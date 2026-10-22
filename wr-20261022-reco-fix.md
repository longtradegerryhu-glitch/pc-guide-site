# wr-20261022-reco-fix · ORD-11 智能推荐整改

- **commit**：`a6bd882`
- **部署**：EdgeOne Pages `dp858og8hmzq` ／ 线上 https://www.pc-guide.icu
- **改动**：13 个文件（`js/data.js`、`js/recommend.js`、`css/styles.css` + 9 个 HTML 的文案与缓存戳、`js/ai.js`）
- **本文档补写说明**：`a6bd882` 的 commit message 写了 `wr-20261022-reco-fix`，但文件当时**没有真的创建**。
  这是验收凭证与事实不符，ORD-15 §1 指出后补写在此。
  以下「实测输出」不是复述、不是凭印象重写 —— 用 `git worktree add E:/AI/_test/wt-ord11 a6bd882`
  检出该 commit 后**重跑**得到，跑完已 `worktree remove`。

---

## 一、改了什么

### 1. 问卷按设备形态分支（原来五种形态共用一套 10 题）

| 形态 | 题数 | 与桌面版的差异 |
|---|---|---|
| `desktop` / `laptop` / `both` | 10 | 基准 |
| `phone` | 9 | 去掉「装机经验」整题；预算题干改为「总投入预算」；偏好/颜值换成移动口径的选项组 |
| `tablet` | 9 | 同手机，选项值再分一套（`t_value` / `t_any`） |

实现位置：`js/data.js` 每题新增 `when: { form: [...] }`（题级过滤）与选项级 `when`；
`js/recommend.js` 新增 `fitsWhen` / `currentForm` / `visibleSteps` / `optionsOf` / `titleOf` / `pruneAnswers`。
编号 `x/N` 的 N 由 `visibleSteps` 实时算，不再写死。

### 2. D1「已有外设」从来没生效

- 原代码只把 `existing` 用来给 `focus` 题排序，**从没传给 `fullPartRows()`**。勾选框改的是一个没人读的变量。
- 新增 `skipPartsOf(rawIds)`：选项 id → **配置单行名**白名单。手机与平板共用 `charger` / `mobileacc` 两个品类，靠选项自带的 `parts` 区分（充电器→`["充电器"]`、数据线→`["数据线"]`）。
- `fullPartRows(plan, { skipParts })` 按行名精确匹配过滤，被跳的行进 `finalRows.skipped`。
- 被跳的行**留在表格里**，价格显示 `—`、整行 `.spec-row-skip` 淡化；配件区对应条目才真删。
  理由：直接删行，用户会以为配置单漏了一件。
- 结果页顶部出说明条：`已按你的实际情况跳过 1 项（显示器），合计已相应减去。你勾选的是：显示器。`
- 合计只有一个来源：`specTableHtml().total`。原来配置单和配件区各算一次，所以会互相打架（D3）。

### 3. D2「配置单同款」是假的

- 原代码只看 `pickOne` 返回的 `anchor` 布尔值 —— 锚点池里挑到就算「同款」，**从不回查 `plan.parts` 写的型号**。
  配置单写 `利民 PA120 SE`、配件区给 `利民 PS120 SE`，徽章照样打「配置单同款」。
- 新增 `anchorState(item, rowText)`，四态：

| 状态 | 判定 | 徽章 |
|---|---|---|
| `exact` | 型号串与品牌完整出现在配置单行文本里（型号 ≥4 字符 / 品牌+型号 ≥5 字符） | 配置单同款 |
| `candidate` | 配置单该行是「A / B」二选一，命中其一 | 配置单候选之一 |
| `chipset` | 配置单只写芯片组/档位（B760M、B650M、「27" 2K 高刷」级） | 配置单档位的具体型号 |
| `alt` | 型号不在配置单行内 | 同档位替代 + `.fp-why-alt` 说明段 |

`alt` 必须带说明段（为什么换：无货 / 价位偏离 / 用途偏好过滤）。没有说明的替代，等于假同款换了个名字。

### 4. D4 非重点件折叠

勾了 focus 时重点件置顶、其余进 `<details class="fp-more">`；快速推荐没有「重点」概念，**必须全展开**（`opts.fold === false`）。

### 5. 快速推荐第 4/5/6 题真正生效

原来第 4/5/6 题的答案只进画像文案，不进型号选择。改为：偏好进 `buildBias()`、强度进 `targetScale`、寿命进 `buildTargetScale()`。

### 6. 五处页面文案同步

`index.html` / `smart.html` / `plans.html` / `guide.html` / `faq.html` 里「6 项」「10 题」的描述统一改为「快速推荐 6 项 / 深度问卷 9-10 题（按设备形态）」。

