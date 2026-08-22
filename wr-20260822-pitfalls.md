# 工作记录 wr-20260822-pitfalls｜智能推荐加「小白避坑」提示

> 审计角色：Auditor ｜ 时间：2026-08-22 21:33- ｜ 基线提交：f532115（评估）

## 一、本次目标（改进清单 #1）
在智能推荐（smart.html 测评结果）与预算适配器（accessories.html 预算工具）的结果区，按用户用途增加「最容易翻车」的大白话避坑提示，直接命中「小白可用性」核心哲学。

## 二、改动清单
1. **js/data.js**：新增 `PC_DATA.pitfalls` 字段，按 5 个键分组——office(3)、game(4)、create(3)、portable(3)、common(3)，共 16 条大白话短句（刻意避开 `< > &` 等特殊字符，规避转义风险）。
2. **js/recommend.js**：
   - 新增顶层函数 `pitfallsHTML(uses)`：聚合指定用途（数组或单字符串）+ common 的避坑点并去重，返回复用既有 `.look-pitfalls` / `.pitfall` 类的 HTML 片段；空则返回空串。
   - smart 测评结果（`box.innerHTML`）res-note 之后注入 `pitfallsHTML(use)`。
   - 预算工具 `renderTable`（`result.innerHTML`）res-note 之后注入 `pitfallsHTML(state.use)`（state.use 为 `all` 时仅取 common）。
3. **样式**：零新增 CSS，直接复用 `styles.css` 既有 `.look-pitfalls`（网格容器）+ `.pitfall`（红色左边框卡片，行 891-892）。

## 三、验证
- `node --check`：data.js / recommend.js 均 OK。
- Node 逻辑实测 `pitfallsHTML`：game→7 卡(4+3)、game+office→10(4+3+3)、all/空→common 3、去重正确、common 文案命中。
- 本地 http（:8130）：smart.html / accessories.html 均 HTTP 200，四脚本（data/models/recommend/main）引用完整。

## 四、风险与说明
- 沿用既有视觉类，外观与 looks 页避坑卡片一致，无新增维护面。
- 避坑文案为规则推荐补充，已在 res-note 提示「以电商实时价为准」，无误导风险。
- 函数用 `window.PC_DATA` 读取而非依赖局部 `D` 变量，作用域更稳。

## 五、后续
- plans 页每个方案已有 `tip`，暂不重复加避坑。
- 季度核验（2026-11-16 自动化）时一并复核 pitfalls 文案时效性。
- 剩余清单项：#2 移动端实测、#3 扩充型号库、#4 looks 定位、#5 可访问性、#6 SEO 强化、#7 P2 真·自动同步（暂缓）。
