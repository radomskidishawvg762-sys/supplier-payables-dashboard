import {analysisContext,DATA_VERSION} from '../../public/assets/business.mjs';

const reply=(code,body)=>new Response(JSON.stringify(body),{status:code,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const clean=(x,max)=>String(x??'').slice(0,max).trim();
const first=(arr,max)=>Array.isArray(arr)?arr.slice(0,max):[];

// The model is never allowed to write a "verified fact". It can only select
// fact IDs from deterministic records, so their wording and sources remain unchanged.
export function normalize(parsed,context){
 if(!parsed||typeof parsed!=='object')throw Error('invalid model response');
 const factsById=new Map(context.facts.map(f=>[f.id,f]));
 const selected=Array.isArray(parsed.fact_ids)?[...new Set(first(parsed.fact_ids,12))].map(id=>factsById.get(id)).filter(Boolean):[];
 // The model may omit IDs; present canonical facts as source records rather than pretending the model verified them.
 const facts=(selected.length?selected:context.facts.slice(0,3)).slice(0,6);
 const rawSummary=parsed.summary??parsed.analysis??parsed.answer??'';
 if(typeof rawSummary!=='string'||rawSummary.trim().length<5)throw Error('missing model summary');
 const options=first(parsed.options,2).map(o=>({title:clean(o?.title,60),consideration:clean(o?.consideration,180),risk:clean(o?.risk,160)})).filter(o=>o.title);
 return {
  title:clean(parsed.title||context.title,72),summary:clean(rawSummary,520),facts,
  unknowns:(first(parsed.unknowns,4).map(x=>clean(x,180)).filter(Boolean).length?first(parsed.unknowns,4).map(x=>clean(x,180)).filter(Boolean):context.openQuestions.slice(0,3)),
  options:context.scope==='L-001'?options:[],
  decisionQuestion:context.scope==='L-001'?clean(parsed.decisionQuestion,180):'',
  sourceVersion:context.sourceVersion,period:context.period,scope:context.scope,
  modelGenerated:true,degraded:false,verification:'分析需由业务归口复核'
 };
}
function safeFallback(context){
 return {title:context.title,summary:'本次模型回复未形成完整分析。以下提供当前事项的业务事实和待确认问题，可重新生成分析。',facts:context.facts.slice(0,3),unknowns:context.openQuestions.slice(0,3),options:[],decisionQuestion:'',sourceVersion:context.sourceVersion,period:context.period,scope:context.scope,modelGenerated:false,degraded:true,verification:'仅显示已登记资料'};
}
function extractModelJson(message){
 const text=typeof message==='string'?message:Array.isArray(message)?message.map(x=>x?.text||'').join(''):'';
 if(!text.trim())throw Error('empty model output');
 try{return JSON.parse(text)}catch{}
 const cleanFence=text.replace(/^\s*```(?:json)?\s*/i,'').replace(/\s*```\s*$/,'').trim();
 try{return JSON.parse(cleanFence)}catch{}
 const opening=cleanFence.indexOf('{'),closing=cleanFence.lastIndexOf('}');
 if(opening>=0&&closing>opening)return JSON.parse(cleanFence.slice(opening,closing+1));
 throw Error('invalid json');
}
// A greeting or a question about the assistant is not an accounts-payable analysis.
// Routing it to the business-report schema was the reason ordinary dialogue
// appeared to trigger the same supplier case repeatedly.
export function isConversationPrompt(question){
 const text=String(question??'').trim().replace(/[\s？！?，,。.!、：:；;~～]+/g,'').toLowerCase();
 if(!text||text.length>70)return false;
 if(/应付|供应商|付款|核销|合同|财务|逾期|账期|广域|金额|风险|协调|证据|报告/.test(text))return false;
 return /^(你好|您好|嗨|哈喽|hello|hi|hey|早上好|下午好|晚上好|你是谁|你是|你能做什么|你会做什么|你可以做什么|介绍一下你自己|自我介绍|这个系统能做什么|这个应用能做什么)/i.test(text);
}
const providerErrorMessage=status=>status===400?'模型请求参数不兼容（HTTP 400），请检查接口与模型配置。':status===401||status===403?'模型服务鉴权失败，请核对 AI_API_KEY 与服务地域。':status===404?'模型名称或接口地址不匹配（HTTP 404）。':status===429?'模型接口已限流或额度不足（HTTP 429）。':status>=500?'模型服务暂时不可用（HTTP '+status+'）。':'模型服务调用失败（HTTP '+status+'）。';
export async function onRequestPost({request,env}){
 if(env?.AI_ENABLED!=='1'||!env.AI_API_KEY||!env.AI_MODEL)return reply(503,{error:'智能分析服务未配置。现有事实和证据仍可正常查看。'});
 const origin=request.headers.get('Origin');if(origin&&new URL(origin).origin!==new URL(request.url).origin)return reply(403,{error:'仅支持从本站提交分析请求。'});
 if(request.headers.get('Content-Type')&&!request.headers.get('Content-Type').includes('application/json'))return reply(415,{error:'仅支持JSON请求。'});
 if(Number(request.headers.get('content-length')||0)>5000)return reply(413,{error:'请求内容过长。'});
 let body;try{body=await request.json()}catch{return reply(400,{error:'请求格式错误。'})}
 const period=clean(body?.period,12),scope=clean(body?.scope,32),prompt=clean(body?.prompt,300);
 if(!['2026-10','2026-11'].includes(period)||prompt.length<1||prompt.length>260)return reply(400,{error:'请选择有效的数据期间并填写具体问题。'});
 let context;try{context=analysisContext(scope,period)}catch{return reply(400,{error:'所选分析对象不存在。'})}
 const base=clean(env.AI_BASE_URL||'https://api.openai.com/v1',260).replace(/\/+$/,'');
 let url;try{url=new URL(base);if(url.protocol!=='https:')throw Error('insecure');}catch{return reply(500,{error:'AI 服务地址必须使用 HTTPS。'})}
 const isConversation=isConversationPrompt(prompt);
 const referenceContext={
  requestedScope:scope,period,cutoff:context.cutoff,version:DATA_VERSION,title:context.title,tier:context.tier,
  canonicalFacts:context.facts,unknowns:context.openQuestions,leadershipBoundary:context.management,
  allowLeadershipDecision:scope==='L-001',
  availableSources:context.sourceIds.map(id=>({id,type:context.evidence[id].type,label:context.evidence[id].label,content:context.evidence[id].description}))
 };
 const system=`你是集团应付事项的严谨资料分析员，读者仅为集团一号位、二号位。基于提供的当前对象与材料回答，不能切换到其他对象。金额、日期和已知事实只能从canonicalFacts选取，不得推断财务风险损失、供应中断或法律结论。正文不要使用“已经确认”来修饰模型自己生成的内容；资料中的合同字段并非已取得原件。请列出当前事实、意义（如无证据说明不能判定）、待核问题。只在allowLeadershipDecision=true时给出两种组织协调选项；否则仅做事实分析并说明属于业务部门核查，不得要求董事长审批付款。只输出合法JSON对象：title字符串、summary字符串、fact_ids数组(仅使用提供的canonicalFacts里的id)、unknowns字符串数组、options数组(每项title/consideration/risk)、decisionQuestion字符串。简洁、客观、具体，无口号。`;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),35000);
 try{
  const endpoint=url.toString().replace(/\/$/,'')+'/chat/completions';
  const payload=isConversation
   ? {model:env.AI_MODEL,temperature:0.4,max_tokens:350,messages:[
       {role:'system',content:'你是中建西部建设集团应付经营工作台内的智能分析助手。用户在问候、询问你的身份或功能时，直接自然回答用户的提问，通常两三句话即可。不要主动插入任何供应商、合同、金额、风险、协调意见或其他案例；不要装作读取了未查询的业务材料。回答使用简洁自然的中文纯文本，不要 JSON。'},
       {role:'user',content:prompt}
     ]}
   : {model:env.AI_MODEL,temperature:0.1,max_tokens:1800,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:JSON.stringify({question:prompt,referenceContext})}]};
  // Alibaba Cloud DeepSeek V4 hybrid models require non-thinking mode for JSON Object responses.
  if(/^deepseek-v4/i.test(env.AI_MODEL))payload.enable_thinking=false;
  const call=body=>fetch(endpoint,{method:'POST',signal:controller.signal,headers:{Authorization:`Bearer ${env.AI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  let response=await call(payload);
  // Some OpenAI-compatible gateways do not implement JSON mode.
  if(response.status===400&&!isConversation){const issue=(await response.clone().text()).slice(0,1000);if(/response_format|json_object|enable_thinking|unsupported/i.test(issue)){const {response_format,enable_thinking,...compatible}=payload;response=await call(compatible);}}
  if(!response.ok){const issue=(await response.text()).slice(0,600);console.warn('AI upstream failure',response.status,issue.replace(/sk-[\w-]{8,}/g,'[redacted]'));return reply(502,{code:'UPSTREAM_'+response.status,error:providerErrorMessage(response.status)});}
  const raw=await response.json();const message=raw?.choices?.[0]?.message?.content;
  if(isConversation){
   const content=typeof message==='string'?message.trim():Array.isArray(message)?message.map(x=>x?.text||'').join('').trim():'';
   if(!content)return reply(502,{error:'模型没有返回可显示的回答，请重新提问。',code:'EMPTY_REPLY'});
   return reply(200,{analysis:{mode:'conversation',title:'对话',summary:clean(content,1000),facts:[],unknowns:[],options:[],decisionQuestion:'',sourceVersion:context.sourceVersion,period:context.period,scope:context.scope,modelGenerated:true,degraded:false},scope:context.scope,period:context.period,sourceVersion:context.sourceVersion});
  }
  let analysis;
  try{analysis=normalize(extractModelJson(message),context)}catch(error){
   console.warn('AI structure fallback',String(error?.message||error));
   analysis=safeFallback(context);
  }
  return reply(200,{analysis,scope:context.scope,period:context.period,sourceVersion:context.sourceVersion});
 }catch(err){console.warn('AI request failed',String(err?.name||'error'));
  return reply(502,{code:err.name==='AbortError'?'TIMEOUT':'RESPONSE_ERROR',error:err.name==='AbortError'?'模型响应超时，请稍后重试。':'无法读取模型响应，请稍后重试。'});
 }finally{clearTimeout(timeout)}
}
