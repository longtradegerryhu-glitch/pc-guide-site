#!/usr/bin/env node
/* 生成「待人工核验清单」—— 49 组同型号重复记录
 *
 * 页面已经把同型号合成为一张卡（价格取并集 + 标注存疑），但"哪条报价是真的"
 * 不是代码该猜的事。本脚本把这 49 组摊平成可核对的清单，供人工逐条裁决。
 *
 * 用法：node tools/dup-review.cjs
 * 产出：reports/dup-pending-review.md（人读）+ reports/dup-pending-review.json（机读）
 */

'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SITE = path.resolve(__dirname, '..');
const { loadCore, loadModels, scan, fmtRange } = require('./dedup-gate.cjs');

const CAT_LABEL = (() => {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(SITE, 'js', 'data.js'), 'utf8'), ctx);
  const D = ctx.window.PC_DATA || {};
  const m = {};
  (D.categories || []).forEach(c => { m[c.id] = c.icon + ' ' + c.name; });
  return m;
})();

const core = loadCore();
const models = loadModels(path.join(SITE, 'js', 'models-data.js'));
const s = scan(models, core);

/* 高差异有两个口径，必须分开写清，否则会互相冤枉：
   A. 中点比 ratio = 两条记录报价中点之比。回答"这两条报价差多远"，对区间宽度不敏感。
   B. 并集跨度 span = 并集上沿 ÷ 下沿。回答"这组里最贵与最便宜差多少"，是 ORD-08 用的口径
      （9950X3D 4199–4899 与 6699 → 6699÷4199 = 1.60，即价差 60%）。
   只用 B 会把"单条记录自己就很宽"误判成分歧：荣耀 Magic 9 两条都是 ¥6499–10999，
   报价完全一致，但 span 也是 1.69。所以 B 单独成立时，还要看它是否超出单条自身宽度。 */
const HIGH = 1.5;

const groups = s.detail.map(g => {
  const selfSpan = Math.max.apply(null, g.ranges.map(r => r[1] / Math.max(r[0], 1)));
  const widened = g.span > selfSpan * 1.05;   // 5% 容差：避免四舍五入把 1.6900 判成 1.6899
  return Object.assign({}, g, {
    selfSpan: Math.round(selfSpan * 100) / 100,
    widenedByDisagreement: widened,
    priceGapPct: Math.round((g.span - 1) * 1000) / 10,
  });
});

/* 主清单 = 中点比高（真差得远），或跨度高且这份跨度不是某一条自己能解释的（真分歧） */
const primary = groups.filter(g => g.ratio >= HIGH || (g.span >= HIGH && g.widenedByDisagreement));
/* 附表 = 跨度高，但跨度完全由单条记录自身宽度造成，两条报价可能一致 */
const wideOnly = groups.filter(g => g.span >= HIGH && !g.widenedByDisagreement);

primary.sort((a, b) => b.span - a.span);
wideOnly.sort((a, b) => b.span - a.span);

/* 给每组一个判断倾向，仍然不替人做决定，只是把线索说清 */
function hint(g) {
  if (g.conflict) {
    if (g.ratio >= HIGH) return '两条区间不重叠且中点比 ' + g.ratio + '×，不可能同时为真，需确认渠道与版本后删掉错的那条';
    return '区间不重叠但差距不大（中点比 ' + g.ratio + '×），大概率是不同渠道报价，确认后保留并集';
  }
  if (g.ratio >= HIGH) return '区间重叠但中点比 ' + g.ratio + '×，其中一条大概录错了价，需人工核对';
  const single = g.ranges.filter(r => r[0] === r[1]);
  if (single.length) return '一条是单点价且落在另一条区间内，属写法差异，不是矛盾';
  return '两条区间重叠，判为重复录入，合并即可';
}

/* 一句话说清这组为什么被判进高差异，别让人猜 */
function why(g) {
  if (g.ratio >= HIGH && g.span >= HIGH) return '中点比 ' + g.ratio + '× + 价差 ' + g.priceGapPct + '%';
  if (g.ratio >= HIGH) return '中点比 ' + g.ratio + '×';
  return '价差 ' + g.priceGapPct + '%（超出单条自身 ' + g.selfSpan + '×）';
}

const detail = groups.slice().sort((a, b) => b.ratio - a.ratio);

