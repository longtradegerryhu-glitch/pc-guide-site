#!/usr/bin/env node
/* 入库查重闸 —— 同型号重复录入的拦截器
 *
 * 为什么在仓库里而不是留在 E:/AI/_test：
 *   闸门只在"某台机器上的某个脚本"里存在，就永远没法被复查、被 CI 跑、被别人接手。
 *   口径内核 js/dup-core.js 与页面合并卡共用同一份，闸与页面不会各说各话。
 *
 * 用法：
 *   node tools/dedup-gate.cjs                      报告当前 js/models-data.js 的重复情况（退出码 0）
 *   node tools/dedup-gate.cjs --strict             零容忍：有任何重复即退出 1（数据清理完成后启用）
 *   node tools/dedup-gate.cjs --base a.js --target b.js
 *                                                  增量闸：target 里比 base 新增的重复键 / 条数增长 → 退出 1
 *   追加 --json 输出机器可读结果
 *
 * 增量闸的设计意图：
 *   存量 49 组是历史欠账，页面已用合并卡兜住；闸门要拦的是"再往里写新的重复"。
 *   基线不写死在文件里，直接取仓库当前的 js/models-data.js —— 数据被清理后，
 *   基线自动收窄到 0，不需要谁记得去改一个 json。
 */

'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SITE = path.resolve(__dirname, '..');
const CORE_PATH = path.join(SITE, 'js', 'dup-core.js');

function loadCore() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(CORE_PATH, 'utf8'), ctx);
  if (!ctx.PCDup) throw new Error('js/dup-core.js 未导出 PCDup');
  return ctx.PCDup;
}

/* 读一个 PC_MODELS 数据文件（models-data.js / models.js 均可） */
function loadModels(file) {
  const src = fs.readFileSync(file, 'utf8');
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const M = ctx.window.PC_MODELS;
  if (!M) throw new Error(path.basename(file) + ' 中没有 window.PC_MODELS');
  return M;
}

/* 扫全库 → 重复组明细 */
function scan(models, core) {
  const groups = core.scanGroups(models);
  let total = 0, extra = 0, maxPerGroup = 0, conflict = 0;
  Object.keys(models).forEach(k => { total += (models[k] || []).length; });
  const detail = groups.map(g => {
    const ranges = g.list.map(x => x.price.slice());
    extra += g.list.length - 1;
    maxPerGroup = Math.max(maxPerGroup, g.list.length);
    let bad = false;
    for (let i = 0; i < ranges.length && !bad; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        if (!core.overlaps(ranges[i], ranges[j])) { bad = true; break; }
      }
    }
    if (bad) conflict++;
    const lo = Math.min.apply(null, ranges.map(r => r[0]));
    const hi = Math.max.apply(null, ranges.map(r => r[1]));
    const minHi = Math.min.apply(null, ranges.map(r => r[1]));
    const maxLo = Math.max.apply(null, ranges.map(r => r[0]));
    const gap = maxLo - minHi;                       // >0 表示区间完全分离
    /* 倍率 = 两条记录报价中点之比：直接回答"这两条报价差多远"。
       不用并集跨度（hi/lo）——两条完全相同的记录跨度也可能是 1.69×（区间本身宽），会被误判成高差异。 */
    const mids = ranges.map(r => (r[0] + r[1]) / 2).filter(x => x > 0);
    const ratio = mids.length > 1
      ? Math.round(Math.max.apply(null, mids) / Math.min.apply(null, mids) * 100) / 100
      : 1;
    return {
      key: g.key, catId: g.catId, brand: g.brand, model: g.model,
      ids: g.list.map(x => x.id), ranges: ranges,
      names: g.list.map(x => x.name),
      specs: g.list.map(x => x.specs),
      union: [lo, hi], conflict: bad,
      gap: gap,
      gapPct: lo > 0 ? Math.round(gap / lo * 1000) / 10 : 0,
      span: lo > 0 ? Math.round(hi / lo * 100) / 100 : 0,
      ratio: ratio,
    };
  });
  return { total, groups: detail.length, extra, maxPerGroup, conflict, detail };
}

function keyCounts(models, core) {
  const m = new Map();
  Object.keys(models).forEach(cat => (models[cat] || []).forEach(it => {
    const k = core.keyOf(cat, it);
    m.set(k, (m.get(k) || 0) + 1);
  }));
  return m;
}

/* 增量比较：返回 { newKeys, grown } */
function incremental(baseModels, nextModels, core) {
  const b = keyCounts(baseModels, core);
  const n = keyCounts(nextModels, core);
  const newKeys = [], grown = [];
  n.forEach((c, k) => {
    const old = b.get(k) || 0;
    if (old === 0 && c > 1) newKeys.push({ key: k, count: c });
    else if (old > 0 && c > old) grown.push({ key: k, from: old, to: c });
  });
  return { newKeys, grown };
}

function fmtRange(r) { return '¥' + r[0] + (r[1] !== r[0] ? '–' + r[1] : ''); }

function main() {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  const strict = argv.includes('--strict');
  const argOf = name => {
    const i = argv.indexOf(name);
    return i > -1 ? argv[i + 1] : null;
  };
  const target = argOf('--target') || path.join(SITE, 'js', 'models-data.js');
  const base = argOf('--base');

  const core = loadCore();
  const next = loadModels(target);
  const s = scan(next, core);

  let inc = null;
  if (base) inc = incremental(loadModels(base), next, core);

  const out = {
    target: path.relative(SITE, target), total: s.total,
    groups: s.groups, extra: s.extra, maxPerGroup: s.maxPerGroup, conflict: s.conflict,
    newKeys: inc ? inc.newKeys : null, grown: inc ? inc.grown : null,
  };

  if (json) { console.log(JSON.stringify(out, null, 2)); }
  else {
    console.log('目标 ' + out.target + '：' + s.total + ' 条 / ' + s.groups + ' 组重复 / 多余 ' + s.extra + ' 条 / 价格冲突 ' + s.conflict + ' 组');
    if (inc) {
      console.log('增量：新增重复键 ' + inc.newKeys.length + ' 个，条数增长 ' + inc.grown.length + ' 个');
      inc.newKeys.forEach(x => console.log('  ✗ 新增重复 key=' + x.key + '（' + x.count + ' 条）'));
      inc.grown.forEach(x => console.log('  ✗ key=' + x.key + ' 由 ' + x.from + ' 条增至 ' + x.to + ' 条'));
    }
  }

  const blocked = (inc && (inc.newKeys.length || inc.grown.length)) || (strict && s.groups > 0);
  if (blocked) {
    if (!json) console.error('[闸门] 拒绝：存在新增重复' + (strict ? '（--strict 零容忍）' : ''));
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { loadCore, loadModels, scan, incremental, keyCounts, fmtRange };
