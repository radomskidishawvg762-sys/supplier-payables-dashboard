import {snapshot,analysisContext,analysisScopes,evidenceCatalog,leadershipCase,formatMoney,DATA_VERSION,REPORTING_DATES} from './business.mjs';

const root=document.querySelector('#app');
const STORE='cscec-payables-leadership-v11';
let restored={};try{restored=JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch{}
const state={page:'brief',period:'2026-11',drawer:null,focus:'L-001',prompt:'',aiReady:'checking',aiLoading:false,aiError:'',aiResult:null,chatTurns:[],sort:'days',expanded:{risks:false,groups:false,compare:false},drafts:Array.isArray(restored.drafts)?restored.drafts:[],search:'',periodOptions:Object.keys(REPORTING_DATES)};
const menu=[['brief','经营概览'],['risks','重点风险'],['topics','经营专题'],['actions','协调进展']];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>formatMoney(n)+' 万元';
const percent=n=>Number.isFinite(n)?Number(n).toFixed(1)+'%':'—';
const button=(label,act,cls='')=>`<button class="btn ${cls}" data-act="${esc(act)}">${esc(label)}</button>`;
const lnk=(label,act)=>`<button class="link" data-act="${esc(act)}">${esc(label)}</button>`;
const heading=(eyebrow,title,subtitle,extra='')=>`<div class="page-heading"><div><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${extra?`<div class="head-actions">${extra}</div>`:''}</div>`;
const section=(name,desc='',right='')=>`<div class="section-head"><div><h2>${esc(name)}</h2>${desc?`<p>${esc(desc)}</p>`:''}</div><div>${right}</div></div>`;
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify({drafts:state.drafts}))}catch{}};
const current=()=>snapshot(state.period);
const context=(id=state.focus)=>analysisContext(id,state.period);
const catalog=()=>evidenceCatalog(state.period);
function evidenceLinks(ids){const c=catalog();return [...new Set(ids)].filter(id=>c[id]).map(id=>`<button class="link source-link" data-evidence="${esc(id)}">${esc(c[id].label)}</button>`).join('　');}
function badge(text,cls=''){return `<span class="pill ${cls}">${esc(text)}</span>`;}
function layout(content){const s=current();return `<header class="masthead"><div class="container mast-inner"><div class="brand"><img src="/assets/cscec.png" alt="中国建筑 CSCEC"><div><div class="brand-name">中建西部建设</div><div class="brand-sub">集团经营管理 · 应付专题</div></div></div><div class="top-meta">${badge('样例环境','gold')}<label>统计期间 <select id="period-select" aria-label="统计期间">${state.periodOptions.map(p=>`<option ${p===state.period?'selected':''} value="${p}">${p}</option>`).join('')}</select></label><span>数据截至 <strong>${s.cutoff}</strong></span></div></div></header><nav class="nav" aria-label="主导航"><div class="container nav-inner">${menu.map(([id,name])=>`<button class="nav-link ${state.page===id?'active':''}" data-nav="${id}" ${state.page===id?'aria-current="page"':''}>${name}</button>`).join('')}<span class="nav-end">金额单位：万元</span></div></nav><main class="container">${content}</main><footer class="footer"><div class="container footer-inner"><span>中建西部建设 · 集团经营管理</span><span>版本 ${DATA_VERSION} · 统计截至 ${s.cutoff}</span></div></footer>${state.drawer?drawer():''}`;}
function numbers(s){const t=s.totals;return `<div class="overview-trail compact-metrics"><div class="stat"><label>集团应付余额</label><strong>${formatMoney(t.balance)}<small>万元</small></strong><div class="sub">未清偿应付</div></div><div class="stat"><label>已逾期未付</label><strong>${formatMoney(t.overdue)}<small>万元</small></strong><div class="sub">可核实范围逾期占比 ${percent(t.overdueRate)}</div></div><div class="stat"><label>未来30天到期</label><strong>${formatMoney(t.upcoming)}<small>万元</small></strong><div class="sub">按已登记到期日计算</div></div><div class="stat"><label>到期日待核金额</label><strong>${formatMoney(t.unknown)}<small>万元</small></strong><div class="sub">不计入逾期率分母</div></div></div>`;}
function factSnippet(facts,n=3){return `<div class="compact-facts">${facts.slice(0,n).map(f=>`<div class="summary-fact"><span>${esc(f.text)}</span>${lnk('依据',`source:${f.source_ids[0]}`)}</div>`).join('')}</div>`;}
function briefPage(){const s=current(),ctx=context('L-001'),g=s.groups.find(g=>g.id==='G2');const drafts=state.drafts.filter(d=>d.period===state.period);return heading('集团经营管理','集团应付经营观察','本期重大事项与处理进展',button('本期经营摘要','report','gold'))+
`<section class="leadership-lead"><div class="lead-top"><span class="soft-label">本期关注事项</span>${badge('待明确协调方向','gold')}</div><h2>${esc(leadershipCase.title)}</h2><p class="lead-deck">${esc(ctx.management)}</p><div class="lead-columns"><div><div class="lead-metrics"><span>相关应付 <strong>${money(g.balance)}</strong></span><span>其中逾期 <strong>${money(g.overdue)}</strong></span><span>登记争议 <strong>90 万元</strong></span></div><h3>主要事实</h3>${factSnippet(ctx.facts,3)}<div class="lead-actions">${button('查看业务依据','evidence:L-001')}${button('查看综合分析','analyze:L-001','primary')}</div></div><div class="lead-decision"><span class="soft-label">拟请明确的协调安排</span><h3>${esc(leadershipCase.question)}</h3>${button('比较协调路径','options:L-001','gold')} ${lnk('形成意见草稿','prepare:0')}</div></div></section>`+
 numbers(s)+section('协调进展','',lnk('查看全部','go:actions'))+
 `<div class="follow-overview">${drafts.length?drafts.slice(-2).reverse().map(d=>`<div class="follow-row"><div><b>${esc(d.title)}</b><p>${esc(d.decision)}</p></div><span>${badge(d.feedback?.length?'已收到反馈 · 待复核':'待正式确认',d.feedback?.length?'green':'gold')}</span>${lnk('查看','go:actions')}</div>`).join(''):'<div class="table-empty">本期尚无协调意见记录。可从重点事项查看证据并形成草稿。</div>'}</div>`+
 section('应付结构','',lnk('查看明细','go:risks'))+
 `<div class="thin-grid"><div class="thin-item"><b>已确认归并的供应商应付</b><strong>${money(s.totals.companyMapped)}</strong><p>归并覆盖率 ${percent(s.totals.mappingCoverage)}；未归并 ${money(s.totals.unmapped)}。</p></div><div class="thin-item"><b>逾期账龄较长的付款节点</b><strong>${s.entries.filter(r=>r.overdue>0&&r.days>180).length} 笔</strong><p>需结合合同、争议和管理责任判断是否提级。</p></div></div>`;
}
function risksPage(){const s=current();const rows=s.entries.filter(r=>r.overdue>0).sort((a,b)=>state.sort==='amount'?b.overdue-a.overdue:b.days-a.days);return heading('重点风险','重点应付事项','逾期金额、合同依据与处理情况',button('查看重点事项依据','analyze:L-001','primary'))+
 `<div class="risk-leading"><div><span class="soft-label">需进一步确认的协调事项</span><h2>${esc(leadershipCase.title)}</h2><p>${esc(leadershipCase.question)}</p></div><div class="risk-leading-actions">${button('查看原因与依据','analyze:L-001','primary')}${lnk('协调进展','go:actions')}</div></div>`+
 `<div class="risk-facts"><div><span>已核实逾期</span><b>${money(s.totals.overdue)}</b></div><div><span>逾期超过180天</span><b>${rows.filter(r=>r.days>180).length} 笔</b></div><div><span>到期日待核金额</span><b>${money(s.totals.unknown)}</b></div></div>`+
 section('单笔逾期明细')+
 `<div class="detail-panel"><details class="business-detail" data-expand="risks" ${state.expanded.risks?'open':''}><summary>展开逾期付款明细与筛选 <span class="small muted">（${rows.length} 笔）</span></summary><div class="filter-strip"><label>排序 <select id="risk-sort"><option value="days" ${state.sort==='days'?'selected':''}>逾期天数</option><option value="amount" ${state.sort==='amount'?'selected':''}>未清金额</option></select></label><span class="spacer"></span><span class="small muted">${rows.length} 笔 · 仅按已登记到期日筛选</span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>付款节点</th><th>供应商</th><th>到期日</th><th class="number">逾期天数</th><th class="number">未付金额</th><th>操作</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.id)}</b><div class="small muted">${esc(r.contract)}</div></td><td>${esc(r.supplier.name)}</td><td>${esc(r.due)}</td><td class="number">${r.days}天</td><td class="number"><b>${money(r.overdue)}</b></td><td>${lnk('证据',`payable:${r.id}`)}　${lnk('分析',`analyze:${r.id}`)}</td></tr>`).join('')}</tbody></table></div></details></div>`;
}
function topicsPage(){const s=current(),groups=s.groups.filter(g=>g.balance>0),comp=s.comparison;return heading('经营专题','经营专题','重点供应商与付款安排')+
 `<div class="topic-leads"><div class="topic-feature"><span class="soft-label">重点供应商</span><h2>广域建材：到期款与争议</h2><p>有哪些未清款项？争议如何影响后续协调？哪些情况仍没有充分依据？</p>${button('查看问题与依据','analyze:L-001','primary')}</div><div class="topic-feature"><span class="soft-label">付款安排</span><h2>同类供应商付款情况</h2><p>识别付款节奏差异，核对合同条件，判断是否需要继续核查。</p>${button('查看比较结果','analyze:COMPARE')}</div></div>`+
 section('供应商应付情况','按供应商集团汇总')+
 `<div class="detail-panel"><div class="table-scroll"><table class="data-table"><thead><tr><th>供应商集团</th><th class="number">应付余额</th><th class="number">逾期金额</th><th>合同数</th><th>操作</th></tr></thead><tbody>${groups.slice().sort((a,b)=>b.balance-a.balance).map(g=>`<tr><td><b>${esc(g.name)}</b></td><td class="number">${money(g.balance)}</td><td class="number">${money(g.overdue)}</td><td>${g.contracts}</td><td>${lnk('查合同及付款',`group:${g.id}`)}　${lnk('深入分析',`analyze:${g.id}`)}</td></tr>`).join('')}</tbody></table></div></div>`+
 section('同类付款对照','',button('分析付款差异','analyze:COMPARE','gold'))+
 `<div class="detail-panel"><details class="business-detail" data-expand="compare" ${state.expanded.compare?'open':''}><summary>展开付款对照清单 <span class="small muted">（${comp.entries.length} 家）</span></summary><div class="filter-strip"><span class="small muted">${esc(comp.condition)}</span><span class="spacer"></span>${badge(comp.valid?'3家独立供应商 · 候选可比组':'样本不足','gold')}</div><div class="table-scroll"><table class="data-table"><thead><tr><th>供应商</th><th>对应合同</th><th class="number">到期金额</th><th class="number">当前清偿比例</th><th class="number">按时付款比例</th><th>操作</th></tr></thead><tbody>${comp.entries.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.contract)}</td><td class="number">${money(r.dueAmount)}</td><td class="number">${percent(r.clearance)}</td><td class="number">${percent(r.punctual)}</td><td>${lnk('证据',`payable:${s.entries.find(x=>x.contract===r.contract)?.id}`)}</td></tr>`).join('')}</tbody></table></div><div class="facts-bar table-note">${esc(comp.note)}</div></details></div>`;
}
function actionsPage(){const drafts=state.drafts.filter(d=>d.period===state.period);return heading('协调进展','协调事项','管理意见与执行反馈',button('形成意见草稿','options:L-001','primary'))+
 `<div class="action-intro"><h2>${esc(leadershipCase.title)}</h2><p>本期需明确：${esc(leadershipCase.question)}</p><div class="lead-actions">${button('查看事实与不同路径','analyze:L-001')}${lnk('生成新草稿','prepare:0')}</div></div>`+
 `<div class="actions-status"><div><span>本期意见记录</span><strong>${drafts.length} 项</strong></div><div><span>已反馈待复核</span><strong>${drafts.filter(d=>d.feedback?.length).length} 项</strong></div><div><span>正式确认</span><strong>以集团 OA 为准</strong></div></div>`+
 section('本期意见记录')+
 `<div class="action-records">${drafts.length?drafts.slice().reverse().map(d=>`<div class="record"><div class="record-top">${badge(d.feedback?.length?'已有业务反馈 · 待复核':'待正式确认',d.feedback?.length?'green':'gold')}<small>${esc(d.time)}</small></div><h3>${esc(d.title)}</h3><p><b>要求：</b>${esc(d.decision)}</p><p><b>归口：</b>${esc(d.owner)}　<b>反馈期限：</b>${esc(d.limit||'待明确')}</p>${d.feedback?.length?`<div class="feedback-list">${d.feedback.map(f=>`<div><b>${esc(f.time)} · ${esc(f.actor)}</b><p>${esc(f.text)}</p><small>${esc(f.evidence||'未附业务凭证')} · 未经正式复核</small></div>`).join('')}</div>`:''}<div class="record-controls">${button('登记新的执行反馈',`feedback:${d.id}`,'compact')}${lnk('回看原事项','analyze:L-001')}</div></div>`).join(''):'<div class="table-empty">本期暂无已保存的意见草稿。可先查看重大事项与依据，再形成记录。</div>'}</div>`;
}
function sourceCard(id){const e=catalog()[id];return e?`<div class="evidence"><div class="meta">${esc(e.type)} · ${esc(id)}</div><h4>${esc(e.label)}</h4><p>${esc(e.description)}</p><small class="muted">来源编号：${esc(e.sourceId||id)}</small></div>`:'';}
function knownFacts(ctx,n=0){const f=n?ctx.facts.slice(0,n):ctx.facts;return `<div class="evidence-list">${f.map((x,i)=>`<div class="context-fact"><span class="record-index">${String(i+1).padStart(2,'0')}</span><div class="record-content"><div>${esc(x.text)}</div><div class="fact-source">${evidenceLinks(x.source_ids)}</div></div></div>`).join('')}</div>`;}
function factFold(ctx){return `<details class="material-details"><summary>查看全部事实与来源记录 <span class="muted">${ctx.facts.length} 项</span></summary>${knownFacts(ctx)}</details>`;}
function questionList(questions){return `<ul class="review-questions">${questions.slice(0,4).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;}
function aiResponse(){
 const transcript=state.chatTurns.map(turn=>`<div class="dialogue-turn ${turn.role==='user'?'from-user':'from-model'}"><div class="dialogue-role">${turn.role==='user'?'提问':'答复'}</div><div class="dialogue-text">${esc(turn.content)}</div>${turn.role==='assistant'&&turn.facts?.length?`<details class="material-details answer-citations"><summary>查看本次引用的记录（${turn.facts.length}）</summary>${knownFacts({facts:turn.facts})}</details>`:''}</div>`).join('');
 return `<div class="dialogue-transcript" aria-live="polite">${transcript}${state.aiLoading?'<div class="dialogue-pending">正在生成回答…</div>':''}${state.aiError?`<div class="dialogue-error">${esc(state.aiError)}</div>`:''}</div>`;
}

function drawer(){const d=state.drawer;if(!d)return '';let title='详情',html='';const s=current();
 if(d.type==='analysis'){
  const ctx=context(d.id);title='咨询 · '+ctx.title;
  html=`<div class="dialogue-context"><div><strong>${esc(ctx.title)}</strong><span>${esc(ctx.cutoff)} · ${esc(state.period)}</span></div><details class="material-details"><summary>查看关联业务资料（${ctx.facts.length}项）</summary>${knownFacts(ctx)}</details></div>
   <div class="dialogue-workspace">${aiResponse()}<div class="dialogue-composer"><label for="ai-prompt">请输入你的问题</label><textarea class="ai-input" id="ai-prompt" maxlength="1000" placeholder="可直接提问，也可以围绕当前事项继续追问。" aria-label="输入业务问题">${esc(state.prompt)}</textarea><div class="dialogue-toolbar"><span>${state.aiReady==='ready'?'已连接分析服务':state.aiReady==='checking'?'正在连接服务':'分析服务不可用'}</span>${state.chatTurns.length?lnk('清空对话','clear-chat'):''}${button(state.aiLoading?'正在生成…':'发送','generate-ai','primary')}</div></div></div>`;
 }else if(d.type==='source'){
  title='来源记录';html=`${sourceCard(d.id)}`;
 }else if(d.type==='evidence'){
  const ctx=context(d.id);title='事实依据 · '+ctx.title;html=`<div class="analysis-section-title"><h3>重要事实</h3></div>${knownFacts(ctx,Math.min(3,ctx.facts.length))}${ctx.facts.length>3?factFold(ctx):''}<details class="material-details"><summary>查看全部来源记录 <span class="muted">${ctx.sourceIds.length} 项</span></summary>${ctx.sourceIds.map(id=>sourceCard(id)).join('')}</details>`;
 }else if(d.type==='payable'){
  const ctx=context(d.id);title=ctx.title;html=`${knownFacts(ctx)}${button('围绕此记录分析','analyze:'+d.id,'primary')}`;
 }else if(d.type==='group'){
  const ctx=context(d.id);title=ctx.title;html=knownFacts(ctx)+button('围绕该供应商分析','analyze:'+d.id,'primary');
 }else if(d.type==='options'){
  const ctx=context('L-001');title='协调方式与条件';html=`<p>${esc(ctx.management)}</p><div class="option-grid">${ctx.options.map((o,i)=>`<div class="option-card"><h4>${esc(o.title)}</h4><p><b>预期作用：</b>${esc(o.consideration)}</p><p><b>前提与约束：</b>${esc(o.risk)}</p>${button('生成可编辑草稿','prepare:'+i,'compact primary')}</div>`).join('')}</div><div class="drawer-tail">${button('回看完整事实','analyze:L-001')}</div>`;
 }else if(d.type==='prepare'){
  const choice=context('L-001').options[d.index]||context('L-001').options[0];title='协调意见草稿';html=`<div class="form-field"><label for="draft-decision">需要落实的管理要求</label><textarea class="input textarea" id="draft-decision" maxlength="600">${esc(choice.title)}：请归口部门核实应付、付款安排与争议依据，并明确后续处理及反馈时间。</textarea></div><div class="form-field"><label for="draft-owner">业务归口</label><input class="input" id="draft-owner" maxlength="80" value="集团财资部、供应链管理部门"></div><div class="form-field"><label for="draft-limit">反馈时间或节点</label><input class="input" id="draft-limit" maxlength="80" placeholder="例如：下次经营分析会前"></div>${button('保存草稿','save-draft','primary')}`;
 }else if(d.type==='feedback'){
  const draft=state.drafts.find(x=>x.id===d.id);title='登记执行反馈';html=draft?`<p><b>${esc(draft.title)}</b></p><div class="form-field"><label for="feedback-actor">反馈人或反馈部门</label><input id="feedback-actor" class="input" maxlength="80" placeholder="例如：集团财资部"></div><div class="form-field"><label for="feedback-text">执行情况与剩余问题</label><textarea id="feedback-text" class="input textarea" maxlength="500" placeholder="填写实际已完成事项、尚未解决的问题和下一步节点"></textarea></div><div class="form-field"><label for="feedback-evidence">依据编号或凭证位置（可选）</label><input id="feedback-evidence" class="input" maxlength="120" placeholder="填写已有凭证编号，不上传敏感资料"></div>${button('保存反馈 · 待复核','save-feedback','primary')}`:'未找到记录';
 }else if(d.type==='report'){
  title='本期经营摘要';const ctx=context('L-001');html=`<span class="soft-label">${state.period} · 数据版本 ${DATA_VERSION}</span><h2>集团应付经营摘要</h2><div class="detail-list"><div><dt>集团应付余额</dt><dd>${money(s.totals.balance)}</dd></div><div><dt>已逾期未付</dt><dd>${money(s.totals.overdue)}</dd></div><div><dt>到期日待核</dt><dd>${money(s.totals.unknown)}</dd></div></div><h3>本期协调事项</h3>${knownFacts(ctx,3)}<p>${esc(ctx.management)}</p><h3>后续关注</h3><p>${esc(ctx.openQuestions[0])}</p>${button('打印','print','gold')}`;
 }
 return `<div class="drawer-scrim" id="drawer-mask"><aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="drawer-head"><h2>${esc(title)}</h2><button class="close" data-act="close" aria-label="关闭">×</button></div><div class="drawer-body">${html}</div></aside></div>`;
}
function reportMarkup(){
 const s=current(),ctx=context('L-001');
 return `<header class="print-brand"><img src="/assets/cscec.png" alt="中建西部建设"><div><strong>中建西部建设</strong><small>集团经营管理</small></div></header>
 <div class="print-title"><h1>集团应付经营摘要</h1><p>${esc(state.period)} · 统计截至 ${esc(s.cutoff)} · 单位：万元</p></div>
 <div class="print-metrics"><div>集团应付余额<strong>${formatMoney(s.totals.balance)}</strong></div><div>已逾期未付<strong>${formatMoney(s.totals.overdue)}</strong></div><div>未来30天到期<strong>${formatMoney(s.totals.upcoming)}</strong></div><div>到期日待核<strong>${formatMoney(s.totals.unknown)}</strong></div></div>
 <section class="print-section"><h2>本期重点事项</h2><h3>${esc(leadershipCase.title)}</h3><p>${esc(ctx.management)}</p></section>
 <section class="print-section"><h2>主要业务事实</h2><ol>${ctx.facts.slice(0,3).map(f=>`<li>${esc(f.text)}</li>`).join('')}</ol></section>
 <section class="print-section"><h2>需要协调的事项</h2><p>${esc(leadershipCase.question)}</p></section>
 <section class="print-section"><h2>后续核实</h2><ul>${ctx.openQuestions.slice(0,3).map(q=>`<li>${esc(q)}</li>`).join('')}</ul></section>
 <footer>数据版本 ${esc(DATA_VERSION)} · 来源：应付、付款及核销记录 · 中建西部建设</footer>`;
}
function makePrintSheet(){let sheet=document.getElementById('print-sheet');if(!sheet){sheet=document.createElement('article');sheet.id='print-sheet';document.body.append(sheet);}sheet.innerHTML=reportMarkup();}
function printReport(){makePrintSheet();window.print();}
window.addEventListener('beforeprint',makePrintSheet);
window.addEventListener('afterprint',()=>{document.getElementById('print-sheet')?.remove();});
function render(){root.innerHTML=layout(state.page==='brief'?briefPage():state.page==='risks'?risksPage():state.page==='topics'?topicsPage():actionsPage());if(state.drawer?.type==='analysis'&&(state.chatTurns.length||state.aiLoading||state.aiError)){requestAnimationFrame(()=>{const drawer=document.querySelector('.drawer');if(drawer)drawer.scrollTop=drawer.scrollHeight;});}}
function openAnalysis(id){try{context(id)}catch{return alert('该对象当前无法分析')}state.focus=id;state.prompt='';state.aiResult=null;state.aiError='';state.chatTurns=[];state.drawer={type:'analysis',id};render();}
async function checkAI(){try{const r=await fetch('/api/health',{cache:'no-store'});if(!r.ok)throw Error('offline');const data=await r.json();state.aiReady=data.available?'ready':'offline';}catch{state.aiReady='offline'}render();}
async function doAI(){
 if(state.aiLoading)return;
 const prompt=document.querySelector('#ai-prompt')?.value?.trim()||'';
 if(!prompt)return alert('请先输入问题');
 state.prompt=prompt;
 if(state.aiReady!=='ready'){state.aiError='分析服务暂不可用。';render();return;}
 const scope=state.focus,period=state.period;
 const history=state.chatTurns.map(({role,content})=>({role,content})).slice(-8);
 state.aiLoading=true;state.aiError='';render();
 try{
  const resp=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope,period,prompt,history})});
  const result=await resp.json().catch(()=>({error:'模型服务返回格式错误'}));
  if(!resp.ok)throw Error(result.error||`请求失败 (${resp.status})`);
  if(result.scope!==scope||result.period!==period||result.sourceVersion!==DATA_VERSION)throw Error('响应对应的数据版本已变化，请重试。');
  if(!result.analysis?.modelGenerated||!result.analysis?.summary)throw Error('模型没有返回有效回答，请重试。');
  if(scope!==state.focus||period!==state.period)return;
  state.chatTurns.push({role:'user',content:prompt},{role:'assistant',content:result.analysis.summary,facts:result.analysis.facts||[]});
  state.prompt='';state.aiResult=result.analysis;
 }catch(e){if(scope===state.focus&&period===state.period)state.aiError=e.message||'模型请求失败。';}
 finally{state.aiLoading=false;render();}
}

document.addEventListener('click',async event=>{
 const source=event.target.closest('[data-evidence]');if(source){state.drawer={type:'source',id:source.dataset.evidence};return render();}
 const nav=event.target.closest('[data-nav]');if(nav){state.page=nav.dataset.nav;state.drawer=null;return render();}
 const action=event.target.closest('[data-act]')?.dataset.act;if(!action){if(event.target.id==='drawer-mask'){state.drawer=null;render()}return;}
 if(action.startsWith('go:')){state.page=action.slice(3);state.drawer=null;return render();}
 if(action.startsWith('analyze:'))return openAnalysis(action.slice(8));
 if(action.startsWith('source:'))state.drawer={type:'source',id:action.slice(7)};
 else if(action.startsWith('payable:'))state.drawer={type:'payable',id:action.slice(8)};
 else if(action.startsWith('group:'))state.drawer={type:'group',id:action.slice(6)};
 else if(action.startsWith('evidence:'))state.drawer={type:'evidence',id:action.slice(9)};
 else if(action.startsWith('options:'))state.drawer={type:'options'};
 else if(action.startsWith('prepare:'))state.drawer={type:'prepare',index:Number(action.slice(8))};
 else if(action.startsWith('feedback:'))state.drawer={type:'feedback',id:action.slice(9)};
 else if(action==='report')state.drawer={type:'report'};
 else if(action==='generate-ai')return await doAI();
 else if(action==='clear-chat'){state.chatTurns=[];state.prompt='';state.aiError='';return render();}
 else if(action==='save-draft'){
  const decision=document.querySelector('#draft-decision')?.value?.trim(),owner=document.querySelector('#draft-owner')?.value?.trim(),limit=document.querySelector('#draft-limit')?.value?.trim();if(!decision||decision.length<12||!owner)return alert('请填写具体管理要求和归口部门');
  state.drafts.push({id:`LOCAL-${Date.now()}`,caseId:'L-001',period:state.period,dataVersion:DATA_VERSION,title:leadershipCase.title,decision,owner,limit,status:'待正式确认',feedback:[],time:new Date().toLocaleString('zh-CN')});save();state.drawer=null;state.page='actions';return render();
 }else if(action==='save-feedback'){
  const record=state.drafts.find(d=>d.id===state.drawer?.id);if(!record)return alert('记录不存在');const actor=document.querySelector('#feedback-actor')?.value?.trim(),text=document.querySelector('#feedback-text')?.value?.trim(),evidence=document.querySelector('#feedback-evidence')?.value?.trim();if(!actor||!text||text.length<10)return alert('请填写反馈人和具体执行情况');record.feedback=record.feedback||[];record.feedback.push({actor,text,evidence,time:new Date().toLocaleString('zh-CN')});record.status='已有反馈 · 待正式复核';save();state.drawer=null;state.page='actions';return render();
 }else if(action==='print')return printReport();
 else if(action==='close')state.drawer=null;
 render();
});
document.addEventListener('toggle',event=>{const target=event.target;if(target.matches?.('details[data-expand]'))state.expanded[target.dataset.expand]=target.open;},true);
document.addEventListener('change',event=>{
 if(event.target.id==='risk-sort'){state.sort=event.target.value;render();}
 if(event.target.id==='period-select'){state.period=event.target.value;state.drawer=null;state.aiResult=null;state.aiError='';state.chatTurns=[];render();}
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&state.drawer){state.drawer=null;render();}});
render();checkAI();
