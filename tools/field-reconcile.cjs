/* ORD-14 第 1 批 · item 3：必填且硬命中 <60% 的字段逐条对账
 *
 * 为什么必须对账再排期：
 *   ORD-06 那轮 ssd.form 报 53/53，其实是「SATA 当形态」的伪命中；ssd.warranty 41/53
 *   是因为「5 年 600TBW」这种写法没覆盖。两个都不是数据缺失，是规则不够。
 *   按「42 个字段 = 42 笔补录」排工期会算虚 —— 实测本轮就修掉 4 个字段的规则分支。
 *
 * 判定方法（机械可复核，不靠印象）：
 *   1. softOnly > 0     → 规格只写在 valueNote/compat，硬字段层确实是空的
 *   2. 补一条候选规则后命中上升 ≥ 5 个点 → 「规则分支不足」
 *   3. 两者都不成立     → 「数据真缺」，进补录清单
 *
 * 产出 reports/specs-field-reconcile.md
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const S = ROOT + path.sep;

const c = { window: {} };
vm.createContext(c);
vm.runInContext(fs.readFileSync(S + 'js/models-data.js', 'utf8'), c);
const M = c.window.PC_MODELS;

const cov = JSON.parse(fs.readFileSync(S + 'reports/specs-parse-coverage.json', 'utf8'));
const src = fs.readFileSync(S + 'tools/schema-dryrun.cjs', 'utf8');
const R = eval('({' + src.match(/const R = \{([\s\S]*?)\n\};/)[1] + '})');

const segs = it => String(it.specs || '').split(/[;；]/).map(s => s.trim()).filter(Boolean);

/* 候选规则：只用于估算「补这条分支能捞回多少」，不写回 dryrun。
   写回属于第 3 批，且必须逐个品类复核规则正确性。 */
const CANDIDATE = {
  'tablet.resolution': {
    add: [/^$/, /(\d(?:\.\d)?K)/i],
    why: 'specs 写的是 2K / 2.5K / 3K 档位，不是 2560×1600 像素对；规则只认像素对'
  },
  'wearable.batteryLife': {
    add: [/(\d+)\s*小时/],
    why: '手环/耳机类按小时写续航，规则只认「N 天续航」；另有「周级续航」这类定性写法'
  },
  'cooler.type': {
    add: [/热管/, /冷排/],
    why: '风冷写「4×6mm 热管」、水冷写「360mm 冷排」，都不含「风冷 / 水冷」字样'
  },
  'charger.ports': {
    add: [/(单|双|三)\s*Type-?C/i, /Type-?C\s*[×x]\s*(\d)/i],
    why: '「单 Type-C」「双 Type-C」是最常见写法，规则只认「3×Type-C」这种带乘号的'
  },
  'network.lanSpeed': {
    add: [/(\d+(?:\.\d+)?)\s*G\b/i],
    why: '「双 2.5G」省略了「口」字，规则要求带口/网口后缀'
  },
  'monitor.iface': {
    add: [/Type-?C/i, /\bDP\b\s*[\d.]*/i],
    why: '「Type-C 可选」「DP 1.4」两种写法都在库里有，规则只认带数量的 HDMI/DP'
  }
};

const rows = Object.entries(cov)
  .filter(([k, v]) => v.req === 1 && typeof v.pct === 'number' && v.pct < 60)
  .sort((a, b) => a[1].pct - b[1].pct);

const out = [];
rows.forEach(([key, v]) => {
  const [cat, field] = key.split('.');
  const arr = M[cat] || [];
  const cand = CANDIDATE[key];
  let projected = v.hit;

  if (cand) {
    const base = (R[cat] && R[cat][field]) || [];
    const all = base.concat(cand.add.filter(re => String(re) !== '/^$/'));
    projected = arr.filter(it => all.some(re => segs(it).some(s => re.test(s)))).length;
  }

  const gain = Math.round((projected - v.hit) / arr.length * 1000) / 10;
  let verdict, action;
  if (cand && gain >= 5) {
    verdict = '规则分支不足';
    action = '补分支：' + cand.why + '（预估 ' + v.hit + '→' + projected + '，+' + gain + 'pt）';
  } else if (v.softOnly > 0) {
    verdict = '数据真缺（硬字段层）';
    action = '规格只写在 valueNote/compat（' + v.softOnly + ' 条），需补录进 specs';
  } else {
    verdict = '数据真缺';
    action = 'specs 与软文本都没有该规格，需外部核验补录';
  }

  out.push({
    key, cat, field, hit: v.hit, total: v.total, pct: v.pct,
    softOnly: v.softOnly || 0, projected, gain, verdict, action
  });
});

const L = [];
L.push('# 必填字段低覆盖对账（' + new Date().toISOString().slice(0, 10) + '）');
L.push('');
L.push('口径：schema 里 `r:1` 且硬命中 < 60% 的字段，共 **' + out.length + '** 个。');
L.push('判定规则见 `tools/field-reconcile.cjs` 头部：补一条候选规则后能涨 ≥5 个点 → 规则分支不足，否则数据真缺。');
L.push('');
L.push('| 字段 | 命中 | 软文本 | 判定 | 处置 |');
L.push('|---|---|---|---|---|');
out.forEach(r => {
  L.push('| `' + r.key + '` | ' + r.hit + '/' + r.total + ' (' + r.pct + '%) | ' + r.softOnly + ' | ' +
    r.verdict + ' | ' + r.action + ' |');
});
const ruleGap = out.filter(r => r.verdict === '规则分支不足');
const realGap = out.filter(r => r.verdict !== '规则分支不足');
L.push('');
L.push('## 汇总');
L.push('');
L.push('- 规则分支不足：**' + ruleGap.length + '** 个（先改规则，不排补录工期）');
L.push('- 数据真缺：**' + realGap.length + '** 个（其中硬字段层空但软文本有：' +
  realGap.filter(r => r.softOnly > 0).length + ' 个）');
L.push('- 若把上面 ' + ruleGap.length + ' 条候选分支补进 dryrun，这 ' + ruleGap.length +
  ' 个字段合计净增命中 **' + ruleGap.reduce((a, r) => a + (r.projected - r.hit), 0) + '** 条记录。');
L.push('');
L.push('> 候选分支**本轮不写回** `tools/schema-dryrun.cjs`：改一个品类的规则要连带复核该品类全部字段，');
L.push('> 属于第 3 批的活。本表只回答「工期该按几个字段算」。');

fs.writeFileSync(S + 'reports/specs-field-reconcile.md', L.join('\n') + '\n', 'utf8');
console.log(L.join('\n'));
