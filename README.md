# 中建西部建设 · 集团应付经营研判

**定位：** 面向集团一号位、二号位的经营辅助决策产品。不是财务应付看板、付款审批平台或供应商评分系统。

## 当前版本的实际能力（V1.1 UI / 证据研判）

- **集团一号位、二号位专用：** 首页先展示一项预置的集团协调议题、确认范围内的业务事实、可选组织协调路径及上次意见反馈；普通供应商逾期不自动形成董事长待办。
- **保留原有风格：** 蓝色 CSCEC 标志、顶部横向导航、暖白底色、深绿与克制的金色未替换；删除英文装饰标题和首页大型 AI 聊天面板。
- **点击对象后分析：** 可从单笔应付（APxxx）、供应商集团（Gx）、同条件付款对照或重大协调议题打开侧栏；每类对象使用各自的付款、核销、合同字段和争议证据，不再共用同一套固定事实。
- **服务端真实模型接口：** `functions/api/analyze.js` 按所选业务对象从规则层生成证据包。模型只能引用规则层给出的事实编号，金额日期及引用事实由程序按原文呈现；模型自由摘要及意见一律标记待复核。模型未配置时不伪装为模型分析。
- **协调反馈原型：** 形成可编辑的意见草稿、录入部门执行反馈及证据编号，在同一浏览器保存。反馈不能自动签发、不能自动解除风险，也不能冒充正式 OA。
- **测试：** `npm test` 包含跨统计期、对象独立证据、金额勾稽、多对多核销和服务端归档事实检查。浏览器回归检查首页、四导航、证据侧栏、草稿与反馈及移动端。

## 数据和安全边界

所有合同、供应商、金额、归并关系均为**公开仓库内的虚构样例**；不能用作真实集团决策。标识在页面头部和页脚，不在正文反复出现。业务指标由 `public/assets/business.mjs` 的确定性规则计算。

AI 仅接收服务端针对**当前所选对象**构建的样例事实与证据编号，不会获得财务系统权限。模型生成的结果标记“待业务核实”，无法替代正式签发。真实企业数据接入、组织权限、OA、审计、接口均未实现。

## Cloudflare Pages 部署（GitHub）

在 Cloudflare 创建 **Pages → Connect to Git**，选择此独立仓库：

| 参数 | 值 |
| --- | --- |
| Production branch | `main` |
| Root directory | `/`（仓库根目录） |
| Framework preset | `None` |
| Build command | `exit 0` |
| Build output directory | `public` |

`functions/api/health.js` 与 `functions/api/analyze.js` 由 Cloudflare Pages Functions 自动识别。页面静态资源来自 `public`。无需先创建 Worker 或转发到旧项目；以后如需复用已有 Worker，可再改为 Service Binding，不要共享或泄漏现有 Key。

### 启用真实 AI

在 **Pages 项目 → Settings → Variables and Secrets** 中配置：

| 名称 | 类型 | 用途 |
| --- | --- | --- |
| `AI_ENABLED` | Text | `1` 开启；默认关闭 |
| `AI_API_KEY` | **Secret** | 大模型 API Key，不能写进网页或 GitHub |
| `AI_MODEL` | Text | 与服务商对应的模型名称 |
| `AI_BASE_URL` | Text | OpenAI 兼容接口的 `/v1` 基础地址；默认 `https://api.openai.com/v1` |
| `AI_DEMO_PASSCODE` | **Secret** | 试用访问口令，由使用者在网页内临时输入；不是大模型 Key |

保存变量后重新部署 Pages。若 AI 未启用，页面仍能展示依据和规则整理的事实，但**不会假装已经调用模型**。

**安全提示：** 当前试用口令只是最低限度的 API 访问保护。正式对外使用前必须通过 Cloudflare Access 或企业身份认证限制访问，并增加服务端限流、审计和成本监控。不要开放给无授权的互联网用户调用模型。

## 本地运行与测试

```bash
npm test
npm run serve
```

打开 `http://localhost:8100` 仅预览静态前端，API 需要 Cloudflare Pages Functions 环境（也可用 Wrangler Pages Dev 本地运行）。单纯打开 `index.html` 的 `file://` 路径不会正确加载 ES module。

## 验收重点

- 一号位/二号位首先看到的是“需决定什么”，不是业务部门待核清单。
- 同一笔款多种异常不能在资金总额中重复累计。
- 未核实供应商法人关系不自动并入已确认集团金额。
- 付款差异只解释合同条件相近的事实，不评价供应商公平性；普通差异不自动提级。
- 没有 AI Key、口令错误、上游故障时不输出伪造的 AI 回答。
- 决策草稿不等于正式 OA 或付款动作。

本仓库独立于原有 `zjxbjs1113` 与 `leadership-reading-compass`，不会修改它们。
