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

/* 「高差异」口径：并集上沿 / 下沿 >= 1.5，即贵的那条比便宜的高 50% 以上。
   不用「区间间隙」做阈值 —— 一条区间包含另一条时间隙恒为 0，但倍率可能到 2×（同型号不该有这种跨度）。 */
const HIGH_RATIO = 1.5;

/* 给每组一个判断倾向，仍然不替人做决定，只是把线索说清 */
function hint(g) {
  if (g.conflict) {
    if (g.ratio >= HIGH_RATIO) return '两条区间不重叠且倍率 ' + g.ratio + '×，不可能同时为真，需确认渠道与版本后删掉错的那条';
    return '区间不重叠但差距不大（' + g.ratio + '×），大概率是不同渠道报价，确认后保留并集';
  }
  if (g.ratio >= HIGH_RATIO) return '区间重叠但跨度 ' + g.ratio + '×，其中一条大概录错了价，需人工核对';
  const single = g.ranges.filter(r => r[0] === r[1]);
  if (single.length) return '一条是单点价且落在另一条区间内，属写法差异，不是矛盾';
  return '两条区间重叠，判为重复录入，合并即可';
}

const detail = s.detail.slice().sort((a, b) => b.ratio - a.ratio);
const high = detail.filter(g => g.ratio >= HIGH_RATIO);

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
L.push('| 倍率 ≥ ' + HIGH_RATIO + '×（高差异） | ' + high.length + ' 组 |');
L.push('');
L.push('**页面现状**：这 ' + s.groups + ' 组已各自合并为一张卡，价格显示并集区间；' + s.conflict +
  ' 组标注「价格存疑」。剩余 ' + (s.groups - s.conflict) + ' 组两条区间重叠，标注「已合并」。');
L.push('');
L.push('**这份清单要你做的事**：逐条确认哪条报价可信 → 删掉多余记录 → 跑 `node tools/dedup-gate.cjs --strict` 应零重复。');
L.push('');

if (high.length) {
  L.push('## 高差异清单（倍率 ≥ ' + HIGH_RATIO + '×，优先处理）');
  L.push('');
  L.push('| # | 品类 | 型号 | 记录 A | 记录 B | 并集 | 倍率 |');
  L.push('|---|---|---|---|---|---|---|');
  high.forEach((g, i) => {
    const a = g.ids.map((id, k) => '`' + id + '` ' + fmtRange(g.ranges[k])).join('<br>');
    L.push('| ' + (i + 1) + ' | ' + (CAT_LABEL[g.catId] || g.catId) + ' | ' + g.brand + ' ' + g.model +
      ' | ' + a.split('<br>')[0] + ' | ' + (a.split('<br>')[1] || '—') + ' | ' + fmtRange(g.union) + ' | ' + g.ratio + '× |');
  });
  L.push('');
}

L.push('## 全量清单（' + s.groups + ' 组，按倍率降序）');
L.push('');
L.push('| # | 品类 | 品牌 | 型号 | 记录（id · 价格） | 并集 | 倍率 | 判定 | 处理提示 |');
L.push('|---|---|---|---|---|---|---|---|---|');
detail.forEach((g, i) => {
  const recs = g.ids.map((id, k) => '`' + id + '` ' + fmtRange(g.ranges[k])).join('<br>');
  L.push('| ' + (i + 1) + ' | ' + (CAT_LABEL[g.catId] || g.catId) + ' | ' + g.brand + ' | ' + g.model +
    ' | ' + recs + ' | ' + fmtRange(g.union) + ' | ' + g.ratio + '× | ' +
    (g.conflict ? '**价格存疑**' : '已合并') + ' | ' + hint(g) + ' |');
});
L.push('');
L.push('## 口径说明');
L.push('');
L.push('- **重复判定**：同品类 + 品牌与型号归一化后相同（小写、去空白、去 `-－—_`）。归一化实现见 `js/dup-core.js`。');
L.push('- **价格冲突**：两条记录的报价区间完全不重叠。端点相接算不重叠。旧实现把自己和自己配了一对，单点价记录必然被判冲突，冲突数因此虚高（21 → 真实 17）。');
L.push('- **高差异**：并集上沿 ÷ 下沿 ≥ ' + HIGH_RATIO + '，即贵的报价比便宜的贵 50% 以上。不用"区间间隙"做阈值——一条区间包含另一条时间隙恒为 0，但倍率仍可能到 2×。');
L.push('- **并集**：`[min(下沿), max(上沿)]`。`¥0`（随主板赠送类）不参与并集，否则会造出 `¥0–8999` 的假区间。');
L.push('- **本清单不含裁决**：代码不判断哪条报价可信，只负责把矛盾摆出来。');

fs.mkdirSync(path.join(SITE, 'reports'), { recursive: true });
fs.writeFileSync(path.join(SITE, 'reports', 'dup-pending-review.md'), L.join('\n') + '\n', 'utf8');
fs.writeFileSync(path.join(SITE, 'reports', 'dup-pending-review.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: 'js/models-data.js',
  highRatioThreshold: HIGH_RATIO,
  summary: { total: s.total, groups: s.groups, extra: s.extra, cards: s.total - s.extra, maxPerGroup: s.maxPerGroup, conflict: s.conflict, highDiff: high.length },
  groups: detail.map(g => ({
    catId: g.catId, catLabel: CAT_LABEL[g.catId] || g.catId,
    brand: g.brand, model: g.model,
    records: g.ids.map((id, k) => ({ id: id, name: g.names[k], price: g.ranges[k], specs: g.specs[k] })),
    union: g.union, gap: g.gap, gapPct: g.gapPct, conflict: g.conflict, hint: hint(g),
  })),
}, null, 2) + '\n', 'utf8');

console.log('待核验清单已生成：');
console.log('  reports/dup-pending-review.md   ' + s.groups + ' 组（高差异 ' + high.length + ' 组）');
console.log('  reports/dup-pending-review.json');
console.log('汇总：原始 ' + s.total + ' 条 → 合并后 ' + (s.total - s.extra) + ' 张卡；冲突 ' + s.conflict + ' 组');
