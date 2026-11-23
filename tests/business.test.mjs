import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshot,analysisContext,analysisScopes,evidenceCatalog} from '../public/assets/business.mjs';
import {onRequestGet} from '../functions/api/health.js';
import {onRequestPost,normalize} from '../functions/api/analyze.js';

test('集团应付汇总与供应商归并余额勾稽',()=>{
 const s=snapshot();assert.equal(s.totals.balance,3890);assert.equal(s.totals.overdue,2250);
 assert.equal(s.totals.unknown,500);assert.equal(s.totals.companyMapped,3650);
 assert.equal(s.totals.unmapped,240);assert.equal(s.totals.companyMapped+s.totals.unmapped,s.totals.balance);
});
test('一笔支付可分配至两项应付，不会重复扣减',()=>{
 const rows=snapshot().entries;
 assert.equal(rows.find(x=>x.id==='AP003').paid,220);
 assert.equal(rows.find(x=>x.id==='AP004').paid,50);
 assert.equal(rows.find(x=>x.id==='AP005').paid,120);
});
test('历史按时支付率与当前清偿率独立',()=>{
 const c=snapshot().comparison;assert.equal(c.entries.length,3);assert.equal(c.valid,true);
 assert.ok(c.entries.find(x=>x.sid==='S01').clearance>c.entries.find(x=>x.sid==='S01').punctual);
 assert.equal(c.entries.find(x=>x.sid==='S05').punctual,100);
});
test('针对任意已选应付、供应商集团、比较专题生成独立分析事实',()=>{
 const scopes=analysisScopes();const ids=new Set(scopes.map(x=>x.id));assert.ok(ids.has('AP012'));
 assert.ok(ids.has('G1'));assert.ok(ids.has('COMPARE'));
 for(const sc of scopes){const ctx=analysisContext(sc.id);assert.ok(ctx.facts.length>0,sc.id);
  for(const fact of ctx.facts){assert.ok(fact.source_ids.length);for(const id of fact.source_ids)assert.ok(ctx.evidence[id],id);}
 }
 const ap=analysisContext('AP012');assert.ok(ap.facts.some(f=>f.text.includes('AP012')));
 assert.ok(!ap.facts.some(f=>f.text.includes('AP003')));
 const group=analysisContext('G1');assert.ok(group.facts.every(f=>!f.text.includes('广域建材')));
 assert.throws(()=>analysisContext('G999'));assert.throws(()=>analysisContext('AP999'));
});
test('分析上下文按统计期重算，不复用上月数字',()=>{
 const now=analysisContext('AP001','2026-11'),past=analysisContext('AP001','2026-10');
 assert.notDeepEqual(now.facts,past.facts);assert.equal(now.cutoff,'2026-11-20');assert.equal(past.cutoff,'2026-10-31');
 const cat=evidenceCatalog('2026-11');assert.ok(cat['E-AP-AP001']);assert.ok(cat['E-ALLOC-AP003-PAY04']);
});
test('服务端未配置时拒绝模型调用，不泄漏密钥',async()=>{
 const r=await onRequestPost({request:new Request('https://example.com/api/analyze',{method:'POST',body:'{}'}),env:{}});
 assert.equal(r.status,503);const h=onRequestGet({env:{}});assert.equal((await h.json()).available,false);
});
test('归档事实只接受已知 fact_id，不接受模型自行编造文本',()=>{
 const ctx=analysisContext('AP001');const data=normalize({title:'测试',summary:'仅为模型待核摘要',fact_ids:[ctx.facts[0].id,'INVENTED'],unknowns:['待核'],options:[{title:'直接付款',consideration:'错误',risk:'错误'}],decisionQuestion:'命令付款'},ctx);
 assert.equal(data.facts.length,1);assert.deepEqual(data.facts[0],ctx.facts[0]);
 assert.equal(data.options.length,0);assert.equal(data.decisionQuestion,'');
});
test('不同所选对象的服务端模型请求携带不同证据包',async()=>{
 const old=globalThis.fetch;const seen=[];
 globalThis.fetch=async(_url,init)=>{
  const body=JSON.parse(init.body);const request=JSON.parse(body.messages[1].content);
  seen.push(request.referenceContext);
  return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({title:'研判',summary:'待复核摘要',fact_ids:[request.referenceContext.canonicalFacts[0].id],unknowns:[],options:[],decisionQuestion:''})}}]}),{status:200});
 };
 try{
  for(const scope of ['AP012','G1','COMPARE']){
   const request=new Request('https://example.com/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period:'2026-11',scope,prompt:'这项业务有什么需要注意？'})});
   const r=await onRequestPost({request,env:{AI_ENABLED:'1',AI_API_KEY:'secret',AI_MODEL:'test',AI_BASE_URL:'https://model.example/v1'}});
   assert.equal(r.status,200);const out=await r.json();assert.equal(out.scope,scope);
  }
  assert.deepEqual(seen.map(x=>x.requestedScope),['AP012','G1','COMPARE']);
  assert.ok(seen[0].canonicalFacts.some(x=>x.text.includes('AP012')));
  assert.ok(!seen[1].canonicalFacts.some(x=>x.text.includes('AP012')));
 }finally{globalThis.fetch=old;}
});

test('无需额外口令即可使用已配置的分析服务',async()=>{
 const r=onRequestGet({env:{AI_ENABLED:'1',AI_MODEL:'test',AI_API_KEY:'key'}});
 assert.equal((await r.json()).available,true);
});
test('禁止来自其他站点的浏览器直接提交模型请求',async()=>{
 const request=new Request('https://site.example/api/analyze',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:JSON.stringify({scope:'L-001',period:'2026-11',prompt:'请解释这项业务为何需要协调？'})});
 const response=await onRequestPost({request,env:{AI_ENABLED:'1',AI_API_KEY:'key',AI_MODEL:'test'}});
 assert.equal(response.status,403);
});

