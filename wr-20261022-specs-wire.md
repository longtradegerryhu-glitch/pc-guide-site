# wr-20261022-specs-wire · ORD-14 第 1 批：schema 接线 + 搜索硬字段优先

> 本文件所在 commit 就是本批的交付提交。`git show --name-only <hash>` 应能看到本文件名。

## 一、改了什么

### 1.1 搜索从「单一 haystack」改成三层命中（`js/recommend.js`）

`matchQuery(item, catId, toks) → bool` 换成 `matchRank(item, catId, toks) → 0|1|2|3`：

| 返回值 | 含义 | 取哪些字段 |
|---|---|---|
| 1 | 字段命中 | `specs` 原串 + `specsObj` 结构化取值 |
| 2 | 型号 / 品牌命中（品类词也归这层） | `name` `brand` `model` `searchName` `style` |
| 3 | 只命中软文本 | `valueNote` `compat` `tags` |
| 0 | 不命中 | — |

多词查询取**最弱**的一层（`max`），避免「字段 + 软文本」混命中冒充纯字段命中。
`collect()` 记录 `rank` 并按升序排序（同层保持原顺序，否则每敲一个字卡片就跳位）。

**为什么不是「只搜硬字段」**：软层必须保留。实测搜「5070 Ti」有 17 条只靠软文本命中
（其它品类的 `compat` 里提到它），砍掉软层会让这类交叉引用全部消失，也会打掉
`tests/audit-search.cjs` 的 `modelQuery` 断言。

### 1.2 `specsObj` 迁移（`tools/specs-derive.cjs` + `tools/derive-specs-obj.cjs`）

- `tools/specs-derive.cjs` 是**唯一实现**：字段规则 + 取值函数。
  `tools/schema-dryrun.cjs` 的 `R.ssd` 整块被删除，改为调用它 —— 命中判定与取值同源，
  不会再出现「dryrun 说覆盖 53/53、迁移却填不出值」。
- `tools/derive-specs-obj.cjs` 把派生结果写回 `js/models-data.js`，原地新增
  `specsObj` 与 `specsMissing` 两个字段，**`specs` 原串一个字都没删**。
- 整文件重生成而非逐行正则改写：重生成用的是与 `tools/rebuild-models.cjs` 相同的 `fmt()`，
  已实测「不加字段时重生成结果与原文件逐字节一致」（539722 字节全等），所以 diff 只来自新字段。
- 幂等：`node tools/derive-specs-obj.cjs --check` 返回 0 表示文件与派生结果一致。
- `tools/rebuild-models.cjs` 的 `fmt` 同步加上 `specsObj`，避免单独跑一次 rebuild 就把结构化字段冲掉。

### 1.3 schema 接线（`js/specs-schema.js` + 8 个页面）

- `ssd.kind` 新增 `lbl` 枚举人话别名（`HDD → 机械硬盘/机械盘`）。用户搜「机械硬盘」，
  库里存的是 `HDD`，没有这层映射永远命中不了。
- `STATUS` 由 `definition-only` 改为 `wired`。
- `js/specs-schema.js` 插入 8 个页面（`index/smart/accessories/plans/looks/faq/guide/404`），
  位置在 `recommend.js` 之前。

### 1.4 超出字面范围的一处：切词

`segmentQuery` 的候选词表加入 schema 的 `lbl` 值。不加这一步，「机械硬盘」会被切成
「机械」+「硬盘」：后半段命中品类 `ssd`，前半段只在「建议搭配机械盘做冷备」这类备注里出现，
于是搜「机械硬盘」会捞出 2 块 4TB 固态（`sd3`/`vd9`），A3 的「0 误命中」过不去。
整体成一个 token 后只按 `kind` 的别名表判定，结果从 5 条降到 3 条，正好是那 3 块机械盘。

## 二、为什么这么改

**第 0 批的 schema 如果不接线，收益是 0。** 44 块 M.2 固态的 `specsObj.form` 全填成 `M.2`，
用户搜「M.2」的行为也不会变一个字节 —— 因为 `matchQuery` 只做字符串包含，根本不读结构化字段。
这批的第一优先级是让 schema 真的影响用户看到的结果，其次才是继续补数据。

**为什么只做三个品类。** ORD-14 限定 `ssd` + `laptop.iface` + `tablet.keyboard/stylus`。
实测这三个里只有 `ssd` 真的能解析（见 §四），另两个的结论是「数据不在 specs 里」，
这个结论本身比覆盖数字有用 —— 它决定第 3 批该写代码还是该补录。

## 三、实测输出

### 3.1 `npm run test:all`（6 段）

