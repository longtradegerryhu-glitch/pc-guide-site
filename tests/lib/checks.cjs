/* 审计断言核心逻辑 —— 纯函数，不读文件（除共享内核）、不依赖 jsdom
 *
 * 为什么单独抽出来：
 *   断言本身必须可测。如果断言只能读真实数据跑一遍，就无法验证"数据被污染时它会不会 FAIL"。
 *   抽成纯函数后，tests/selftest-mutation.cjs 可以构造污染数据，验证对应断言确实失败。
 *
 * 归一化/合并口径不在这里定义，从 js/dup-core.js 读 —— 页面合并卡用的是同一份代码。
 * 本仓库 package.json 是 type=module，require 一个 .js 会 ERR_REQUIRE_ESM，
 * 所以用 vm 读取该浏览器脚本，取它挂到 globalThis 上的 PCDup。
 *
 * 输入的 models 结构：{ 品类id: [ {id, brand, model, price:[lo,hi], specs, ...} ] }
 * 输入的 searchProbe：async (query) => { n, main, soft }
 *   真实场景由 audit-search.cjs 用 jsdom 提供；自测场景用 stub 提供。
 */

'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const CORE_PATH = path.join(__dirname, '..', '..', 'js', 'dup-core.js');
const coreCtx = {};
vm.createContext(coreCtx);
vm.runInContext(fs.readFileSync(CORE_PATH, 'utf8'), coreCtx);
const core = coreCtx.PCDup;
if (!core) throw new Error('js/dup-core.js 未导出 PCDup，口径内核加载失败');

const S = core.S;
const norm = core.norm;
const dupKey = core.keyOf;

/* ---------- 基线（2026-10-22 / 1209 款 / 21 品类） ---------- */
const BASE = {
  totalModels: 1209,
  /* 原始数据层：库内仍有 49 组重复录入。页面已合并显示，但数据源没动，
     所以这里维持 49 —— 它的作用是拦住"再往里写重复"，不是描述页面现状。 */
  dupGroups: 49,          // 有重复的型号组数
  dupExtraEntries: 49,    // 重复条目总数（每组超出的条数之和）—— 抓"同组新增第三条"
  maxPerGroup: 2,         // 单个型号最多出现几次 —— 同样抓"同组新增第三条"
  priceConflict: 17,      // 组内价格区间完全不重叠的组数（旧口径 21 含自比较虚高，见 dupStats 注释）
  /* 呈现层：合并卡总数与存疑标注数 */
  mergedCards: 1160,      // 1209 条原始记录合并后应有 1160 张卡
  mergedDispute: 17,      // 合并卡中标注「价格存疑」的组数，必须等于原始冲突数
  specsInconsistent: 21,  // specs 段数不固定的品类数
  singlePricePct: 10,     // 单点价格（lo==hi）占比上限 %
  specQueries: ['ATX3.1', 'GDDR7', '360水冷'],  // 规格词：主体命中必须 > 0，防"过滤垃圾"误杀
  modelQuery: '5070 Ti',  // 型号词：必须存在软备注层，证明分层生效
};

/* PART_CAT 里允许出现的「虚拟品类 id」：不对应真实 category，只用来让行名能落地。
   登记在此等于承认它不是品类；新增必须显式加进来，否则绕不开 plans:partcat-target。 */
const VIRTUAL_CAT = ['laptop-cool'];

const HARD = ['name', 'brand', 'model', 'searchName', 'style', 'specs'];
const SOFT = ['valueNote', 'compat'];

function allItems(models) {
  const out = [];
  Object.keys(models).forEach(cat => (models[cat] || []).forEach(it => out.push({ cat, it })));
  return out;
}

/* ---------- 重复型号统计（原始数据层） ---------- */
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
    /* 只比较不同记录之间。旧实现用 v.every(a => v.every(b => ...))，把自己和自己也配了一对，
       单点价（lo===hi）记录必然判成"不重叠"，导致冲突数虚高（实测 21 → 真实 17）。 */
    let conflict = false;
    for (let i = 0; i < v.length && !conflict; i++) {
      for (let j = i + 1; j < v.length; j++) {
        if (!core.overlaps(v[i].price, v[j].price)) { conflict = true; break; }
      }
    }
    if (conflict) priceConflict++;
    detail.push({
      key: k, n: v.length, ids: v.map(x => x.id),
      ranges: v.map(x => x.price.slice()),
      brand: v[0].brand, model: v[0].model, catId: k.split('|')[0],
    });
  });
  return { groups: groups.length, extra, maxPerGroup, priceConflict, detail };
}

