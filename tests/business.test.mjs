import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshot,analysisContext,analysisScopes,evidenceCatalog} from '../public/assets/business.mjs';
import {onRequestGet} from '../functions/api/health.js';
import {onRequestPost} from '../functions/api/analyze.js';

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
