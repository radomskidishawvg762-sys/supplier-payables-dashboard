import {caseEvidence,evidenceIndex,DATA_VERSION} from '../../public/assets/business.mjs';
const reply=(code,body)=>new Response(JSON.stringify(body),{status:code,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const cleanText=(v,n)=>String(v??'').slice(0,n).trim();
const trimArray=(arr,n=5)=>Array.isArray(arr)?arr.slice(0,n):[];
function normalize(parsed,knownIds){
 if(!parsed||typeof parsed!=='object'||typeof parsed.summary!=='string'||!Array.isArray(parsed.facts))throw Error('模型未返回完整的结构化研判');
 const allowed=new Set(knownIds);
 return {
  title:cleanText(parsed.title||'集团经营研判',80),
  summary:cleanText(parsed.summary,520),
  facts:trimArray(parsed.facts,5).map(x=>({text:cleanText(x?.text,420),source_ids:trimArray(x?.source_ids,5).filter(id=>allowed.has(id))})).filter(x=>x.text&&x.source_ids.length),
  unknowns:trimArray(parsed.unknowns,5).map(x=>cleanText(x,240)).filter(Boolean),
  options:trimArray(parsed.options,3).map(x=>({title:cleanText(x?.title,90),consideration:cleanText(x?.consideration,250),risk:cleanText(x?.risk,250)})).filter(x=>x.title),
  decisionQuestion:cleanText(parsed.decisionQuestion,300)
 };
}
export async function onRequestPost({request,env}){
 // Never expose a model key to public JavaScript. Disabled unless explicitly configured.
 if(env?.AI_ENABLED!=='1'||!env.AI_API_KEY||!env.AI_MODEL||!env.AI_DEMO_PASSCODE)return reply(503,{error:'AI 服务尚未配置，请由部署管理员设置服务端变量与访问口令。'});
 const supplied=request.headers.get('X-Demo-Passcode')||'';
 if(!supplied||supplied.length>180||supplied!==env.AI_DEMO_PASSCODE)return reply(401,{error:'访问口令无效。'});
 if(Number(request.headers.get('content-length')||0)>5000)return reply(413,{error:'问题过长。'});
 let body;try{body=await request.json()}catch{return reply(400,{error:'请求格式错误。'})}
 const topics=['priority','impact','options','compare'];
 const topic=cleanText(body?.topic,30);const period=cleanText(body?.period,10);const prompt=cleanText(body?.prompt,300);
 if(!topics.includes(topic)||!['2026-10','2026-11'].includes(period)||prompt.length<5||prompt.length>260)return reply(400,{error:'请选择有效的问题和统计期间。'});
 const packet=caseEvidence(topic==='compare'?'COMPARE':'L-001',period);
 const sources=packet.evidenceIds.map(id=>({id,...evidenceIndex[id]}));
 const base=cleanText(env.AI_BASE_URL||'https://api.openai.com/v1',260).replace(/\/+$/,'');
 let parsedBase;try{parsedBase=new URL(base);if(parsedBase.protocol!=='https:')throw Error()}catch{return reply(500,{error:'服务端 AI 地址配置无效，必须使用 HTTPS。'})}
 // This endpoint ONLY receives the repository's fictional fact packet; never query enterprise data.
 const system=`你是集团一号位、二号位的应付经营辅助决策分析员。只能根据提供的已核实事实和依据编号研判，不能杜撰数字、合同、会计结论或法律责任。你的职责不是生成BI报告，也不是财资工作台的核数操作。重点说明：需要领导决定什么；为什么需要集团而不是部门自己处理；可选协调方案与代价；哪些仍待核实。付款差异默认由财资/供应链核查，未经确认不得提交一号位。不提议直接付款或系统写入。用简洁专业中文。只输出一个JSON对象，字段：title字符串，summary字符串，facts数组（每项text字符串、source_ids字符串数组；只用提供的来源编号），unknowns字符串数组，options数组（title、consideration、risk字符串），decisionQuestion字符串。每条facts必须有可引用的source_ids；不足证据则写在unknowns中。`;
 const userData={topic,question:prompt,period,sourceVersion:DATA_VERSION,topicName:packet.topic,verifiedFacts:packet.facts,availableEvidence:sources,unknowns:packet.openQuestions,leadershipBoundary:packet.decisionScope,cutoff:packet.cutoff};
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),18000);
 try{
  const res=await fetch(base+'/chat/completions',{method:'POST',signal:controller.signal,headers:{'Authorization':'Bearer '+env.AI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:env.AI_MODEL,temperature:0.1,max_tokens:1150,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(userData)}]})});
  if(!res.ok)return reply(502,{error:'模型服务调用失败，请检查模型名称、额度或服务地址。'});
  const raw=await res.json();const msg=raw?.choices?.[0]?.message?.content;if(typeof msg!=='string')throw Error('模型未返回文本');
  let val;try{val=JSON.parse(msg)}catch{const matched=msg.match(/\{[\s\S]*\}/);if(!matched)throw Error('模型未返回JSON');val=JSON.parse(matched[0])}
  const analysis=normalize(val,packet.evidenceIds);
  if(!analysis.facts.length)throw Error('没有可引用的证据，暂不生成确定性研判');
  return reply(200,{analysis,sourceVersion:DATA_VERSION,period,modelUsed:true});
 }catch(e){return reply(502,{error:e.name==='AbortError'?'模型响应超时，请稍后重试。':'AI 输出未通过证据校验，请重试或核对原始资料。'});}finally{clearTimeout(timer)}
}
export {normalize};
