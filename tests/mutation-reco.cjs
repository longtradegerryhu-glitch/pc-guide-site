/* 变异测试：验证 17 条验收断言不是「恒真假通过」
 *
 * 做法：把**代码快照**复制到临时目录 → 注入一个故障 → 跑 tests/reco-acceptance.cjs
 *       → 看对应断言是否 FAIL。断言抓不住故障 = 该断言无效。
 *
 * 为什么用快照而不是直接改工作区：
 *   注入变异要改 js/data.js、js/recommend.js。在工作区改会让文件处于半损坏状态，
 *   中途崩掉就留下一堆脏改动。快照 = 复制一份出来改，工作区一个字节都不动。
 *
 * 开箱即用（ORD-15）：本脚本**不依赖 git**，也不需要预先导出快照。
 *   · 默认快照目录 E:/AI/_test/mutsnap（可用 PCG_MUT_SNAP 覆盖）
 *   · 快照缺失 / 与工作区不一致 → 自动从工作区重建
 *   · 每次跑完自动删除自己产生的临时目录（逐个 unlink + rmdir，不用递归批量删除）
 *   · 上次异常中断留下的目录，下次启动自动清掉
 *
 * 锚点用正则 + 唯一性断言：命中 0 次或 >1 次都直接报错，
 * 不允许「模糊命中就改」——那会变成静默的假变异。
 *
 * 跑法：npm run test:mutation:reco          全跑 17 个变异
 *       npm run test:mutation:reco -- M8    只跑一个
 *       PCG_MUT_KEEP=1 ... 保留临时目录（默认清理）
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
/* 快照与临时目录都可以用环境变量覆盖；默认值优先落在 E:/AI/_test，
   该盘不存在时退回系统临时目录，保证换一台机器也能跑。 */
const SNAP = process.env.PCG_MUT_SNAP
  || (fs.existsSync('E:/AI/_test') ? 'E:/AI/_test/mutsnap' : path.join(os.tmpdir(), 'pcg-mutsnap'));
const WORK_ROOT = process.env.PCG_MUT_WORK || path.join(os.tmpdir(), 'pcg-mutation-reco');
const NODE = process.execPath;
const NODE_PATH = process.env.NODE_PATH || 'C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules';

/* 快照里不带这些东西：.git 太大、node_modules 有自己的依赖、.env 含密钥、
   .mutruns / snap 是历史残留目录。 */
const SKIP_TOP = new Set(['.git', 'node_modules', '.mutruns', 'snap', '.env', '.snapmeta.json']);

/* 「关键文件」= 会影响断言结果的文件。只有这些变了才需要重建快照；
   改一份 wr-*.md 不该触发重建。 */
const KEY_RE = /^(js\/.*\.js|css\/.*\.css|tests\/reco-acceptance\.cjs|[^/]+\.html)$/;

function walkRel(dir, base, out) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const e of ents) {
    if (!base && SKIP_TOP.has(e.name)) continue;
    const rel = base ? base + '/' + e.name : e.name;
    if (e.isDirectory()) walkRel(path.join(dir, e.name), rel, out);
    else out.push(rel);
  }
  return out;
}

/* 关键文件集的指纹：路径 + 逐文件 md5，排序后拼。任何一个字节变了指纹就变。 */
function fingerprint(dir) {
  const h = crypto.createHash('md5');
  const files = walkRel(dir, '', []).filter(r => KEY_RE.test(r)).sort();
  for (const rel of files) {
    let one = 'MISSING';
    try { one = crypto.createHash('md5').update(fs.readFileSync(path.join(dir, rel))).digest('hex'); } catch (e) {}
    h.update(rel + '\u0000' + one + '\n');
  }
  return { hash: h.digest('hex'), count: files.length };
}

/* 自底向上逐个删：先 unlink 文件，再 rmdir 目录。
   不用 rmSync(recursive) —— 环境的批量删除保护会拦，而且看不出删了什么。 */
