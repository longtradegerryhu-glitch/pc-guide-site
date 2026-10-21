/* 审计断言核心逻辑 —— 纯函数，不读文件、不依赖 jsdom
 *
 * 为什么单独抽出来：
 *   断言本身必须可测。如果断言只能读真实数据跑一遍，就无法验证"数据被污染时它会不会 FAIL"。
 *   抽成纯函数后，tests/selftest-mutation.cjs 可以构造污染数据，验证对应断言确实失败。
 *
 * 输入的 models 结构：{ 品类id: [ {id, brand, model, price:[lo,hi], specs, ...} ] }
 * 输入的 searchProbe：async (query) => { n, main, soft }
 *   真实场景由 audit-search.cjs 用 jsdom 提供；自测场景用 stub 提供。
 */

'use strict';

/* ---------- 基线（2026-10-21 / 1209 款 / 21 品类） ---------- */
const BASE = {
  totalModels: 1209,
  dupGroups: 49,          // 有重复的型号组数
  dupExtraEntries: 49,    // 重复条目总数（每组超出的条数之和）—— 抓"同组新增第三条"
  maxPerGroup: 2,         // 单个型号最多出现几次 —— 同样抓"同组新增第三条"
  priceConflict: 21,      // 组内价格区间完全不重叠的组数
  specsInconsistent: 21,  // specs 段数不固定的品类数
  singlePricePct: 10,     // 单点价格（lo==hi）占比上限 %
  specQueries: ['ATX3.1', 'GDDR7', '360水冷'],  // 规格词：主体命中必须 > 0，防"过滤垃圾"误杀
  modelQuery: '5070 Ti',  // 型号词：必须存在软备注层，证明分层生效
};

const HARD = ['name', 'brand', 'model', 'searchName', 'style', 'specs'];
const SOFT = ['valueNote', 'compat'];
const S = x => String(x == null ? '' : x).toLowerCase();

/* 归一化：小写 + 去空白 + 去横线类符号。
   ⚠ 这是全项目唯一实现。rebuild2.js 的入库查重闸必须 require 这里，
     不许另写一份 —— 闸与审计口径不一致，审计数字就失去意义。 */
const norm = x => S(x).replace(/\s+/g, '').replace(/[\-－—_]/g, '');

/* 重复判定的键：品类 + 归一化品牌 + 归一化型号 */
const dupKey = (cat, it) => cat + '|' + norm(it && it.brand) + '|' + norm(it && it.model);

function allItems(models) {
  const out = [];
  Object.keys(models).forEach(cat => (models[cat] || []).forEach(it => out.push({ cat, it })));
  return out;
}

/* ---------- 重复型号统计 ---------- */
function dupStats(models) {
  const m = new Map();
  allItems(models).forEach(({ cat, it }) => {
    const k = dupKey(cat, it);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(it);
  });
  const groups = [...m.entries()].filter(([, v]) => v.length > 1);
  let extra = 0, maxPerGroup = 0, priceConflict = 0;
  const detail = [];
  groups.forEach(([k, v]) => {
    extra += v.length - 1;
    maxPerGroup = Math.max(maxPerGroup, v.length);
    const overlap = v.every(a => v.every(b => a.price[0] < b.price[1] && b.price[0] < a.price[1]));
    if (!overlap) priceConflict++;
    detail.push({ key: k, n: v.length, ids: v.map(x => x.id) });
  });
  return { groups: groups.length, extra, maxPerGroup, priceConflict, detail };
}

/* ---------- specs 结构一致性 ---------- */
function specsInconsistentCount(models) {
  let bad = 0;
  Object.keys(models).forEach(k => {
    const segs = new Set((models[k] || []).map(i => S(i.specs).split(/[;；]/).filter(x => x.trim()).length));
    if (segs.size > 1) bad++;
  });
  return bad;
}

/* ---------- 价格精度 ---------- */
function priceStats(models) {
  let single = 0, tot = 0, numModel = 0;
  allItems(models).forEach(({ it }) => {
    tot++;
    if (typeof it.model === 'number') numModel++;
    if (it.price && it.price[0] === it.price[1]) single++;
  });
  return { tot, single, singlePct: tot ? single / tot * 100 : 0, numModel };
}

/* ---------- 主检查 ----------
 * 返回 [{ id, name, ok, actual, base }]，调用方决定如何展示与退出码。
 * 只有 ok === false 计为 FAIL。
 */
async function runChecks({ models, searchProbe, base = BASE }) {
  const items = [];
  /* kind 显式标注，不靠 id 前缀推断 —— 否则 model:type（数据）会被 model:layer（搜索）的命名规则误伤 */
  const add = (id, name, ok, actual, b, kind) => items.push({ id, name, ok: !!ok, actual, base: b, kind: kind || 'data' });

  /* 1. 搜索分层 */
  for (const q of base.specQueries) {
    const r = await searchProbe(q);
    add('spec:' + q, `规格词「${q}」主体命中 > 0（防误杀）`, r.main > 0, r, '>0', 'search');
  }
  {
    const r = await searchProbe(base.modelQuery);
    add('model:layer', `型号词「${base.modelQuery}」存在软备注层（分层生效）`,
      r.soft > 0 && r.main < r.n, r, '0<soft && main<n', 'search');
  }

  /* 2. 重复型号 —— 三个维度同时断言，任何一个退化都会 FAIL */
  const d = dupStats(models);
  add('dup:groups', `重复型号组数 <= ${base.dupGroups}`, d.groups <= base.dupGroups, d.groups, base.dupGroups);
  add('dup:extra', `重复条目总数 <= ${base.dupExtraEntries}（抓同组新增第 3 条）`,
    d.extra <= base.dupExtraEntries, d.extra, base.dupExtraEntries);
  add('dup:max', `单型号最多出现 <= ${base.maxPerGroup} 次`, d.maxPerGroup <= base.maxPerGroup,
    d.maxPerGroup, base.maxPerGroup);
  add('dup:price', `价格区间冲突组 <= ${base.priceConflict}`, d.priceConflict <= base.priceConflict,
    d.priceConflict, base.priceConflict);

  /* 3. specs 结构 */
  const bad = specsInconsistentCount(models);
  add('specs:shape', `specs 段数不固定的品类 <= ${base.specsInconsistent}（schema 迁移后应下降）`,
    bad <= base.specsInconsistent, bad, base.specsInconsistent);

  /* 4. 字段与价格精度 */
  const p = priceStats(models);
  add('total', `型号总数 >= ${base.totalModels}`, p.tot >= base.totalModels, p.tot, base.totalModels);
  add('model:type', 'model 全为字符串', p.numModel === 0, p.numModel, 0);
  add('price:single', `单点价格占比 <= ${base.singlePricePct}%`, p.singlePct <= base.singlePricePct,
    Number(p.singlePct.toFixed(1)), base.singlePricePct + '%');

  return { items, stats: { dup: d, price: p, specsBad: bad } };
}

module.exports = { BASE, dupStats, specsInconsistentCount, priceStats, runChecks, allItems, norm, dupKey, S };
