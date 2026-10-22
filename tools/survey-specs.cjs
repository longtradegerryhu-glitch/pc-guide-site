/* ORD-06 取证：统计各品类 specs 分号段数分布 + 每位置的高频段，用于推导字段清单 */
const fs = require('fs'), vm = require('vm'), path = require('path');
const SITE = path.resolve(__dirname, '..');
const c = { window: {} }; vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(SITE, 'js/models-data.js'), 'utf8'), c);
const M = c.window.PC_MODELS;

const IDS = ['cpu','mobo','ram','gpu','ssd','psu','case','cooler','monitor','input','network','stand','dock','laptop','phone','charger','mobileacc','tablet','earphone','audio','wearable'];

const out = [];
function w(s) { out.push(s); }

IDS.forEach(id => {
  const arr = M[id] || [];
  if (!arr.length) { w('## ' + id + '\n（空）\n'); return; }
  const segCount = {};
  let noSpecs = 0;
  const posMap = {};   // pos -> Map(token -> count)
  arr.forEach(it => {
    const s = String(it.specs || '').trim();
    if (!s) { noSpecs++; return; }
    const parts = s.split(/[;；]/).map(x => x.trim()).filter(Boolean);
    segCount[parts.length] = (segCount[parts.length] || 0) + 1;
    parts.forEach((p, i) => {
      // 归一化：数字替换为 #
      const k = p.replace(/\d+(\.\d+)?/g, '#').slice(0, 22);
      if (!posMap[i]) posMap[i] = new Map();
      posMap[i].set(k, (posMap[i].get(k) || 0) + 1);
    });
  });
  const dist = Object.entries(segCount).sort((a, b) => +a[0] - +b[0]);
  w('## ' + id + '  共 ' + arr.length + ' 款，无 specs ' + noSpecs + ' 款');
  w('段数分布: ' + dist.map(([n, k]) => n + '段×' + k).join('  '));
  const maxPos = Math.max.apply(null, Object.keys(posMap).map(Number));
  for (let i = 0; i <= Math.min(maxPos, 11); i++) {
    const m = posMap[i];
    if (!m) { w('  [' + i + '] —'); continue; }
    const top = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const tot = [...m.values()].reduce((a, b) => a + b, 0);
    w('  [' + i + '] n=' + tot + '  ' + top.map(([t, k]) => t + '×' + k).join(' | '));
  }
  w('');
});

fs.writeFileSync(path.join(SITE, 'reports/_specs-survey.txt'), out.join('\n'), 'utf8');
console.log('写出 reports/_specs-survey.txt，行数', out.length);
