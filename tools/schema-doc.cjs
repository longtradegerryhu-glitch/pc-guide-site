/* 从 js/specs-schema.js 生成人读的 21 品类字段清单，避免手抄与定义脱节 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = path.resolve(__dirname, '..');
const c = { window: {} }; vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(SITE, 'js/specs-schema.js'), 'utf8'), c);
const S = c.window.PC_SCHEMA;

/* 取 dry-run 实测覆盖率（JSON 精确到 catId.key，避免跨品类同名 key 串号） */
const covPath = path.join(SITE, 'reports/specs-parse-coverage.json');
const cov = fs.existsSync(covPath) ? JSON.parse(fs.readFileSync(covPath, 'utf8')) : {};

const ORDER = ['cpu','mobo','ram','gpu','ssd','psu','case','cooler','monitor','input','network','stand','dock','laptop','phone','charger','mobileacc','tablet','earphone','audio','wearable'];
const TYPE_CN = { num: '数值', enum: '枚举', bool: '布尔', text: '文本' };

const L = [];
L.push('# 21 品类 specs 字段清单（ORD-06 第 0 批定义稿）');
L.push('');
L.push('> 机器可读定义：`js/specs-schema.js`（`window.PC_SCHEMA`）。本文件由 `node tools/schema-doc.cjs` 生成，**勿手改**。');
L.push('> 状态：第 1 批已接线（ORD-14）。定义在本文件，解析在 `tools/specs-derive.cjs`，产物写进 `js/models-data.js` 的 `specsObj`，搜索与第 4 批对比表读同一份。');
L.push('');
L.push('**排序原则**：按用户选购决策顺序 —— 硬约束（装不装得上）→ 性能 → 体验 → 外观。');
L.push('不是按现有 specs 的分号位置排。现有位置实测不可用：显示器 3~12 段不定长，拓展坞 1~9 段，按索引对齐必然把「亮度」和「噪音」排进同一行。');
L.push('');
L.push('**列含义**');
L.push('');
L.push('| 列 | 含义 |');
L.push('|---|---|');
L.push('| 类型 | 数值=可比较排序；枚举=可分组筛选；布尔=可开关；文本=仅展示不参与对比 |');
L.push('| 必填 | ☆ 表示批次一必须补齐 |');
L.push('| 来源 | `解析` = 现有 specs 文本能抽出来；`补录` = 现库没有，必须外部核验 |');
L.push('| 实测 | dry-run 在真实数据上的硬命中数（分子=命中，分母=该品类款数）。空=该品类未纳入必填低覆盖清单 |');
L.push('| 搜索词 | 该字段补上后应当能响应的查询。**这一列是本次 schema 的重点**：字段存在但用户搜不到，等于没做 |');
L.push('');
L.push('---');
L.push('');

let tot = 0, totReq = 0, totD = 0, totM = 0;
ORDER.forEach(id => {
  const cat = S.cats[id];
  if (!cat) { L.push('## ' + id + '（定义缺失）'); L.push(''); return; }
  const fs2 = cat.fields;
  const req = fs2.filter(f => f.r === 1).length;
  const der = fs2.filter(f => f.d === 'derive').length;
  tot += fs2.length; totReq += req; totD += der; totM += fs2.length - der;

  L.push('## ' + cat.label + '（`' + id + '`）');
  L.push('');
  L.push('字段 ' + fs2.length + ' 个 · 必填 ' + req + ' · 可解析 ' + der + ' · 须补录 ' + (fs2.length - der));
  L.push('');
  L.push('| # | 字段 | 键名 | 类型 | 单位 | 必填 | 示例值 | 来源 | 实测 | 搜索词 |');
  L.push('|---|---|---|---|---|---|---|---|---|---|');
  fs2.forEach((f, i) => {
    const enumTxt = f.e ? f.e.slice(0, 4).join(' / ') + (f.e.length > 4 ? ' …' : '') : (f.open ? '开放枚举' : '');
    const unit = f.t === 'num' ? (f.u || '—') : (enumTxt || '—');
    L.push('| ' + (i + 1) + ' | ' + f.n + ' | `' + f.k + '` | ' + TYPE_CN[f.t] +
      ' | ' + unit + ' | ' + (f.r ? '☆' : '') + ' | ' + (f.ex || '') +
      ' | ' + (f.d === 'derive' ? '解析' : '**补录**') +
      ' | ' + (cov[id + '.' + f.k] ? cov[id + '.' + f.k].hit + '/' + cov[id + '.' + f.k].total : '') +
      ' | ' + (f.s ? f.s.join(' / ') : '') + ' |');
  });
  L.push('');
});

L.push('---');
L.push('');
L.push('## 汇总');
L.push('');
L.push('| 项 | 数量 |');
L.push('|---|---|');
L.push('| 品类 | 21 |');
L.push('| 字段总数 | ' + tot + ' |');
L.push('| 必填字段 | ' + totReq + ' |');
L.push('| 可从现有 specs 解析 | ' + totD + ' |');
L.push('| 必须外部核验补录 | ' + totM + ' |');
L.push('| 带搜索词映射的字段 | ' + Object.keys(S.cats).reduce((a, k) => a + S.cats[k].fields.filter(f => f.s).length, 0) + ' |');
L.push('');
L.push('## 与旧结构的关系');
L.push('');
L.push('旧结构是 `specs: "分号分隔的自由文本"`。新结构是 `specsObj: {字段: 值}`，**原 specs 字符串保留**用于降级显示。');
L.push('两者不是替代关系，是「机器读的」与「人读的」并存 —— 详见 `reports/specs-migration-plan.md`。');
L.push('');

fs.writeFileSync(path.join(SITE, 'reports/specs-schema.md'), L.join('\n'), 'utf8');
console.log('写出 reports/specs-schema.md，字段合计', tot, '必填', totReq, '可解析', totD, '须补录', totM);