const L = [];
L.push('# 同型号重复记录 · 待人工核验清单');
L.push('');
L.push('> 生成时间：' + new Date().toISOString().slice(0, 19).replace('T', ' ') + '　·　数据源：`js/models-data.js`　·　生成命令：`node tools/dup-review.cjs`');
L.push('> 口径内核：`js/dup-core.js`（页面合并卡、入库闸、审计断言共用）');
L.push('');
L.push('## 汇总');
L.push('');
L.push('| 项 | 值 |');
L.push('|---|---|');
L.push('| 型号原始条目 | ' + s.total + ' 条 |');
L.push('| 重复型号组 | ' + s.groups + ' 组 |');
L.push('| 多余条目（合并后消失） | ' + s.extra + ' 条 |');
L.push('| 合并后卡片数 | ' + (s.total - s.extra) + ' 张 |');
L.push('| 单型号最多出现 | ' + s.maxPerGroup + ' 次 |');
L.push('| 价格区间冲突（完全不重叠） | ' + s.conflict + ' 组 |');
L.push('| 价差 ≥ 50%（并集跨度口径） | ' + (primary.length + wideOnly.length) + ' 组 |');
L.push('| ├ 其中真实报价分歧（优先处理） | **' + primary.length + '** 组 |');
L.push('| └ 其中跨度由单条自身宽度造成 | ' + wideOnly.length + ' 组 |');
L.push('| 中点比 ≥ ' + HIGH + '×（另一口径） | ' + detail.filter(g => g.ratio >= HIGH).length + ' 组 |');
L.push('');
L.push('**页面现状**：这 ' + s.groups + ' 组已各自合并为一张卡，价格显示并集区间；' + s.conflict +
  ' 组标注「价格存疑」。剩余 ' + (s.groups - s.conflict) + ' 组两条区间重叠，标注「已合并」。');
L.push('');
L.push('**这份清单要你做的事**：逐条确认哪条报价可信 → 删掉多余记录 → 跑 `node tools/dedup-gate.cjs --strict` 应零重复。');
L.push('');

L.push('## 高差异清单（真实报价分歧，' + primary.length + ' 组，按价差降序优先处理）');
L.push('');
L.push('| # | 品类 | 型号 | 记录 A | 记录 B | 并集 | 价差 | 中点比 | 触发原因 |');
L.push('|---|---|---|---|---|---|---|---|---|');
primary.forEach((g, i) => {
  const rec = g.ids.map((id, k) => '`' + id + '` ' + fmtRange(g.ranges[k]));
  L.push('| ' + (i + 1) + ' | ' + (CAT_LABEL[g.catId] || g.catId) + ' | ' + g.brand + ' ' + g.model +
    ' | ' + rec[0] + ' | ' + (rec[1] || '—') + ' | ' + fmtRange(g.union) +
    ' | ' + g.priceGapPct + '% | ' + g.ratio + '× | ' + why(g) + ' |');
});
L.push('');

if (wideOnly.length) {
  L.push('## 附表：跨度大但两条报价并不矛盾（' + wideOnly.length + ' 组）');
  L.push('');
  L.push('这些组的并集跨度也 ≥ ' + HIGH + '，但跨度完全来自单条记录自己的宽区间，' +
    '两条报价的**中点几乎一致**。按「价差」看会误判，实际不需要优先核价 —— 列出来只是说明它们为什么没进主清单。');
  L.push('');
  L.push('| # | 品类 | 型号 | 记录 A | 记录 B | 并集 | 价差 | 中点比 | 单条最宽 |');
  L.push('|---|---|---|---|---|---|---|---|---|');
  wideOnly.forEach((g, i) => {
    const rec = g.ids.map((id, k) => '`' + id + '` ' + fmtRange(g.ranges[k]));
    L.push('| ' + (i + 1) + ' | ' + (CAT_LABEL[g.catId] || g.catId) + ' | ' + g.brand + ' ' + g.model +
      ' | ' + rec[0] + ' | ' + (rec[1] || '—') + ' | ' + fmtRange(g.union) +
      ' | ' + g.priceGapPct + '% | ' + g.ratio + '× | ' + g.selfSpan + '× |');
  });
  L.push('');
}

