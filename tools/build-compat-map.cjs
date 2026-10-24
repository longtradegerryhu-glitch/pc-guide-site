/* 生成 js/compat-map.js —— 把 models-data.js 里 compat 文本已经写明的兼容边界结构化成 id → fit。
 *
 * 为什么是派生而不是编造：
 *   库里 1209 条模型全都没有 fit / fits / compatibleWith 字段，唯一带兼容语义的就是 compat，
 *   而 compat 里本来就写着「iPhone 17 专机专用」「MagSafe 系机型」「仅兼容 iPhone」
 *   这类硬边界。把它们抽成结构化映射，信息量没有增加，只是从自然语言变成可判定。
 *   这与 ORD-14「解析不出就留空 specsMissing、不填假值」是同一条原则。
 *
 * 为什么不能只靠 brand：
 *   brand 是「厂商归属」不是「适配归属」。库里有 4 件厂商与适配生态无关：
 *     ma21 罗技 Combo Touch（iPad 专用）、ma4 绿联磁吸壳（MagSafe）、
 *     pw23 Anker MagGo（iPhone）、pw16 Anker Lightning 线（iPhone 15 以下）。
 *
 * 为什么每条规则还要带「物类」：
 *   只按 compat 关键词判会误杀通用件 —— 「Anker 自拍杆」的 compat 写着
 *   「兼容 Type-C 与 Lightning」，照字面就是「苹果专用」，可它夹任何手机都能用。
 *   所以一条边界要同时满足：① compat 里写了专属关系 ② 这个物类物理上真的排他。
 *
 * 跑法：node tools/build-compat-map.cjs
 *       node tools/build-compat-map.cjs --check   # 只校验不写盘（幂等闸）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'js', 'compat-map.js');

/* ---------- 品牌写法归一 ----------
   同一家两种写法必须认（Apple / 苹果、Redmi / 红米），否则写「苹果」的那批能绕过对「Apple」的判定。
   子品牌不合并：iqoo 不并 vivo、redmi 不并 xiaomi、红魔不并努比亚 ——
   子品牌的壳/膜并不通用，合并会制造假的「同生态」。 */
const BRAND_ALIAS = {
  'apple': 'apple', '苹果': 'apple', '苹果公司': 'apple',
  'huawei': 'huawei', '华为': 'huawei', '华为智选': 'huawei',
  'samsung': 'samsung', '三星': 'samsung',
  'xiaomi': 'xiaomi', '小米': 'xiaomi',
  'redmi': 'redmi', '红米': 'redmi',
  'honor': 'honor', '荣耀': 'honor',
  'oppo': 'oppo', 'vivo': 'vivo', 'iqoo': 'iqoo',
  'oneplus': 'oneplus', '一加': 'oneplus', 'realme': 'realme',
  'lenovo': 'lenovo', '联想': 'lenovo',
  'zte': 'zte', '中兴': 'zte',
  'google': 'google', '谷歌': 'google',
  'anker': 'anker', '安克': 'anker',
  'ugreen': 'ugreen', '绿联': 'ugreen',
  'baseus': 'baseus', '倍思': 'baseus',
  'pisen': 'pisen', '品胜': 'pisen',
  'zmi': 'zmi', '紫米': 'zmi',
  'asus': 'asus', '华硕': 'asus',
  'msi': 'msi', '微星': 'msi',
  'gigabyte': 'gigabyte', '技嘉': 'gigabyte',
  'asrock': 'asrock', '华擎': 'asrock'
};

function ecoOfBrand(brand) {
  const b = String(brand || '').trim();
  if (!b) return 'other';
  const k = b.toLowerCase();
  if (BRAND_ALIAS[k]) return BRAND_ALIAS[k];
  if (BRAND_ALIAS[b]) return BRAND_ALIAS[b];
  /* 表外归 other，绝不返回空 —— 空等于不设防（红魔/努比亚那次就是因为空） */
  return k;
}

/* 本体品类：手机 / 平板 / 笔记本是「被配的对象」，不是配件，不参与 fit */
const BODY_CATS = { phone: 1, tablet: 1, laptop: 1 };