```

> pc-guide-site@1.0.0 test:all
> node tests/selftest-mutation.cjs && node tests/audit-search.cjs && node tests/specs-wire.cjs && node tests/e2e-merge.cjs && node tests/e2e-inject-test.cjs && node tools/check-wr-refs.cjs

== 用例 0：干净数据应全绿（对照组）==
  PASS 干净数据 17 项全 PASS

== 用例 1：同型号注入第 3 条（组数不变，条数 +1）==
  注入前: {"groups":49,"extra":49,"maxPerGroup":2,"priceConflict":17,"detail":[{"key":"cpu|amd|ryzen59600x","n":2,"ids":["u4","vc204"],"ranges":[[1200,1350],[1169,1348]],"brand":"AMD","model":"Ryzen 5 9600X","catId":"cpu"},{"key":"cpu|amd|ryzen79700x","n":2,"ids":["u6","vc205"],"ranges":[[1500,1750],[1478,1478]],"brand":"AMD","model":"Ryzen 7 9700X","catId":"cpu"},{"key":"cpu|amd|ryzen79800x3d","n":2,"ids":["u7","vc206"],"ranges":[[2900,3200],[3299,3299]],"brand":"AMD","model":"Ryzen 7 9800X3D","catId":"cpu"},{"key":"cpu|intel|coreultra9285k","n":2,"ids":["u8","vc214"],"ranges":[[4400,4800],[3699,4699]],"brand":"Intel","model":"Core Ultra 9 285K","catId":"cpu"},{"key":"cpu|amd|ryzen57500f","n":2,"ids":["u9","vc201"],"ranges":[[900,1000],[829,829]],"brand":"AMD","model":"Ryzen 5 7500F","catId":"cpu"},{"key":"cpu|intel|coreultra5245k","n":2,"ids":["u14","vc216"],"ranges":[[1450,1500],[1469,1469]],"brand":"Intel","model":"Core Ultra 5 245K","catId":"cpu"},{"key":"cpu|amd|ryzen77800x3d","n":2,"ids":["u15","vc209"],"ranges":[[2050,2499],[2069,2069]],"brand":"AMD","model":"Ryzen 7 7800X3D","catId":"cpu"},{"key":"cpu|intel|coreultra7265k","n":2,"ids":["u16","vc213"],"ranges":[[1865,1980],[1969,1969]],"brand":"Intel","model":"Core Ultra 7 265K","catId":"cpu"},{"key":"cpu|amd|ryzen99950x3d","n":2,"ids":["u19","vc208"],"ranges":[[4199,4899],[6699,6699]],"brand":"AMD","model":"Ryzen 9 9950X3D","catId":"cpu"},{"key":"cpu|amd|ryzen59600","n":2,"ids":["u31","vc203"],"ranges":[[1250,1400],[1349,1349]],"brand":"AMD","model":"Ryzen 5 9600","catId":"cpu"},{"key":"gpu|nvidia|rtx50608g","n":2,"ids":["g2","vg202"],"ranges":[[2550,3100],[3300,3699]],"brand":"NVIDIA","model":"RTX 5060 8G","catId":"gpu"},{"key":"gpu|amd|rx9060xt16g","n":2,"ids":["g3","vg210"],"ranges":[[2600,3600],[4899,4899]],"brand":"AMD","model":"RX 9060 XT 16G","catId":"gpu"},{"key":"gpu|nvidia|rtx507012g","n":2,"ids":["g4","vg205"],"ranges":[[6300,7200],[8599,9399]],"brand":"NVIDIA","model":"RTX 5070 12G","catId":"gpu"},{"key":"gpu|nvidia|rtx5070ti16g","n":2,"ids":["g6","vg206"],"ranges":[[8700,10500],[8600,9394]],"brand":"NVIDIA","model":"RTX 5070 Ti 16G","catId":"gpu"},{"key":"gpu|nvidia|rtx508016g","n":2,"ids":["g7","vg207"],"ranges":[[12300,16000],[12500,15988]],"brand":"NVIDIA","model":"RTX 5080 16G","catId":"gpu"},{"key":"gpu|nvidia|rtx5060ti16g","n":2,"ids":["g9","vg204"],"ranges":[[5000,6000],[3100,6156]],"brand":"NVIDIA","model":"RTX 5060 Ti 16G","catId":"gpu"},{"key":"gpu|nvidia|rtx50508g","n":2,"ids":["g15","vg201"],"ranges":[[2400,3150],[2279,2600]],"brand":"NVIDIA","model":"RTX 5050 8G","catId":"gpu"},{"key":"gpu|nvidia|rtx5060ti8g","n":2,"ids":["g19","vg203"],"ranges":[[3600,4200],[3499,3999]],"brand":"NVIDIA","model":"RTX 5060 Ti 8G","catId":"gpu"},{"key":"gpu|amd|rx9060xt8g","n":2,"ids":["g24","vg209"],"ranges":[[2300,2700],[2729,3390]],"brand":"AMD","model":"RX 9060 XT 8G","catId":"gpu"},{"key":"ssd|致态|tiplus71001tb","n":2,"ids":["sd1","vsd201"],"ranges":[[850,999],[639,639]],"brand":"致态","model":"TiPlus7100 1TB","catId":"ssd"},{"key":"ssd|致态|ti6002tb","n":2,"ids":["sd7","vsd204"],"ranges":[[1550,1850],[1699,1889]],"brand":"致态","model":"Ti600 2TB","catId":"ssd"},{"key":"ssd|三星|9100pro2tb","n":2,"ids":["sd12","vsd205"],"ranges":[[2900,3500],[2813,2999]],"brand":"三星","model":"9100 PRO 2TB","catId":"ssd"},{"key":"ssd|致态|tipro90001tb","n":2,"ids":["vd11","vsd203"],"ranges":[[1300,1600],[999,1619]],"brand":"致态","model":"TiPro9000 1TB","catId":"ssd"},{"key":"cooler|arctic|lfiii360","n":2,"ids":["c6","cl5"],"ranges":[[599,720],[599,649]],"brand":"Arctic","model":"LF III 360","catId":"cooler"},{"key":"cooler|猫头鹰|nhu12a","n":2,"ids":["c16","cl4"],"ranges":[[599,699],[699,799]],"brand":"猫头鹰","model":"NH-U12A","catId":"cooler"},{"key":"input|狼蛛|f99","n":2,"ids":["k17","ink4"],"ranges":[[299,399],[259,399]],"brand":"狼蛛","model":"F99","catId":"input"},{"key":"audio|漫步者|s2000mkiii","n":2,"ids":["va8","au207"],"ranges":[[1599,1899],[1480,1980]],"brand":"漫步者","model":"S2000MKIII","catId":"audio"},{"key":"network|小米|be36002.5g版","n":2,"ids":["n1","vnw201"],"ranges":[[140,180],[159,199]],"brand":"小米","model":"BE3600 2.5G 版","catId":"network"},{"key":"network|小米|be7000","n":2,"ids":["n9","vnw205"],"ranges":[[699,899],[689,799]],"brand":"小米","model":"BE7000","catId":"network"},{"key":"laptop|荣耀|magicbookpro162026","n":2,"ids":["lt36","lbx8"],"ranges":[[8600,9600],[8999,10999]],"brand":"荣耀","model":"MagicBook Pro 16 2026","catId":"laptop"},{"key":"laptop|联想|小新air132026","n":2,"ids":["lbx4","lb201"],"ranges":[[3994,4699],[3994,4699]],"brand":"联想","model":"小新 Air 13 2026","catId":"laptop"},{"key":"laptop|联想|小新air152026","n":2,"ids":["lbx5","lb202"],"ranges":[[3786,4699],[3825,4299]],"brand":"联想","model":"小新 Air 15 2026","catId":"laptop"},{"key":"laptop|华硕|无畏16se2026","n":2,"ids":["lbx7","lb204"],"ranges":[[4299,5799],[3600,3824]],"brand":"华硕","model":"无畏16 SE 2026","catId":"laptop"},{"key":"phone|荣耀|magic9","n":2,"ids":["ph23","ph224"],"ranges":[[4999,5999],[4999,5999]],"brand":"荣耀","model":"Magic 9","catId":"phone"},{"key":"phone|荣耀|magic9promax","n":2,"ids":["ph24","ph223"],"ranges":[[6499,10999],[6499,10999]],"brand":"荣耀","model":"Magic 9 Pro Max","catId":"phone"},{"key":"phone|华为|matex7","n":2,"ids":["ph42","ph218"],"ranges":[[11999,17599],[11999,15999]],"brand":"华为","model":"Mate X7","catId":"phone"},{"key":"tablet|oppo|pad6","n":2,"ids":["tb42","tb209"],"ranges":[[2999,3899],[3899,6099]],"brand":"OPPO","model":"Pad 6","catId":"tablet"},{"key":"tablet|vivo|pad5pro","n":2,"ids":["tb44","tb211"],"ranges":[[2999,4399],[2999,4399]],"brand":"vivo","model":"Pad5 Pro","catId":"tablet"},{"key":"earphone|华为|freebuds7","n":2,"ids":["ep6","ep203"],"ranges":[[949,999],[949,999]],"brand":"华为","model":"FreeBuds 7","catId":"earphone"},{"key":"earphone|华为|freeclip2","n":2,"ids":["ep14","ep205"],"ranges":[[1299,1699],[1299,1449]],"brand":"华为","model":"FreeClip 2","catId":"earphone"},{"key":"earphone|索尼|linkbudsopen","n":2,"ids":["ep15","ep210"],"ranges":[[799,1099],[1499,1499]],"brand":"索尼","model":"LinkBuds Open","catId":"earphone"},{"key":"earphone|索尼|wh1000xm5","n":2,"ids":["ep21","a16"],"ranges":[[2099,2999],[1799,2099]],"brand":"索尼","model":"WH-1000XM5","catId":"earphone"},{"key":"earphone|索尼|wh1000xm6","n":2,"ids":["ep22","ep211"],"ranges":[[2096,2549],[2298,3499]],"brand":"索尼","model":"WH-1000XM6","catId":"earphone"},{"key":"earphone|森海塞尔|momentum4","n":2,"ids":["ep25","ep216"],"ranges":[[1053,1538],[1799,2799]],"brand":"森海塞尔","model":"Momentum 4","catId":"earphone"},{"key":"earphone|森海塞尔|hd660s2","n":2,"ids":["ep26","ep217"],"ranges":[[1999,2499],[2999,4199]],"brand":"森海塞尔","model":"HD660S2","catId":"earphone"},{"key":"earphone|铁三角|athclr100","n":2,"ids":["ep31","va1"],"ranges":[[549,899],[99,149]],"brand":"铁三角","model":"ATH-CLR100","catId":"earphone"},{"key":"earphone|hyperx|cloudiii","n":2,"ids":["ep39","a20"],"ranges":[[599,899],[599,699]],"brand":"HyperX","model":"Cloud III","catId":"earphone"},{"key":"earphone|雷蛇|北海巨妖v4x","n":2,"ids":["ep41","va3"],"ranges":[[499,599],[499,599]],"brand":"雷蛇","model":"北海巨妖 V4 X","catId":"earphone"},{"key":"wearable|小米|watchs4sport","n":2,"ids":["wr18","wr214"],"ranges":[[1697,2899],[2464,2899]],"brand":"小米","model":"Watch S4 Sport","catId":"wearable"}]}
  注入后: {"groups":49,"extra":50,"maxPerGroup":3,"priceConflict":17,"detail":[{"key":"cpu|amd|ryzen59600x","n":3,"ids":["u4","vc204","MUT_DUP3"],"ranges":[[1200,1350],[1169,1348],[1200,1400]],"brand":"AMD","model":"Ryzen 5 9600X","catId":"cpu"},{"key":"cpu|amd|ryzen79700x","n":2,"ids":["u6","vc205"],"ranges":[[1500,1750],[1478,1478]],"brand":"AMD","model":"Ryzen 7 9700X","catId":"cpu"},{"key":"cpu|amd|ryzen79800x3d","n":2,"ids":["u7","vc206"],"ranges":[[2900,3200],[3299,3299]],"brand":"AMD","model":"Ryzen 7 9800X3D","catId":"cpu"},{"key":"cpu|intel|coreultra9285k","n":2,"ids":["u8","vc214"],"ranges":[[4400,4800],[3699,4699]],"brand":"Intel","model":"Core Ultra 9 285K","catId":"cpu"},{"key":"cpu|amd|ryzen57500f","n":2,"ids":["u9","vc201"],"ranges":[[900,1000],[829,829]],"brand":"AMD","model":"Ryzen 5 7500F","catId":"cpu"},{"key":"cpu|intel|coreultra5245k","n":2,"ids":["u14","vc216"],"ranges":[[1450,1500],[1469,1469]],"brand":"Intel","model":"Core Ultra 5 245K","catId":"cpu"},{"key":"cpu|amd|ryzen77800x3d","n":2,"ids":["u15","vc209"],"ranges":[[2050,2499],[2069,2069]],"brand":"AMD","model":"Ryzen 7 7800X3D","catId":"cpu"},{"key":"cpu|intel|coreultra7265k","n":2,"ids":["u16","vc213"],"ranges":[[1865,1980],[1969,1969]],"brand":"Intel","model":"Core Ultra 7 265K","catId":"cpu"},{"key":"cpu|amd|ryzen99950x3d","n":2,"ids":["u19","vc208"],"ranges":[[4199,4899],[6699,6699]],"brand":"AMD","model":"Ryzen 9 9950X3D","catId":"cpu"},{"key":"cpu|amd|ryzen59600","n":2,"ids":["u31","vc203"],"ranges":[[1250,1400],[1349,1349]],"brand":"AMD","model":"Ryzen 5 9600","catId":"cpu"},{"key":"gpu|nvidia|rtx50608g","n":2,"ids":["g2","vg202"],"ranges":[[2550,3100],[3300,3699]],"brand":"NVIDIA","model":"RTX 5060 8G","catId":"gpu"},{"key":"gpu|amd|rx9060xt16g","n":2,"ids":["g3","vg210"],"ranges":[[2600,3600],[4899,4899]],"brand":"AMD","model":"RX 9060 XT 16G","catId":"gpu"},{"key":"gpu|nvidia|rtx507012g","n":2,"ids":["g4","vg205"],"ranges":[[6300,7200],[8599,9399]],"brand":"NVIDIA","model":"RTX 5070 12G","catId":"gpu"},{"key":"gpu|nvidia|rtx5070ti16g","n":2,"ids":["g6","vg206"],"ranges":[[8700,10500],[8600,9394]],"brand":"NVIDIA","model":"RTX 5070 Ti 16G","catId":"gpu"},{"key":"gpu|nvidia|rtx508016g","n":2,"ids":["g7","vg207"],"ranges":[[12300,16000],[12500,15988]],"brand":"NVIDIA","model":"RTX 5080 16G","catId":"gpu"},{"key":"gpu|nvidia|rtx5060ti16g","n":2,"ids":["g9","vg204"],"ranges":[[5000,6000],[3100,6156]],"brand":"NVIDIA","model":"RTX 5060 Ti 16G","catId":"gpu"},{"key":"gpu|nvidia|rtx50508g","n":2,"ids":["g15","vg201"],"ranges":[[2400,3150],[2279,2600]],"brand":"NVIDIA","model":"RTX 5050 8G","catId":"gpu"},{"key":"gpu|nvidia|rtx5060ti8g","n":2,"ids":["g19","vg203"],"ranges":[[3600,4200],[3499,3999]],"brand":"NVIDIA","model":"RTX 5060 Ti 8G","catId":"gpu"},{"key":"gpu|amd|rx9060xt8g","n":2,"ids":["g24","vg209"],"ranges":[[2300,2700],[2729,3390]],"brand":"AMD","model":"RX 9060 XT 8G","catId":"gpu"},{"key":"ssd|致态|tiplus71001tb","n":2,"ids":["sd1","vsd201"],"ranges":[[850,999],[639,639]],"brand":"致态","model":"TiPlus7100 1TB","catId":"ssd"},{"key":"ssd|致态|ti6002tb","n":2,"ids":["sd7","vsd204"],"ranges":[[1550,1850],[1699,1889]],"brand":"致态","model":"Ti600 2TB","catId":"ssd"},{"key":"ssd|三星|9100pro2tb","n":2,"ids":["sd12","vsd205"],"ranges":[[2900,3500],[2813,2999]],"brand":"三星","model":"9100 PRO 2TB","catId":"ssd"},{"key":"ssd|致态|tipro90001tb","n":2,"ids":["vd11","vsd203"],"ranges":[[1300,1600],[999,1619]],"brand":"致态","model":"TiPro9000 1TB","catId":"ssd"},{"key":"cooler|arctic|lfiii360","n":2,"ids":["c6","cl5"],"ranges":[[599,720],[599,649]],"brand":"Arctic","model":"LF III 360","catId":"cooler"},{"key":"cooler|猫头鹰|nhu12a","n":2,"ids":["c16","cl4"],"ranges":[[599,699],[699,799]],"brand":"猫头鹰","model":"NH-U12A","catId":"cooler"},{"key":"input|狼蛛|f99","n":2,"ids":["k17","ink4"],"ranges":[[299,399],[259,399]],"brand":"狼蛛","model":"F99","catId":"input"},{"key":"audio|漫步者|s2000mkiii","n":2,"ids":["va8","au207"],"ranges":[[1599,1899],[1480,1980]],"brand":"漫步者","model":"S2000MKIII","catId":"audio"},{"key":"network|小米|be36002.5g版","n":2,"ids":["n1","vnw201"],"ranges":[[140,180],[159,199]],"brand":"小米","model":"BE3600 2.5G 版","catId":"network"},{"key":"network|小米|be7000","n":2,"ids":["n9","vnw205"],"ranges":[[699,899],[689,799]],"brand":"小米","model":"BE7000","catId":"network"},{"key":"laptop|荣耀|magicbookpro162026","n":2,"ids":["lt36","lbx8"],"ranges":[[8600,9600],[8999,10999]],"brand":"荣耀","model":"MagicBook Pro 16 2026","catId":"laptop"},{"key":"laptop|联想|小新air132026","n":2,"ids":["lbx4","lb201"],"ranges":[[3994,4699],[3994,4699]],"brand":"联想","model":"小新 Air 13 2026","catId":"laptop"},{"key":"laptop|联想|小新air152026","n":2,"ids":["lbx5","lb202"],"ranges":[[3786,4699],[3825,4299]],"brand":"联想","model":"小新 Air 15 2026","catId":"laptop"},{"key":"laptop|华硕|无畏16se2026","n":2,"ids":["lbx7","lb204"],"ranges":[[4299,5799],[3600,3824]],"brand":"华硕","model":"无畏16 SE 2026","catId":"laptop"},{"key":"phone|荣耀|magic9","n":2,"ids":["ph23","ph224"],"ranges":[[4999,5999],[4999,5999]],"brand":"荣耀","model":"Magic 9","catId":"phone"},{"key":"phone|荣耀|magic9promax","n":2,"ids":["ph24","ph223"],"ranges":[[6499,10999],[6499,10999]],"brand":"荣耀","model":"Magic 9 Pro Max","catId":"phone"},{"key":"phone|华为|matex7","n":2,"ids":["ph42","ph218"],"ranges":[[11999,17599],[11999,15999]],"brand":"华为","model":"Mate X7","catId":"phone"},{"key":"tablet|oppo|pad6","n":2,"ids":["tb42","tb209"],"ranges":[[2999,3899],[3899,6099]],"brand":"OPPO","model":"Pad 6","catId":"tablet"},{"key":"tablet|vivo|pad5pro","n":2,"ids":["tb44","tb211"],"ranges":[[2999,4399],[2999,4399]],"brand":"vivo","model":"Pad5 Pro","catId":"tablet"},{"key":"earphone|华为|freebuds7","n":2,"ids":["ep6","ep203"],"ranges":[[949,999],[949,999]],"brand":"华为","model":"FreeBuds 7","catId":"earphone"},{"key":"earphone|华为|freeclip2","n":2,"ids":["ep14","ep205"],"ranges":[[1299,1699],[1299,1449]],"brand":"华为","model":"FreeClip 2","catId":"earphone"},{"key":"earphone|索尼|linkbudsopen","n":2,"ids":["ep15","ep210"],"ranges":[[799,1099],[1499,1499]],"brand":"索尼","model":"LinkBuds Open","catId":"earphone"},{"key":"earphone|索尼|wh1000xm5","n":2,"ids":["ep21","a16"],"ranges":[[2099,2999],[1799,2099]],"brand":"索尼","model":"WH-1000XM5","catId":"earphone"},{"key":"earphone|索尼|wh1000xm6","n":2,"ids":["ep22","ep211"],"ranges":[[2096,2549],[2298,3499]],"brand":"索尼","model":"WH-1000XM6","catId":"earphone"},{"key":"earphone|森海塞尔|momentum4","n":2,"ids":["ep25","ep216"],"ranges":[[1053,1538],[1799,2799]],"brand":"森海塞尔","model":"Momentum 4","catId":"earphone"},{"key":"earphone|森海塞尔|hd660s2","n":2,"ids":["ep26","ep217"],"ranges":[[1999,2499],[2999,4199]],"brand":"森海塞尔","model":"HD660S2","catId":"earphone"},{"key":"earphone|铁三角|athclr100","n":2,"ids":["ep31","va1"],"ranges":[[549,899],[99,149]],"brand":"铁三角","model":"ATH-CLR100","catId":"earphone"},{"key":"earphone|hyperx|cloudiii","n":2,"ids":["ep39","a20"],"ranges":[[599,899],[599,699]],"brand":"HyperX","model":"Cloud III","catId":"earphone"},{"key":"earphone|雷蛇|北海巨妖v4x","n":2,"ids":["ep41","va3"],"ranges":[[499,599],[499,599]],"brand":"雷蛇","model":"北海巨妖 V4 X","catId":"earphone"},{"key":"wearable|小米|watchs4sport","n":2,"ids":["wr18","wr214"],"ranges":[[1697,2899],[2464,2899]],"brand":"小米","model":"Watch S4 Sport","catId":"wearable"}]}
  PASS 第 3 条被"重复条目总数"抓到 → dup:extra 正确 FAIL（实测 50，基线 49）
  PASS 第 3 条被"单型号最多出现次数"抓到 → dup:max 正确 FAIL（实测 3，基线 2）
  PASS 对照组：组数仍为 49（证明旧断言 dup:groups 会漏检，新断言补上了）

== 用例 2：新增一个全新重复组（同型号写两种大小写）==
  PASS 归一化能识别大小写/空格差异 → dup:groups 正确 FAIL（实测 50，基线 49）

== 用例 3：注入价格区间完全不重叠 ==
  改造对象: cpu|amd|ryzen59600x → vc204 原价 [1169,1348]
  PASS 价格冲突组被计数 → dup:price 正确 FAIL（实测 18，基线 17）

== 用例 4：注入 model 为数字 ==
  PASS model 类型检查 → model:type 正确 FAIL（实测 1，基线 0）

== 用例 5：模拟"过滤垃圾"规则误杀规格词 ==
  PASS 规格词主体归零被抓 → spec:ATX3.1 正确 FAIL（实测 {"n":24,"main":0,"soft":24}，基线 ">0"）
  PASS 规格词主体归零被抓（GDDR7） → spec:GDDR7 正确 FAIL（实测 {"n":24,"main":0,"soft":24}，基线 ">0"）
  PASS 规格词主体归零被抓（360水冷） → spec:360水冷 正确 FAIL（实测 {"n":24,"main":0,"soft":24}，基线 ">0"）

== 用例 6：模拟层级失效（所有结果全算主体，软备注层消失）==
  PASS 型号词分层检查 → model:layer 正确 FAIL（实测 {"n":23,"main":23,"soft":0}，基线 "0<soft && main<n"）

== 用例 7：注入单点价格灌水（验证阈值方向）==
  PASS 单点价格占比上限 → price:single 正确 FAIL（实测 23.1，基线 "10%"）

== 用例 8：合并层失效（mergeList 不合并，页面会退回 1209 条重复卡）==
  PASS 合并卡数量断言 → merge:cards 正确 FAIL（实测 1209，基线 1160）

== 用例 9：冲突探测失效（冲突被吞成"区间一致"，价格存疑不再标注）==
  PASS 存疑组数随数据变化被抓（cpu|amd|ryzen59600x） → merge:dispute 正确 FAIL（实测 18，基线 17）
  PASS 呈现层与原始层一致性断言 → merge:parity 正确 FAIL（实测 0，基线 17）

自测结果：PASS 15 / FAIL 0
jsdom: jsdom
探针口径：UI

  PASS 规格词「ATX3.1」主体命中 > 0（防误杀）
  PASS 规格词「GDDR7」主体命中 > 0（防误杀）
  PASS 规格词「360水冷」主体命中 > 0（防误杀）
  PASS 型号词「5070 Ti」存在软备注层（分层生效）
  PASS 原始重复型号组数 <= 49
  PASS 原始重复条目总数 <= 49（抓同组新增第 3 条）
  PASS 单型号最多出现 <= 2 次
  PASS 价格区间冲突组 <= 17
  PASS 合并后卡片数 = 1160（原始 1209 − 重复 49）
  PASS 合并卡标「价格存疑」17 组（冲突不得被吞掉）
  PASS 合并层判定的冲突组数 = 原始层冲突组数
  PASS specs 段数不固定的品类 <= 21（schema 迁移后应下降）
  PASS 型号总数 >= 1209
  PASS model 全为字符串
  PASS 单点价格占比 <= 10%
  PASS 配置单每个行名都在 PART_CAT 内
  PASS PART_CAT 取值都指向真实品类（虚拟 id 须在 VIRTUAL_CAT 登记）
  PASS 问卷选项的 parts 每项都在 PART_CAT 内

结果：PASS 18 / FAIL 0
PASS A4a schema 自校验 0 错误 :: []
PASS A4b 字段数 260 :: 实测 260
PASS A4c 必填 128 :: 实测 128
PASS A4d 21 品类 :: 实测 21
PASS A4e schema 状态已接线 :: STATUS=wired
PASS A6 dry-run 覆盖率 ≥ 38.9% :: 5395/13773 = 39.17%
PASS 数据层 ssd 共 53 条 :: 实测 53
PASS 数据层 form=M.2 恰 44 条 :: 实测 44
PASS 数据层 iface=SATA 恰 6 条（3 SSD + 3 HDD） :: sd13:SSD, sd24:HDD, sd25:HDD, sd26:HDD, vd13:SSD, vd14:SSD
PASS 数据层 kind=HDD 恰 3 条 :: sd24, sd25, sd26
PASS ssd 全部带 specsObj :: 0 条缺失
PASS specs 原串未被删除 :: 空串 0 条
PASS 页面已加载 PC_SCHEMA :: STATUS=wired
PASS A1a 搜「M.2」ssd 主体命中 44 :: 实测 44
PASS A1b 这 44 条覆盖率 44/44 :: 未覆盖 
PASS A1c ssd 主体命中全在 ssd（不串品类） :: rank=1 的品类分布 {"mobo":57,"ssd":44,"dock":1}
PASS A2a 搜「SATA」命中 6 条 ssd :: 实测 6
PASS A2b 其中 3 SSD + 3 HDD :: {"SSD":3,"HDD":3}
     逐条：sd13/三星 870 EVO 1TB=SSD | sd24/西数 紫盘 4TB=HDD | sd25/希捷 酷狼 8TB=HDD | sd26/希捷 银河 Exos 16TB=HDD | vd13/西数 红盘 SA500 1TB=SSD | vd14/致态 SC001 1TB=SSD
PASS A3a 搜「机械硬盘」主体命中恰 3 条 :: 实测 3 → sd24,sd25,sd26
PASS A3b 就是 sd24/sd25/sd26 :: sd24,sd25,sd26
PASS A3c 主体层 0 块 M.2 误命中 :: 误命中 
     软层（compat 里提到机械盘做冷备）：无
PASS 软层未被干掉（5070 Ti 仍有软命中） :: 软命中 17 条 / 共 23
PASS 「机械硬盘」整体切词 :: ["机械硬盘"]
     卡片口径「M.2」：首屏 49 张 / 展开后 101 张
     卡片口径「SATA」：首屏 7 张 / 展开后 7 张
     卡片口径「机械硬盘」：首屏 3 张 / 展开后 3 张

结果：PASS 23 / FAIL 0
jsdom: jsdom

== G1 合并内核已装载 ==
  PASS window.PCDup 存在（js/dup-core.js 已引入）

== G2 每个品类的款数与合并后一致（逐类对账） ==
  PASS 分组数 = 21  实测 21
  PASS 各品类款数全部等于合并后条数  不符 0 个
  PASS 全站合计 = 1160 款（原始 1209 − 重复 49）  实测 1160

== G3 价格冲突组：合并成一条 + 并集 + 价格存疑 ==
  PASS 只出 1 张卡（原始 2 条记录）  实测 1
  PASS 价格显示并集 ¥99 - 899  ¥99 - 899
  PASS 有「价格存疑」徽标  价格存疑
  PASS 口径说明写了"不重叠"
  PASS 口径说明列出两条原始区间
  PASS 明确写"未替你选其中一条"

== G4 区间一致的重复组：合并但不误报存疑 ==
  PASS 只出 1 张卡  实测 1
  PASS 徽标为「已合并 2 条」  已合并 2 条
  PASS 不误标「价格存疑」
  PASS 口径说明写了"区间一致"

== G5 无重复的型号不出任何徽标 ==
  PASS 存在无徽标的普通卡（未被合并逻辑污染）  共 14 张，其中无徽标 13 张
  PASS 9800X3D 自身带徽标（它确实是重复组）

== G6 全量渲染下同型号不重复出现 ==
  PASS 任一品类首屏内没有同名型号重复卡  重复 0 处

结果：PASS 17 / FAIL 0
== 步骤 1：干净数据应通过 ==
  PASS 干净数据 exit 0
  PASS 干净数据输出含 PASS

== 步骤 2：注入一条重复（同型号第 3 条）==
  已注入 id=E2E_INJECT_DUP（与 u4 同品牌同型号）
  PASS 注入后 exit 1（不许静默通过）
  PASS 注入后报出 dup:extra FAIL
  PASS 注入后报出 dup:max FAIL
  —— 注入后的 FAIL 行 ——
  FAIL 原始重复条目总数 <= 49（抓同组新增第 3 条） :: 50（基线 49）
  FAIL 单型号最多出现 <= 2 次 :: 3（基线 2）

== 步骤 3：恢复后应重新通过 ==
  PASS 恢复后文件 md5 与原始一致
  PASS 恢复后 exit 0
  PASS 恢复后 FAIL 0

结果：PASS 8 / FAIL 0
文件已恢复原状。
== wr 引用一致性（commit message 承诺的文件必须真实存在）==
  PASS 基线外没有新的 wr 引用缺失
  PASS 已存在的 wr 文件全部已被 git 跟踪
  —— 基线内历史欠账 25 条（不拦，但必须可见）——
       跑 npm run audit:wr -- --list 看明细

结果：PASS 37 / FAIL 0（共 37 处 wr 引用；历史欠账 25 条已登记）
```

