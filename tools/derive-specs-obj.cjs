/* 把 specs 自由文本派生为结构化 specsObj，写回 js/models-data.js · ORD-14 第 1 批
 *
 * 用法：
 *   node tools/derive-specs-obj.cjs           # 重新派生并写回
 *   node tools/derive-specs-obj.cjs --check    # 只报告覆盖率，不写文件
 *   node tools/derive-specs-obj.cjs --dry-run  # 写临时文件并对比，验证幂等
 *
 * 为什么整文件重生成而不是逐行正则改写：
 *   逐行改写要自己维护「对象字面量 → 字符串 → 对象」的双向解析，一旦某个 valueNote
 *   里出现 `},` 就会错位且静默成功。重生成走的是与 tools/rebuild-models.cjs 完全相同的
 *   fmt()，已实测「不加字段时重生成结果与原文件逐字节一致」，所以差异只会来自新字段。
 *   —— 这也是为什么 fmt 必须和 rebuild-models.cjs 保持一致，改一处要同步另一处。
 *
 * 幂等：派生是纯函数（只读 item.specs），重复执行结果不变，可随时重跑。
 * 行尾：models-data.js 是 CRLF，写回时保持 CRLF，否则 git 会把整文件标记为修改。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const SD = require('./specs-derive.cjs');

const SITE_DIR = process.env.PCG_SITE || path.resolve(__dirname, '..');
const P = path.join(SITE_DIR, 'js', 'models-data.js');

const ORDER = [
  ['cpu', 'CPU'], ['mobo', '主板'], ['ram', '内存'], ['gpu', '显卡'],
  ['ssd', '固态硬盘'], ['psu', '电源'], ['case', '机箱'], ['cooler', '散热器'],
  ['monitor', '显示器'], ['input', '键鼠外设'], ['audio', '音箱与麦克风'],
  ['network', '网络设备'], ['stand', '支架'], ['dock', '拓展坞'], ['laptop', '笔记本电脑'],
  ['phone', '手机'], ['tablet', '平板'], ['charger', '充电与供电'], ['mobileacc', '手机与平板配件'],
  ['earphone', '耳机与耳麦'], ['wearable', '智能穿戴与配套']
];

/* 与 tools/rebuild-models.cjs 的 fmt 保持同一形状，只在 specs 之后插入 specsObj */
function makeFmt(catId) {
  const q = JSON.stringify;
  const A = a => '[' + (a || []).map(q).join(', ') + ']';
  return it => {
    const d = SD.derive(catId, it);
    const objTxt = d.obj ? ', specsObj: ' + JSON.stringify(d.obj) : '';
    /* specsMissing 只列本轮尝试过但没有取到值的字段，不是整个 schema 的缺失清单 */
    const misTxt = d.missing.length ? ', specsMissing: ' + JSON.stringify(d.missing) : '';
    return '    { id: ' + q(it.id) + ', brand: ' + q(it.brand) + ', model: ' + q(it.model) +
      ', name: ' + q(it.name) + ', searchName: ' + q(it.searchName) + ', style: ' + q(it.style) +
      ', price: [' + it.price[0] + ', ' + it.price[1] + '], rating: ' + it.rating +
      ', valueGrade: ' + q(it.valueGrade) + ', valueNote: ' + q(it.valueNote) +
      ', use: ' + A(it.use) + ', audience: ' + A(it.audience) + ', tags: ' + A(it.tags) +
      ', specs: ' + q(it.specs) + objTxt + misTxt + ', compat: ' + q(it.compat) + ' },';
  };
}

function render(src, M) {
  let body = 'window.PC_MODELS = {\n';
  ORDER.forEach(([k, label], idx) => {
    body += '  /* ---------- ' + label + ' ---------- */\n  ' + k + ': [\n' +
      (M[k] || []).map(makeFmt(k)).join('\n') + '\n  ]' +
      (idx === ORDER.length - 1 ? '\n' : ',\n\n');
  });
  body += '};\n';
  const start = src.indexOf('window.PC_MODELS = {');
  if (start < 0) throw new Error('ABORT 定位 window.PC_MODELS 失败');
  return src.slice(0, start) + body;
}

function loadModels(src) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.window.PC_MODELS;
}

/* 覆盖率表：品类 × 字段 → 取到值的款数 / 总款数 */
function coverage(M) {
  const rows = [];
  Object.keys(SD.SCOPE).forEach(catId => {
    const arr = M[catId] || [];
    const fields = SD.SCOPE[catId];
    fields.forEach(k => {
      let hit = 0;
      arr.forEach(it => { if (SD.deriveField(catId, k, it) != null) hit++; });
      rows.push({ catId, key: k, hit, total: arr.length, pct: Math.round(hit / arr.length * 1000) / 10 });
    });
  });
  return rows;
}

function main() {
  const raw = fs.readFileSync(P, 'utf8');
  const crlf = raw.indexOf('\r\n') > -1;
  const src = raw.replace(/\r\n/g, '\n');
  const M = loadModels(src);

  const rows = coverage(M);
  console.log('=== 派生覆盖率（只统计本轮 SCOPE 内字段）===');
  rows.forEach(r => console.log('  ' + (r.catId + '.' + r.key).padEnd(18) +
    r.hit + '/' + r.total + '  ' + r.pct + '%'));

  const next = render(src, M);
  const same = next === src;
  console.log('');
  console.log('=== 写回检查 ===');
  console.log('  目标文件已是当前派生结果：' + (same ? '是（幂等）' : '否'));

  const check = process.argv.includes('--check');
  const dry = process.argv.includes('--dry-run');

  if (check) {
    if (!same) {
      console.error('  ✗ 文件落后于派生结果，请执行 node tools/derive-specs-obj.cjs');
      process.exit(1);
    }
    return;
  }
  if (dry) {
    const tmp = P + '.tmp';
    fs.writeFileSync(tmp, crlf ? next.replace(/\n/g, '\r\n') : next, 'utf8');
    console.log('  临时文件已写出：' + tmp);
    return;
  }
  if (same) { console.log('  无需写入'); return; }

  fs.writeFileSync(P, crlf ? next.replace(/\n/g, '\r\n') : next, 'utf8');
  console.log('  已写回 js/models-data.js（' + (crlf ? 'CRLF' : 'LF') + '）');

  /* 回读断言：写完必须能重新加载，且 specsObj 真的在里面 */
  const back = loadModels(fs.readFileSync(P, 'utf8'));
  let n = 0;
  Object.keys(SD.SCOPE).forEach(c => (back[c] || []).forEach(it => { if (it.specsObj) n++; }));
  console.log('  回读校验：带 specsObj 的条目 ' + n + ' 条');
  if (!n) { console.error('  ✗ 回读无 specsObj，写入失败'); process.exit(1); }
}

main();