/* ---------- 硬边界规则 ----------
   boundary：compat / specs / model 里必须出现的关系描述
   kinds   ：这个物类必须物理排他（防「自拍杆写了兼容 Lightning 就被当成苹果专用」）
   顺序即优先级。scope 为空 = 不限本体品类。 */
const HARD = [
  {
    boundary: /iPhone\s*\d+\s*专机专用|iPhone\s*专机专用/,
    kinds: /保护壳|保护套|壳/, eco: 'apple', scope: ['phone'], why: 'iPhone 机型专用开孔'
  },
  {
    boundary: /仅兼容\s*iPhone|仅\s*iPhone/i,
    kinds: /手表|手环|Watch/i, eco: 'apple', scope: ['phone'], why: '只能配 iPhone（安卓机配对不上）'
  },
  {
    boundary: /MagSafe/i,
    kinds: /保护壳|保护套|充电宝|移动电源/, eco: 'apple', scope: ['phone'], why: 'MagSafe 磁吸定位（别的机型吸不住）'
  },
  {
    boundary: /Lightning[^。；]*(专用|以下机型)/,
    kinds: /线/, eco: 'apple', scope: ['phone'], why: 'Lightning 接口（安卓机插不进）'
  },
  {
    /* pw16 的 compat 写「iPhone 15 以下机型专用」，Lightning 只在名字里 —— 两条都要认 */
    boundary: /以下机型专用/, kinds: /线/, eco: 'apple', scope: ['phone'], why: 'Lightning 接口（安卓机插不进）'
  },
  {
    boundary: /iPad\s*全系|仅支持\s*iPad\s*与\s*Mac|iPad\s*需配/i,
    kinds: /键盘|触控板|Trackpad|Pencil|手写笔|触控笔/, eco: 'apple', scope: ['tablet', 'laptop'], why: 'iPad / Mac 专用'
  },
  {
    boundary: /华为\s*MatePad\s*系列/i,
    kinds: /键盘|手写笔|触控笔/, eco: 'huawei', scope: ['tablet'], why: '华为 MatePad 专用'
  },
  {
    boundary: /Galaxy\s*Tab\s*系列/i,
    kinds: /键盘|书 Cover|Book Cover/, eco: 'samsung', scope: ['tablet'], why: '三星 Galaxy Tab 专用'
  },
  {
    boundary: /小米平板\s*\d/i,
    kinds: /手写笔|触控笔|键盘/, eco: 'xiaomi', scope: ['tablet'], why: '小米平板专用'
  },
  {
    boundary: /仅适合\s*iPhone|iPhone\s*轻充/,
    kinds: /充电器|充电头/, eco: 'apple', scope: ['phone'], why: '苹果原装充电头（安卓机不认它的协议）'
  },
  {
    boundary: /华为设备专机专用/,
    kinds: /充电器|充电头/, eco: 'huawei', scope: null, why: '华为原装头（私有快充协议）'
  },
  /* Apple Watch：compat 有的写「仅兼容 iPhone」，有的写「苹果生态」，有的只写
     「需自购充电器」（wr217）—— 三种写法同一条边界。这里不信 compat 写法，
     按「厂商=苹果 且 物类=手表」判：这不是拿厂商当适配方，而是这一物类的既定事实 ——
     每一块 Apple Watch 都只能配 iPhone，没有例外型号。 */
  {
    brandEco: 'apple',
    kinds: /手表|手环|Watch/i, eco: 'apple', scope: ['phone'], why: 'Apple Watch 只能配 iPhone（安卓机配对不上）'
  },
  /* 「专机专用」没写品牌时，原装件的适配方就是厂商自己 —— brand 唯一可信的场合 */
  {
    boundary: /专机专用/,
    kinds: /充电器|充电头|充电宝/, eco: '@brand', scope: null, why: '原装专机专用'
  }
];

/* 软边界：装得上但功能打折 —— 只提示，不排除。
   典型：AirPods 在安卓上能听歌但不能用空间音频/自动切换。 */
const SOFT = /功能受限|需手动开启|需较新|观感统一|功能缩减|跨平台可用/;

