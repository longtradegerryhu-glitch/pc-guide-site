/* specs 自由文本 → 结构化 specsObj 的唯一实现 · ORD-14 第 1 批
 *
 * 为什么要单独一个文件：
 *   tools/schema-dryrun.cjs 原本自带一套正则，只判「命中/未命中」，不取值；
 *   迁移需要取值。两套正则必然漂移 —— dryrun 说覆盖 53/53、迁移却填不出值，
 *   这种「闸说好、实现做不到」正是 ORD-11 反复返工的根因。
 *   所以这里的 RULES 是唯一实现：dryrun 的命中判定改为调用本模块的 derive()，
 *   两边数字由构造保证一致，不需要人工对账。
 *
 * 口径纪律（与本仓库既有规矩一致）：
 *   1. 只读 item.specs 的分号段，**不借 valueNote / compat**。
 *      compat 是采购建议（「配 Type-C 拓展坞」「配笔式支架」），
 *      把它当规格会直接造出假值 —— 实测 tablet 有 41 款 compat 含「笔」，
 *      其中 tb1/tb4/tb6 的原话是「配笔式支架」，与手写笔毫无关系。
 *   2. 推不出的字段一律留空（null），由调用方写进 specsMissing。
 *      不做「大概是 2.5 英寸」这种猜测：3 款 SATA 固态的 specs 只有接口没有尺寸，
 *      按猜测填 2.5 英寸能让覆盖率好看 3 个点，但那是假数据。
 *   3. 允许的推断只有一条，且必须写在这里：PCIe / NVMe 的消费级固态形态即 M.2。
 *      U.2 / AIC 极罕见且产品页一定会写明 U.2，所以先判 U.2 再判 M.2。
 *
 * 本轮范围：ssd 全字段、laptop.iface、tablet.keyboard / tablet.stylus。
 * 其余品类留第 3 批，不铺开。
 */

'use strict';

/* 每条规则 = { re, v(match, seg) }，按数组顺序取第一个命中。
   v 返回 null 表示「正则命中了但这一条拿不出值」，继续试下一条。 */
function num(s) {
  if (s == null) return null;
  const n = parseInt(String(s).replace(/,/g, ''), 10);
  return isFinite(n) ? n : null;
}

const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