L.push('## 全量清单（' + s.groups + ' 组，按中点比降序）');
L.push('');
L.push('| # | 品类 | 品牌 | 型号 | 记录（id · 价格） | 并集 | 价差 | 中点比 | 判定 | 处理提示 |');
L.push('|---|---|---|---|---|---|---|---|---|---|');
detail.forEach((g, i) => {
  const recs = g.ids.map((id, k) => '`' + id + '` ' + fmtRange(g.ranges[k])).join('<br>');
  L.push('| ' + (i + 1) + ' | ' + (CAT_LABEL[g.catId] || g.catId) + ' | ' + g.brand + ' | ' + g.model +
    ' | ' + recs + ' | ' + fmtRange(g.union) + ' | ' + g.priceGapPct + '% | ' + g.ratio + '× | ' +
    (g.conflict ? '**价格存疑**' : '已合并') + ' | ' + hint(g) + ' |');
});
L.push('');
L.push('## 口径说明');
L.push('');
L.push('- **重复判定**：同品类 + 品牌与型号归一化后相同（小写、去空白、去 `-－—_`）。归一化实现见 `js/dup-core.js`。');
L.push('- **价格冲突**：两条记录的报价区间完全不重叠。端点相接算不重叠。旧实现把自己和自己配了一对，单点价记录必然被判冲突，冲突数因此虚高（21 → 真实 17）。');
L.push('- **价差**：并集上沿 ÷ 下沿 − 1。两次报价的最贵与最便宜差多少，是 ORD-08 采用的口径（9950X3D：6699 ÷ 4199 − 1 = 60%）。');
L.push('- **中点比**：两条记录报价中点之比。对区间宽度不敏感，用来判断"两条报价本身差多远"。');
L.push('- **为什么两个口径都要**：只看价差，单条记录自己区间宽就会虚高（荣耀 Magic 9 两条都是 ¥6499–10999，报价一致但价差 69%）；只看中点比，则会漏掉"一条窄区间 + 一条单点价"这种真实分歧（9950X3D 中点比只有 1.47×，但价差 60%）。主清单要求两者互证：中点比 ≥ 1.5，或价差 ≥ 50% 且超出单条自身宽度的 5%。');
L.push('- **并集**：`[min(下沿), max(上沿)]`。`¥0`（随主板赠送类）不参与并集，否则会造出 `¥0–8999` 的假区间。');
L.push('- **本清单不含裁决**：代码不判断哪条报价可信，只负责把矛盾摆出来。');

fs.mkdirSync(path.join(SITE, 'reports'), { recursive: true });
fs.writeFileSync(path.join(SITE, 'reports', 'dup-pending-review.md'), L.join('\n') + '\n', 'utf8');
fs.writeFileSync(path.join(SITE, 'reports', 'dup-pending-review.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: 'js/models-data.js',
  threshold: { midRatio: HIGH, priceGapPct: 50, widenedTolerance: 1.05 },
  summary: {
    total: s.total, groups: s.groups, extra: s.extra, cards: s.total - s.extra,
    maxPerGroup: s.maxPerGroup, conflict: s.conflict,
    highDiffDisputed: primary.length, highDiffWideOnly: wideOnly.length,
    midRatioHigh: detail.filter(g => g.ratio >= HIGH).length,
  },
  groups: detail.map(g => ({
    catId: g.catId, catLabel: CAT_LABEL[g.catId] || g.catId,
    brand: g.brand, model: g.model,
    records: g.ids.map((id, k) => ({ id: id, name: g.names[k], price: g.ranges[k], specs: g.specs[k] })),
    union: g.union, gap: g.gap, gapPct: g.gapPct,
    priceGapPct: g.priceGapPct, midRatio: g.ratio, selfSpan: g.selfSpan,
    dispute: g.ratio >= HIGH || (g.span >= HIGH && g.widenedByDisagreement) ? 'disputed'
      : (g.span >= HIGH ? 'wide-only' : 'none'),
    conflict: g.conflict, hint: hint(g),
  })),
}, null, 2) + '\n', 'utf8');

console.log('待核验清单已生成：');
console.log('  reports/dup-pending-review.md   ' + s.groups + ' 组（主清单 ' + primary.length + ' 组 / 附表 ' + wideOnly.length + ' 组）');
console.log('  reports/dup-pending-review.json');
console.log('汇总：原始 ' + s.total + ' 条 → 合并后 ' + (s.total - s.extra) + ' 张卡；冲突 ' + s.conflict + ' 组');
