# 必填字段低覆盖对账（2026-10-22）

口径：schema 里 `r:1` 且硬命中 < 60% 的字段，共 **42** 个。
判定规则见 `tools/field-reconcile.cjs` 头部：补一条候选规则后能涨 ≥5 个点 → 规则分支不足，否则数据真缺。

| 字段 | 命中 | 软文本 | 判定 | 处置 |
|---|---|---|---|---|
| `tablet.stylus` | 0/66 (0%) | 3 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（3 条），需补录进 specs |
| `tablet.keyboard` | 0/66 (0%) | 4 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（4 条），需补录进 specs |
| `phone.ipRating` | 1/93 (1.1%) | 6 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（6 条），需补录进 specs |
| `phone.network` | 1/93 (1.1%) | 1 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（1 条），需补录进 specs |
| `gpu.powerConn` | 4/61 (6.6%) | 5 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（5 条），需补录进 specs |
| `gpu.outputs` | 4/61 (6.6%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |
| `wearable.waterproof` | 7/71 (9.9%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |
| `earphone.codec` | 11/95 (11.6%) | 3 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（3 条），需补录进 specs |
| `dock.compat` | 5/34 (14.7%) | 2 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（2 条），需补录进 specs |
| `earphone.batterySingle` | 15/95 (15.8%) | 1 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（1 条），需补录进 specs |
| `laptop.battery` | 14/79 (17.7%) | 2 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（2 条），需补录进 specs |
| `mobileacc.material` | 8/36 (22.2%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |
| `cooler.sockets` | 13/54 (24.1%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |
| `tablet.resolution` | 16/66 (24.2%) | 2 | 规则分支不足 | 补分支：specs 写的是 2K / 2.5K / 3K 档位，不是 2560×1600 像素对；规则只认像素对（预估 16→44，+42.4pt） |
| `audio.freqResp` | 9/37 (24.3%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |
| `network.mesh` | 10/40 (25%) | 3 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（3 条），需补录进 specs |
| `monitor.brightness` | 20/76 (26.3%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |
| `wearable.batteryLife` | 22/71 (31%) | 0 | 规则分支不足 | 补分支：手环/耳机类按小时写续航，规则只认「N 天续航」；另有「周级续航」这类定性写法（预估 22→28，+8.5pt） |
| `monitor.response` | 24/76 (31.6%) | 1 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（1 条），需补录进 specs |
| `cpu.boostClock` | 20/61 (32.8%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |
| `cpu.arch` | 20/61 (32.8%) | 24 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（24 条），需补录进 specs |
| `mobo.lan` | 19/57 (33.3%) | 1 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（1 条），需补录进 specs |
| `monitor.iface` | 27/76 (35.5%) | 2 | 规则分支不足 | 补分支：「Type-C 可选」「DP 1.4」两种写法都在库里有，规则只认带数量的 HDMI/DP（预估 27→38，+14.5pt） |
| `phone.resolution` | 34/93 (36.6%) | 1 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（1 条），需补录进 specs |
| `psu.form` | 20/53 (37.7%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |
| `earphone.anc` | 38/95 (40%) | 2 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（2 条），需补录进 specs |
| `case.color` | 17/42 (40.5%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |
| `cpu.igpu` | 25/61 (41%) | 6 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（6 条），需补录进 specs |
| `case.cpuMax` | 18/42 (42.9%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |
| `charger.ports` | 18/41 (43.9%) | 0 | 规则分支不足 | 补分支：「单 Type-C」「双 Type-C」是最常见写法，规则只认「3×Type-C」这种带乘号的（预估 18→21，+7.3pt） |
| `charger.protocol` | 18/41 (43.9%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |
| `gpu.busWidth` | 27/61 (44.3%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |
| `network.band` | 18/40 (45%) | 2 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（2 条），需补录进 specs |
| `psu.warranty` | 24/53 (45.3%) | 5 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（5 条），需补录进 specs |
| `cooler.height` | 25/54 (46.3%) | 1 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（1 条），需补录进 specs |
| `dock.hostIface` | 16/34 (47.1%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |
| `cooler.tdpRating` | 27/54 (50%) | 1 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（1 条），需补录进 specs |
| `cooler.type` | 28/54 (51.9%) | 13 | 规则分支不足 | 补分支：风冷写「4×6mm 热管」、水冷写「360mm 冷排」，都不含「风冷 / 水冷」字样（预估 28→51，+42.6pt） |
| `network.lanSpeed` | 21/40 (52.5%) | 10 | 规则分支不足 | 补分支：「双 2.5G」省略了「口」字，规则要求带口/网口后缀（预估 21→31，+25pt） |
| `laptop.weight` | 42/79 (53.2%) | 8 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（8 条），需补录进 specs |
| `network.speed` | 22/40 (55%) | 6 | 数据真缺（硬字段层） | 规格只写在 valueNote/compat（6 条），需补录进 specs |
| `tablet.charge` | 39/66 (59.1%) | 0 | 数据真缺 | specs 与软文本都没有该规格，需外部核验补录 |

## 汇总

- 规则分支不足：**6** 个（先改规则，不排补录工期）
- 数据真缺：**36** 个（其中硬字段层空但软文本有：22 个）
- 若把上面 6 条候选分支补进 dryrun，这 6 个字段合计净增命中 **81** 条记录。

> 候选分支**本轮不写回** `tools/schema-dryrun.cjs`：改一个品类的规则要连带复核该品类全部字段，
> 属于第 3 批的活。本表只回答「工期该按几个字段算」。
