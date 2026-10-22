/* 重建 models.js：拆分电源/机箱 + 合入三大件 + 合入扩充数据
 *
 * 本文件是 rebuild2.js 的入库版本（ORD-08 要求「闸门代码必须在版本库里」）。
 * 站点目录自动取本文件的上一级；原始数据（models.backup.js / new_*.js / plus_*.js）
 * 不在版本库，用 PCG_DATA_DIR 指向，默认 ../_test。查重闸直接调同目录的 dedup-gate.cjs，
 * 保证「闸算的」与「页面合并卡显示的」是同一份口径（js/dup-core.js）。
 */
const fs = require('fs');
const path = require('path');
/* 站点目录与流水线目录都可覆盖：换机器/换目录时不用改脚本 */
const SITE_DIR = process.env.PCG_SITE || path.resolve(__dirname, '..');
const SRC_DIR = process.env.PCG_DATA_DIR || path.resolve(SITE_DIR, '..', '_test');
const vm = require('vm');

const P = path.join(SITE_DIR, 'js', 'models-data.js');
// 源固定取原始备份，保证脚本可反复执行而不会叠加
const SRC = path.join(SRC_DIR, 'models.backup.js');
const src = fs.readFileSync(SRC, 'utf8');

// 1. 现有数据
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const M = ctx.window.PC_MODELS;

// 2. 拆分 psu
const psuOnly = M.psu.filter(x => !String(x.style).includes('机箱'));
const caseOnly = M.psu.filter(x => String(x.style).includes('机箱'));

// 3. 新品类
function loadArr(f) {
  if (!fs.existsSync(f)) { console.log('  (缺) ' + f); return []; }
  return vm.runInNewContext('(' + fs.readFileSync(f, 'utf8').trim() + ')', {});
}
const mobo = loadArr(SRC_DIR + '/new_mobo.js');
const ram = loadArr(SRC_DIR + '/new_ram.js');
const ssd = loadArr(SRC_DIR + '/new_ssd.js');
const laptop = loadArr(SRC_DIR + '/new_laptop.js');
const phone = loadArr(SRC_DIR + '/new_phone.js');
const tablet = loadArr(SRC_DIR + '/new_tablet.js');
const charger = loadArr(SRC_DIR + '/new_power.js');
const mobileacc = loadArr(SRC_DIR + '/new_mobile_acc.js');
const earphone = loadArr(SRC_DIR + '/new_earphone.js');
// audio 里混放的耳机条目迁到 earphone：原始 audio 与 ext.audio 都要过判定，
// 判定依据是 style 含「耳机/头戴」；便携音箱、桌面音箱、麦克风留在 audio。
const isHeadphone = x => /耳机|头戴/.test(String(x.style));
const splitAudio = list => {
  const hp = [], sp = [];
  (list || []).forEach(x => { (isHeadphone(x) ? hp : sp).push(x); });
  return { hp: hp, sp: sp };
};
const wearable = loadArr(SRC_DIR + '/new_wearable.js');

// 4. 扩充（第二轮 plus_* 为后加的批次，合并顺序对结果无影响）
const ext = {};
['extend1', 'extend2', 'extend3', 'extend4', 'extend5',
 'plus_coreA', 'plus_coreB', 'plus_gpu', 'plus_thermal', 'plus_input', 'plus_periph', 'plus_cooler',
 'plus_2026q4', 'plus_2026mobile', 'plus_2026av', 'plus_2026pc', 'plus_2026core',
 'plus_2026mb'].forEach(n => {
  const p = SRC_DIR + '/' + n + '.js';
  if (!fs.existsSync(p)) { console.log('  (缺) ' + n); return; }
  const mod = require(p);
  Object.keys(mod).forEach(k => { ext[k] = (ext[k] || []).concat(mod[k]); });
});

