/* 漂移闸注入验证脚本（临时用，验证完归档）
 * 场景：
 *   D0 未改动时通过
 *   D1 改配置单行价格文本 → 必须 FAIL
 *   D2 改配置单行原文 → 必须 FAIL
 *   D3 删除一行 → 必须 FAIL
 *   D4 新增一行 → 必须 FAIL
 *   D5 改一行 + --accept → PASS 且留痕
 *   D6 恢复原状 → PASS
 *
 * 实现：按行定位 t3000 的 parts 块，逐行改。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = 'E:/AI/pc-guide-site';
const DATA = path.join(ROOT, 'js/data.js');
const BASE = path.join(ROOT, 'tools/plan-drift-baseline.json');
const orig = fs.readFileSync(DATA, 'utf8');
const origBase = fs.readFileSync(BASE, 'utf8');

function run(args) {
  try {
    const out = execFileSync('node', [path.join(ROOT, 'tools/plan-drift.cjs')].concat(args), {
      cwd: ROOT, encoding: 'utf8'
    });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status === undefined ? -1 : e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}
function restore() {
  fs.writeFileSync(DATA, orig);
  fs.writeFileSync(BASE, origBase);
}

/* 找到 t3000 块内第一条 parts 行（形如  ["CPU", "...", "¥900-1300", "..."],） */
function firstPartsLineIdx(lines) {
  const planIdx = lines.findIndex(l => l.includes('id: "t3000"'));
  if (planIdx < 0) throw new Error('找不到 t3000');
  const partsIdx = lines.findIndex((l, i) => i > planIdx && l.includes('parts: ['));
  if (partsIdx < 0) throw new Error('找不到 parts');
  for (let i = partsIdx + 1; i < lines.length; i++) {
    if (/^\s*\["/.test(lines[i])) return i;
  }
  throw new Error('找不到 parts 行');
}

const results = [];
function scenario(name, expectCode, mutate) {
  restore();
  if (mutate) mutate();
  const r = run(['--check']);
  const ok = r.code === expectCode;
  results.push({ name, ok });
  console.log((ok ? '  PASS ' : '  FAIL ') + name +
    '  (期望 exit ' + expectCode + '，实际 ' + r.code + ')');
  if (!ok) console.log(r.out.slice(0, 700));
}

console.log('== 漂移闸 · 注入验证 ==');

scenario('D0 未改动时通过', 0, null);

scenario('D1 改配置单行价格文本 → 必须 FAIL', 1, function () {
  const lines = fs.readFileSync(DATA, 'utf8').split('\n');
  const i = firstPartsLineIdx(lines);
  const before = lines[i];
  lines[i] = before.replace(/("¥[\d-]+")/, '"¥999-1999"');
  if (lines[i] === before) throw new Error('价格替换失败：' + before);
  fs.writeFileSync(DATA, lines.join('\n'));
});

scenario('D2 改配置单行原文 → 必须 FAIL', 1, function () {
  const lines = fs.readFileSync(DATA, 'utf8').split('\n');
  const i = firstPartsLineIdx(lines);
  const before = lines[i];
  lines[i] = before.replace(/\["([A-Za-z一-龥]+)",\s*"([^"]*)"/,
    '["$1", "注入测试原文 $2"');
  if (lines[i] === before) throw new Error('原文替换失败：' + before);
  fs.writeFileSync(DATA, lines.join('\n'));
});

scenario('D3 删除配置单行 → 必须 FAIL', 1, function () {
  const lines = fs.readFileSync(DATA, 'utf8').split('\n');
  const i = firstPartsLineIdx(lines);
  lines.splice(i, 1);
  fs.writeFileSync(DATA, lines.join('\n'));
});

scenario('D4 新增配置单行 → 必须 FAIL', 1, function () {
  const lines = fs.readFileSync(DATA, 'utf8').split('\n');
  const i = firstPartsLineIdx(lines);
  lines.splice(i, 0, '        ["注入测试行", "注入件", "¥1-2", "注入用"],');
  fs.writeFileSync(DATA, lines.join('\n'));
});

/* D5：改一行 + accept → PASS 且留痕 */
restore();
{
  const lines = fs.readFileSync(DATA, 'utf8').split('\n');
  const i = firstPartsLineIdx(lines);
  lines[i] = lines[i].replace(/("¥[\d-]+")/, '"¥999-1999"');
  fs.writeFileSync(DATA, lines.join('\n'));
}
const acc = run(['--accept', 't3000:CPU']);
console.log((acc.code === 0 ? '  PASS ' : '  FAIL ') + 'D5a accept 成功 (exit ' + acc.code + ')');
results.push({ name: 'D5a accept 成功', ok: acc.code === 0 });
const after = run(['--check']);
console.log((after.code === 0 ? '  PASS ' : '  FAIL ') + 'D5b accept 后 --check 通过 (exit ' + after.code + ')');
results.push({ name: 'D5b accept 后 --check 通过', ok: after.code === 0 });
const b = JSON.parse(fs.readFileSync(BASE, 'utf8'));
const a0 = (b._accepts || [])[0];
const hasTrace = !!a0 && !!a0.at && !!a0.diff && !!a0.note;
console.log((hasTrace ? '  PASS ' : '  FAIL ') + 'D5c accept 留下留痕（时间+diff+说明）');
results.push({ name: 'D5c accept 留痕', ok: hasTrace });
if (hasTrace) console.log('       留痕：' + JSON.stringify(a0).slice(0, 200));

restore();
const final = run(['--check']);
console.log((final.code === 0 ? '  PASS ' : '  FAIL ') + 'D6 恢复原状后通过 (exit ' + final.code + ')');
results.push({ name: 'D6 恢复原状后通过', ok: final.code === 0 });

restore();
const bad = results.filter(r => !r.ok);
console.log('\n结果：PASS ' + (results.length - bad.length) + ' / FAIL ' + bad.length);
if (bad.length) { bad.forEach(r => console.log('  x ' + r.name)); process.exit(1); }
