/* 同型号去重口径 —— 全项目唯一实现
 *
 * 使用方：js/recommend.js（页面合并卡）、tools/dedup-gate.cjs（入库闸）、
 *         tools/dup-review.cjs（人工核验清单）、tests/lib/checks.cjs（审计断言）。
 * 不要在别处再写一份 norm：口径一旦不一致，页面合并出的组数和审计统计的组数就对不上，
 * 于是「页面已经没有重复了」和「审计说还有 49 组」会同时成立。
 */
(function (root) {
  'use strict';

  var S = function (x) { return String(x == null ? '' : x).toLowerCase(); };

  /* 小写 + 去空白 + 去横线类符号（半角连字符 / 全角减号 / 破折号 / 下划线） */
  var norm = function (x) { return S(x).replace(/\s+/g, '').replace(/[\-－—_]/g, ''); };

  var keyOf = function (catId, it) {
    return catId + '|' + norm(it && it.brand) + '|' + norm(it && it.model);
  };

  /* 两个价格区间是否重叠。端点相接算不重叠 —— 与审计口径保持一致 */
  var overlaps = function (a, b) { return a[0] < b[1] && b[0] < a[1]; };

  var GRADE_RANK = { S: 5, A: 4, B: 3, C: 2, D: 1 };

  function uniqPush(arr, v) { if (v && arr.indexOf(v) === -1) arr.push(v); }

  /* 合并一组同型号记录 → { item, ids, ranges, dispute, specsDiffer }
     价格取并集，绝不挑其中一条：哪条可信是人工核验的事，代码不猜。 */
  function mergeGroup(catId, list) {
    var base = list[0];
    var ids = [], ranges = [], dispute = false, specsDiffer = false;
    list.forEach(function (x) {
      ids.push(x.id);
      ranges.push([x.price[0], x.price[1]]);
    });
    for (var i = 0; i < list.length; i++) {
      for (var j = i + 1; j < list.length; j++) {
        if (!overlaps(ranges[i], ranges[j])) dispute = true;
        if (S(list[i].specs) !== S(list[j].specs)) specsDiffer = true;
      }
    }
    /* 「随主板」这类 0 价不参与并集，否则会造出 [0, 8999] 的假区间 */
    var real = ranges.filter(function (r) { return !(r[0] === 0 && r[1] === 0); });
    var lo = real.length ? Math.min.apply(null, real.map(function (r) { return r[0]; })) : 0;
    var hi = real.length ? Math.max.apply(null, real.map(function (r) { return r[1]; })) : 0;

    var tags = [], use = [], audience = [], notes = [], compats = [];
    var rating = 0, grade = '', specs = '', specsSegs = -1;
    list.forEach(function (x) {
      (x.tags || []).forEach(function (t) { uniqPush(tags, t); });
      (x.use || []).forEach(function (t) { uniqPush(use, t); });
      (x.audience || []).forEach(function (t) { uniqPush(audience, t); });
      uniqPush(notes, x.valueNote);
      uniqPush(compats, x.compat);
      if (x.rating > rating) rating = x.rating;
      if ((GRADE_RANK[x.valueGrade] || 0) > (GRADE_RANK[grade] || 0)) grade = x.valueGrade;
      /* 同型号两条记录的 specs 常是详略不同（4 段 vs 6 段），取信息量最大的那条，不拼接 */
      var segs = String(x.specs || '').split(/[;；]/).filter(function (t) { return t.trim(); }).length;
      if (segs > specsSegs) { specsSegs = segs; specs = x.specs; }
    });

    var item = {};
    for (var k in base) if (Object.prototype.hasOwnProperty.call(base, k)) item[k] = base[k];
    item.price = [lo, hi];
    item.rating = rating;
    item.valueGrade = grade;
    item.tags = tags;
    item.use = use;
    item.audience = audience;
    item.specs = specs;
    item.valueNote = notes.join(' ／ ');
    item.compat = compats.join(' ／ ');

    return { item: item, ids: ids, ranges: ranges, dispute: dispute, specsDiffer: specsDiffer, key: keyOf(catId, base) };
  }

  /* 按首次出现顺序输出合并后的条目；单条记录 merge 为 null */
  function mergeList(catId, items) {
    var order = [], bucket = {};
    (items || []).forEach(function (it) {
      var k = keyOf(catId, it);
      if (!bucket[k]) { bucket[k] = []; order.push(k); }
      bucket[k].push(it);
    });
    return order.map(function (k) {
      var g = bucket[k];
      if (g.length === 1) return { item: g[0], merge: null, key: k };
      var m = mergeGroup(catId, g);
      return { item: m.item, merge: m, key: k };
    });
  }

  /* 全库扫一遍：只返回重复组，供闸门与人工核验清单使用 */
  function scanGroups(models) {
    var out = [];
    Object.keys(models || {}).forEach(function (catId) {
      (models[catId] || []).forEach(function (it) {
        var k = keyOf(catId, it);
        var found = null;
        for (var i = 0; i < out.length; i++) if (out[i].key === k) { found = out[i]; break; }
        if (found) found.list.push(it);
        else out.push({ key: k, catId: catId, brand: it.brand, model: it.model, list: [it] });
      });
    });
    return out.filter(function (g) { return g.list.length > 1; });
  }

  var api = {
    S: S, norm: norm, keyOf: keyOf, overlaps: overlaps,
    mergeGroup: mergeGroup, mergeList: mergeList, scanGroups: scanGroups
  };

  root.PCDup = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
