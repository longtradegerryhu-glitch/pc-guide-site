/* 复现审计发现：SSD 搜 M.2 主体命中 0；并统计各品类规格词覆盖率 */
const fs = require('fs'), vm = require('vm'), path = require('path');
const SITE = path.resolve(__dirname, '..');
const c = { window: {} }; vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(SITE, 'js/models-data.js'), 'utf8'), c);
const M = c.window.PC_MODELS;
const L = [];
const w = s => L.push(s);

/* ---- 1. SSD 的 M.2 / SATA / U.2 分布 ---- */
const SSD = M.ssd || [];
const hit = { 'M.2': [], 'SATA': [], 'U.2': [], 'mSATA': [], 'PCIe': [] };
SSD.forEach(it => {
  const sp = String(it.specs || ''), vn = String(it.valueNote || ''), cp = String(it.compat || '');
  const nm = String(it.name || '') + ' ' + String(it.model || '');
  Object.keys(hit).forEach(k => {
    const re = new RegExp(k.replace('.', '\\.'), 'i');
    if (re.test(sp)) hit[k].push(it.id + ':specs');
    else if (re.test(vn) || re.test(cp)) hit[k].push(it.id + ':soft');
    else if (re.test(nm)) hit[k].push(it.id + ':name');
  });
});
w('## SSD ' + SSD.length + ' 款，接口词出现位置统计');
Object.keys(hit).forEach(k => {
  const a = hit[k];
  const g = { specs: 0, soft: 0, name: 0 };
  a.forEach(x => { const t = x.split(':')[1]; if (g[t] != null) g[t]++; });
  w('  ' + k.padEnd(7) + ' 总命中 ' + String(a.length).padStart(3) + '  specs主体 ' + String(g.specs).padStart(3) + '  soft ' + String(g.soft).padStart(3) + '  name ' + String(g.name).padStart(3));
});

w('');
w('## SSD 全部 53 条的形态判定（从 brand/model/name 推断）');
const form = { 'M.2（可从型号推断 NVMe/2280 等）': 0, 'SATA 2.5英寸': 0, '移动固态/其他': 0, '无法判断': 0 };
SSD.forEach(it => {
  const t = (it.model || '') + ' ' + (it.name || '') + ' ' + (it.specs || '');
  if (/移动|便携|USB|三防|IP\d/i.test(t)) form['移动固态/其他']++;
  else if (/SATA|2\.5|英寸/.test(t)) form['SATA 2.5英寸']++;
  else if (/M\.2|2280|2230|NVMe|PCIe/i.test(t)) form['M.2（可从型号推断 NVMe/2280 等）']++;
  else form['无法判断']++;
});
Object.entries(form).forEach(([k, v]) => w('  ' + k + ' → ' + v + ' 款'));

/* ---- 2. 各品类的「接口/形态」字段缺失情况 ---- */
w('');
w('## 各品类「接口/形态」硬规格在 specs 中的覆盖');
const PROBE = {
  cpu: [/AM[45]/, /LGA\s?\d+/, /BGA/],
  mobo: [/ATX|MATX|M-ATX|ITX|EATX|E-ATX/i],
  ram: [/DDR[345]/, /SO-?DIMM/i, /DIMM/],
  gpu: [/PCIe\s?[45]\.0/i],
  ssd: [/M\.2/, /SATA/, /U\.2/],
  psu: [/ATX\s?3/i, /SFX/i, /(20|24)\s?pin/i],
  case: [/ATX|MATX|M-ATX|ITX|EATX|E-ATX/i],
  cooler: [/AM[45]/, /LGA\s?\d+/],
  monitor: [/HDMI/, /DP|DisplayPort/i, /USB-?C/i],
  input: [/蓝牙/, /2\.4G/i, /有线/, /三模/],
  network: [/Wi-?Fi/i, /2\.5G/, /千兆/, /Mesh/],
  stand: [/VESA/i],
  dock: [/雷电|Thunderbolt/i, /USB\s?[34]/i, /HDMI/i],
  laptop: [/雷电|Thunderbolt/i, /USB-?[AC]/i, /HDMI/i],
  phone: [/IP\d\d/, /5G/],
  charger: [/PD\s?\d|PD\d/, /PPS/, /QC\d?/],
  mobileacc: [/MagSafe/i, /Qi2?/],
  tablet: [/USB-?C/i, /键盘/, /触控笔|手写笔/],
  earphone: [/蓝牙/, /LDAC|aptX|AAC|SBC|LC3/],
  audio: [/XLR|RCA|3\.5mm|光纤|同轴|蓝牙/i],
  wearable: [/蓝牙/, /eSIM/, /NFC/],
};
Object.keys(PROBE).forEach(id => {
  const arr = M[id] || [];
  if (!arr.length) return;
  PROBE[id].forEach(re => {
    const n = arr.filter(it => re.test(String(it.specs || ''))).length;
    const softN = arr.filter(it => !re.test(String(it.specs || '')) &&
      re.test(String(it.valueNote || '') + ' ' + String(it.compat || ''))).length;
    w('  ' + id.padEnd(10) + String(re).padEnd(28) + ' specs ' + String(n).padStart(3) + '/' + arr.length + '  仅软文本 ' + softN);
  });
});

fs.writeFileSync(path.join(SITE, 'reports/_iface-survey.txt'), L.join('\n'), 'utf8');
console.log('ok', L.length);