/* ---------- 呈现层统计：走页面同一套 mergeList ---------- */
function presentedStats(models) {
  let raw = 0, cards = 0, mergedGroups = 0, dispute = 0, specsDiffer = 0;
  Object.keys(models).forEach(cat => {
    const items = models[cat] || [];
    raw += items.length;
    const merged = core.mergeList(cat, items);
    cards += merged.length;
    merged.forEach(e => {
      if (!e.merge) return;
      mergedGroups++;
      if (e.merge.dispute) dispute++;
      if (e.merge.specsDiffer) specsDiffer++;
    });
  });
  return { raw, cards, mergedGroups, dispute, specsDiffer };
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
 * 返回 [{ id, name, ok, actual, base, kind }]，调用方决定如何展示与退出码。
 * 只有 ok === false 计为 FAIL。
 */
async function runChecks({ models, searchProbe, base = BASE, plans, partCat, catIds, quiz }) {
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

  /* 2. 重复型号 —— 原始层三个维度同时断言，任何一个退化都会 FAIL */
  const d = dupStats(models);
  add('dup:groups', `原始重复型号组数 <= ${base.dupGroups}`, d.groups <= base.dupGroups, d.groups, base.dupGroups);
  add('dup:extra', `原始重复条目总数 <= ${base.dupExtraEntries}（抓同组新增第 3 条）`,
    d.extra <= base.dupExtraEntries, d.extra, base.dupExtraEntries);
  add('dup:max', `单型号最多出现 <= ${base.maxPerGroup} 次`, d.maxPerGroup <= base.maxPerGroup,
    d.maxPerGroup, base.maxPerGroup);
  add('dup:price', `价格区间冲突组 <= ${base.priceConflict}`, d.priceConflict <= base.priceConflict,
    d.priceConflict, base.priceConflict);

  /* 3. 呈现层 —— 页面合并卡必须与原始层一致：不多不少、冲突不漏标 */
  const p2 = presentedStats(models);
  add('merge:cards', `合并后卡片数 = ${base.mergedCards}（原始 ${p2.raw} − 重复 ${p2.raw - base.mergedCards}）`,
    p2.cards === base.mergedCards, p2.cards, base.mergedCards);
  add('merge:dispute', `合并卡标「价格存疑」${base.mergedDispute} 组（冲突不得被吞掉）`,
    p2.dispute === base.mergedDispute, p2.dispute, base.mergedDispute);
  add('merge:parity', '合并层判定的冲突组数 = 原始层冲突组数',
    p2.dispute === d.priceConflict, p2.dispute, d.priceConflict);

  /* 4. specs 结构 */
  const bad = specsInconsistentCount(models);
  add('specs:shape', `specs 段数不固定的品类 <= ${base.specsInconsistent}（schema 迁移后应下降）`,
    bad <= base.specsInconsistent, bad, base.specsInconsistent);

  /* 5. 字段与价格精度 */
  const p = priceStats(models);
  add('total', `型号总数 >= ${base.totalModels}`, p.tot >= base.totalModels, p.tot, base.totalModels);
  add('model:type', 'model 全为字符串', p.numModel === 0, p.numModel, 0);
  add('price:single', `单点价格占比 <= ${base.singlePricePct}%`, p.singlePct <= base.singlePricePct,
    Number(p.singlePct.toFixed(1)), base.singlePricePct + '%');

  /* 6. 配置单行名 ↔ PART_CAT（ORD-13 §6，纯校验，零数据改动）
     行名对不上 → planPartTargets 里 `if (!cid) return;` 静默跳过，该件拿不到目标价，
     配件区按默认档推。静默跳过是最难查的一类错，所以用闸门拦。 */
  if (plans && partCat && catIds) {
    const badRows = [];
    (plans || []).forEach(pl => (pl.parts || []).forEach(r => {
      if (!partCat[r[0]]) badRows.push((pl.id || pl.name) + ':' + r[0]);
    }));
    add('plans:partcat', '配置单每个行名都在 PART_CAT 内', badRows.length === 0,
      badRows.length ? (JSON.stringify(badRows.slice(0, 8)) + (badRows.length > 8 ? ' …共 ' + badRows.length + ' 处' : '')) : '0 个未映射行名',
      '0 个未映射行名');

    const dangling = Object.keys(partCat).filter(k =>
      catIds.indexOf(partCat[k]) < 0 && VIRTUAL_CAT.indexOf(partCat[k]) < 0);
    add('plans:partcat-target', 'PART_CAT 取值都指向真实品类（虚拟 id 须在 VIRTUAL_CAT 登记）',
      dangling.length === 0, dangling.length ? dangling : '0 个悬空映射', '0 个悬空映射');
  } else {
    /* 纯 models 调用（变异自测）没有 data.js，本项不适用，不计 FAIL */
    add('plans:partcat', '配置单每个行名都在 PART_CAT 内', true, '未提供 plans/partCat，跳过', '0 个未映射行名');
  }

  /* 问卷选项的 parts 白名单同样必须全都映射得到。
     2026-10-22 发现的真实缺陷：dock / existing.dock / t_dock 的 parts 里写着「扩展埂」，
     PART_CAT 查不到 → 这一项永久失效，但因为数组第一个「拓展坞」已经命中，症状被完全掩盖。
     plans:partcat 只查 plan.parts 的行名，查不到这种藏在选项白名单里的死值。 */
  if (quiz && quiz.length && partCat) {
    const badOpt = [];
    quiz.forEach(q => (q.options || []).forEach(o => (o.parts || []).forEach(pn => {
      if (!partCat[pn]) badOpt.push(q.id + '/' + o.id + ':' + pn);
    })));
    add('quiz:optparts', '问卷选项的 parts 每项都在 PART_CAT 内', badOpt.length === 0,
      badOpt.length ? JSON.stringify(badOpt.slice(0, 8)) : '0 个未映射部件名', '0 个未映射部件名');
  } else {
    add('quiz:optparts', '问卷选项的 parts 每项都在 PART_CAT 内', true, '未提供 quiz，跳过', '0 个未映射部件名');
  }

  /* 第三道闸：quiz 选项的 parts 是「配置单行名」，不是品类。
     skipPartsOf() 的返回值直接拿去和 plan.parts 的行名做精确比较
     （js/recommend.js 的 `skipParts.indexOf(part) > -1`），
     所以真实契约是「命中某套方案的实际行名」，PART_CAT 只是它的超集。
     上一道闸拿 PART_CAT 当参照表，漏掉了「在 PART_CAT 内、但没有任何方案叫这个名字」这一类：
       existing/audio: 音箱  → PART_CAT 有（→audio），plans 行名里只有 音频 / 耳机 / 耳机/音箱
       existing/watch: 手环  → PART_CAT 有（→wearable），plans 行名里只有 手表
     后果不是报错，是「已有件跳过」永久失效：用户在问卷里勾了「已有音频 / 已有手表」，
     系统照样给他推音频和手表，且因为同一数组里前一项已经命中，症状被完全掩盖。
     （2026-10-22 审计点名 4 处，本轮清掉最后 2 处。） */
  if (quiz && quiz.length && plans && plans.length) {
    const rows = new Set();
    plans.forEach(pl => (pl.parts || []).forEach(r => rows.add(r[0])));
    const rowList = [...rows];
    const dead = [];
    quiz.forEach(q => (q.options || []).forEach(o => (o.parts || []).forEach(pn => {
      if (rows.has(pn)) return;
      /* 拼写可疑的顺带给候选：包含关系能捞到「音箱 → 耳机/音箱」这类近义/误写 */
      const near = rowList.filter(r => r.indexOf(pn) > -1 || pn.indexOf(r) > -1);
      dead.push(q.id + '/' + o.id + ':' + pn + (near.length ? '（疑似「' + near.join('」「') + '」）' : ''));
    })));
    add('quiz:partrow', '问卷选项的 parts 每项都是某套方案的配置单行名（skipPartsOf 的真实契约）',
      dead.length === 0,
      dead.length ? JSON.stringify(dead.slice(0, 8)) : '0 个悬挂行名（方案行名全集 ' + rowList.length + ' 个）',
      '0 个悬挂行名');
  } else {
    add('quiz:partrow', '问卷选项的 parts 每项都是某套方案的配置单行名（skipPartsOf 的真实契约）',
      true, '未提供 plans/quiz，跳过', '0 个悬挂行名');
  }

  /* planPartTargets 的第二道静默 return：`if (!nums || !nums.length) return;`
     行价写成「一千一百元」，该件就拿不到目标价，配件区默默退回默认档、不报错。
     当前真实数据命中 0 处（属潜在缺口），但这类「静默跳过」查起来最贵，闸门成本极低。 */
  if (plans && plans.length) {
    const noNum = [];
    plans.forEach(pl => (pl.parts || []).forEach(r => {
      if (!/\d/.test(String(r[2] == null ? '' : r[2]))) noNum.push((pl.id || pl.name) + ':' + r[0] + '=' + r[2]);
    }));
    add('plans:price-num', '配置单每行价格文本都含阿拉伯数字（否则该件拿不到目标价）',
      noNum.length === 0,
      noNum.length ? JSON.stringify(noNum.slice(0, 8)) : '0 行无数字价格',
      '0 行无数字价格');
  } else {
    add('plans:price-num', '配置单每行价格文本都含阿拉伯数字（否则该件拿不到目标价）',
      true, '未提供 plans，跳过', '0 行无数字价格');
  }

  return { items, stats: { dup: d, presented: p2, price: p, specsBad: bad } };
}

module.exports = {
  BASE, dupStats, presentedStats, specsInconsistentCount, priceStats, runChecks,
  allItems, norm, dupKey, S, core,
};