### 3.2 `npm run audit:gate`（审计方独立验收，17 条）

```

> pc-guide-site@1.0.0 audit:gate
> node tests/reco-acceptance.cjs

jsdom: jsdom

  PASS A1 首题是「使用什么设备」
  PASS A2 手机形态下「已有外设」「重点」选项不含显示器/键鼠/散热器
       说明：按题号定位（existing/focus），不按位置 —— 手机形态下题号会前移，位置会漂
  PASS A3 手机形态下「装机经验」整题消失，题目总数减少
  PASS A4 手机形态下题干与选项不含「电脑」二字
  PASS A5 编号 x/N 随形态重算，N 正确且编号连续
  PASS A16 形态变化时题目本身变化（结构层，非仅结果层）
  PASS A11 配置单价格逐部件 === 配件区同型号价（两向核对）
  PASS A12 「配置单同款」标记逐个属实（型号不一致不得出现该标记）
       说明：本次共 2 处「配置单同款」标记，逐处回查配置单原选文本
  PASS A13 勾了 focus 后非重点件被折叠、重点件留在首屏
  PASS A8 勾已有显示器/键鼠/音频后，配置单与配件区均不再推荐这三项
  PASS A9 整体投入下调，差额 === 被移除行的金额之和（逐项相等，非仅"变小了"）
  PASS A10 被跳过的部件有说明文案
  PASS A14 已有外设与重点升级冲突时有提示
  PASS A6 手机形态输出不含任何电脑件
       说明：黑名单为数据驱动：电脑方案部件名减去手机/平板方案部件名，再并入 ORD-12 硬名单
  PASS A7 手机用户选不同的 focus，结果必须不同
  PASS A15 逐题对照实验：10 题每题单独改变，结果都变化
       说明：已逐题对照 10 题；exp 按实现设计意图只要求 tier2 变化
  PASS A17 现有审计闸（tests/audit-search.cjs）仍全绿

结果：PASS 17 / FAIL 0（共 17 条）
```

