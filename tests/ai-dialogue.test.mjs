import test from 'node:test';
import assert from 'node:assert/strict';
import {needsBusinessFacts,onRequestPost} from '../functions/api/analyze.js';
import {analysisContext,DATA_VERSION} from '../public/assets/business.mjs';

const env={AI_ENABLED:'1',AI_API_KEY:'test-key',AI_MODEL:'deepseek-v4.1-flash',AI_BASE_URL:'https://model.test/compatible-mode/v1'};
function request(prompt,scope='L-001',history=[]){return new Request('https://app.test/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,scope,period:'2026-11',history})});}
function mockReply(answer){return new Response(JSON.stringify({choices:[{message:{content:answer}}]}),{status:200,headers:{'content-type':'application/json'}});}
async function mockRun(prompt,scope,answer,history=[]){const old=globalThis.fetch,seen=[];globalThis.fetch=async(url,init)=>{seen.push({url,body:JSON.parse(init.body)});return mockReply(answer)};
 try{const result=await onRequestPost({request:request(prompt,scope,history),env});return {response:result,data:await result.json(),seen}}finally{globalThis.fetch=old}}

test('片段问题不附带固定广域案例，模型必须接收用户原文',async()=>{
 assert.equal(needsBusinessFacts('供应商停'),false);
 const x=await mockRun('供应商停','L-001','你是想了解供应商停供风险，还是暂停付款的安排？');
 assert.equal(x.data.analysis.summary,'你是想了解供应商停供风险，还是暂停付款的安排？');
 assert.equal(x.data.analysis.mode,'answer');
 assert.equal(x.data.analysis.usedBusinessFacts,false);
 assert.equal(x.seen[0].body.messages.at(-1).content,'供应商停');
 assert.ok(!JSON.stringify(x.seen[0].body).includes('AP003'));
 assert.equal('response_format' in x.seen[0].body,false);
});
test('普通问候由真实模型返回，不注入供应商材料',async()=>{
 const x=await mockRun('你好，你是谁？','L-001','你好，我是经营工作台的问答助手。');
 assert.equal(x.data.analysis.summary,'你好，我是经营工作台的问答助手。');
 assert.equal(x.data.analysis.usedBusinessFacts,false);
 assert.ok(!JSON.stringify(x.seen[0].body).includes('AP003'));
});
test('同一对象不同问题传入不同用户输入，回答使用真实模型文本',async()=>{
 const a=await mockRun('AP003还剩多少未付？','AP003','AP003截至统计日剩余680万元。【F01】');
 const b=await mockRun('这项争议是否已调整？','AP003','目前没有正式调整凭证，因此不能直接减记应付。');
 assert.notEqual(a.data.analysis.summary,b.data.analysis.summary);
 assert.equal(a.data.analysis.usedBusinessFacts,true);
 assert.ok(a.seen[0].body.messages[0].content.includes('AP003'));
 assert.equal(a.seen[0].body.messages.at(-1).content,'AP003还剩多少未付？');
 assert.ok(Array.isArray(a.data.analysis.facts));
});
test('历史消息可支持追问，最后一条始终是新问题',async()=>{
 const x=await mockRun('那它为什么还没付？','AP003','资料没有直接说明未付原因，需核对争议和付款安排。',[
  {role:'user',content:'这笔应付余额多少？'}, {role:'assistant',content:'截至日未付680万元。'}
 ]);
 const m=x.seen[0].body.messages;
 assert.equal(m.at(-1).content,'那它为什么还没付？');
 assert.equal(m.at(-2).content,'截至日未付680万元。');
 assert.equal(x.data.analysis.summary,'资料没有直接说明未付原因，需核对争议和付款安排。');
});
test('模型没有返回正文时必须失败，绝不能展示固定报告',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>mockReply('');
 try{const r=await onRequestPost({request:request('供应商停'),env});const x=await r.json();assert.equal(r.status,502);assert.equal(x.code,'EMPTY_MODEL_REPLY');assert.equal(x.analysis,undefined);}finally{globalThis.fetch=old;}
});
test('模型鉴权失败不回退成预设综合分析',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response('bad key',{status:401});
 try{const r=await onRequestPost({request:request('为什么逾期？'),env});const x=await r.json();assert.equal(r.status,502);assert.equal(x.code,'UPSTREAM_401');assert.equal(x.analysis,undefined);}finally{globalThis.fetch=old;}
});
test('引用只展示来源记录中存在的事实',async()=>{
 const f=analysisContext('AP003').facts[0];const x=await mockRun('AP003为什么逾期？','AP003',`已登记到期日，当前仍有余额。【${f.id}】 虚构来源【F999】不成立。`);
 assert.equal(x.data.analysis.facts.length,1);assert.equal(x.data.analysis.facts[0].id,f.id);
});
test('健康检查和不同对象的返回都带正确版本',async()=>{
 const x=await mockRun('该集团当前应付多少？','G1','请以当前期应付记录为准。');assert.equal(x.data.scope,'G1');assert.equal(x.data.sourceVersion,DATA_VERSION);
});
