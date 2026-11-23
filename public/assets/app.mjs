import {snapshot,analysisContext,analysisScopes,evidenceCatalog,leadershipCase,formatMoney,DATA_VERSION,REPORTING_DATES} from './business.mjs';

const root=document.querySelector('#app');
const STORE='cscec-payables-leadership-v11';
let restored={};try{restored=JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch{}
const state={page:'brief',period:'2026-11',drawer:null,focus:'L-001',prompt:'',aiReady:'checking',aiLoading:false,aiError:'',aiResult:null,sort:'days',expanded:{risks:false,groups:false,compare:false},drafts:Array.isArray(restored.drafts)?restored.drafts:[],search:'',periodOptions:Object.keys(REPORTING_DATES)};
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
function layout(content){const s=current();return `<header class="masthead"><div class="container mast-inner"><div class="brand"><img src="/assets/cscec.png" alt="中国建筑 CSCEC"><div><div class="brand-name">中建西部建设</div><div class="brand-sub">集团经营管理 · 应付专题</div></div></div><div class="top-meta">${badge('样例环境','gold')}<label>统计期间 <select id="period-select" aria-label="统计期间">${state.periodOptions.map(p=>`<option ${p===state.period?'selected':''} value="${p}">${p}</option>`).join('')}</select></label><span>数据截至 <strong>${s.cutoff}</strong></span></div></div></header><nav class="nav" aria-label="主导航"><div class="container nav-inner">${menu.map(([id,name])=>`<button class="nav-link ${state.page===id?'active':''}" data-nav="${id}" ${state.page===id?'aria-current="page"':''}>${name}</button>`).join('')}<span class="nav-end">金额单位：万元</span></div></nav><main class="container">${content}</main><footer class="footer"><div class="container footer-inner"><span>中建西部建设 · 集团经营管理</span><span>数据说明：分析内容以当前记录为依据，正式决策须经业务确认。</span></div></footer>${state.drawer?drawer():''}`;}
function numbers(s){const t=s.totals;return `<div class="overview-trail compact-metrics"><div class="stat"><label>集团应付余额</label><strong>${formatMoney(t.balance)}<small>万元</small></strong><div class="sub">未清偿应付</div></div><div class="stat"><label>已逾期未付</label><strong>${formatMoney(t.overdue)}<small>万元</small></strong><div class="sub">可核实范围逾期占比 ${percent(t.overdueRate)}</div></div><div class="stat"><label>未来30天到期</label><strong>${formatMoney(t.upcoming)}<small>万元</small></strong><div class="sub">按已登记到期日计算</div></div><div class="stat"><label>到期日待核金额</label><strong>${formatMoney(t.unknown)}<small>万元</small></strong><div class="sub">不计入逾期率分母</div></div></div>`;}
function factSnippet(facts,n=3){return `<div class="compact-facts">${facts.slice(0,n).map(f=>`<div class="summary-fact"><span>${esc(f.text)}</span>${lnk('依据',`source:${f.source_ids[0]}`)}</div>`).join('')}</div>`;}
function briefPage(){const s=current(),ctx=context('L-001'),g=s.groups.find(g=>g.id==='G2');const drafts=state.drafts.filter(d=>d.period===state.period);return heading('集团经营管理','集团应付经营观察','聚焦重大应付事项、协调安排与后续进展。',button('本期经营摘要','report','gold'))+
`<section class="panel leadership-lead"><div class="lead-top"><span class="soft-label">本期关注事项</span>${badge('待明确协调方向','gold')}</div><h2>${esc(leadershipCase.title)}</h2><p class="lead-deck">${esc(ctx.management)}</p><div class="lead-columns"><div><div class="lead-metrics"><span>相关应付 <strong>${money(g.balance)}</strong></span><span>其中逾期 <strong>${money(g.overdue)}</strong></span><span>登记争议 <strong>90 万元</strong></span></div><h3>主要事实</h3>${factSnippet(ctx.facts,3)}<div class="lead-actions">${button('查看业务依据','evidence:L-001')}${button('查看综合分析','analyze:L-001','primary')}</div></div><div class="lead-decision"><span class="soft-label">拟请明确的协调安排</span><h3>${esc(leadershipCase.question)}</h3><p>目前没有证据证明已发生停供或实际损失；付款仍按既有授权流程办理。</p>${button('比较协调路径','options:L-001','gold')} ${lnk('形成意见草稿','prepare:0')}</div></div></section>`+
 numbers(s)+section('已有管理意见与反馈','本页记录用于整理管理意见；正式结果以企业审批系统为准。',lnk('进入协调进展','go:actions'))+
 `<div class="panel follow-overview">${drafts.length?drafts.slice(-2).reverse().map(d=>`<div class="follow-row"><div><b>${esc(d.title)}</b><p>${esc(d.decision)}</p></div><span>${badge(d.feedback?.length?'已收到反馈 · 待复核':'待正式确认',d.feedback?.length?'green':'gold')}</span>${lnk('查看','go:actions')}</div>`).join(''):'<div class="table-empty">本期尚无协调意见记录。可从重点事项查看证据并形成草稿。</div>'}</div>`+
 section('相关应付情况','财务数据用于解释事项，不直接等于需要集团审批的事项。',lnk('查看风险依据','go:risks'))+
 `<div class="thin-grid"><div class="panel thin-item"><b>已确认归并的供应商应付</b><strong>${money(s.totals.companyMapped)}</strong><p>归并覆盖率 ${percent(s.totals.mappingCoverage)}；未归并 ${money(s.totals.unmapped)}。</p></div><div class="panel thin-item"><b>逾期账龄较长的付款节点</b><strong>${s.entries.filter(r=>r.overdue>0&&r.days>180).length} 笔</strong><p>需结合合同、争议和管理责任判断是否提级。</p></div></div>`;
}
function risksPage(){const s=current();const rows=s.entries.filter(r=>r.overdue>0).sort((a,b)=>state.sort==='amount'?b.overdue-a.overdue:b.days-a.days);return heading('重点风险','重大事项与付款依据','先看需协调的重大问题；单笔付款记录按需展开。',button('查看重点事项依据','analyze:L-001','primary'))+
 `<div class="panel risk-leading"><div><span class="soft-label">需进一步确认的协调事项</span><h2>${esc(leadershipCase.title)}</h2><p>${esc(leadershipCase.question)}</p></div><div class="risk-leading-actions">${button('查看原因与依据','analyze:L-001','primary')}${lnk('协调进展','go:actions')}</div></div>`+
 section('单笔逾期查询','用于核对合同到期日、未付金额与历史付款情况，不自动生成领导待办。')+
 `<div class="panel detail-panel"><details class="business-detail" data-expand="risks" ${state.expanded.risks?'open':''}><summary>展开逾期付款明细与筛选 <span class="small muted">（${rows.length} 笔）</span></summary><div class="filter-strip"><label>排序 <select id="risk-sort"><option value="days" ${state.sort==='days'?'selected':''}>逾期天数</option><option value="amount" ${state.sort==='amount'?'selected':''}>未清金额</option></select></label><span class="spacer"></span><span class="small muted">${rows.length} 笔 · 仅按已登记到期日筛选</span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>付款节点</th><th>供应商</th><th>到期日</th><th class="number">逾期天数</th><th class="number">未付金额</th><th>操作</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.id)}</b><div class="small muted">${esc(r.contract)}</div></td><td>${esc(r.supplier.name)}</td><td>${esc(r.due)}</td><td class="number">${r.days}天</td><td class="number"><b>${money(r.overdue)}</b></td><td>${lnk('证据',`payable:${r.id}`)}　${lnk('分析',`analyze:${r.id}`)}</td></tr>`).join('')}</tbody></table></div></details></div>`;
}
function topicsPage(){const s=current(),groups=s.groups.filter(g=>g.balance>0),comp=s.comparison;return heading('经营专题','围绕管理问题开展专项分析','从具体问题进入分析，供应商和付款记录作为查询依据。')+
 `<div class="topic-leads"><div class="panel topic-feature"><span class="soft-label">重点供应商</span><h2>广域建材：到期款与争议</h2><p>有哪些未清款项？争议如何影响后续协调？哪些情况仍没有充分依据？</p>${button('查看问题与依据','analyze:L-001','primary')}</div><div class="panel topic-feature"><span class="soft-label">付款安排</span><h2>同类供应商付款情况</h2><p>识别付款节奏差异，核对合同条件，判断是否需要继续核查。</p>${button('查看比较结果','analyze:COMPARE')}</div></div>`+
 section('供应商应付明细','按已核实的集团关系汇总；余额较高不直接代表风险。')+
 `<div class="panel detail-panel"><details class="business-detail" data-expand="groups" ${state.expanded.groups?'open':''}><summary>查看供应商应付清单 <span class="small muted">（${groups.length} 家）</span></summary><div class="table-scroll"><table class="data-table"><thead><tr><th>供应商集团</th><th class="number">应付余额</th><th class="number">逾期金额</th><th>合同数</th><th>操作</th></tr></thead><tbody>${groups.map(g=>`<tr><td><b>${esc(g.name)}</b></td><td class="number">${money(g.balance)}</td><td class="number">${money(g.overdue)}</td><td>${g.contracts}</td><td>${lnk('查看依据',`group:${g.id}`)}　${lnk('专题分析',`analyze:${g.id}`)}</td></tr>`).join('')}</tbody></table></div><div class="facts-bar table-note">已确认归并 ${money(s.totals.companyMapped)} · 待核归属 ${money(s.totals.unmapped)} · 归并覆盖率 ${percent(s.totals.mappingCoverage)}</div></details></div>`+
 section('付款对照明细','相关比较由财资及供应链核实，只有经确认需集团协调的情况才提请管理层。',button('查看分析依据','analyze:COMPARE','gold'))+
 `<div class="panel detail-panel"><details class="business-detail" data-expand="compare" ${state.expanded.compare?'open':''}><summary>展开付款对照清单 <span class="small muted">（${comp.entries.length} 家）</span></summary><div class="filter-strip"><span class="small muted">${esc(comp.condition)}</span><span class="spacer"></span>${badge(comp.valid?'3家独立供应商 · 候选可比组':'样本不足','gold')}</div><div class="table-scroll"><table class="data-table"><thead><tr><th>供应商</th><th>对应合同</th><th class="number">到期金额</th><th class="number">当前清偿比例</th><th class="number">按时付款比例</th><th>操作</th></tr></thead><tbody>${comp.entries.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.contract)}</td><td class="number">${money(r.dueAmount)}</td><td class="number">${percent(r.clearance)}</td><td class="number">${percent(r.punctual)}</td><td>${lnk('证据',`payable:${s.entries.find(x=>x.contract===r.contract)?.id}`)}</td></tr>`).join('')}</tbody></table></div><div class="facts-bar table-note">${esc(comp.note)} 本环境的可比条件仅用于规则演示，正式使用需合同原件与业务归口确认。</div></details></div>`;
}
function actionsPage(){const drafts=state.drafts.filter(d=>d.period===state.period);return heading('协调进展','管理意见与执行情况','重点关注上次安排、归口反馈和仍需协调的问题。',button('形成意见草稿','options:L-001','primary'))+
 `<div class="panel panel-pad action-intro"><h2>${esc(leadershipCase.title)}</h2><p>本期需明确：${esc(leadershipCase.question)}</p><div class="lead-actions">${button('查看事实与不同路径','analyze:L-001')}${lnk('生成新草稿','prepare:0')}</div></div>`+
 section('本期意见记录','仅保存于当前浏览器；反馈未经过正式核实或 OA 确认。')+
 `<div class="panel">${drafts.length?drafts.slice().reverse().map(d=>`<div class="record"><div class="record-top">${badge(d.feedback?.length?'已有业务反馈 · 待复核':'待正式确认',d.feedback?.length?'green':'gold')}<small>${esc(d.time)}</small></div><h3>${esc(d.title)}</h3><p><b>要求：</b>${esc(d.decision)}</p><p><b>归口：</b>${esc(d.owner)}　<b>反馈期限：</b>${esc(d.limit||'待明确')}</p>${d.feedback?.length?`<div class="feedback-list">${d.feedback.map(f=>`<div><b>${esc(f.time)} · ${esc(f.actor)}</b><p>${esc(f.text)}</p><small>${esc(f.evidence||'未附业务凭证')} · 未经正式复核</small></div>`).join('')}</div>`:''}<div class="record-controls">${button('登记新的执行反馈',`feedback:${d.id}`,'compact')}${lnk('回看原事项','analyze:L-001')}</div></div>`).join(''):'<div class="table-empty">本期暂无已保存的意见草稿。可先查看重大事项与依据，再形成记录。</div>'}</div>`;
}
function sourceCard(id){const e=catalog()[id];return e?`<div class="evidence"><div class="meta">${esc(e.type)} · ${esc(id)}</div><h4>${esc(e.label)}</h4><p>${esc(e.description)}</p><small class="muted">来源编号：${esc(e.sourceId||id)}</small></div>`:'';}
function knownFacts(ctx,n=0){const f=n?ctx.facts.slice(0,n):ctx.facts;return `<div class="evidence-list">${f.map((x,i)=>`<div class="context-fact"><span class="record-index">${String(i+1).padStart(2,'0')}</span><div class="record-content"><div>${esc(x.text)}</div><div class="fact-source">${evidenceLinks(x.source_ids)}</div></div></div>`).join('')}</div>`;}
function factFold(ctx){return `<details class="material-details"><summary>查看全部事实与来源记录 <span class="muted">${ctx.facts.length} 项</span></summary>${knownFacts(ctx)}</details>`;}
function questionList(questions){return `<ul class="review-questions">${questions.slice(0,4).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;}
function aiResponse(){
 if(state.aiLoading)return `<div class="analysis-wait">正在核对相关材料并组织分析结果……</div>`;
 if(state.aiError)return `<div class="analysis-error"><b>分析未完成</b><p>${esc(state.aiError)}</p></div>`;
 const a=state.aiResult;if(!a)return '';
 return `<section class="analysis-result" aria-live="polite"><div class="analysis-result-head"><span>综合研判</span>${badge('待业务确认','gold')}</div><p class="analysis-summary">${esc(a.summary)}</p>${a.decisionQuestion?`<div class="result-decision"><b>建议明确</b><p>${esc(a.decisionQuestion)}</p></div>`:''}${a.options?.length?`<h4>可讨论的协调方式</h4><div class="result-options">${a.options.map(o=>`<article><b>${esc(o.title)}</b><p>${esc(o.consideration)}</p><small>条件与约束：${esc(o.risk)}</small></article>`).join('')}</div>`:''}${a.unknowns.length?`<h4>有待进一步确认</h4>${questionList(a.unknowns)}`:''}<details class="material-details"><summary>本次引用的事实与出处 <span class="muted">${a.facts.length} 项</span></summary>${knownFacts({facts:a.facts})}</details><p class="analysis-disclaimer">以上为模型生成的分析意见，不构成正式业务结论。事实以来源记录为准。</p></section>`;
}

function drawer(){const d=state.drawer;if(!d)return '';let title='详情',html='';const s=current();
 if(d.type==='analysis'){
  const ctx=context(d.id);title='事项分析 · '+ctx.title;
  html=`<div class="analysis-context"><div class="analysis-meta">${badge(ctx.tier,'gold')}<span>${esc(ctx.cutoff)} · ${esc(ctx.sourceVersion)}</span></div><span class="analysis-kicker">本事项需要关注什么</span><p class="analysis-focus">${esc(ctx.management)}</p></div><div class="analysis-section"><div class="analysis-section-title"><h3>关键事实</h3><small>来源记录可追溯</small></div>${knownFacts(ctx,Math.min(2,ctx.facts.length))}${ctx.facts.length>2?factFold(ctx):''}</div><div class="analysis-section"><div class="analysis-section-title"><h3>仍需明确</h3><small>不以推测替代核实</small></div>${questionList(ctx.openQuestions)}</div><div class="analysis-section analysis-query"><div class="analysis-section-title"><h3>进一步研判</h3>${badge(state.aiReady==='ready'?'服务可用':state.aiReady==='checking'?'正在连接':'未配置模型服务',state.aiReady==='ready'?'green':'')}</div><p class="muted small">系统将围绕当前事项的记录组织分析，涉及付款金额与日期时以业务规则计算为准。</p><label class="field-heading" for="ai-prompt">分析问题</label><textarea class="ai-input" id="ai-prompt" maxlength="260" aria-label="针对当前事项提问">${esc(state.prompt)}</textarea><div class="context-query-actions">${button(state.aiLoading?'正在分析…':'生成综合研判','generate-ai','primary')}</div>${aiResponse()}</div>`;
 }else if(d.type==='source'){
  title='来源记录';html=`<p class="small muted">以下为当前数据批次中的登记内容；正式使用时可跳转原始合同、付款和核销单据。</p>${sourceCard(d.id)}`;
 }else if(d.type==='evidence'){
  const ctx=context(d.id);title='事实依据 · '+ctx.title;html=`<div class="analysis-section-title"><h3>重要事实</h3></div>${knownFacts(ctx,Math.min(3,ctx.facts.length))}${ctx.facts.length>3?factFold(ctx):''}<details class="material-details"><summary>查看全部来源记录 <span class="muted">${ctx.sourceIds.length} 项</span></summary>${ctx.sourceIds.map(id=>sourceCard(id)).join('')}</details>`;
 }else if(d.type==='payable'){
  const ctx=context(d.id);title=ctx.title;html=`${knownFacts(ctx)}<p class="small muted">以上来自当前期间的应付、付款与核销示例记录。</p>${button('围绕此记录分析','analyze:'+d.id,'primary')}`;
 }else if(d.type==='group'){
  const ctx=context(d.id);title=ctx.title;html=knownFacts(ctx)+button('围绕该供应商分析','analyze:'+d.id,'primary');
 }else if(d.type==='options'){
  const ctx=context('L-001');title='协调方式与条件';html=`<p>${esc(ctx.management)}</p><div class="option-grid">${ctx.options.map((o,i)=>`<div class="option-card"><h4>${esc(o.title)}</h4><p><b>预期作用：</b>${esc(o.consideration)}</p><p><b>前提与约束：</b>${esc(o.risk)}</p>${button('生成可编辑草稿','prepare:'+i,'compact primary')}</div>`).join('')}</div><div class="drawer-tail">${button('回看完整事实','analyze:L-001')}</div>`;
 }else if(d.type==='prepare'){
  const choice=context('L-001').options[d.index]||context('L-001').options[0];title='协调意见草稿';html=`<p class="small muted">当前为意见草稿；正式授权和付款仍以企业流程为准。</p><div class="form-field"><label for="draft-decision">需要落实的管理要求</label><textarea class="input textarea" id="draft-decision" maxlength="600">${esc(choice.title)}：请归口部门核实应付、付款安排与争议依据，并明确后续处理及反馈时间。</textarea></div><div class="form-field"><label for="draft-owner">业务归口</label><input class="input" id="draft-owner" maxlength="80" value="集团财资部、供应链管理部门"></div><div class="form-field"><label for="draft-limit">反馈时间或节点</label><input class="input" id="draft-limit" maxlength="80" placeholder="例如：下次经营分析会前"></div>${button('保存草稿','save-draft','primary')}`;
 }else if(d.type==='feedback'){
  const draft=state.drafts.find(x=>x.id===d.id);title='登记执行反馈';html=draft?`<p><b>${esc(draft.title)}</b></p><p class="small muted">反馈是当前浏览器中的样例记录，不代表集团 OA 已反馈或相关风险已解除。</p><div class="form-field"><label for="feedback-actor">反馈人或反馈部门</label><input id="feedback-actor" class="input" maxlength="80" placeholder="例如：集团财资部"></div><div class="form-field"><label for="feedback-text">执行情况与剩余问题</label><textarea id="feedback-text" class="input textarea" maxlength="500" placeholder="填写实际已完成事项、尚未解决的问题和下一步节点"></textarea></div><div class="form-field"><label for="feedback-evidence">依据编号或凭证位置（可选）</label><input id="feedback-evidence" class="input" maxlength="120" placeholder="填写已有凭证编号，不上传敏感资料"></div>${button('保存反馈 · 待复核','save-feedback','primary')}`:'未找到记录';
 }else if(d.type==='report'){
  title='本期经营摘要';const ctx=context('L-001');html=`<span class="soft-label">${state.period} · 数据版本 ${DATA_VERSION}</span><h2>集团应付经营摘要</h2><div class="detail-list"><div><dt>集团应付余额</dt><dd>${money(s.totals.balance)}</dd></div><div><dt>已逾期未付</dt><dd>${money(s.totals.overdue)}</dd></div><div><dt>到期日待核</dt><dd>${money(s.totals.unknown)}</dd></div></div><h3>本期协调事项</h3>${knownFacts(ctx,3)}<p>${esc(ctx.management)}</p><h3>后续关注</h3><p>${esc(ctx.openQuestions[0])}</p><p class="small muted">当前为样例环境的工作摘要，未经正式确认或签发。</p>${button('打印','print','gold')}`;

 }
 return `<div class="drawer-scrim" id="drawer-mask"><aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="drawer-head"><h2>${esc(title)}</h2><button class="close" data-act="close" aria-label="关闭">×</button></div><div class="drawer-body">${html}</div></aside></div>`;
}
function render(){root.innerHTML=layout(state.page==='brief'?briefPage():state.page==='risks'?risksPage():state.page==='topics'?topicsPage():actionsPage());}
function openAnalysis(id){try{context(id)}catch{return alert('该对象当前无法分析')}state.focus=id;state.prompt=id==='L-001'?'该事项为什么需要集团协调？还有哪些关键事实未确认？':id==='COMPARE'?'这组付款对照反映了哪些事实？哪些不能得出公平性结论？':id.startsWith('AP')?'请说明这笔应付的付款、核销和逾期事实，以及仍需核实什么？':'这家供应商的集团应付有哪些值得关注的事实？是否需要集团介入？';state.aiResult=null;state.aiError='';state.drawer={type:'analysis',id};render();}
async function checkAI(){try{const r=await fetch('/api/health',{cache:'no-store'});if(!r.ok)throw Error('offline');const data=await r.json();state.aiReady=data.available?'ready':'offline';}catch{state.aiReady='offline'}render();}
async function doAI(){if(state.aiLoading)return;const val=document.querySelector('#ai-prompt')?.value?.trim()||'';state.prompt=val;if(val.length<5)return alert('请填写具体问题');if(state.aiReady!=='ready'){state.aiError='分析服务未启用。请检查 Cloudflare 服务端配置。';return render();}state.aiLoading=true;state.aiError='';state.aiResult=null;render();try{const resp=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope:state.focus,period:state.period,prompt:val})});const result=await resp.json().catch(()=>({error:'服务器返回内容无法解析'}));if(!resp.ok)throw Error(result.error||`请求失败 ${resp.status}`);if(result.scope!==state.focus||result.period!==state.period||result.sourceVersion!==DATA_VERSION)throw Error('分析结果的对象或数据版本不一致');state.aiResult=result.analysis;}catch(e){state.aiError=e.message||'分析失败'}finally{state.aiLoading=false;render()}}

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

 else if(action==='save-draft'){
  const decision=document.querySelector('#draft-decision')?.value?.trim(),owner=document.querySelector('#draft-owner')?.value?.trim(),limit=document.querySelector('#draft-limit')?.value?.trim();if(!decision||decision.length<12||!owner)return alert('请填写具体管理要求和归口部门');
  state.drafts.push({id:`LOCAL-${Date.now()}`,caseId:'L-001',period:state.period,dataVersion:DATA_VERSION,title:leadershipCase.title,decision,owner,limit,status:'待正式确认',feedback:[],time:new Date().toLocaleString('zh-CN')});save();state.drawer=null;state.page='actions';return render();
 }else if(action==='save-feedback'){
  const record=state.drafts.find(d=>d.id===state.drawer?.id);if(!record)return alert('记录不存在');const actor=document.querySelector('#feedback-actor')?.value?.trim(),text=document.querySelector('#feedback-text')?.value?.trim(),evidence=document.querySelector('#feedback-evidence')?.value?.trim();if(!actor||!text||text.length<10)return alert('请填写反馈人和具体执行情况');record.feedback=record.feedback||[];record.feedback.push({actor,text,evidence,time:new Date().toLocaleString('zh-CN')});record.status='已有反馈 · 待正式复核';save();state.drawer=null;state.page='actions';return render();
 }else if(action==='print')return window.print();
 else if(action==='close')state.drawer=null;
 render();
});
document.addEventListener('toggle',event=>{const target=event.target;if(target.matches?.('details[data-expand]'))state.expanded[target.dataset.expand]=target.open;},true);
document.addEventListener('change',event=>{
 if(event.target.id==='risk-sort'){state.sort=event.target.value;render();}
 if(event.target.id==='period-select'){state.period=event.target.value;state.drawer=null;state.aiResult=null;state.aiError='';render();}
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&state.drawer){state.drawer=null;render();}});
render();checkAI();
