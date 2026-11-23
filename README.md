# 中建西部建设 · 集团应付经营研判

**定位：** 面向集团一号位、二号位的经营辅助决策产品。不是财务应付看板、付款审批平台或供应商评分系统。

## 已实现

- 领导首页优先显示已确认的重大议题、需要明确的协调方向与事实依据；财务数字退至辅助位置。
- “AI 经营研判”支持领导预设问题及自然语言追问；服务端从事实包中组织证据并调用模型，生成已确认事实、待核点、可选措施及领导决策问题。
- 重大风险、专题分析、决策跟踪三个视图；可进入单笔应付、核销分配、供应商集团关系和付款对照依据。
- 协调方案生成**本地待确认草稿**，不会自动创建正式 OA 流程，也不会执行付款。
- 原有蓝色 CSCEC 标志、顶部横向导航、暖白＋深绿＋少量金色的视觉系统保留。

## 数据和安全边界

所有合同、供应商、金额、归并关系均为**公开仓库内的虚构样例**；不能用作真实集团决策。标识在页面头部和页脚，不在正文反复出现。业务指标由 `public/assets/business.mjs` 的确定性规则计算。

AI 仅接收服务端构建的样例事实和证据编号，不会获得财务系统权限。模型生成的结果标记“待业务核实”，无法替代正式签发。真实企业数据接入、组织权限、OA、审计、接口均未实现。

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