### 3.3 `npm run test:specs-wire`（本批 A1–A4/A6）

```

> pc-guide-site@1.0.0 test:specs-wire
> node tests/specs-wire.cjs

PASS A4a schema 自校验 0 错误 :: []
PASS A4b 字段数 260 :: 实测 260
PASS A4c 必填 128 :: 实测 128
PASS A4d 21 品类 :: 实测 21
PASS A4e schema 状态已接线 :: STATUS=wired
PASS A6 dry-run 覆盖率 ≥ 38.9% :: 5395/13773 = 39.17%
PASS 数据层 ssd 共 53 条 :: 实测 53
PASS 数据层 form=M.2 恰 44 条 :: 实测 44
PASS 数据层 iface=SATA 恰 6 条（3 SSD + 3 HDD） :: sd13:SSD, sd24:HDD, sd25:HDD, sd26:HDD, vd13:SSD, vd14:SSD
PASS 数据层 kind=HDD 恰 3 条 :: sd24, sd25, sd26
PASS ssd 全部带 specsObj :: 0 条缺失
PASS specs 原串未被删除 :: 空串 0 条
PASS 页面已加载 PC_SCHEMA :: STATUS=wired
PASS A1a 搜「M.2」ssd 主体命中 44 :: 实测 44
PASS A1b 这 44 条覆盖率 44/44 :: 未覆盖 
PASS A1c ssd 主体命中全在 ssd（不串品类） :: rank=1 的品类分布 {"mobo":57,"ssd":44,"dock":1}
PASS A2a 搜「SATA」命中 6 条 ssd :: 实测 6
PASS A2b 其中 3 SSD + 3 HDD :: {"SSD":3,"HDD":3}
     逐条：sd13/三星 870 EVO 1TB=SSD | sd24/西数 紫盘 4TB=HDD | sd25/希捷 酷狼 8TB=HDD | sd26/希捷 银河 Exos 16TB=HDD | vd13/西数 红盘 SA500 1TB=SSD | vd14/致态 SC001 1TB=SSD
PASS A3a 搜「机械硬盘」主体命中恰 3 条 :: 实测 3 → sd24,sd25,sd26
PASS A3b 就是 sd24/sd25/sd26 :: sd24,sd25,sd26
PASS A3c 主体层 0 块 M.2 误命中 :: 误命中 
     软层（compat 里提到机械盘做冷备）：无
PASS 软层未被干掉（5070 Ti 仍有软命中） :: 软命中 17 条 / 共 23
PASS 「机械硬盘」整体切词 :: ["机械硬盘"]
     卡片口径「M.2」：首屏 49 张 / 展开后 101 张
     卡片口径「SATA」：首屏 7 张 / 展开后 7 张
     卡片口径「机械硬盘」：首屏 3 张 / 展开后 3 张

结果：PASS 23 / FAIL 0
```

