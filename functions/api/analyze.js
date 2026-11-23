import {analysisContext,DATA_VERSION} from '../../public/assets/business.mjs';

const reply=(code,body)=>new Response(JSON.stringify(body),{status:code,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const clean=(x,max)=>String(x??'').slice(0,max).trim();
const first=(arr,max)=>Array.isArray(arr)?arr.slice(0,max):[];

// The model is never allowed to write a "verified fact". It can only select
// fact IDs from deterministic records, so their wording and sources remain unchanged.
export function normalize(parsed,context){
 if(!parsed||typeof parsed!=='object'||typeof parsed.summary!=='string'||!Array.isArray(parsed.fact_ids))throw Error('invalid model response');
 const factsById=new Map(context.facts.map(f=>[f.id,f]));
 const facts=[...new Set(first(parsed.fact_ids,12))].map(id=>factsById.get(id)).filter(Boolean).slice(0,6);
 if(!facts.length)throw Error('no grounded facts selected');
 const options=first(parsed.options,2).map(o=>({title:clean(o?.title,60),consideration:clean(o?.consideration,180),risk:clean(o?.risk,160)})).filter(o=>o.title);
 const optionSafe=context.scope==='L-001'?options:[]; // Department-only findings cannot become leadership directives.
 return {
  title:clean(parsed.title||context.title,72),
  summary:clean(parsed.summary,370),
  facts,
  unknowns:first(parsed.unknowns,4).map(x=>clean(x,180)).filter(Boolean),
  options:optionSafe,
  decisionQuestion:context.scope==='L-001'?clean(parsed.decisionQuestion,180):'',
  sourceVersion:context.sourceVersion,period:context.period,scope:context.scope,
  modelGenerated:true,verification:'模型摘要待人工复核；引用事实由规则层生成'
 };
}
export async function onRequestPost({request,env}){
 if(env?.AI_ENABLED!=='1'||!env.AI_API_KEY||!env.AI_MODEL||!env.AI_DEMO_PASSCODE)return reply(503,{error:'智能分析服务未配置。现有事实和证据仍可正常查看。'});
 const passcode=request.headers.get('X-Demo-Passcode')||'';
 if(!passcode||passcode.length>180||passcode!==env.AI_DEMO_PASSCODE)return reply(401,{error:'访问口令无效。'});
 if(Number(request.headers.get('content-length')||0)>5000)return reply(413,{error:'请求内容过长。'});
 let body;try{body=await request.json()}catch{return reply(400,{error:'请求格式错误。'})}
 const period=clean(body?.period,12),scope=clean(body?.scope,32),prompt=clean(body?.prompt,300);
 if(!['2026-10','2026-11'].includes(period)||prompt.length<5||prompt.length>260)return reply(400,{error:'请选择有效的数据期间并填写具体问题。'});
 let context;try{context=analysisContext(scope,period)}catch{return reply(400,{error:'所选分析对象不存在。'})}
 const base=clean(env.AI_BASE_URL||'https://api.openai.com/v1',260).replace(/\/+$/,'');
 let url;try{url=new URL(base);if(url.protocol!=='https:')throw Error('insecure');}catch{return reply(500,{error:'AI 服务地址必须使用 HTTPS。'})}
 const referenceContext={
  requestedScope:scope,period,cutoff:context.cutoff,version:DATA_VERSION,title:context.title,tier:context.tier,
  canonicalFacts:context.facts,unknowns:context.openQuestions,leadershipBoundary:context.management,
  allowLeadershipDecision:scope==='L-001',
  availableSources:context.sourceIds.map(id=>({id,type:context.evidence[id].type,label:context.evidence[id].label,content:context.evidence[id].description}))
 };
 const system=`你是集团应付事项的严谨资料分析员，读者仅为集团一号位、二号位。基于提供的当前对象与材料回答，不能切换到其他对象。金额、日期和已知事实只能从canonicalFacts选取，不得推断财务风险损失、供应中断或法律结论。正文不要使用“已经确认”来修饰模型自己生成的内容；资料中的合同字段并非已取得原件。请列出当前事实、意义（如无证据说明不能判定）、待核问题。只在allowLeadershipDecision=true时给出两种组织协调选项；否则仅做事实分析并说明属于业务部门核查，不得要求董事长审批付款。只输出合法JSON对象：title字符串、summary字符串、fact_ids数组(仅使用提供的canonicalFacts里的id)、unknowns字符串数组、options数组(每项title/consideration/risk)、decisionQuestion字符串。简洁、客观、具体，无口号。`;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),18000);
 try{
  const response=await fetch(url.toString().replace(/\/$/,'')+'/chat/completions',{method:'POST',signal:controller.signal,headers:{Authorization:`Bearer ${env.AI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:env.AI_MODEL,temperature:0.1,max_tokens:1100,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify({question:prompt,referenceContext})}]})});
  if(!response.ok)return reply(502,{error:'模型服务调用失败。请检查模型接口、额度和配置。'});
  const raw=await response.json();const message=raw?.choices?.[0]?.message?.content;
  if(typeof message!=='string')throw Error('empty');
  let data;try{data=JSON.parse(message)}catch{const match=message.match(/\{[\s\S]*\}/);if(!match)throw Error('json');data=JSON.parse(match[0]);}
  const analysis=normalize(data,context);
  return reply(200,{analysis,scope:context.scope,period:context.period,sourceVersion:context.sourceVersion});
 }catch(err){return reply(502,{error:err.name==='AbortError'?'模型响应超时，请重试。':'模型输出未通过结构和证据检查；请核对原始记录。'});}finally{clearTimeout(timeout)}
}