// 5. 组装
const ORDER = [
  ['cpu', 'CPU'], ['mobo', '主板'], ['ram', '内存'], ['gpu', '显卡'],
  ['ssd', '固态硬盘'], ['psu', '电源'], ['case', '机箱'], ['cooler', '散热器'],
  ['monitor', '显示器'], ['input', '键鼠外设'], ['audio', '音箱与麦克风'],
  ['network', '网络设备'], ['stand', '支架'], ['dock', '拓展坞'], ['laptop', '笔记本电脑'],
  ['phone', '手机'], ['tablet', '平板'], ['charger', '充电与供电'], ['mobileacc', '手机与平板配件'],
  ['earphone', '耳机与耳麦'], ['wearable', '智能穿戴与配套']
];
const data = {};
ORDER.forEach(([k]) => {
  if (k === 'psu') data[k] = psuOnly.concat(ext.psu || []);
  else if (k === 'case') data[k] = caseOnly.concat(ext.case || []);
  else if (k === 'mobo') data[k] = mobo.concat(ext.mobo || []);
  else if (k === 'ram') data[k] = ram.concat(ext.ram || []);
  else if (k === 'ssd') data[k] = ssd.concat(ext.ssd || []);
  else if (k === 'laptop') data[k] = laptop.concat(ext.laptop || []);
  else if (k === 'phone') data[k] = phone.concat(ext.phone || []);
  else if (k === 'tablet') data[k] = tablet.concat(ext.tablet || []);
  else if (k === 'charger') data[k] = charger.concat(ext.charger || []);
  else if (k === 'mobileacc') data[k] = mobileacc.concat(ext.mobileacc || []);
  else if (k === 'earphone') {
    const src = splitAudio(M.audio), extSp = splitAudio(ext.audio);
    const migrated = src.hp.concat(extSp.hp);   // 保留原 id，榜单条目才能继续对上
    data[k] = earphone.concat(migrated).concat(ext.earphone || []);
  }
  else if (k === 'wearable') data[k] = wearable.concat(ext.wearable || []);
  else if (k === 'audio') {
    const src = splitAudio(M.audio), extSp = splitAudio(ext.audio);
    data[k] = src.sp.concat(extSp.sp);
  }
  else data[k] = (M[k] || []).concat(ext[k] || []);
});

// 6. 入库查重闸
//    只查 id 不够 —— 同一型号两条记录 id 往往不同（u4 vs vc204），历史上 49 组就是这么做进去的。
//    闸的实现就是同目录的 dedup-gate.cjs，口径内核是 js/dup-core.js（页面合并卡同一份）。
//    这里不再本地实现，避免"闸算的"和"页面显示的"两套口径。
const gate = require('./dedup-gate.cjs');
/* specsObj 的派生规则与 tools/derive-specs-obj.cjs 是同一份（tools/specs-derive.cjs）。
   写在这里是为了让「单独跑 rebuild」也不丢 specsObj —— 只靠 npm run data:rebuild 串联
   的话，谁直接跑一次 rebuild-models.cjs 就会静默把结构化字段冲掉。 */
const SD = require('./specs-derive.cjs');

const FORCE = process.argv.includes('--force') || process.argv.includes('-f');

let idDupIds = [];
const allIds = new Set();
ORDER.forEach(([k]) => (data[k] || []).forEach(x => {
  if (allIds.has(x.id)) idDupIds.push(x.id + '@' + k);
  allIds.add(x.id);
}));

/* 存量 vs 增量：
   基线不写死在 json 里，直接取仓库当前的 models-data.js —— 这份数据就是"已上线的现状"。
   好处：数据被清理后基线自动收窄到 0，不需要谁记得去改一个基线文件；
        谁把老重复删了、谁又添了新的，闸门都按事实算。
   闸只拦"新增"碰撞，否则一装就把现有流程永久堵死 —— 那不是闸，是路障。 */
const core = gate.loadCore();
const oldModels = fs.existsSync(P) ? gate.loadModels(P) : {};
const inc = gate.incremental(oldModels, data, core);
const cur = gate.scan(data, core);

const freshKeys = new Set(inc.newKeys.map(x => x.key).concat(inc.grown.map(x => x.key)));
const fresh = cur.detail.filter(g => freshKeys.has(g.key));
const known = cur.detail.filter(g => !freshKeys.has(g.key));

console.log('[闸门] 本次产物：' + cur.total + ' 条 / ' + cur.groups + ' 组重复 / 冲突 ' + cur.conflict + ' 组');
if (known.length) {
  console.log('[闸门] 存量重复 ' + known.length + ' 组（当前已上线数据本就有，放行；需另行去重）');
}