### 3.4 `npm run test:mutation:reco`（17 个变异，266s）

```

> pc-guide-site@1.0.0 test:mutation:reco
> node tests/mutation-reco.cjs

变异测试：17 个变异 × 17 条断言
快照：E:/AI/_test/mutsnap（与工作区不一致，重建）
       关键文件 21 个，就绪

工作目录：C:\Users\Lenovo\AppData\Local\Temp\pcg-mutation-reco（跑完自动清理）

  OK   M1 form 题被移到末位（首题不再是设备形态）
       期望 FAIL: A1, A16
       实际 FAIL: A1, A16, A3
       把 form 题改名 → visibleSteps 里 currentForm() 取不到 form，首题不再是设备题
       用时 5s

  OK   M2 focus 的「散热器」选项去掉 form 限制（手机也显示散热器）
       期望 FAIL: A2
       实际 FAIL: A2
       手机形态的 focus 题多出「散热器」选项 → A2 应 FAIL
       用时 16s

  OK   M3 exp 题在手机形态也显示（整题不消失）
       期望 FAIL: A16, A3, A4
       实际 FAIL: A16, A3, A4
       exp 题不再按形态过滤 → 题数不减、题干含「电脑」
       用时 16s

  OK   M4 预算题题干不分形态（desktop 与 phone 文案相同）
       期望 FAIL: A16
       实际 FAIL: A16
       A16 第 4 层：题干文案须随形态变化
       用时 16s

  OK   M5 编号 N 写死不重算（永远显示 /10）
       期望 FAIL: A5
       实际 FAIL: A5
       手机形态实际 9 题，写死 /10 → A5 的 N 与实有题数不符
       用时 16s

  OK   M6 题级形态过滤失效（visibleSteps 不过滤）
       期望 FAIL: A16, A3, A4
       实际 FAIL: A16, A3, A4
       题级过滤失效 → A3/A4/A16 应 FAIL
       用时 16s

  OK   M6b 选项级过滤失效（optionsOf 不按形态收窄）
       期望 FAIL: A2
       实际 FAIL: A16, A2
       手机形态会显示「显示器/键鼠/散热器」选项 → A2 应 FAIL
       用时 16s

  OK   M7 手机方案塞进电脑件（CPU）
       期望 FAIL: A6
       实际 FAIL: A6
       手机方案里出现 CPU → A6 应 FAIL（数据层同口径自查）
       用时 16s

  OK   M8 focus 完全不进入 priority（三条路径全断）
       期望 FAIL: A15, A7
       实际 FAIL: A13, A15, A7
       三条路径全断 → focus 完全不生效：A7（不同 focus 结构相同）+ A15（focus 题改了结果不变）都应 FAIL
       用时 16s

  OK   M8b focus 的部件不追加进 focusIds（形态内 focus 失效）
       期望 FAIL: A7
       实际 FAIL: A7
       形态内 focus（p_body 等）不展开 → 手机 focus 各选项首屏集合相同 → A7 应 FAIL
       用时 16s

  OK   M9 已有件不再跳过（配置单与配件区照推）
       期望 FAIL: A10, A8, A9
       实际 FAIL: A10, A14, A15, A8, A9
       跳过逻辑失效 → A8（仍在推）/A9（差额对不上）/A10（无跳过行）应 FAIL
       用时 16s

  OK   M10 跳过说明文案被删
       期望 FAIL: A10
       实际 FAIL: A10, A14
       skipTip 不再生成 → A10 应 FAIL
       用时 16s

  OK   M11 冲突提示被删
       期望 FAIL: A14
       实际 FAIL: A14
       conflictTip 不再生成 → A14 应 FAIL
       用时 16s

  OK   M12 非重点件不再折叠（全部平铺）
       期望 FAIL: A13
       实际 FAIL: A13, A15, A7
       折叠区消失 → A13 应 FAIL（非重点件没被折叠 + 折叠区为空）
       用时 16s

  OK   M13 配置单价格改回 plan.parts 字符串价（与型号库分叉）
       期望 FAIL: A11
       实际 FAIL: A11, A12
       配置单改用模板价 → 与配件区型号库价不一致 → A11 应 FAIL
       用时 16s

  OK   M14 同款徽章一律写 exact（不校验型号）
       期望 FAIL: A12
       实际 FAIL: A12
       anchorState 把所有 alt 都判成 exact → 型号对不上却标「配置单同款」
       用时 16s

  OK   M15 使用强度不再影响目标价位（intensity 题空转）
       期望 FAIL: A15
       实际 FAIL: A15
       intensity 改变不改结果 → A15 逐题对照实验应 FAIL
       用时 16s

已清理临时目录 17 个
总用时 266s
全部变异都被对应断言抓住
```