test('模型未返回 fact_ids 时仍保留系统事实，不捏造核实结果',()=>{
 const ctx=analysisContext('AP001');
 const parsed=normalize({summary:'结合登记记录，本事项需要核实付款条款与调整依据。'},ctx);
 assert.ok(parsed.facts.length>0);
 assert.equal(parsed.modelGenerated,true);
 assert.ok(parsed.facts.every(f=>ctx.facts.some(x=>x.id===f.id)));
});
test('模型返回非 JSON 时安全降级为可追溯事实',async()=>{
 const old=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content:'已核实所有问题，可以直接付款。'}}]}),{status:200});
 try{
  const r=await onRequestPost({request:new Request('https://example.com/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period:'2026-11',scope:'AP001',prompt:'请说明这笔付款节点需要注意的问题？'})}),env:{AI_ENABLED:'1',AI_API_KEY:'redacted',AI_MODEL:'test',AI_BASE_URL:'https://example.com/v1'}});
  const v=await r.json();assert.equal(r.status,200);assert.equal(v.analysis.degraded,true);assert.equal(v.analysis.modelGenerated,false);
  assert.ok(!v.analysis.summary.includes('直接付款'));
  assert.ok(v.analysis.facts.length>0);
 }finally{globalThis.fetch=old;}
});
test('模型接口鉴权问题返回可理解的错误，而非结构检查失败',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response('{"error":{"message":"wrong key"}}',{status:401});
 try{
  const r=await onRequestPost({request:new Request('https://example.com/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period:'2026-11',scope:'AP001',prompt:'请说明这笔付款节点需要注意的问题？'})}),env:{AI_ENABLED:'1',AI_API_KEY:'bad',AI_MODEL:'test',AI_BASE_URL:'https://example.com/v1'}});
  const v=await r.json();assert.equal(r.status,502);assert.equal(v.code,'UPSTREAM_401');assert.match(v.error,/鉴权/);
 }finally{globalThis.fetch=old;}
});
test('OpenAI 兼容接口不支持 JSON mode 时可回退普通文本模式',async()=>{
 const old=globalThis.fetch;let calls=[];
 globalThis.fetch=async(_url,init)=>{let body=JSON.parse(init.body);calls.push(body);
  if(body.response_format)return new Response('{"error":{"message":"unsupported response_format"}}',{status:400});
  const ctx=analysisContext('AP001');return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({summary:'根据应付明细需要核对到期条件。',fact_ids:[ctx.facts[0].id],unknowns:[]})}}]}),{status:200});
 };
 try{
  const r=await onRequestPost({request:new Request('https://example.com/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period:'2026-11',scope:'AP001',prompt:'请说明这笔付款节点需要注意的问题？'})}),env:{AI_ENABLED:'1',AI_API_KEY:'token',AI_MODEL:'test',AI_BASE_URL:'https://example.com/v1'}});
  const v=await r.json();assert.equal(r.status,200);assert.equal(v.analysis.degraded,false);assert.equal(calls.length,2);assert.ok(calls[0].response_format);assert.ok(!calls[1].response_format);
 }finally{globalThis.fetch=old;}
});

test('普通问候走真实模型自然对话，不携带固定应付事实包',async()=>{
 const {isConversationPrompt}=await import('../functions/api/analyze.js');
 assert.equal(isConversationPrompt('你好？你是？'),true);
 assert.equal(isConversationPrompt('你是谁？'),true);
 assert.equal(isConversationPrompt('这笔应付为什么逾期？'),false);
 const old=globalThis.fetch;const seen=[];
 globalThis.fetch=async(_url,init)=>{
  const req=JSON.parse(init.body);seen.push(req);
  return new Response(JSON.stringify({choices:[{message:{content:'你好，我是集团应付工作台的分析助手，可以帮你查阅付款情况和相关依据。'}}]}),{status:200});
 };
 try{
  const request=new Request('https://test.example/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period:'2026-11',scope:'L-001',prompt:'你好？你是？'})});
  const response=await onRequestPost({request,env:{AI_ENABLED:'1',AI_API_KEY:'key',AI_MODEL:'deepseek-v4.1-flash',AI_BASE_URL:'https://example.org/v1'}});
  assert.equal(response.status,200);const payload=await response.json();
  assert.equal(payload.analysis.mode,'conversation');
  assert.match(payload.analysis.summary,/你好/);
  assert.deepEqual(payload.analysis.facts,[]);
  assert.equal(seen[0].messages[1].content,'你好？你是？');
  assert.equal('response_format' in seen[0],false);
  assert.equal(seen[0].enable_thinking,false);
  assert.ok(!JSON.stringify(seen[0]).includes('AP003'));
 }finally{globalThis.fetch=old;}
});

test('普通问候失败时明确失败，不能拿固定合同分析冒充模型回复',async()=>{
 const old=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content:''}}]}),{status:200});
 try{
  const request=new Request('https://test.example/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period:'2026-11',scope:'L-001',prompt:'你是谁？'})});
  const response=await onRequestPost({request,env:{AI_ENABLED:'1',AI_API_KEY:'key',AI_MODEL:'test',AI_BASE_URL:'https://example.org/v1'}});
  assert.equal(response.status,502);const result=await response.json();assert.equal(result.code,'EMPTY_REPLY');
 }finally{globalThis.fetch=old;}
});