function main() {
  const checkOnly = process.argv.indexOf('--check') > -1;
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'models-data.js'), 'utf8'), ctx);
  const M = ctx.window.PC_MODELS;

  const fit = {};
  const soft = {};
  const rows = [];
  let total = 0;

  Object.keys(M).forEach(cat => {
    if (BODY_CATS[cat]) return;
    (M[cat] || []).forEach(it => {
      total++;
      const compat = String(it.compat || '');
      const specTxt = String(it.specs || '') + ' ' + String(it.model || '') + ' ' + String(it.name || '');
      const kind = String(it.style || '') + ' ' + String(it.name || '') + ' ' + String(it.model || '');
      for (const r of HARD) {
        if (!r.kinds.test(kind)) continue;
        if (r.brandEco) {
          if (ecoOfBrand(it.brand) !== r.brandEco) continue;
        } else if (!r.boundary.test(compat) && !r.boundary.test(specTxt)) continue;
        const eco = r.eco === '@brand' ? ecoOfBrand(it.brand) : r.eco;
        if (!eco || eco === 'other') continue;
        fit[it.id] = { eco: eco, scope: r.scope, why: r.why };
        rows.push([cat, it.id, it.brand, it.name, eco, r.scope ? r.scope.join('+') : '不限', r.why]);
        return;
      }
      if (SOFT.test(compat)) soft[it.id] = compat;
    });
  });

  /* 品牌表必须覆盖全库每一个 brand（一条不漏），表外归 other */
  const brands = [];
  const seen = {};
  Object.keys(M).forEach(cat => (M[cat] || []).forEach(it => {
    const b = String(it.brand || '').trim();
    if (b && !seen[b]) { seen[b] = 1; brands.push(b); }
  }));
  brands.sort();

  const lines = [];
  lines.push('/* 由 tools/build-compat-map.cjs 从 js/models-data.js 的 compat 文本派生生成，勿手改。');
  lines.push(' * 重跑：node tools/build-compat-map.cjs   （--check 只校验不写盘）');
  lines.push(' * 口径：只收「物理上装不到别的机器」的边界；功能打折的进 SOFT，只提示不排除。 */');
  lines.push('(function (w) {');
  lines.push('  /* 品牌 → 生态：' + brands.length + ' 个品牌全覆盖，表外归 other（绝不返回空） */');
  lines.push('  w.PC_ECO_BRAND = {');
  brands.forEach(b => { lines.push('    ' + JSON.stringify(b) + ': ' + JSON.stringify(ecoOfBrand(b)) + ','); });
  lines.push('  };');
  lines.push('  /* id → { eco, scope, why }：scope 为空表示不限本体品类 */');
  lines.push('  w.PC_COMPAT_MAP = {');
  rows.forEach(r => {
    const v = fit[r[1]];
    lines.push('    ' + JSON.stringify(r[1]) + ': { eco: ' + JSON.stringify(v.eco) +
      ', scope: ' + (v.scope ? JSON.stringify(v.scope) : 'null') +
      ', why: ' + JSON.stringify(v.why) + ' },');
  });
  lines.push('  };');
  lines.push('  /* 软边界：装得上但功能打折，页面提示、不排除 */');
  lines.push('  w.PC_COMPAT_SOFT = {');
  Object.keys(soft).forEach(id => { lines.push('    ' + JSON.stringify(id) + ': ' + JSON.stringify(soft[id]) + ','); });
  lines.push('  };');
  lines.push('})(window);');
  const out = lines.join('\n') + '\n';

  const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (checkOnly) {
    if (old !== out) { console.error('compat-map.js 与源数据不一致，请重跑 node tools/build-compat-map.cjs'); process.exit(1); }
    console.log('compat-map.js 与 models-data.js 一致（幂等）');
  } else {
    fs.writeFileSync(OUT, out, 'utf8');
  }

  console.log('配件条目 ' + total + ' · 品牌 ' + brands.length + ' · 硬边界 ' + rows.length + ' 件 · 软边界 ' + Object.keys(soft).length + ' 件');
  console.log('硬边界明细：');
  rows.forEach(r => console.log('  [' + r[0] + '] ' + r[1] + ' | ' + r[2] + ' | ' + r[3] + ' → eco=' + r[4] + ' scope=' + r[5] + ' :: ' + r[6]));
  console.log('软边界明细：');
  Object.keys(soft).forEach(id => console.log('  ' + id + ' :: ' + soft[id]));
}

main();
