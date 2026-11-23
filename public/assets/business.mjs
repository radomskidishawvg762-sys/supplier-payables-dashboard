// Group-level sample source facts. All names, contracts and amounts are synthetic.
// All client figures and server AI evidence packets use these same immutable records.
export const REPORTING_DATES = Object.freeze({'2026-11':'2026-11-20','2026-10':'2026-10-31'});
export const DATA_VERSION = 'sample-20261123-r1';
export const suppliers = Object.freeze([
  {id:'S01',name:'华中砂石供应有限公司',groupId:'G1',groupName:'华中砂石联合集团',mapped:true,material:'碎石',spec:'5-25mm',terms:'验收结算后30天',critical:'一般',payer:'C01'},
  {id:'S02',name:'华中石料运输有限公司',groupId:'G1',groupName:'华中砂石联合集团',mapped:true,material:'砂石',spec:'机制砂',terms:'结算后45天',critical:'一般',payer:'C02'},
  {id:'S03',name:'广域建材有限公司',groupId:'G2',groupName:'广域建材控股',mapped:true,material:'水泥',spec:'P.O42.5',terms:'结算后60天',critical:'关键',payer:'C03'},
  {id:'S04',name:'广域物资有限公司',groupId:'G2',groupName:'广域建材控股',mapped:false,material:'外加剂',spec:'聚羧酸',terms:'结算后45天',critical:'关键',payer:'C01'},
  {id:'S05',name:'青岚砂石有限公司',groupId:'G3',groupName:'青岚砂石集团',mapped:true,material:'碎石',spec:'5-25mm',terms:'验收结算后30天',critical:'一般',payer:'C01'},
  {id:'S06',name:'明诚物资有限公司',groupId:'G4',groupName:'明诚物资集团',mapped:true,material:'水泥',spec:'P.O42.5',terms:'结算后60天',critical:'关键',payer:'C02'},
  {id:'S07',name:'龙图骨料有限公司',groupId:'G5',groupName:'龙图骨料集团',mapped:true,material:'碎石',spec:'5-25mm',terms:'验收结算后30天',critical:'一般',payer:'C01'},
  {id:'S08',name:'远江水泥有限公司',groupId:'G6',groupName:'远江水泥集团',mapped:true,material:'水泥',spec:'P.O42.5',terms:'结算后60天',critical:'关键',payer:'C03'}
]);
export const payables=Object.freeze([
  {id:'AP001',sid:'S01',contract:'HT-1001',settlement:'JS-1001',amount:520,due:'2026-10-31',dispute:0},
  {id:'AP002',sid:'S02',contract:'HT-1002',settlement:'JS-1002',amount:680,due:'2026-12-10',dispute:0},
  {id:'AP003',sid:'S03',contract:'HT-2001',settlement:'JS-2001',amount:900,due:'2026-06-15',dispute:90},
  {id:'AP004',sid:'S03',contract:'HT-2002',settlement:'JS-2002',amount:400,due:'2026-09-04',dispute:0},
  {id:'AP005',sid:'S04',contract:'HT-2003',settlement:'JS-2003',amount:360,due:'2026-09-20',dispute:40},
  {id:'AP006',sid:'S05',contract:'HT-3001',settlement:'JS-3001',amount:400,due:'2026-11-01',dispute:0},
  {id:'AP007',sid:'S06',contract:'HT-4001',settlement:'JS-4001',amount:650,due:'2026-08-15',dispute:0},
  {id:'AP008',sid:'S07',contract:'HT-5001',settlement:'JS-5001',amount:300,due:'2026-11-03',dispute:0},
  {id:'AP009',sid:'S08',contract:'HT-6001',settlement:'JS-6001',amount:500,due:null,dispute:30},
  {id:'AP010',sid:'S01',contract:'HT-1003',settlement:'JS-1003',amount:240,due:'2026-12-02',dispute:0},
  {id:'AP011',sid:'S06',contract:'HT-4002',settlement:'JS-4002',amount:220,due:'2026-11-29',dispute:0},
  {id:'AP012',sid:'S08',contract:'HT-6002',settlement:'JS-6002',amount:260,due:'2026-02-15',dispute:15}
]);
export const payments=Object.freeze([
  {id:'PAY01',date:'2026-10-30',amount:250},
  {id:'PAY02',date:'2026-11-06',amount:200},
  {id:'PAY03',date:'2026-07-01',amount:150},
  {id:'PAY04',date:'2026-10-10',amount:120},
  {id:'PAY05',date:'2026-10-30',amount:400},
  {id:'PAY06',date:'2026-08-20',amount:200},
  {id:'PAY07',date:'2026-11-08',amount:100},
  {id:'PAY08',date:'2026-11-14',amount:85},
  {id:'PAY09',date:'2026-09-08',amount:120}
]);
export const allocations=Object.freeze([
  {paymentId:'PAY01',payableId:'AP001',amount:250},
  {paymentId:'PAY02',payableId:'AP001',amount:200},
  {paymentId:'PAY03',payableId:'AP003',amount:150},
  {paymentId:'PAY04',payableId:'AP003',amount:70},
  {paymentId:'PAY04',payableId:'AP004',amount:50},
  {paymentId:'PAY05',payableId:'AP006',amount:400},
  {paymentId:'PAY06',payableId:'AP007',amount:200},
  {paymentId:'PAY07',payableId:'AP008',amount:100},
  {paymentId:'PAY09',payableId:'AP005',amount:120}
]);
export const leadershipCase = Object.freeze({
 id:'L-001',title:'广域建材到期款及争议事项需要协调',type:'已确认的集团协调议题',supplierId:'S03',
 owner:'集团财资部 / 供应链管理部门',status:'待领导明确协调方向',
 basis:'截至2026-11-20，关联合同HT-2001、HT-2002存在已到期未清款；其中HT-2001登记争议90万元，争议尚未作为正式财务调整。',
 question:'是否要求财资、供应链和法务共同核实付款义务及争议处理安排，并明确反馈期限？',
 options:[
   {title:'组织财资与供应链专题核查',benefit:'先厘清到期事实、已执行付款、争议及各方责任',tradeoff:'需要归口部门补充合同和争议材料'},
   {title:'先按现有机制持续督办',benefit:'不增加新的协调会议',tradeoff:'跨部门争议可能继续延后解决'}
 ]
});
export const evidenceIndex=Object.freeze({
 'E-C01':{label:'采购合同 HT-2001 · 付款节点',type:'合同登记',description:'对应广域建材有限公司；到期日2026-06-15。这里只保存登记字段，未存储原件。'},
 'E-C02':{label:'采购合同 HT-2002 · 付款节点',type:'合同登记',description:'对应广域建材有限公司；到期日2026-09-04。'},
 'E-P03':{label:'财务应付 AP003',type:'应付明细',description:'原始金额900万元；关联付款分配PAY03 150万元和PAY04 70万元。'},
 'E-P04':{label:'财务应付 AP004',type:'应付明细',description:'原始金额400万元；关联付款分配PAY04 50万元。'},
 'E-A04':{label:'付款及核销分配 PAY04',type:'核销关系',description:'PAY04合计120万元，分配至AP003 70万元、AP004 50万元。'},
 'E-D03':{label:'争议登记 AP003',type:'争议记录',description:'登记争议金额90万元；没有正式核销或账务调整凭证。'},
 'E-G02':{label:'供应商集团关系核验记录',type:'主体映射',description:'S03归并G2已确认；S04拟归并G2但关系待核，不计入确认集团金额。'},
 'E-CO01':{label:'同类供应商付款记录',type:'付款对照',description:'S01、S05、S07属同规格碎石与30天账期；截至日清偿率不代表历史按时付款率。'}
});
export const formatMoney=n=>Number(n||0).toLocaleString('zh-CN',{maximumFractionDigits:1});
export function diffDays(a,b){return Math.round((Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000);}
export function snapshot(period='2026-11'){
 const cutoff=REPORTING_DATES[period];if(!cutoff)throw new Error('unsupported period');
 const entries=payables.map(ap=>{
  const s=suppliers.find(x=>x.id===ap.sid);
  const applied=allocations.filter(x=>x.payableId===ap.id).map(x=>({...x,payment:payments.find(p=>p.id===x.paymentId)})).filter(x=>x.payment && x.payment.date<=cutoff);
  const paid=applied.reduce((n,x)=>n+x.amount,0);const balance=Math.max(0,ap.amount-paid);
  const days=ap.due?diffDays(cutoff,ap.due):null;
  const isDue=days!=null && days>=0;
  const overdue=days>0?balance:0;
  const unknown=days===null?balance:0;
  const upcoming=days!=null&&days<0&&days>=-30?balance:0;
  const onTime=isDue?applied.filter(x=>x.payment.date<=ap.due).reduce((n,x)=>n+x.amount,0):0;
  return {...ap,supplier:s,paid,balance,days,isDue,overdue,unknown,upcoming,onTime,applied};
 });
 const sum=(items,key)=>items.reduce((n,x)=>n+(x[key]||0),0);
 const bal=sum(entries,'balance'),overdue=sum(entries,'overdue'),unknown=sum(entries,'unknown');
 const known=bal-unknown;
 const groups=[...new Map(suppliers.filter(x=>x.mapped).map(s=>[s.groupId,s.groupName])).entries()].map(([id,name])=>{
  const items=entries.filter(r=>r.supplier.mapped&&r.supplier.groupId===id);
  return {id,name,balance:sum(items,'balance'),overdue:sum(items,'overdue'),contracts:new Set(items.map(x=>x.contract)).size,items};
 }).sort((a,b)=>b.balance-a.balance);
 const mapped=sum(groups,'balance');
 const ageBands=[{name:'1—30天',min:1,max:30},{name:'31—90天',min:31,max:90},{name:'91—180天',min:91,max:180},{name:'超过180天',min:181,max:Infinity}].map(b=>({...b,amount:entries.filter(e=>e.days>=b.min&&e.days<=b.max).reduce((v,e)=>v+e.overdue,0)}));
 const upcoming=sum(entries,'upcoming');const avg=overdue?entries.reduce((v,r)=>v+r.overdue*Math.max(0,r.days||0),0)/overdue:0;
 // Comparison is a candidate group, not a financial fairness verdict.
 const comparisonEntries=entries.filter(r=>['S01','S05','S07'].includes(r.sid)&&r.isDue).map(r=>({sid:r.sid,name:r.supplier.name,contract:r.contract,due:r.due,dueAmount:r.amount,paid:r.paid,onTime:r.onTime,balance:r.balance,clearance:r.paid/r.amount*100,punctual:r.onTime/r.amount*100}));
 const median=arr=>[...arr].sort((a,b)=>a-b)[Math.floor(arr.length/2)];
 const comparison={entries:comparisonEntries,medianClearance:median(comparisonEntries.map(e=>e.clearance)),medianPunctual:median(comparisonEntries.map(e=>e.punctual)),valid:comparisonEntries.length>=3,condition:'碎石 · 5-25mm · 验收结算后30天 · 同一到期窗口（2026年10月末至11月初）',note:'仅表示可核查的付款差异，不对公平与否作出认定。'};
 return {cutoff,period,entries,totals:{balance:bal,overdue,unknown,known,overdueRate:known?overdue/known*100:null,upcoming,avgOverdueDays:avg,companyMapped:mapped,unmapped:bal-mapped,mappingCoverage:bal?mapped/bal*100:0},groups,ageBands,comparison};
}
export function caseEvidence(caseId='L-001',period='2026-11'){
 const snap=snapshot(period);
 if(caseId==='COMPARE'){
  return {caseId,topic:'同条件供应商付款安排核查',facts:snap.comparison.entries.map(x=>`${x.name}（${x.contract}）：已到期${x.dueAmount}万元，已付${x.paid}万元，按期已付${x.onTime}万元；截至日清偿率${x.clearance.toFixed(1)}%，按期付款率${x.punctual.toFixed(1)}%。`),evidenceIds:['E-CO01'],openQuestions:['付款节奏差异是否有合同约定或争议原因？','是否需要由财资和供应链继续核对？'],decisionScope:'通常属于部门核查；未经核实不建议列为一号位决策事项。',cutoff:snap.cutoff};
 }
 if(caseId!=='L-001')throw new Error('case not found');
 const g=snap.groups.find(x=>x.id==='G2');
 return {caseId,topic:leadershipCase.title,facts:[`广域建材控股已确认归并应付${g.balance}万元，其中逾期${g.overdue}万元。`,`AP003原始应付900万元，截至${snap.cutoff}已核销220万元、未清680万元；AP004原始应付400万元、已核销50万元、未清350万元。`,'AP003登记争议90万元，但不直接扣减正式应付。','广域物资有限公司S04的集团关系待核，其应付金额没有进入G2已确认归并。'],evidenceIds:['E-C01','E-C02','E-P03','E-P04','E-A04','E-D03','E-G02'],openQuestions:['争议90万元的处理状态及正式依据是什么？','付款安排与集团资金计划是否协调？','是否需要明确归口部门会商及反馈期限？'],decisionScope:leadershipCase.question,cutoff:snap.cutoff};
}