---

## 二、为什么这么改

1. **问卷不分形态是根因，不是表面问题。** 手机用户被问「你以前装过或折腾过电脑吗」，这个问题对他是无意义的纯噪音；更糟的是他答完，结果页给他推 CPU。
2. **D1/D2 都属于「标记说了，行为没做」**：勾选框存在、徽章存在，但背后没有数据支撑。这类比功能缺失更坏 —— 用户看到标记会以为功能生效了。
3. **D3 是双数据源**：配置单走 `plan.parts` 的字符串价、配件区走型号库 `item.price`，两边必然漂移。改成单源 + `plan.parts` 仅兜底。
4. **D4 是取舍**：全展开会让首屏塞 10 行，重点不突出；但折叠必须有门控，否则「勾的重点一件都没有」时整屏被收进折叠区（这个坑在 ORD-12 才彻底修好，见 `wr-20261022-reco-fix2.md`）。

---

## 三、实测输出（worktree 检出 `a6bd882` 后重跑）

```
$ git worktree add E:/AI/_test/wt-ord11 a6bd882
$ cd E:/AI/_test/wt-ord11
$ NODE_PATH="C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules" npm run test:all
```

```
> pc-guide-site@1.0.0 test:all
> node tests/selftest-mutation.cjs && node tests/audit-search.cjs && node tests/e2e-merge.cjs && node tests/e2e-inject-test.cjs

  PASS 存疑组数随数据变化被抓（cpu|amd|ryzen59600x） → merge:dispute 正确 FAIL（实测 18，基线 17）
  PASS 呈现层与原始层一致性断言 → merge:parity 正确 FAIL（实测 0，基线 17）

自测结果：PASS 15 / FAIL 0                       ← tests/selftest-mutation.cjs
jsdom: jsdom
探针口径：UI

  PASS model 全为字符串
  PASS 单点价格占比 <= 10%

结果：PASS 15 / FAIL 0                            ← tests/audit-search.cjs（当时 15 项，ORD-13 后扩到 17）
jsdom: jsdom

== G1 合并内核已装载 ==
  PASS 任一品类首屏内没有同名型号重复卡  重复 0 处

结果：PASS 17 / FAIL 0                            ← tests/e2e-merge.cjs
== 步骤 1：干净数据应通过 ==
  PASS 干净数据 exit 0
  PASS 干净数据输出含 PASS
  PASS 恢复后 FAIL 0

结果：PASS 8 / FAIL 0                             ← tests/e2e-inject-test.cjs
文件已恢复原状。
exit=0
```

当轮探针（`E:/AI/_test/ord11_assert.cjs`，47 条断言）的关键数字：

```
不勾已有件：10 行，合计 ¥13,052 - ¥14,802
勾已有显示器：10 行（跳过 1），合计 ¥12,403 - ¥13,893
配置单里还有显示器行：无 ✓ / 配件区还有显示器：无 ✓
合计差额：649 ~ 909

desktop  同款 3 / 候选 1 / 档位型号 2 / 同档替代 4  ✓ 同款全部属实
laptop   同款 0 / 候选 1 / 档位型号 0 / 同档替代 5  ✓ 同款全部属实
phone    同款 2 / 候选 2 / 档位型号 0 / 同档替代 3  ✓ 同款全部属实
tablet   同款 2 / 候选 2 / 档位型号 0 / 同档替代 1  ✓ 同款全部属实
both     同款 1 / 候选 1 / 档位型号 0 / 同档替代 4  ✓ 同款全部属实
```

> 注：这两段是 `ord11_assert.cjs` 的输出，该脚本未入库（在 `E:/AI/_test/`）。
> 上面的 `test:all` 才是仓库内的闸门，可随时重放。

---

## 四、遗留问题（当时就知道、当时没解决）

1. **勾了重点但方案里一件都没有时，整屏会被收进折叠区** —— `collapsible` 只看「有没有勾重点」，不看「勾的重点在不在这一套里」。ORD-12 修掉。
2. **颜值 6 个选项只出 2 种结果** —— `PC_LOOKS` 只标了 75/1209 款（6%），且「未标注」被 `filter(lookOf === x)` 判成「不是该风格」。ORD-12 修名字兜底 + 无货明示，但**标注覆盖率仍是 6%**，需要专门一批补（ORD-13 §4 已批准单开）。
3. **`initBudgetTool()` 的 DOM 从来不存在** —— 死代码，但 `index` / `plans` 仍在宣传「预算适配器」。
4. **`valueGrade` 未随本轮涨价重估**。
5. **looks / plans 正文全由 JS 注入**，SEO 拿不到内容，需要预渲染。