### 3.5 排序效果的独立证据：`npm run spec:matrix`

`tools/spec-word-matrix.cjs` 的判定口径没动过（只认 `specs` 等字符串字段，不读 `specsObj`），
它数的是「每个品类首屏 24 张卡里有多少主体命中」。同一份数据，改排序前后对比：

```
旧 合计 n/main/soft = {"n":468,"a":370,"b":98}
新 合计 n/main/soft = {"n":468,"a":392,"b":76}
```

**命中总数 468 一张不差，主体命中 370 → 392（+22），软命中 98 → 76（−22）。**
这说明改动只改了「谁排在前面」，没有偷偷放宽或收紧过滤条件 ——
如果实现成「只搜硬字段」，n 会跟着掉；如果实现成「全放行」，a 不会涨。

## 四、数字口径变化

| 指标 | ORD-06 结案 | 本批之后 | 说明 |
|---|---|---|---|
| schema 字段 / 必填 | 260 / 128 | 260 / 128 | 只给 `kind` 加了 `lbl`，字段数不变 |
| schema 校验错误 | 0 | 0 | — |
| dry-run 硬命中 | 5363/13773 = 38.94% | **5395/13773 = 39.17%** | 委托给 `specs-derive` 后规则分支补齐（`ifaceVer` 无 ×4、`seqWrite` a/b 写法、`warranty` 的「N 年 M TBW」） |
| `ssd.form` | 53/53 | **50/53** | 上一轮把 `/SATA/` 当形态命中，是伪命中。3 款纯 SATA 固态形态未知，进 `specsMissing` |
| 必填且 <60% 字段 | 40 | **42** | 放宽到含 `tablet.stylus/keyboard`（此前 `noRule` 未计入必填统计） |
| ssd 带 `specsObj` | 0 | **53** | — |
| laptop.iface / tablet.keyboard+stylus | 未做 | **0/79 · 0/66 · 0/66** | 数据不在 specs 里，见 §五 |

