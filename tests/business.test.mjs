import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshot,caseEvidence} from '../public/assets/business.mjs';
import {onRequestGet} from '../functions/api/health.js';
import {onRequestPost,normalize} from '../functions/api/analyze.js';
test('2026-11 group totals reconcile without joining unconfirmed supplier entity',()=>{
 const s=snapshot();assert.equal(s.totals.balance,3890);assert.equal(s.totals.overdue,2250);assert.equal(s.totals.unknown,500);assert.equal(s.totals.companyMapped,3650);assert.equal(s.totals.unmapped,240);assert.equal(s.totals.companyMapped+s.totals.unmapped,s.totals.balance);
});
test('one payment allocated to two separate payables, no accidental full subtraction',()=>{
 const rows=snapshot().entries;assert.equal(rows.find(x=>x.id==='AP003').paid,220);assert.equal(rows.find(x=>x.id==='AP004').paid,50);assert.equal(rows.find(x=>x.id==='AP005').paid,120);
});
test('timely paid and as-of clearance differ for comparison group',()=>{
 const c=snapshot().comparison;assert.equal(c.entries.length,3);assert.equal(c.valid,true);const s1=c.entries.find(x=>x.sid==='S01');assert.ok(s1.clearance>s1.punctual);const s5=c.entries.find(x=>x.sid==='S05');assert.equal(s5.clearance,100);assert.equal(s5.punctual,100);
});
test('facts for AI are bound to known evidence references and unknowns',()=>{
 const packet=caseEvidence('L-001');assert.ok(packet.evidenceIds.includes('E-D03'));assert.ok(packet.facts.some(x=>x.includes('争议90万元')));
});
test('server AI disabled without secrets; public entry never runs upstream',async()=>{
 const r=await onRequestPost({request:new Request('https://example.com/api/analyze',{method:'POST',body:'{}'}),env:{}});assert.equal(r.status,503);
 const h=onRequestGet({env:{}});assert.equal((await h.json()).available,false);
});
test('AI evidence normalization rejects invented evidence IDs',()=>{
 const x=normalize({title:'x',summary:'s',facts:[{text:'a',source_ids:['E-D03','FAKE-ID']}],unknowns:[],options:[],decisionQuestion:'q'},['E-D03']);assert.deepEqual(x.facts[0].source_ids,['E-D03']);
});