const RULES = {
  ssd: {
    /* 品类内实测混入 3 块 3.5 英寸机械盘（sd24 紫盘 / sd25 酷狼 / sd26 Exos） */
    kind: [
      { re: /移动固态|便携固态/, v: () => '移动固态' },
      { re: /3\.5\s*英寸/, v: () => 'HDD' },
      { re: /\d{4}\s*rpm/i, v: () => 'HDD' },
      { re: /NAS\s*盘|监控盘|企业级/i, v: () => 'HDD' },
      { re: /TLC|QLC|MLC|PCIe|NVMe|SATA/i, v: () => 'SSD' }
    ],
    form: [
      { re: /U\.2/i, v: () => 'U.2' },
      { re: /mSATA/i, v: () => 'mSATA' },
      { re: /3\.5\s*英寸/, v: () => '3.5 英寸' },
      { re: /2\.5\s*英寸/, v: () => '2.5 英寸' },
      { re: /移动固态|便携固态/, v: () => '便携' },
      /* 唯一允许的推断：见文件头第 3 条 */
      { re: /PCIe|NVMe/i, v: () => 'M.2' }
    ],
    iface: [
      { re: /SATA/i, v: () => 'SATA' },
      { re: /USB\s*[\d.]/i, v: () => 'USB' },
      { re: /PCIe|NVMe/i, v: () => 'NVMe (PCIe)' }
    ],
    ifaceVer: [
      { re: /PCIe\s*5\.0/i, v: () => 'PCIe 5.0×4' },
      { re: /PCIe\s*4\.0/i, v: () => 'PCIe 4.0×4' },
      { re: /PCIe\s*3\.0/i, v: () => 'PCIe 3.0×4' },
      { re: /SATA\s*6/i, v: () => 'SATA 3.0' },
      { re: /USB\s*3\.2\s*Gen\s*2\s*[×x]\s*2/i, v: () => 'USB 3.2 Gen2×2' },
      { re: /USB\s*3\.2\s*Gen\s*2/i, v: () => 'USB 3.2 Gen2' }
    ],
    capacity: [
      { re: /(\d+(?:\.\d+)?)\s*TB/i, v: m => Math.round(parseFloat(m[1]) * 1000) },
      { re: /(\d+)\s*GB/i, v: m => num(m[1]) }
    ],
    nand: [
      { re: /\bTLC\b/i, v: () => 'TLC' },
      { re: /\bQLC\b/i, v: () => 'QLC' },
      { re: /\bMLC\b/i, v: () => 'MLC' }
    ],
    /* 顺序不能换：sd1 写的是「无独立缓存;HMB」，两条正则都能命中，HMB 更具体 */
    dram: [
      { re: /\bHMB\b/i, v: () => '无（HMB）' },
      { re: /无独立缓存|无缓/, v: () => '无' },
      { re: /独立缓存|有缓|DRAM|缓存/i, v: () => '有' }
    ],
    seqRead: [
      { re: /读\s*(?:速\s*)?([\d,]+)\s*MB\/s/i, v: m => num(m[1]) },
      { re: /([\d,]+)\s*MB\/s\s*读/i, v: m => num(m[1]) },
      { re: /([\d,]+)\s*\/\s*[\d,]+\s*MB\/s/i, v: m => num(m[1]) }
    ],
    seqWrite: [
      { re: /写\s*(?:速\s*)?([\d,]+)\s*MB\/s/i, v: m => num(m[1]) },
      { re: /[\d,]+\s*\/\s*([\d,]+)\s*MB\/s/i, v: m => num(m[1]) }
    ],
    tbw: [
      { re: /([\d,]+)\s*TBW/i, v: m => num(m[1]) },
      { re: /TBW\s*([\d,]+)/i, v: m => num(m[1]) }
    ],
    warranty: [
      { re: /(\d+)\s*年\s*[保质]/, v: m => num(m[1]) },
      /* vsd20x 批次写的是「5 年 600TBW」，年后面跟的是寿命不是「保」字。
         这是同一件事的另一种写法，不是新字段 —— 不加这条会漏 8 款。 */
      { re: /(\d+)\s*年\s*[\d,]+\s*TBW/i, v: m => num(m[1]) },
      { re: /([一二三四五六七八九十])\s*年\s*[保质]/, v: m => CN_NUM[m[1]] || null }
    ]
  },

  /* 79 款笔记本的 specs 是固定 5 段模板（CPU;内存;SSD;屏幕;重量），
     实测 0/79 含任何接口字样。这里保留规则是为了「接口一旦补进 specs 就能自动生效」，
     本轮它必然全部留空 —— 那是数据缺失，不是规则不足。 */
  laptop: {
    iface: [
      { re: /((?:\d+\s*[×x]\s*)?USB\s*[AC][\d.]*|雷电\s*[45]|Thunderbolt|HDMI\s*[\d.]*|RJ45|Type-?C)/i, v: m => m[1].trim() }
    ]
  },

  /* 66 款平板的 specs 同样不含笔/键盘信息。同理保留空规则。 */
  tablet: {
    stylus: [
      { re: /(?:支持|兼容|附赠|随机)\s*([^;；]*(?:手写笔|触控笔|Pencil|压感)[^;；]*)/i, v: m => m[1].trim() }
    ],
    keyboard: [
      { re: /(?:支持|兼容|附赠|随机)\s*([^;；]*(?:键盘|妙控)[^;；]*)/i, v: m => m[1].trim() }
    ]
  }
};

/* 本轮尝试迁移的字段（specsMissing 只列这些，不是整个品类的 schema 字段表）。
   其它品类的字段本轮不动，列进来会让 specsMissing 变成噪音。 */
const SCOPE = {
  ssd: ['kind', 'form', 'iface', 'ifaceVer', 'capacity', 'nand', 'dram', 'seqRead', 'seqWrite', 'tbw', 'warranty'],
  laptop: ['iface'],
  tablet: ['stylus', 'keyboard']
};

function segsOf(item) {
  return String((item && item.specs) || '')
    .split(/[;；]/)
    .map(s => s.trim())
    .filter(Boolean);
}

/* 单字段取值：逐段试所有规则，命中第一个能拿出值的即返回。
   整段试完没有值才返回 null —— 不在整串上试，避免跨段拼接造出假值。 */
function deriveField(catId, key, item) {
  const rules = RULES[catId] && RULES[catId][key];
  if (!rules) return null;
  const segs = segsOf(item);
  for (const r of rules) {
    for (const seg of segs) {
      const m = seg.match(r.re);
      if (!m) continue;
      const v = r.v(m, seg);
      if (v !== null && v !== undefined && v !== '') return v;
    }
  }
  return null;
}

/* 返回 { obj, missing }：obj 只放取到值的字段，missing 按 SCOPE 顺序列出空字段 */
function derive(catId, item) {
  const scope = SCOPE[catId];
  if (!scope) return { obj: null, missing: [] };
  const obj = {};
  const missing = [];
  scope.forEach(k => {
    const v = deriveField(catId, k, item);
    if (v === null || v === undefined || v === '') missing.push(k);
    else obj[k] = v;
  });
  return { obj: Object.keys(obj).length ? obj : null, missing };
}

module.exports = { RULES, SCOPE, derive, deriveField, segsOf };
