/* 断言自测（变异测试）—— 验证审计脚本真的能抓到污染
 *
 * 跑法：node tests/selftest-mutation.cjs
 * 退出码：0 全部变异都被抓到 / 1 有变异漏检（说明断言失效）
 *
 * 为什么需要这个：
 *   一个只会"跑一遍全绿"的审计脚本，无法证明它有效。必须注入已知污染，
 *   确认对应断言变成 FAIL，才能说它真的在把关。
 *
 * 每个用例做两件事：
 *   1. 构造一份被污染的数据
 *   2. 断言「目标断言项 ok === false」，且其他断言不受牵连
 */

'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { runChecks, dupStats } = require('./lib/checks.cjs');

const ROOT = path.resolve(__dirname, '..') + path.sep;

/* 读真实数据作为干净基线 */
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(ROOT + 'js/data.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(ROOT + 'js/models-data.js', 'utf8'), ctx);
const CLEAN = ctx.window.PC_MODELS;
const clone = () => JSON.parse(JSON.stringify(CLEAN));

/* 干净探针：让搜索类断言全部通过（selftest 不依赖 jsdom） */
const cleanProbe = async (q) => {
  if (q === '5070 Ti') return { n: 23, main: 8, soft: 15 };
  return { n: 24, main: 18, soft: 6 };
};

/* 被污染的探针：模拟"过滤垃圾"规则误杀规格词（主体全被折叠） */
const killingProbe = async (q) => {
  if (q === '5070 Ti') return { n: 23, main: 8, soft: 15 };
  return { n: 24, main: 0, soft: 24 };   // ← 规格词主体 0，正是要抓的退化
};

let pass = 0, fail = 0;
function expectDetected(name, items, targetId) {
  const it = items.find(x => x.id === targetId);
  if (!it) { fail++; console.log(`  FAIL ${name} :: 找不到断言项 ${targetId}`); return; }
  if (it.ok === false) { pass++; console.log(`  PASS ${name} → ${targetId} 正确 FAIL（实测 ${JSON.stringify(it.actual)}，基线 ${JSON.stringify(it.base)}）`); }
  else { fail++; console.log(`  FAIL ${name} :: ${targetId} 竟然 PASS（实测 ${JSON.stringify(it.actual)}）—— 断言失效`); }
}
function expectClean(name, items, targetId) {
  const it = items.find(x => x.id === targetId);
  if (!it) { fail++; console.log(`  FAIL ${name} :: 找不到断言项 ${targetId}`); return; }
  if (it.ok === true) { pass++; console.log(`  PASS ${name} → ${targetId} 为 PASS（实测 ${JSON.stringify(it.actual)}）`); }
  else { fail++; console.log(`  FAIL ${name} :: 干净数据下 ${targetId} 竟然 FAIL（实测 ${JSON.stringify(it.actual)}）`); }
}

(async () => {
  console.log('== 用例 0：干净数据应全绿（对照组）==');
  {
    const r = await runChecks({ models: clone(), searchProbe: cleanProbe });
    const bad = r.items.filter(x => !x.ok);
    if (bad.length === 0) { pass++; console.log(`  PASS 干净数据 ${r.items.length} 项全 PASS`); }
    else { fail++; console.log('  FAIL 干净数据仍有 FAIL：' + bad.map(x => x.id).join(', ')); }
  }

  console.log('\n== 用例 1：同型号注入第 3 条（组数不变，条数 +1）==');
  {
    const m = clone();
    console.log('  注入前:', JSON.stringify(dupStats(m)));
    m.cpu.push({ id: 'MUT_DUP3', brand: 'AMD', model: 'Ryzen 5 9600X', name: 'AMD Ryzen 5 9600X', price: [1200, 1400], specs: '6核12线程;AM5;65W' });
    const d = dupStats(m);
    console.log('  注入后:', JSON.stringify(d));
    const r = await runChecks({ models: m, searchProbe: cleanProbe });
    expectDetected('第 3 条被"重复条目总数"抓到', r.items, 'dup:extra');
    expectDetected('第 3 条被"单型号最多出现次数"抓到', r.items, 'dup:max');
    /* 反向确认：这就是旧断言漏检的场景 —— 组数没变 */
    if (d.groups === 49) { pass++; console.log('  PASS 对照组：组数仍为 49（证明旧断言 dup:groups 会漏检，新断言补上了）'); }
    else { fail++; console.log('  FAIL 组数异常变为 ' + d.groups); }
  }

  console.log('\n== 用例 2：新增一个全新重复组（同型号写两种大小写）==');
  {
    const m = clone();
    m.gpu.push({ id: 'MUT_DUP_A', brand: 'NVIDIA', model: 'RTX 9999 24G', name: 'NVIDIA RTX 9999 24G', price: [9000, 9800], specs: '24GB;384bit' });
    m.gpu.push({ id: 'MUT_DUP_B', brand: 'nvidia', model: 'rtx  9999 24g', name: 'NVIDIA RTX 9999 24G', price: [9000, 9800], specs: '24GB;384bit' });
    const r = await runChecks({ models: m, searchProbe: cleanProbe });
    expectDetected('归一化能识别大小写/空格差异', r.items, 'dup:groups');
  }

  console.log('\n== 用例 3：注入价格区间完全不重叠 ==');
  {
    const m = clone();
    /* 找一组现有重复，把其中一条价格改到与原区间不相交 */
    const d0 = dupStats(m);
    const target = d0.detail.find(g => g.n === 2);
    if (!target) { fail++; console.log('  FAIL 找不到可用于改造的重复组'); }
    else {
      const [cat, brand, model] = target.key.split('|');
      const arr = m[cat];
      const idx = arr.findIndex(x => String(x.id) === String(target.ids[1]));
      console.log('  改造对象:', target.key, '→', arr[idx].id, '原价', JSON.stringify(arr[idx].price));
      arr[idx].price = [arr[idx].price[1] * 5, arr[idx].price[1] * 6];
      const r = await runChecks({ models: m, searchProbe: cleanProbe });
      expectDetected('价格冲突组被计数', r.items, 'dup:price');
    }
  }

  console.log('\n== 用例 4：注入 model 为数字 ==');
  {
    const m = clone();
    m.earphone[0].model = 12345;
    const r = await runChecks({ models: m, searchProbe: cleanProbe });
    expectDetected('model 类型检查', r.items, 'model:type');
  }

  console.log('\n== 用例 5：模拟"过滤垃圾"规则误杀规格词 ==');
  {
    const r = await runChecks({ models: clone(), searchProbe: killingProbe });
    expectDetected('规格词主体归零被抓', r.items, 'spec:ATX3.1');
    expectDetected('规格词主体归零被抓（GDDR7）', r.items, 'spec:GDDR7');
    expectDetected('规格词主体归零被抓（360水冷）', r.items, 'spec:360水冷');
  }

  console.log('\n== 用例 6：模拟层级失效（所有结果全算主体，软备注层消失）==');
  {
    const flatProbe = async (q) => {
      if (q === '5070 Ti') return { n: 23, main: 23, soft: 0 };  // 没有分层
      return { n: 24, main: 18, soft: 6 };
    };
    const r = await runChecks({ models: clone(), searchProbe: flatProbe });
    expectDetected('型号词分层检查', r.items, 'model:layer');
  }

  console.log('\n== 用例 7：注入单点价格灌水（验证阈值方向）==');
  {
    const m = clone();
    let n = 0;
    Object.keys(m).forEach(k => (m[k] || []).forEach(i => {
      if (n < 200 && i.price) { i.price = [i.price[0], i.price[0]]; n++; }
    }));
    const r = await runChecks({ models: m, searchProbe: cleanProbe });
    expectDetected('单点价格占比上限', r.items, 'price:single');
  }

  console.log(`\n自测结果：PASS ${pass} / FAIL ${fail}`);
  if (fail > 0) console.log('⚠ 有变异未被抓到 —— 断言存在盲区，审计不可信。');
  process.exit(fail > 0 ? 1 : 0);
})();