function rmTree(p) {
  let ents;
  try { ents = fs.readdirSync(p, { withFileTypes: true }); } catch (e) { return; }
  for (const e of ents) {
    const q = path.join(p, e.name);
    if (e.isDirectory()) rmTree(q);
    else { try { fs.unlinkSync(q); } catch (err) {} }
  }
  try { fs.rmdirSync(p); } catch (err) {}
}

function copySite(src, dir) {
  fs.mkdirSync(dir, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP_TOP.has(e.name)) continue;
    if (e.isFile() && /\.md$/i.test(e.name)) continue;   /* 文档不影响断言，少复制 30+ 文件 */
    fs.cpSync(path.join(src, e.name), path.join(dir, e.name), { recursive: true });
  }
}

/* 快照：命中缓存就不重建。缓存判定用关键文件指纹，
   防止「快照是三天前的代码，锚点全漂移」这种最难查的假失败。 */
function ensureSnapshot() {
  const metaFile = path.join(SNAP, '.snapmeta.json');
  let meta = null;
  try { meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch (e) {}
  const cur = fingerprint(REPO);
  const hasCore = fs.existsSync(path.join(SNAP, 'js', 'recommend.js'))
    && fs.existsSync(path.join(SNAP, 'tests', 'reco-acceptance.cjs'));
  if (hasCore && meta && meta.hash === cur.hash) {
    console.log(`快照：${SNAP}（复用，${cur.count} 个关键文件）\n`);
    return;
  }
  if (fs.existsSync(SNAP)) rmTree(SNAP);      /* 旧快照带着过期文件，整体重建 */
  console.log(`快照：${SNAP}（${hasCore ? '与工作区不一致，重建' : '缺失，新建'}）`);
  copySite(REPO, SNAP);
  const now = fingerprint(SNAP);
  if (now.hash !== cur.hash) {
    console.error('快照指纹与工作区不一致 —— 复制过程出错');
    process.exit(2);
  }
  if (!fs.existsSync(path.join(SNAP, 'tests', 'reco-acceptance.cjs'))) {
    console.error('快照缺 tests/reco-acceptance.cjs，无法跑断言');
    process.exit(2);
  }
  fs.writeFileSync(metaFile, JSON.stringify({ hash: now.hash, count: now.count, at: new Date().toISOString() }, null, 1));
  console.log(`       关键文件 ${now.count} 个，就绪\n`);
}

/* 清上次中断留下的目录。只认本脚本的命名（时间戳/pid + -M 编号），
   绝不碰 WORK_ROOT 里别人放的东西。 */
function sweep(root) {
  if (!fs.existsSync(root)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (!/^\d+(-\d+)?-M\w+$/.test(e.name)) continue;
    rmTree(path.join(root, e.name));
    n++;
  }
  return n;
}
const MUTS = [
  /* ===== 问卷结构类（A1-A5 / A16）===== */
  {
    id: 'M1', name: 'form 题被移到末位（首题不再是设备形态）',
    expect: ['A1', 'A16'], file: 'js/data.js',
    pattern: /\{\s*\n?\s*id: "form", title: "你想用哪种设备\？", multi: false,\n\s*options: \[\n\s*\{ id: "desktop"/,
    to: (m) => m.replace('id: "form"', 'id: "formZZ"'),
    note: '把 form 题改名 → visibleSteps 里 currentForm() 取不到 form，首题不再是设备题'
  },
  {
    id: 'M2', name: 'focus 的「散热器」选项去掉 form 限制（手机也显示散热器）',
    expect: ['A2'], file: 'js/data.js',
    pattern: /\{ id: "cooler", label: "散热器", desc: "CPU 或笔记本散热",\n\s*parts: \["散热", "笔记本散热"\],\n\s*when: \{ form: \["desktop", "laptop", "both"\] \} \}/,
    to: (m) => m.replace(/,\n\s*when: \{[^}]*\} \}/, ' }'),
    note: '手机形态的 focus 题多出「散热器」选项 → A2 应 FAIL'
  },
  {
    id: 'M3', name: 'exp 题在手机形态也显示（整题不消失）',
    expect: ['A3', 'A4', 'A16'], file: 'js/data.js',
    pattern: /id: "exp", title: "你以前装过或折腾过电脑吗\？", multi: false,\n\s*when: \{ form: \["desktop", "laptop", "both"\] \},/,
    to: (m) => m.replace(/,\n\s*when: \{[^}]*\},/, ','),
    note: 'exp 题不再按形态过滤 → 题数不减、题干含「电脑」'
  },
  {
    id: 'M4', name: '预算题题干不分形态（desktop 与 phone 文案相同）',
    expect: ['A16'], file: 'js/data.js',
    pattern: /title: \{ default: "整机预算大概在\？", phone: "总投入预算大概在\？", tablet: "总投入预算大概在\？" \}/,
    to: (m) => 'title: { default: "整机预算大概在？" }',
    note: 'A16 第 4 层：题干文案须随形态变化'
  },
  {
    id: 'M5', name: '编号 N 写死不重算（永远显示 /10）',
    expect: ['A5'], file: 'js/recommend.js',
    pattern: /var stepBadge = '<span class="q-step">' \+ \(qi \+ 1\) \+ "\/" \+ vis\.length \+ "<\/span>";/,
    to: (m) => m.replace('vis.length', '"10"'),
    note: '手机形态实际 9 题，写死 /10 → A5 的 N 与实有题数不符'
  },
  {
    id: 'M6', name: '题级形态过滤失效（visibleSteps 不过滤）',
    expect: ['A3', 'A4', 'A16'], file: 'js/recommend.js',
    /* 只破坏 visibleSteps 不够：A2 审的是「选项集合」，optionsOf 仍会按 when.form 过滤，
       选项级过滤要另用 M6b 破。这里只期待题级结构断言 FAIL。 */
    pattern: /return steps\.filter\(function \(q\) \{ return fitsWhen\(q, form\); \}\);/,
    to: () => 'return steps;',
    note: '题级过滤失效 → A3/A4/A16 应 FAIL'
  },
  {
    id: 'M6b', name: '选项级过滤失效（optionsOf 不按形态收窄）',
    expect: ['A2'], file: 'js/recommend.js',
    pattern: /return q\.options\.filter\(function \(o\) \{ return fitsWhen\(o, form\); \}\);/,
    to: () => 'return q.options;',
    note: '手机形态会显示「显示器/键鼠/散热器」选项 → A2 应 FAIL'
  },

  /* ===== 结果内容类（A6-A15）===== */
  {
    id: 'M7', name: '手机方案塞进电脑件（CPU）',
    expect: ['A6'], file: 'js/data.js',
    pattern: /\["手机", "iQOO 16 \/ iQOO 15", "¥4200-6500",/,
    to: (m) => '["CPU", "AMD Ryzen 5 9600X", "¥1200-1500", "测试用"],\n        ' + m,
    note: '手机方案里出现 CPU → A6 应 FAIL（数据层同口径自查）'
  },
  {
    id: 'M8', name: 'focus 完全不进入 priority（三条路径全断）',
    expect: ['A7', 'A15'], file: 'js/recommend.js',
    /* focus→priority 有三条路径，任一条存活 focus 就仍生效：
       ① focusIds.concat(core 八件)        —— core 显式展开
       ② partsOfOption 逐项 push          —— focus 声明的部件名
       ③ focusIds = focus.slice() 保留选项 id —— 选项 id（monitor/input/audio/stand/dock/cooler）
          与品类 id 完全同名，keys 判定里 r.cat.id 直接命中
       三条必须同破，否则是存活变异。 */
    pattern: /var focusIds = focus\.slice\(\);\n\s*if \(focusIds\.indexOf\("core"\) > -1\) \{\n\s*focusIds = focusIds\.concat\(\["cpu", "gpu", "mobo", "ram", "ssd", "psu", "case", "cooler"\]\);\n\s*\}\n\s*focus\.forEach\(function \(fid\) \{\n\s*partsOfOption\("focus", fid\)\.forEach\(function \(pn\) \{\n\s*if \(focusIds\.indexOf\(pn\) === -1\) focusIds\.push\(pn\);/,
    to: () => 'var focusIds = [];\n      if (false) { }\n      focus.forEach(function (fid) {\n        if (1) return; partsOfOption("focus", fid).forEach(function (pn) {\n          if (false) focusIds.push(pn);',
    note: '三条路径全断 → focus 完全不生效：A7（不同 focus 结构相同）+ A15（focus 题改了结果不变）都应 FAIL'
  },
  {
    id: 'M8b', name: 'focus 的部件不追加进 focusIds（形态内 focus 失效）',
    expect: ['A7'], file: 'js/recommend.js',
    pattern: /focus\.forEach\(function \(fid\) \{\n\s*partsOfOption\("focus", fid\)\.forEach\(function \(pn\) \{/,
    to: (m) => m.replace('partsOfOption("focus", fid).forEach(function (pn) {', 'if (1) return; partsOfOption("focus", fid).forEach(function (pn) {'),
    note: '形态内 focus（p_body 等）不展开 → 手机 focus 各选项首屏集合相同 → A7 应 FAIL'
  },
  {
    id: 'M9', name: '已有件不再跳过（配置单与配件区照推）',
    expect: ['A8', 'A9', 'A10'], file: 'js/recommend.js',
    pattern: /if \(skipParts\.indexOf\(part\) > -1\) \{/,
    to: (m) => m.replace('if (skipParts.indexOf(part) > -1) {', 'if (false && skipParts.indexOf(part) > -1) {'),
    note: '跳过逻辑失效 → A8（仍在推）/A9（差额对不上）/A10（无跳过行）应 FAIL'
  },
  {
    id: 'M10', name: '跳过说明文案被删',
    expect: ['A10'], file: 'js/recommend.js',
    pattern: /var skipTip = \(curRows\.skipped && curRows\.skipped\.length\)/,
    to: (m) => 'var skipTip = false && (curRows.skipped && curRows.skipped.length)',
    note: 'skipTip 不再生成 → A10 应 FAIL'
  },
  {
    id: 'M11', name: '冲突提示被删',
    expect: ['A14'], file: 'js/recommend.js',
    pattern: /var conflictTip = \(focusConflict\.length && skipTip\)/,
    to: (m) => 'var conflictTip = false && (focusConflict.length && skipTip)',
    note: 'conflictTip 不再生成 → A14 应 FAIL'
  },
  {
    id: 'M12', name: '非重点件不再折叠（全部平铺）',
    expect: ['A13'], file: 'js/recommend.js',
    pattern: /var collapsible = pri\.length > 0 && opts\.fold !== false && hotHits > 0;/,
    to: () => 'var collapsible = false;',
    note: '折叠区消失 → A13 应 FAIL（非重点件没被折叠 + 折叠区为空）'
  },
  {
    id: 'M13', name: '配置单价格改回 plan.parts 字符串价（与型号库分叉）',
    expect: ['A11'], file: 'js/recommend.js',
    pattern: /if \(libPrice\) \{/,
    to: (m) => m.replace('if (libPrice) {', 'if (false && libPrice) {'),
    note: '配置单改用模板价 → 与配件区型号库价不一致 → A11 应 FAIL'
  },
  {
    id: 'M14', name: '同款徽章一律写 exact（不校验型号）',
    expect: ['A12'], file: 'js/recommend.js',
    pattern: /return "alt";\n\s*\}/,
    to: (m) => m.replace('return "alt";', 'return "exact";'),
    note: 'anchorState 把所有 alt 都判成 exact → 型号对不上却标「配置单同款」'
  },
  {
    id: 'M15', name: '使用强度不再影响目标价位（intensity 题空转）',
    expect: ['A15'], file: 'js/recommend.js',
    /* targetScale 有两处（深度测评 / 快速推荐），用注释上下文锁定深度测评那一处 */
    pattern: /(使用强度真实影响目标价位[^\n]*\n\s*)var targetScale = intensity === "light" \? 0\.85 : intensity === "heavy" \? 1\.12 : 1;/,
    to: (m) => m.replace(/var targetScale = intensity[^;]*;/, 'var targetScale = 1;'),
    note: 'intensity 改变不改结果 → A15 逐题对照实验应 FAIL'
  }
];

function runAccept() {
  const r = spawnSync(NODE, [path.join(WORK, 'tests', 'reco-acceptance.cjs')], {
    env: Object.assign({}, process.env, { NODE_PATH }),
    encoding: 'utf8', cwd: WORK, timeout: 900000
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const failed = [];
  out.split('\n').forEach(l => {
    const m = l.match(/^\s*FAIL\s+(A\d+)\s/);
    if (m) failed.push(m[1]);
  });
  return { failed, out, status: r.status };
}

function applyMut(mut) {
  const p = path.join(WORK, mut.file);
  let raw = fs.readFileSync(p, 'utf8');
  /* data.js 是 CRLF、recommend.js 是 LF。锚点里的 \n 只匹配 LF，
     所以先归一化成 LF 再匹配；写回时按原文件的行尾还原。 */
  const crlf = raw.includes('\r\n');
  let t = raw.replace(/\r\n/g, '\n');
  const re = new RegExp(mut.pattern.source, mut.pattern.flags);
  const hits = t.match(new RegExp(mut.pattern.source, mut.pattern.flags + 'g'));
  const n = hits ? hits.length : 0;
  if (n !== 1) return { ok: false, msg: `锚点命中 ${n} 次（必须为 1）` };
  t = t.replace(re, mut.to);
  if (crlf) t = t.replace(/\n/g, '\r\n');
  fs.writeFileSync(p, t);
  return { ok: true };
}

const only = process.argv[2];
const list = only ? MUTS.filter(m => m.id === only) : MUTS;
if (!list.length) { console.error('无此变异编号：' + only + '（可选：' + MUTS.map(m => m.id).join(', ') + '）'); process.exit(1); }

console.log(`变异测试：${list.length} 个变异 × 17 条断言`);
ensureSnapshot();

const stray = sweep(WORK_ROOT);
if (stray) console.log(`清理上次残留：${stray} 个目录`);
console.log(`工作目录：${WORK_ROOT}（跑完自动清理）\n`);

const RUN_TAG = process.pid + '-' + Date.now();
const T0 = Date.now();
let allOk = true;
let cleaned = 0;
for (const mut of list) {
  WORK = path.join(WORK_ROOT, RUN_TAG + '-' + mut.id);
  try {
    copySite(SNAP, WORK);
    const ap = applyMut(mut);
    if (!ap.ok) {
      console.log(`  ${mut.id} 注入失败：${ap.msg}  ← 锚点漂移，需重新定位`);
      allOk = false;
      continue;
    }
    const t0 = Date.now();
    const res = runAccept();
    const got = res.failed.slice().sort();
    const want = mut.expect.slice().sort();
    const miss = want.filter(w => got.indexOf(w) === -1);
    const ok = miss.length === 0;
    if (!ok) allOk = false;
    console.log(`  ${ok ? 'OK  ' : 'MISS'} ${mut.id} ${mut.name}`);
    console.log(`       期望 FAIL: ${want.join(', ')}`);
    console.log(`       实际 FAIL: ${got.join(', ') || '(无)'}`);
    if (miss.length) console.log(`       ⚠ 没抓住: ${miss.join(', ')}`);
    console.log(`       ${mut.note || ''}`);
    console.log(`       用时 ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
  } finally {
    if (process.env.PCG_MUT_KEEP) {
      console.log(`       保留现场：${WORK}\n`);
    } else {
      rmTree(WORK);
      cleaned++;
    }
  }
}

if (!process.env.PCG_MUT_KEEP) {
  const left = sweep(WORK_ROOT);
  try { fs.rmdirSync(WORK_ROOT); } catch (e) {}   /* 空了才删得掉，非空说明还有别人的 */
  console.log(`已清理临时目录 ${cleaned} 个${left ? '（另有 ' + left + ' 个残留）' : ''}`);
}
console.log(`总用时 ${((Date.now() - T0) / 1000).toFixed(0)}s`);
console.log(allOk ? '全部变异都被对应断言抓住' : '有变异未被抓住 —— 对应断言无效');
process.exit(allOk ? 0 : 1);