if (fresh.length || idDupIds.length) {
  console.log('');
  console.log('[闸门] 检出新增碰撞 ' + fresh.length + ' 组' + (idDupIds.length ? ' + id 重复 ' + idDupIds.length + ' 条' : ''));
  if (idDupIds.length) console.log('  id 重复：' + idDupIds.join(', '));

  fresh.forEach(g => {
    console.log('  ── key=' + g.key);
    g.ids.forEach((id, i) => {
      console.log('     写入: ' + id + '  price=[' + g.ranges[i][0] + ',' + g.ranges[i][1] + ']');
    });
    if (g.conflict) {
      console.log('     类型: 价格区间不重叠（倍率 ' + g.ratio + '×）→ 大概率是两条真信息，请核对后合并入库');
    } else {
      console.log('     类型: 归一化后同键（原始写法可能不同）');
      console.log('     提示: 若确为不同型号（容量/版本差异），请把差异写进 model 字段后重试');
    }
  });

  if (FORCE) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  ⚠  --force 已启用：强制写入，产物含重复条目            ║');
    console.log('║  ⚠  该产物禁止上线，仅供排查使用                        ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
  } else {
    console.error('');
    console.error('[闸门] 拒绝写入：入库查重未通过。确认要覆盖请加 --force。');
    process.exit(1);
  }
}

// 7. 生成
const q = JSON.stringify;
const A = a => '[' + (a || []).map(q).join(', ') + ']';
const fmtWith = catId => it => {
  const d = SD.derive(catId, it);
  const objTxt = d.obj ? ', specsObj: ' + JSON.stringify(d.obj) : '';
  const misTxt = d.missing.length ? ', specsMissing: ' + JSON.stringify(d.missing) : '';
  return '    { id: ' + q(it.id) + ', brand: ' + q(it.brand) + ', model: ' + q(it.model) +
    ', name: ' + q(it.name) + ', searchName: ' + q(it.searchName) + ', style: ' + q(it.style) +
    ', price: [' + it.price[0] + ', ' + it.price[1] + '], rating: ' + it.rating +
    ', valueGrade: ' + q(it.valueGrade) + ', valueNote: ' + q(it.valueNote) +
    ', use: ' + A(it.use) + ', audience: ' + A(it.audience) + ', tags: ' + A(it.tags) +
    ', specs: ' + q(it.specs) + objTxt + misTxt + ', compat: ' + q(it.compat) + ' },';
};

let total = 0, body = 'window.PC_MODELS = {\n';
ORDER.forEach(([k, label], idx) => {
  body += '  /* ---------- ' + label + ' ---------- */\n  ' + k + ': [\n' + data[k].map(fmtWith(k)).join('\n') + '\n  ]' + (idx === ORDER.length - 1 ? '\n' : ',\n\n');
  total += data[k].length;
});
body += '};\n';

const start = src.indexOf('window.PC_MODELS = {');
const endMark = '\n};\n';
const end = src.indexOf(endMark, start);
if (start < 0 || end < 0) { console.error('ABORT 定位失败'); process.exit(1); }
/* 写文件时保持目标文件原有的行尾。
   原文件是 CRLF，若统一写成 LF，git 会把整文件标记为修改（git diff 为空但 status 变脏），
   每次重建都要手工恢复行尾。 */
function writeKeepEol(file, content) {
  let eol = '\n';
  if (fs.existsSync(file)) {
    const head = fs.readFileSync(file, 'latin1');
    if (head.includes('\r\n')) eol = '\r\n';
  }
  const normalized = content.replace(/\r\n/g, '\n');
  fs.writeFileSync(file, eol === '\n' ? normalized : normalized.replace(/\n/g, '\r\n'), 'utf8');
}

// 只保留文件头注释 + 型号库；topList 及之后的颜值数据归 models.js，不写进本文件
writeKeepEol(P, src.slice(0, start) + body);
// 同时把 models.js 回写到基线（topList + 颜值数据），保证本脚本可反复执行
const P_BASE = path.join(SITE_DIR, 'js', 'models.js');
writeKeepEol(P_BASE, src.slice(0, start) + src.slice(end + endMark.length));

console.log('\n重建完成：' + total + ' 款，存量重复 ' + known.length + ' 组（放行），新增碰撞 ' + fresh.length + ' 组');
if (cur.groups > 0) {
  console.log('⚠ 本文件是「中间态」：models.js 的榜单已回写到基线（' + (M.topList || []).length + ' 条），');
  console.log('  必须继续跑 build_models.js 的后续榜单步骤才会回到 251 条。单独跑本脚本会留下不完整产物。');
}
console.log(ORDER.map(([k]) => k + ':' + data[k].length).join('  '));