## 五、遗留问题

1. **`laptop.iface` 与 `tablet.keyboard/stylus` 迁移不出任何值**，不是规则问题。
   79 款笔记本的 specs 是固定 5 段模板（CPU;内存;SSD;屏幕;重量），66 款平板同样不含笔/键盘。
   信息只在 `compat` 里，且是采购建议（`tb1`「配笔式支架」、`lt1`「配 Type-C 拓展坞」），
   从那里抽布尔值会直接造假。→ 需要 145 条人工补录，来源是厂商页。
2. **`specsMissing` 的语义**：只列本轮 `SCOPE` 内尝试过但没有取到值的字段，
   不是整个品类的缺失清单。第 3 批扩品类时要同步扩 `SCOPE`，否则清单会漏。
3. **42 个低覆盖必填字段里 6 个是规则分支不足**（`tablet.resolution`、`wearable.batteryLife`、
   `cooler.type`、`charger.ports`、`network.lanSpeed`、`monitor.iface`），补规则合计净增 81 条命中。
   候选规则写在 `tools/field-reconcile.cjs` 的 `CANDIDATE` 里但**没有写回 dryrun**：
   改一个品类的规则要连带复核该品类全部字段，属于第 3 批。详见 `reports/specs-field-reconcile.md`。
4. **`ssd.seqWrite` 7/53、`ssd.tbw` 8/53** 是真缺：多数固态的 specs 只写读速。
   想做「写入性能」对比（第 4 批）必须先补这两列。
5. **搜索排序只做了层级，没做「同层内的相关度」**。同层内仍是品类顺序 + 数据顺序。
   若第 2 批要做相关度（字段命中数、词距），`matchRank` 需要改成返回对象而不是整数。
6. **`window.PCRecoDiag` 是测试出口**，只读、不写状态，但确实暴露在页面上。
   如果认为不该存在，删掉 `js/recommend.js` 里那段 `if (typeof window !== "undefined")` 即可，
   `tests/specs-wire.cjs` 会降级为只跑数据层并标 SKIP。
