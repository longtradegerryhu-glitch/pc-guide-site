# wr-20261009-quizfull — 深度测评结果页补齐全套配置单

## 用户反馈
「为什么深度测评有转为只有外设了」——深度测评结果页只有「整机方案一行 + 外设推荐」，看不到 CPU/主板/内存/硬盘等核心部件。

## 诊断（jsdom 端到端实测，非推测）
把 smart.html 用 jsdom 跑起来、真实点击「深度测评」→ 逐题作答 → 点「生成我的方案」，抓出旧结果页结构：

| 项 | 旧行为 |
|---|---|
| 整机方案 | 仅一行文字：图标 + 名称 + summary + 参考价，**无部件明细** |
| 配件区 | 只按「升级重点」出件（显示器/键鼠/音频/支架/散热），**永远不含 CPU/显卡/内存/硬盘/主板/电源/机箱** |
| 方案数量 | 单套，无对比 |
| 导出文本 | 「配件推荐」同样只有外设，贴给店家等于半个方案 |

根因：快速推荐（initSmart）此前已改造为「全套配置单表格为主角」，**深度测评（initQuiz）仍是旧的单方案 + 外设模式**，两条路径各写各的渲染，没同步。

## 附带查出并修掉的严重 bug
`pickPlan` 兜底逻辑：`exact = price[1] <= cap`，预算内无方案时 `pool = candidates`（全部），再按「同匹配度取更贵」→ **越穷推越贵**。实测 4800 元游戏预算匹配到 **¥32000-42000 旗舰顶配档**。

修复：改按「起步价」判预算（`price[0] <= cap`），够不着就退回**最便宜**的一套，绝不在超预算时推旗舰。

## 改动（js/recommend.js）
1. 抽出模块级共用渲染函数（两条路径共用，消重）：
   - `specTableHtml(plan)` — 全套配置单表格（部件/配置/参考价 + 区间合计 + 照单买法提示），返回 `{html, parts, total}`
   - `planBriefHtml(plan)` — 方案简述卡（名称/档位/参考预算/适合人群/一句话）
   - `planSiblingSets(plan, pool)` — 相邻档位三套（省预算/为你匹配/加预算），笔记本保持单套
   - `planSetTabsHtml(sets, mainIdx)` / `bindPlanSetTabs(root, render)` — 多套切换标签
2. 深度测评（initQuiz）结果页重做：
   - **全套配置单表格成为主角**（9-11 行部件 + 合计）
   - 方案候选池按用途过滤（`pl.uses.some(u => use.includes(u))`），游戏用户不再看到只标办公的核显机当「省预算」
   - 多套对比 2-3 套，配件推荐随当前方案重算（`picksOf/totalsOf`），避免整机与配件档次脱节
   - 超预算黄色提示条（`budgetCap < plan.price[0] * 0.85`）
   - 导出文本（`quizPlanText`）补「全套配置单」逐行明细
3. `pickPlan` 预算兜底修正（见上）。

## 验证（jsdom 真实 DOM，非静态检查）
| 场景 | 输出 |
|---|---|
| 办公-4800 | 核显入门档 ¥4200-5500，9 部件，2 套（+加预算 独显入门档） |
| 游戏-4800（超预算） | 独显入门档 ¥6500-8500 + 超预算提示 + 加预算 主流游戏档 |
| 游戏-11000 | 主流游戏档 ¥10500-13000，10 部件，3 套对比 |
| 创作-24000 | 创作旗舰档 ¥22000-28000，10 部件，3 套对比 |
| 游戏-37000 | 旗舰顶配档 ¥32000-42000，3 套对比 |
| 办公-笔记本 | 便携移动型补强包（6 部件，单套） |

6 场景 JS 错误数均为 0；部件行恒为 CPU/显卡/主板/内存/硬盘/电源/机箱/散热/显示器/键鼠。快速推荐路径回归测试（办公/游戏/创作）同样 0 错误、配置单与三套对比完好。线上 11 项标记全 PASS。

## 部署
- EdgeOne 项目 pc-guide，部署 ID `dp0nt4qfqt7r`
- 提交：见 git log
- 注意：部署后约 30 秒内 PoP 仍返回旧文件（`js` 缓存 4h 的 edgeone.json 配置叠加传播延迟），验证需带 `?v=timestamp` 复核或稍等重测。

## 工具经验
- **jsdom 替代 headless 浏览器**：本沙箱 Edge `--headless --dump-dom` 无 stdout 输出（与 PowerShell 吞 stdout 同类问题）。改为 `npm i jsdom`（托管 node workspace）+ `JSDOM.fromFile(..., {runScripts:"dangerously", resources:"usable", beforeParse})`，`beforeParse` 里补 `scrollIntoView`/`matchMedia` polyfill，可真实点击并断言 DOM。**装一次即可长期复用**（`C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules/jsdom`）。
- 代码注释/文案避免「括号大白话」与辩护式长注释（用户已明确反感）。

## 遗留
- initQuiz/initBudgetTool/partCatalog 死代码仍留（守卫休眠，便回滚）
- looks/plans 正文全 JS 注入，SEO 需服务端预渲染
- 行情核验窗口：2026-11 底 ~ 12 月初
