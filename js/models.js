/* ===========================================================
 * models.js — 真实产品型号数据库（2026-10 参考行情）
 * 价格区间为人民币参考价（京东自营/电商 2026 年 10 月联网核验行情），
 * 随促销、补贴波动，购机请以电商实时价为准。
 * 字段：
 *   id / brand / model / name(品牌+型号展示名) / style / price([min,max])
 *   rating(0-5) / valueGrade(S/A/B/C) / valueNote(一句话点评)
 *   use(适用场景) / audience(适合人群) / tags / specs / compat(搭配建议)
 * =========================================================== */
window.PC_MODELS = {
  /* ---------- 散热器 ---------- */
  cooler: [
    { id: "c1",  brand: "利民",      model: "AX120 R SE",         name: "利民 AX120 R SE", searchName: "利民 AX120 R SE", style: "风冷单塔", price: [60, 89],    rating: 5, valueGrade: "S", valueNote: "百元内单塔之王，压 i3/R5 与办公机绰绰有余。想压 i7/R7 或带 K 超频得加钱上双塔 PA120；装前确认机箱限高 ≥150mm。",        use: ["office", "portable"], audience: ["student", "office"], tags: ["高性价比"],  specs: "4×6mm 热管;解热 125W;148mm 高;三年质保", compat: "i3/R5 及办公机首选，注意机箱限高 ≥150mm" },
    { id: "c2",  brand: "九州风神",  model: "玄冰 400 V5",         name: "九州风神 玄冰400 V5", searchName: "九州风神 玄冰 400 V5", style: "风冷单塔", price: [69, 109],   rating: 4, valueGrade: "A", valueNote: "5 热管大鳍片，解热标称 220W 却把噪音压在 32dB 内，办公机静音优选。同价比 AX120 多一根热管、更安静，但体积更大，小机箱要先量限高。",                  use: ["office", "game"],     audience: ["student", "office"], tags: ["静音"],      specs: "5×6mm 热管;解热 220W;≤31.6dB(A)", compat: "i5 全系/办公娱乐够用，RGB 版可选" },
    { id: "c3",  brand: "利民",      model: "PA120 SE",           name: "利民 PA120 SE", searchName: "利民 PA120 SE", style: "风冷双塔", price: [138, 179],   rating: 5, valueGrade: "S", valueNote: "双塔性价比标杆，6 热管解热 280W，压 i7/R7 与入门创作平台都稳。比单塔 AX120 贵约一倍，换的是跨档散热能力；注意 157mm 限高与内存避让。",              use: ["game", "create"],     audience: ["gamer", "student"], tags: ["高性价比"],  specs: "6×6mm 热管;解热 280W;157mm 高", compat: "主流游戏/创作平台首选，注意机箱限高与内存避让" },
    { id: "c4",  brand: "九州风神",  model: "大霜塔 V5",           name: "九州风神 大霜塔 V5", searchName: "九州风神 大霜塔 V5", style: "风冷双塔", price: [135, 199],   rating: 4, valueGrade: "A", valueNote: "主打静音调校的双塔，159mm 高度对机箱更挑。解热标称 200W，低于同价 PA120 的 280W，纯看性能不如它；选这台多半是冲噪音表现和大机箱空间。",      use: ["game", "create"],     audience: ["gamer", "creator"], tags: ["静音"],      specs: "6×6mm 热管;解热 200W;159mm 高", compat: "静音党优先，大机箱更从容" },
    { id: "c5",  brand: "瓦尔基里",  model: "B360-GT",             name: "瓦尔基里 B360-GT", searchName: "瓦尔基里 B360-GT", style: "360水冷", price: [499, 590],   rating: 5, valueGrade: "A", valueNote: "中端 360 水冷的性能标杆，五年质保敢给，压 65-105W 的旗舰 CPU 还要安静就选它。机箱放得下双塔且预算紧时，PA120 更划算；水冷有冷头衰减风险。",              use: ["create", "game"],     audience: ["creator", "gamer"], tags: ["RGB", "静音"], specs: "360mm 冷排;解热 280W;五年质保", compat: "需机箱支持 360 冷排位，旗舰 CPU 推荐" },
    { id: "c6",  brand: "Arctic",    model: "LF III 360",          name: "Arctic 液冷 LF III 360", searchName: "Arctic LF III 360", style: "360水冷", price: [599, 720], rating: 5, valueGrade: "S", valueNote: "S 级水冷。38mm 厚排解热 330W，满载噪音反而比薄排更低，Ultra 9 / R9 长期渲染首选。比 B360-GT 贵约 120 元，换六年质保与顶格余量。",      use: ["create"],             audience: ["creator"], tags: ["静音", "长质保"], specs: "38mm 厚排;解热 330W;六年质保", compat: "Ultra9/R9 级旗舰与长期高负载渲染首选" }
,
    { id: "c7",  brand: "利民",      model: "AXP90-X53",        name: "利民 AXP90-X53", searchName: "利民 AXP90-X53", style: "下压式ITX", price: [99, 139],   rating: 4, valueGrade: "A", valueNote: "53mm 下压式，ITX 与小机箱的散热破局方案，解热 130W 足够多数核显与低功耗 U。追性能别选它——常规塔式同价解热翻倍，它赢在高度。",           use: ["portable"],       audience: ["mobile", "student"], tags: ["小机箱"],   specs: "下压式;53mm 高;解热 130W;ITX 专用", compat: "ITX/小机箱限高 ≤55mm，注意风道" },
    { id: "c8",  brand: "九州风神",  model: "AK620",             name: "九州风神 AK620", searchName: "九州风神 AK620", style: "风冷双塔", price: [199, 259],  rating: 5, valueGrade: "S", valueNote: "双塔 6 热管解热 260W，压 i7/R7 稳，静音调校比 PA120 更细。比 PA120 贵 60-80 元，适合大机箱、追安静的创作者；小机箱与高马甲内存要先量尺寸。",             use: ["game", "create"], audience: ["gamer", "creator"], tags: ["静音"],     specs: "双塔;6×6mm 热管;解热 260W", compat: "大机箱优先，注意内存避让" },

    { id: "c9", brand: "乔思伯", model: "CR-1400 EVO", name: "乔思伯 CR-1400 EVO", searchName: "乔思伯 CR-1400 EVO", style: "风冷单塔", price: [71, 85], rating: 4, valueGrade: "S", valueNote: "八十元内带 ARGB 同步的 4 热管单塔，130mm 高度不挡内存，小机箱与灯效党的入门首选。解热有限，i7/R7 高负载压不住；极致静音选玄冰 400。", use: ["office", "game"], audience: ["student"], tags: ["RGB", "高性价比"], specs: "4热管镀镍;ARGB同步;130mm高;9cm PWM", compat: "i3/R5 及小机箱灯效入门" },
    { id: "c10", brand: "利民", model: "AQUA ELITE 240", name: "利民 AQUA ELITE 240", searchName: "利民 AQUA ELITE 240", style: "240水冷", price: [233, 319], rating: 4, valueGrade: "S", valueNote: "京东 20 万+ 评论的入门水冷标杆，240 排解热越级打双塔风冷，ARGB 冷头颜值在线。i9/R9 级高功耗别指望；装机前确认机箱有 240 冷排位。", use: ["game", "create"], audience: ["gamer", "student"], tags: ["RGB", "高性价比"], specs: "240冷排;ARGB冷头;双平台扣具;27mm排厚", compat: "i5/R7 级平台，确认机箱 240 排位" },
    { id: "c11", brand: "利民", model: "FC140 冰封统领", name: "利民 FC140 冰封统领", searchName: "利民 FC140 冰封统领", style: "风冷双塔", price: [276, 369], rating: 4, valueGrade: "A", valueNote: "风冷天花板，双塔 5×8mm 热管压 i7 K 系毫无压力，比同性能水冷便宜还免维护。158mm 高且挡高马甲内存，矮机箱与灯条内存务必先量尺寸。", use: ["game", "create"], audience: ["gamer", "creator"], tags: ["散热", "静音"], specs: "双塔5×8mm热管;回流焊;158mm高;双扇", compat: "高端风冷党，注意机箱限高与内存避让" },
    { id: "c12", brand: "瓦尔基里", model: "N360", name: "瓦尔基里 N360", searchName: "瓦尔基里 N360", style: "360水冷", price: [969, 999], rating: 4, valueGrade: "A", valueNote: "6.67 吋 AMOLED 磁吸曲屏素质顶级，300W 解热压旗舰 U 轻松，五年质保兜底。一台顶两台中端水冷的价格；不看屏的话 B360-GT 能省一半。", use: ["create", "game"], audience: ["creator", "gamer"], tags: ["RGB", "旗舰", "OLED屏"], specs: "360冷排;AMOLED曲屏;解热300W;五年质保", compat: "旗舰平台颜值党，需 360 冷排位" },
  ],

  /* ---------- 支架 ---------- */
  stand: [
    { id: "s1", brand: "北弧",      model: "Brateck E350",       name: "北弧 Brateck E350", searchName: "北弧 Brateck E350", style: "单臂支架", price: [99, 129],   rating: 5, valueGrade: "S", valueNote: "入门单臂性价比之王，气弹簧顺滑、承重 9kg 覆盖 17-32 英寸。比 NB F80 略贵但外观更简洁；夹桌厚度限 2-5cm，买前确认显示器背面有 VESA 孔。",                  use: ["office", "game"], audience: ["office", "student"], tags: ["人体工学", "高性价比"], specs: "VESA 75/100;承重 9kg;17-32 英寸", compat: "确认显示器带 VESA 孔；夹桌厚 2-5cm" },
    { id: "s2", brand: "NB",        model: "F80",                 name: "NB F80", searchName: "NB F80", style: "单臂支架", price: [69, 129],   rating: 5, valueGrade: "S", valueNote: "百元档越级做工的 9kg 真机械臂，显示器加笔记本双叠也能稳。价格比北弧 E350 更低，缺点是外观偏实用派；同样需要显示器带 VESA 孔。",                    use: ["office", "game"], audience: ["student", "office"], tags: ["人体工学", "高性价比"], specs: "双段机械臂;承重 9kg;17-32 英寸;阻尼油芯", compat: "显示器+笔记本双叠也能稳，理线方便" },
    { id: "s3", brand: "NB",        model: "F160",                name: "NB F160", searchName: "NB F160", style: "单臂支架", price: [170, 259],   rating: 4, valueGrade: "A", valueNote: "气弹簧升降 415mm、拉伸 538mm，自带理线槽，办公进阶之选。尺寸范围只到 27 英寸，要上 32 英寸得换 E350；组双屏请直接看双臂款。",            use: ["office"],             audience: ["office"], tags: ["人体工学", "理线"], specs: "气弹簧;415mm 升降;538mm 拉伸;17-27 英寸", compat: "双屏组建建议选双臂款" },
    { id: "s4", brand: "乐歌",      model: "DLB502-D",            name: "乐歌 DLB502-D", searchName: "乐歌 DLB502-D", style: "单臂支架", price: [298, 399],   rating: 4, valueGrade: "A", valueNote: "自由悬停顺滑、外观硬朗有辨识度，属于愿意为质感买单的办公件。承重起步 2kg，太轻的便携屏可能悬不住；纯讲性价比不如 NB F160。",              use: ["office", "create"], audience: ["office", "creator"], tags: ["人体工学"], specs: "承重 2-9kg;395mm 悬停升降;17-30 英寸", compat: "对支架质感有要求的中高端办公场景" },
    { id: "s5", brand: "AOC",       model: "AM400PLUS",           name: "AOC AM400PLUS", searchName: "AOC AM400PLUS", style: "一体升降", price: [299, 399],   rating: 4, valueGrade: "B", valueNote: "一体式桌面升降免夹桌、不沉头，懒人快装。前提是显示器带 VESA 孔；承重 6kg 偏保守，比同价 NB H180 更适合追省事而不是追规格的人。",                  use: ["office"],             audience: ["office", "student"], tags: ["省事"], specs: "一体式桌面升降;承重 6kg;22-32 英寸", compat: "免 VESA 改造？仍需确认显示器带孔" },
    { id: "s6", brand: "NB",        model: "H180",                name: "NB H180 双臂", searchName: "NB H180", style: "双臂支架", price: [299, 499],   rating: 4, valueGrade: "A", valueNote: "双屏办公利器，550mm 拉伸、615mm 升降，理线槽到位，挂双 27 英寸各一支都稳。单屏用户买它属于浪费，下单前先量桌面厚度。",                    use: ["office", "create"], audience: ["office", "creator"], tags: ["多屏", "理线"], specs: "承重 12kg;22-32 英寸;550mm 拉伸/615mm 升降", compat: "双 27 英寸内各一支，注意桌面厚度" }
,
    { id: "s7",  brand: "北弧",      model: "E360 双臂",         name: "北弧 E360 双臂", searchName: "北弧 E360 双臂", style: "双臂支架", price: [299, 399],  rating: 4, valueGrade: "A", valueNote: "承重 18kg，双屏或带鱼屏一托搞定，气弹簧结构省力。比 NB H180 承重更高、价格更低；若只是双 27 英寸，H180 的升降行程反而更宽裕。",          use: ["office", "create"], audience: ["office", "creator"], tags: ["多屏"],     specs: "承重 18kg;双 13-32 英寸;气弹簧", compat: "双屏或超宽屏用户，注意桌面厚度" },

    { id: "s8", brand: "绿联", model: "笔记本折叠便携支架", name: "绿联 笔记本折叠便携支架", searchName: "绿联 笔记本折叠便携支架", style: "笔记本支架", price: [49, 69], rating: 4, valueGrade: "A", valueNote: "铝合金五档升降、折叠后巴掌大，通勤出差随手把笔记本垫到舒适高度。无旋转且承重一般，17.3 英寸以上游戏本别硬上；固定工位请选机械臂。", use: ["portable", "office"], audience: ["mobile", "student"], tags: ["便携", "高性价比"], specs: "铝合金;5档升降;折叠收纳;17.3吋内", compat: "13-15.6 吋轻薄本通勤适用" },
    { id: "s9", brand: "奥睿科", model: "HSQ-M1", name: "奥睿科 HSQ-M1", searchName: "奥睿科 HSQ-M1", style: "显示器增高架", price: [59, 79], rating: 4, valueGrade: "B", valueNote: "六十块把显示器垫高 10cm 还白捡一层键盘收纳位，桌面整洁度立竿见影。高度固定不可调，需要频繁调视角请选机械臂；木纹板颜值见仁见智。", use: ["office"], audience: ["office", "student"], tags: ["省事", "高性价比"], specs: "木纹面板;键盘下收纳;桌面置物", compat: "桌面整理入门，预算优先" },
  ],

  /* ---------- 显示器 ---------- */
  monitor: [
    { id: "m1", brand: "小米",      model: "Redmi A27Q",          name: "小米 Redmi A27Q", searchName: "小米 Redmi A27Q", style: "27英寸 2K", price: [649, 909],   rating: 5, valueGrade: "S", valueNote: "27 英寸 2K 120Hz 的入门守门员，办公看剧都够，青山护眼屏对久坐党友好。想要 170Hz 以上电竞体验得看泰坦军团或 AOC；Type-C 版才能一线连笔记本。",         use: ["office", "game"], audience: ["student", "office"], tags: ["高性价比"], specs: "27\";2K 120Hz;IPS;双重广色域;Type-C 可选", compat: "入门显卡即可带动，办公/轻度游戏首选" },
    { id: "m2", brand: "泰坦军团",  model: "P2710R2+",             name: "泰坦军团 P2710R2+", searchName: "泰坦军团 P2710R2+", style: "27英寸 2K 高刷", price: [779, 949],   rating: 5, valueGrade: "S", valueNote: "799 元档无对手的 2K 高刷，超频 235Hz 配 Fast IPS 与 HDR500。比小米 A27Q 贵一两百但刷新率翻倍；显卡至少 RTX 5060 级才喂得满。",                    use: ["game", "office"], audience: ["gamer", "student"], tags: ["高性价比", "电竞"], specs: "27\";2K 235Hz 超频;Fast IPS;1ms;HDR500", compat: "RTX 5060 级显卡可带满帧率" },
    { id: "m3", brand: "AOC",       model: "Q27G4SP",             name: "AOC Q27G4SP", searchName: "AOC Q27G4SP", style: "27英寸 2K 高刷", price: [1250, 1399],  rating: 4, valueGrade: "A", valueNote: "一线大厂 2K 高刷甜点，品控与售后比白牌省心。参数并不占优——同价能买到刷新率更高的国产品牌，多付的两三百买的是不出事。",            use: ["game", "office"], audience: ["gamer", "office"], tags: ["电竞", "大品牌"], specs: "27\";2K 170Hz;IPS;HDR10", compat: "品牌控优先，比白牌贵约 200 买放心" },
    { id: "m4", brand: "雷鸟",      model: "Q6",                   name: "雷鸟 Q6", searchName: "雷鸟 Q6", style: "27英寸 2K MiniLED", price: [1330, 1799],  rating: 5, valueGrade: "S", valueNote: "2K 档少见的 QD-MiniLED，HDR600 配 98% DCI-P3，游戏修图双修。比同价 IPS 高刷贵 200-400 元换画质；追极限刷新率请上 320Hz 双模机型。",                  use: ["game", "create"], audience: ["gamer", "creator"], tags: ["电竞", "高色域"], specs: "27\";2K 180Hz;QD-MiniLED;HDR600;DCI-P3 ≥98%", compat: "游戏党升级首选，兼顾轻度修图" },
    { id: "m5", brand: "雷鸟",      model: "U6",                   name: "雷鸟 U6", searchName: "雷鸟 U6", style: "27英寸 4K", price: [1315, 1999],  rating: 5, valueGrade: "S", valueNote: "4K 性价比之王，QD-MiniLED 面板配 Type-C 90W 反向充电，笔记本一线连首选，办公修图闭眼入。60Hz 不适合硬核电竞，追高帧得选 4K 160Hz 档。",                    use: ["office", "create"], audience: ["office", "creator"], tags: ["高性价比", "清晰"], specs: "27\";4K 60Hz;QD-MiniLED;HDR600;Type-C 90W", compat: "笔记本外接首选，Type-C 一线连" },
    { id: "m6", brand: "泰坦军团",  model: "P275MV MAX",           name: "泰坦军团 P275MV MAX", searchName: "泰坦军团 P275MV MAX", style: "27英寸 4K 高刷", price: [2200, 2499], rating: 4, valueGrade: "A", valueNote: "2304 分区 MiniLED、4K 170Hz 可切 340Hz 双模，两三千档的画质天花板。需 RTX 5070 Ti 级显卡才跑得动 4K 高刷；纯办公用属于性能过剩。",               use: ["game", "create"], audience: ["creator", "gamer"], tags: ["旗舰", "MiniLED"], specs: "27\";4K 170Hz 双模 340Hz;2304 分区 MiniLED;HDR1400;Type-C 90W", compat: "需 RTX 5070 Ti 级显卡跑 4K 高刷" }
,
    { id: "m7",  brand: "AOC",       model: "24G4",              name: "AOC 24G4", searchName: "AOC 24G4", style: "24英寸 1080P 高刷", price: [599, 699], rating: 4, valueGrade: "A", valueNote: "24 英寸小屏高帧，FPS 玩家性价比之选，1080P 对显卡压力小、一眼看得全。分辨率只有 1080P，做设计或看细节不如 2K；当办公主屏也偏小。",        use: ["game"],           audience: ["gamer", "student"], tags: ["电竞"],     specs: "24\";1080P 180Hz;Fast IPS;1ms", compat: "FPS 玩家小屏高帧，显卡压力低" },
    { id: "m8",  brand: "雷鸟",   model: "27U8A",             name: "雷鸟 27U8A", searchName: "雷鸟 27U8A", style: "27英寸 4K MiniLED", price: [1889, 2299], rating: 5, valueGrade: "S", valueNote: "4K 160Hz 与 1080P 320Hz 双模切换，一台兼顾 3A 画质与竞技帧率。需 RTX 5070 级显卡；只玩 1080P 就浪费了这块 MiniLED 屏。",                 use: ["game", "create"], audience: ["gamer", "creator"], tags: ["MiniLED", "双模"], specs: "27英寸;4K 160Hz / 1080P 320Hz;MiniLED;HDR1000;95% DCI-P3", compat: "需 RTX 5070 级显卡跑 4K 高刷，游戏创作两用" },
    { id: "m9",  brand: "雷神",   model: "CU27F160M-EVO",     name: "雷神 CU27F160M-EVO", searchName: "雷神 CU27F160M-EVO", style: "27英寸 4K MiniLED", price: [2199, 2499], rating: 4, valueGrade: "A", valueNote: "1152 分区 MiniLED、HDR1000 亮度扎实，4K 高刷的稳当入门。分区数低于同价位 P275MV MAX 的 2304，看 HDR 高光细节会差一口气。",              use: ["game", "create"], audience: ["gamer", "creator"], tags: ["MiniLED", "1152分区"], specs: "27英寸;4K 160Hz;1152 分区;HDR1000", compat: "4K 高刷入门甜点，配 5070 Ti 更稳" },
    { id: "m10", brand: "HKC",    model: "G27M7Pro",          name: "HKC G27M7Pro", searchName: "HKC G27M7Pro", style: "27英寸 4K MiniLED", price: [2399, 2699], rating: 4, valueGrade: "A", valueNote: "QD-MiniLED 双模加 HDR1400 峰值亮度，HDR 观影与 3A 兼顾且越级。刷新率与分区规格已落后新一代 170Hz 双模机型半代，追新可再等等。",            use: ["game", "create"], audience: ["gamer", "creator"], tags: ["MiniLED", "HDR1400"], specs: "27英寸;4K 160Hz / 1080P 320Hz;QD-MiniLED;HDR1400", compat: "高亮度 HDR 观影与 3A 兼顾" },
    { id: "m11", brand: "AOC",    model: "AG276UZD",          name: "AOC AG276UZD", searchName: "AOC AG276UZD", style: "26.5英寸 2K OLED", price: [3299, 3699], rating: 4, valueGrade: "A", valueNote: "QD-OLED 360Hz 零拖影，竞技响应上限最高，显卡压力还低于 4K。纯竞技向，生产力场景不如同价 4K 面板；OLED 长期挂静态界面要留意烧屏。",                 use: ["game"], audience: ["gamer"], tags: ["OLED", "高刷"], specs: "26.5英寸;2K 360Hz;QD-OLED;HDR400", compat: "纯竞技向，显卡压力低于 4K" },
    { id: "m12", brand: "微星",   model: "MAG321UPX QD-OLED", name: "微星 MAG321UPX", searchName: "微星 MAG321UPX", style: "32英寸 4K QD-OLED", price: [4199, 4599], rating: 4, valueGrade: "A", valueNote: "32 英寸 4K 240Hz QD-OLED 加 Type-C，桌面旗舰终端，一次到位能用很多年。要 RTX 5080 级显卡才喂得满，且价格与烧屏风险都属高端。",             use: ["create", "game"], audience: ["creator", "gamer"], tags: ["OLED", "旗舰", "4K"], specs: "31.5英寸;4K 240Hz;QD-OLED;0.03ms;Type-C", compat: "旗舰机一步到位，需 5080 级显卡喂满" },

    { id: "m13", brand: "HKC", model: "G24H2", name: "HKC G24H2", searchName: "HKC G24H2", style: "24英寸 2K 高刷", price: [749, 799], rating: 5, valueGrade: "S", valueNote: "749 的 24 寸 2K 180Hz，小桌面电竞的甜点尺寸，支架升降旋转全给。亮度一般，靠窗强光位慎重；桌面够大就加几十块上 27 寸款。", use: ["game", "office"], audience: ["student", "gamer"], tags: ["高性价比", "电竞"], specs: "23.8\";2K 180Hz;Fast IPS;升降旋转", compat: "RTX 5050 级即可带满，小桌面首选" },
    { id: "m14", brand: "小米", model: "Redmi G27Q 2026款", name: "小米 Redmi G27Q 2026款", searchName: "小米 Redmi G27Q 2026款", style: "27英寸 2K 高刷", price: [769, 799], rating: 5, valueGrade: "S", valueNote: "八百内把 200Hz、HDR400、10bit、硬件低蓝光全堆上，参数卷到没朋友。对比度是 IPS 常规水平，影音发烧友请加钱 MiniLED；性价比党闭眼冲。", use: ["game", "office"], audience: ["student", "gamer"], tags: ["高性价比", "高刷"], specs: "27\";2K 200Hz;Fast IPS;HDR400;硬件低蓝光", compat: "RTX 5060 级显卡可喂饱，国补后更便宜" },
    { id: "m15", brand: "AOC", model: "U32N10", name: "AOC U32N10", searchName: "AOC U32N10", style: "32英寸 4K", price: [1599, 1699], rating: 4, valueGrade: "A", valueNote: "32 寸 4K 大屏配 PBP/PIP 分屏，表格文档一屏铺开的办公利器，VA 高对比看剧也舒服。只有 60Hz，电竞玩家请绕道；要全能加钱上 U27G4F。", use: ["office"], audience: ["office"], tags: ["4K", "大品牌"], specs: "31.5\";4K 60Hz;VA;PBP/PIP 分屏", compat: "核显即可点亮，办公/影音大屏首选" },
    { id: "m16", brand: "AOC", model: "U27G4F", name: "AOC U27G4F", searchName: "AOC U27G4F", style: "27英寸 4K 双模", price: [1599, 1661], rating: 4, valueGrade: "A", valueNote: "4K 190Hz 与 1080P 380Hz 双模一键切换，一台屏同时伺候 3A 画质党与电竞帧率党，450nit 亮度够亮。双模有学习成本；只玩 3A 可省几百。", use: ["game"], audience: ["gamer"], tags: ["双模", "4K", "高刷"], specs: "27\";4K 190Hz/1080P 380Hz 双模;Fast IPS;450nit", compat: "3A+电竞双栖玩家，显卡建议 5070 级" },
    { id: "m17", brand: "AOC", model: "CU34G4H", name: "AOC CU34G4H", searchName: "AOC CU34G4H", style: "34英寸 带鱼屏", price: [1799, 1899], rating: 4, valueGrade: "A", valueNote: "3440×1440 准 4K 宽屏 + 200Hz，1500R 曲面沉浸感拉满，出厂校色 ΔE<2 干活游戏两不误。VA 可视角度一般，专业修图请选 IPS；桌深要 70cm 起。", use: ["game", "create"], audience: ["gamer", "creator"], tags: ["多屏", "高刷"], specs: "34\"曲面1500R;3440×1440 准4K;200Hz;ΔE<2", compat: "显卡建议 5070 级，桌面进深 ≥70cm" },
    { id: "m18", brand: "微星", model: "MAG 272QP QD-OLED", name: "微星 MAG 272QP QD-OLED", searchName: "微星 MAG 272QP QD-OLED", style: "27英寸 2K OLED", price: [2299, 2399], rating: 5, valueGrade: "S", valueNote: "QD-OLED 跌破 2300 的降价先锋，0.03ms 响应与真黑场碾压同价 LCD，三年烧屏包换兜底。全屏亮度偏低，明亮客厅慎用；暗室游戏影音直接封神。", use: ["game", "create"], audience: ["gamer", "creator"], tags: ["OLED", "高刷"], specs: "27\";2K 240Hz;QD-OLED;0.03ms;Type-C", compat: "暗光环境游戏/影音，显卡建议 5070 级" },
    { id: "m19", brand: "小米", model: "Redmi A24 100Hz", name: "小米 Redmi A24 100Hz", searchName: "小米 Redmi A24 100Hz 显示器", style: "24英寸 1080P", price: [429, 499], rating: 4, valueGrade: "A", valueNote: "入门办公屏守门员，1080P 100Hz + 低蓝光，439 元交个朋友。只办公看网课闭眼买；打游戏或想要 2K 细腻度请加钱上 A27Q 或 24G4。", use: ["office"], audience: ["office", "student"], tags: ["入门", "高性价比"], specs: "23.8英寸;1080P 100Hz;IPS;低蓝光;75×75 壁挂", compat: "核显办公机绝配，预算 500 内的唯一答案" }
  ],

  /* ---------- 键鼠外设 ---------- */
  input: [
    { id: "k1", brand: "达尔优",    model: "DK100",               name: "达尔优 DK100", searchName: "达尔优 DK100", style: "机械键盘", price: [109, 149],   rating: 4, valueGrade: "S", valueNote: "百元档机械键盘入门，104 键全尺寸带数字区，办公学生党首选。塑料外壳质感普通，想要 Gasket 软弹手感与三模得加钱上狼蛛 F87。",              use: ["office"],             audience: ["student", "office"], tags: ["高性价比"], specs: "104 键;青/黑轴;混光背光", compat: "预算型办公与备用键盘" },
    { id: "k2", brand: "狼蛛",      model: "F87",                  name: "狼蛛 F87", searchName: "狼蛛 F87", style: "机械键盘", price: [149, 249],   rating: 5, valueGrade: "S", valueNote: "200 元档的 Gasket 卷王，三模、全键热插拔、RGB 一次给齐，87 配列还省桌面。砍掉了数字小键盘，财务统计这类高频录入不适合；无线也有极轻微延迟。",            use: ["game", "office"], audience: ["gamer", "student"], tags: ["高性价比", "三模"], specs: "87 键;Gasket;三模;全键热插拔;4000mAh", compat: "游戏办公通吃，性价比天花板" },
    { id: "k3", brand: "VGN",       model: "V98 Pro V3",           name: "VGN V98 Pro V3", searchName: "VGN V98 Pro V3", style: "机械键盘", price: [259, 349],   rating: 5, valueGrade: "A", valueNote: "98 配列长期标杆，保留数字区却只比 87 键宽一点，冰淇淋/极地狐轴手感扎实。比狼蛛 F87 贵约 100 元，买的是配列完整度与手感上限。",                use: ["game", "create"], audience: ["gamer", "creator"], tags: ["手感", "三模"], specs: "98 键;三模;冰淇淋/极地狐轴;8000mAh", compat: "带数字区的游戏/办公主力键盘" },
    { id: "k4", brand: "VGN",       model: "蜻蜓 R1",              name: "VGN 蜻蜓 R1", searchName: "VGN 蜻蜓 R1", style: "无线鼠标", price: [69, 99],    rating: 5, valueGrade: "S", valueNote: "百元内 3395 传感器卷王，48g 轻量化加三模，小手抓握与指握的入门首选。PAW3395SE 是精简版，极限高 DPI 略逊满血 3395；大手型握着偏小。",                  use: ["game", "portable"], audience: ["student", "gamer"], tags: ["高性价比", "轻量化"], specs: "PAW3395SE;48g;三模;2K 回报率", compat: "小手抓握/指握玩家首选" },
    { id: "k5", brand: "迈从",      model: "A5",                   name: "迈从 A5", searchName: "迈从 A5", style: "无线鼠标", price: [170, 240],   rating: 5, valueGrade: "S", valueNote: "4K 回报率的类 GPW 模具，旗舰手感平民价，中大手抓握的 FPS/MOBA 玩家首选。比蜻蜓 R1 贵约 100 元，换满血传感器与更高回报率；重量多 8g。",             use: ["game"],               audience: ["gamer"], tags: ["电竞", "高回报率"], specs: "PAW3395;56g;4K 回报率;类 GPW 模具", compat: "FPS/MOBA 玩家，中大手抓握" },
    { id: "k6", brand: "雷蛇",      model: "毒蝰 V3 极速版",        name: "雷蛇 毒蝰V3极速版", searchName: "雷蛇 毒蝰 V3 极速版", style: "无线鼠标", price: [289, 399],  rating: 4, valueGrade: "A", valueNote: "一线大厂轻量化甜点，光学微动加品牌手感，耐用度扎实。80-99g 在当下轻量化潮流里偏重，同价国产已能买到 50g 级；买它主要为品牌与售后。",                  use: ["game"],               audience: ["gamer"], tags: ["电竞", "大品牌"], specs: "80-99g;≥1000mAh;光学微动", compat: "品牌控与长时间游戏用户" }
,
    { id: "k7",  brand: "黑爵",      model: "AKKO 4084",         name: "黑爵 AKKO 4084", searchName: "黑爵 AKKO 4084", style: "机械键盘", price: [199, 259],  rating: 4, valueGrade: "A", valueNote: "84 配列矮轴，桌面紧张或通勤携带都能塞进包里，三模加热插拔。矮轴键程浅、可玩性低，追手感请回狼蛛 F87 那类常规轴键盘。",           use: ["office", "game"], audience: ["office", "student"], tags: ["矮轴", "便携"], specs: "84 键;矮轴;三模;热插拔", compat: "桌面空间紧张/通勤携带用户" },
    { id: "k8",  brand: "ROG",     model: "夜魔 X",             name: "ROG 夜魔 X", searchName: "ROG 夜魔 X", style: "三模机械键盘", price: [1849, 1999], rating: 5, valueGrade: "B", valueNote: "2 英寸 OLED 屏加全键热插拔，旗舰手感天花板，客制化门槛低。价格已摸到客制化成品区间，追纯手感不如 Keychron；买它多是冲灯效与品牌。",     use: ["game", "create"], audience: ["gamer", "creator"], tags: ["旗舰", "OLED屏", "三模"], specs: "全键热插拔;2 英寸 OLED;冰暴灰轴 V2 / 雪武白轴 V2;三面透光", compat: "一步到位的主力键盘，客制化门槛低" },
    { id: "k9",  brand: "Keychron", model: "Q13 Ultra 8K",     name: "Keychron Q13 Ultra 8K", searchName: "Keychron Q13 Ultra 8K", style: "客制化机械键盘", price: [1601, 1899], rating: 5, valueGrade: "B", valueNote: "CNC 铝合金加 96% Alice 配列，无线 8K 还能撑 660 小时，长时间码字肩腕更放松。Alice 配列需要适应期，电竞玩家换手位会不习惯。",   use: ["create", "office"], audience: ["creator", "office"], tags: ["客制化", "铝壳", "8K"], specs: "96% Alice 布局;CNC 铝合金;Gasket 六层填充;三模 8000Hz;660 小时续航", compat: "长时间码字/剪辑，肩腕更放松" },
    { id: "k10", brand: "ROG",     model: "龙鳞 2 Ace",        name: "ROG 龙鳞 2 Ace", searchName: "ROG 龙鳞 2 Ace", style: "无线鼠标", price: [909, 999], rating: 5, valueGrade: "B", valueNote: "48g 超轻加 AimPoint Pro 42K，8K 无线低延迟，FPS 硬核玩家的下限保障。近千元是纯竞技溢价，休闲玩家用蜻蜓 R1 或迈从 A5 完全够。",      use: ["game"], audience: ["gamer"], tags: ["旗舰", "轻量化", "8K"], specs: "48g;AimPoint Pro 42K;SpeedNova 8K 无线", compat: "FPS 硬核玩家，1 亿次按键寿命" },
    { id: "k11", brand: "罗技",    model: "MX Master 4",        name: "罗技 MX Master 4", searchName: "罗技 MX Master 4", style: "无线鼠标", price: [999, 1099], rating: 4, valueGrade: "B", valueNote: "生产力标杆，多设备切换加人机工学造型，剪辑、编程、多机党都吃这套。它不是电竞向产品，回报率与重量都不适合 FPS，游戏党别买错方向。",            use: ["office", "create"], audience: ["creator", "office"], tags: ["生产力", "人体工学"], specs: "右手人体工学;多设备切换;高精度追踪", compat: "剪辑/编程/多机党效率工具，非纯电竞向" },
    { id: "k12", brand: "万灵竞记", model: "幻63",              name: "万灵竞记 幻63", searchName: "万灵竞记 幻63", style: "磁轴电竞键盘", price: [1749, 1899], rating: 4, valueGrade: "B", valueNote: "镁合金机身加磁轴 0.001mm RT 精度，纯竞技向的极致触发。近两千元只为一件事服务，办公与创作属于浪费；磁轴手感与机械差异明显，建议先上手试。",               use: ["game"], audience: ["gamer"], tags: ["磁轴", "镁合金"], specs: "63 键;镁合金机身;8000Hz;磁轴 RT 0.001mm", compat: "纯竞技向，追求极致触发精度" },

    { id: "k13", brand: "罗技", model: "G304 LIGHTSPEED", name: "罗技 G304 LIGHTSPEED", searchName: "罗技 G304 LIGHTSPEED", style: "无线鼠标", price: [129, 179], rating: 4, valueGrade: "A", valueNote: "最便宜的 LIGHTSPEED 无线鼠，AA 电池一装大半年，稳定不折腾就是它最大的参数。传感器已是上代、无蓝牙；追新参数请加钱上国产 3395 鼠。", use: ["game", "office"], audience: ["student", "office"], tags: ["轻量化", "大品牌"], specs: "2.4G无线;HERO 12000DPI;99g;AA电池", compat: "笔记本/台式通吃，备用电池常备" },
    { id: "k14", brand: "ATK", model: "RS7 Air", name: "ATK RS7 Air", searchName: "ATK RS7 Air", style: "磁轴电竞键盘", price: [330, 399], rating: 4, valueGrade: "A", valueNote: "三百档磁轴爆品，RT 急停手感兑现稳定，Gasket 结构加全键热插拔，瓦与 CS 玩家平价上车首选。仅有线连接；桌面无线党请看三模款。", use: ["game"], audience: ["gamer", "student"], tags: ["磁轴", "高性价比"], specs: "81键;磁轴RT;Gasket;全键热插拔;有线", compat: "FPS 电竞首选，轴体可自行更换" },
    { id: "k15", brand: "WOB", model: "Rainy75 雨75", name: "WOB Rainy75 雨75", searchName: "WOB Rainy75 雨75", style: "三模机械键盘", price: [499, 529], rating: 4, valueGrade: "A", valueNote: "铝坨坨 Gasket 三模标杆，填充堆料到顶，声音手感全面越级，五百档几乎没有对手。分量不轻，经常带出门的请选矮轴便携款。", use: ["office", "game"], audience: ["office", "gamer"], tags: ["三模", "铝壳", "手感"], specs: "81键三模;铝壳Gasket;热插拔;RGB", compat: "桌面主力键盘，轴体键帽可玩性高" },
    { id: "k16", brand: "罗技", model: "GPW4 朱雀", name: "罗技 GPW4 朱雀", searchName: "罗技 GPW4 朱雀", style: "无线鼠标", price: [571, 649], rating: 5, valueGrade: "S", valueNote: "旗舰模具 HERO2 + 8K 回报率打到六百内，58g 轻量化 FPS 一步到位，比发售价近乎腰斩。无灯、侧键少，MMO 多键需求与办公党请选别家。", use: ["game"], audience: ["gamer"], tags: ["轻量化", "高回报率", "电竞"], specs: "2.4G+蓝牙;HERO2;58g;8K回报率", compat: "FPS 玩家毕业鼠，配大脚贴手感更佳" },
  ],

  /* ---------- 音频设备 ---------- */
  audio: [
    { id: "a1", brand: "漫步者",    model: "R20",                  name: "漫步者 R20", searchName: "漫步者 R20", style: "桌面音箱", price: [159, 199],   rating: 4, valueGrade: "S", valueNote: "百元档蓝牙 2.0，USB 即插即用，小桌面与宿舍省心不占地。音质只到够用级别，追低音与人声细节要加钱上漫步者 D12 或 R1080BT。",                    use: ["office", "game"], audience: ["student", "office"], tags: ["高性价比"], specs: "2.0 声道;蓝牙 6.0;USB 即插即用", compat: "小桌面/宿舍首选，省心不占地" },
    { id: "a2", brand: "漫步者",    model: "D12",                  name: "漫步者 D12", searchName: "漫步者 D12", style: "桌面音箱", price: [307, 440],   rating: 4, valueGrade: "A", valueNote: "四单元一体式设计，音质均衡，办公桌与客厅电视两用。一体式声场不如同价分体 2.0；桌面够宽的话，R1080BT 的木质箱体听感更讨喜。",                  use: ["office", "game"], audience: ["office", "student"], tags: ["音质"], specs: "2.0 声道;4 单元;DSP 数字音频;蓝牙 5.0", compat: "办公桌与客厅电视两用" },
    { id: "a3", brand: "漫步者",    model: "R1080BT",              name: "漫步者 R1080BT", searchName: "漫步者 R1080BT", style: "桌面音箱", price: [230, 419],   rating: 4, valueGrade: "A", valueNote: "入门木质箱体标杆，4 英寸中低音配丝绢高音，桌面近场听音的 HiFi 启蒙。接口只到蓝牙/AUX/LINE，没有光纤同轴；接电视前先看清接口是否够用。",               use: ["office", "create"], audience: ["office", "creator"], tags: ["音质", "木质箱体"], specs: "4 英寸中低音+丝绢高音;蓝牙/AUX/LINE", compat: "桌面近场听音首选，预算友好" },
    { id: "a4", brand: "惠威",      model: "D1100",                name: "惠威 D1100", searchName: "惠威 D1100", style: "桌面音箱", price: [509, 659],   rating: 5, valueGrade: "A", valueNote: "进阶 HiFi 甜点，猫眼号角高音通透，还带同轴与光纤输入，接电视比 R1080BT 方便。比漫步者同档贵约 200 元，换的是高音解析与接口规格。",                use: ["create", "office"], audience: ["creator", "office"], tags: ["音质", "HiFi"], specs: "20mm 球顶高音+4 英寸中低音;同轴/光纤输入", compat: "对音质有要求的创作者与听音党" },
    { id: "a5", brand: "漫步者",    model: "S1000MKII",            name: "漫步者 S1000MKII", searchName: "漫步者 S1000MKII", style: "桌面音箱", price: [899, 1199], rating: 5, valueGrade: "B", valueNote: "HiFi 级 2.0，120W 大功率配 5.5 英寸中低音，客厅当电视音响也够。桌面近场用体积偏大，小桌子建议退回 D1100 或 R1080BT。",         use: ["create"],             audience: ["creator"], tags: ["HiFi", "大功率"], specs: "钛顶高音+5.5 英寸中低音;120W;APTX 蓝牙", compat: "预算充足的影音发烧友" }
,
    { id: "a6",  brand: "惠威",      model: "M200MKIII+",        name: "惠威 M200MKIII+", searchName: "惠威 M200MKIII+", style: "桌面音箱", price: [1798, 2088], rating: 5, valueGrade: "A", valueNote: "经典 5.25 英寸木质 2.0，近场监听味足，桌面与客厅两用，不少机主用十年不换。价格是入门箱的三倍以上，听个响的话属于严重浪费。",        use: ["create", "office"], audience: ["creator", "office"], tags: ["HiFi", "木质"], specs: "5.25 英寸;木质箱体;2.0 声道", compat: "桌面近场与客厅电视两用" },

    { id: "a7", brand: "漫步者", model: "W820NB 三金标版", name: "漫步者 W820NB 三金标版", searchName: "漫步者 W820NB 三金标版", style: "蓝牙降噪耳机", price: [309, 369], rating: 4, valueGrade: "S", valueNote: "-49dB 降噪加 83 小时续航再加 LDAC 三金标，三百档通勤降噪天花板。蓝牙延迟高，FPS 听声辨位别用它；打游戏请选飓风 3 有线款。", use: ["office", "portable"], audience: ["student", "office"], tags: ["音质", "高性价比"], specs: "-49dB降噪;83h续航;LDAC;蓝牙5.3", compat: "通勤/影音/网课，电竞党绕道" },
    { id: "a8", brand: "罗技", model: "G335", name: "罗技 G335", searchName: "罗技 G335", style: "游戏耳机", price: [377, 399], rating: 4, valueGrade: "B", valueNote: "240g 轻量佩戴舒适，翻转即静音的麦克风设计讨巧，配色年轻。音质平淡无 7.1，同价飓风 3 的单元与声卡全面更强；图轻便好看再选它。", use: ["game"], audience: ["student", "gamer"], tags: ["轻量化"], specs: "40mm单元;240g;3.5mm有线;翻转静音麦", compat: "多平台即插即用，轻量优先" },
    { id: "a9", brand: "HyperX", model: "飓风3", name: "HyperX 飓风3", searchName: "HyperX 飓风3", style: "游戏耳机", price: [461, 599], rating: 4, valueGrade: "A", valueNote: "53mm 单元加 USB 声卡加 DTS 空间音效，FPS 听声辨位的口碑标杆，可拆降噪麦开黑清晰。有线束缚桌面，无线需求请加钱；纯听歌不值这个价。", use: ["game"], audience: ["gamer"], tags: ["电竞", "音质"], specs: "53mm单元;USB声卡;DTS空间音效;可拆麦", compat: "FPS 电竞首选，PC/主机通吃" },
    { id: "a10", brand: "闪克", model: "DM20", name: "闪克 DM20", searchName: "闪克 DM20", style: "桌面麦克风", price: [197, 232], rating: 4, valueGrade: "A", valueNote: "USB 即插即用的心形指向电容麦，主动降噪压得住键盘声，网课直播与语音会议的性价比之王。无 XLR 口升级空间小；专业录音请上看千元档。", use: ["office", "create"], audience: ["student", "creator"], tags: ["高性价比"], specs: "USB即插即用;心形指向;主动降噪;圆盘底座", compat: "网课/直播/语音会议即插即用" },
  ],

  /* ---------- 网络设备 ---------- */
  network: [
    { id: "n1", brand: "小米",      model: "BE3600 2.5G 版",        name: "小米 BE3600 2.5G 版", searchName: "小米 BE3600 2.5G 版", style: "WiFi7 路由", price: [140, 180],  rating: 5, valueGrade: "S", valueNote: "百元 WiFi7 带一个 2.5G 口，80-100㎡ 小户型神器。只有单 2.5G 口，多设备有线互联要上 BE6500；宽带低于 500M 时这口也吃不满。",                use: ["office", "portable"], audience: ["student", "office"], tags: ["高性价比", "WiFi7"], specs: "WiFi7;高通四核;1×2.5G 口;支持 Mesh", compat: "80-100㎡ 小户型，宽带 ≥500M 优先 2.5G 口" },
    { id: "n2", brand: "TP-LINK",   model: "XDR3010 易展版",        name: "TP-LINK XDR3010 易展版", searchName: "TP-LINK XDR3010 易展版", style: "WiFi6 路由", price: [135, 150],  rating: 4, valueGrade: "A", valueNote: "固件稳定、故障率低，老房子与多设备家庭的省心解。制式停在 WiFi6 AX3000，也没有 2.5G 口；追新制式与吞吐请直接看 WiFi7 那几款。",               use: ["office"],             audience: ["student", "office"], tags: ["稳定"], specs: "WiFi6;AX3000;易展 Mesh", compat: "多设备家庭，追求省心" },
    { id: "n3", brand: "红米",      model: "AX5400",               name: "红米 AX5400", searchName: "红米 AX5400", style: "WiFi6 路由", price: [319, 399],   rating: 4, valueGrade: "A", valueNote: "家用爆款，带机量大、发热控制好，适合 100-130㎡ 主力。WiFi6 制式相比同价 WiFi7 已是上一代，价格也没更便宜，性价比反而不如小米 BE6500。",                    use: ["game", "office"], audience: ["office", "gamer"], tags: ["带机强", "稳定"], specs: "WiFi6;AX5400;大内存", compat: "100-130㎡ 家用主力" },
    { id: "n4", brand: "小米",      model: "BE6500",               name: "小米 BE6500", searchName: "小米 BE6500", style: "WiFi7 路由", price: [279, 420],   rating: 5, valueGrade: "S", valueNote: "最便宜的全 2.5G 口 WiFi7，300 元档王者，千兆宽带、大户型、多设备家庭首选。天线增益一般，超大平层或穿墙需求多时，中兴 BE7200 Pro+ 更稳。",            use: ["game", "create"], audience: ["gamer", "creator"], tags: ["WiFi7", "全2.5G口"], specs: "WiFi7;全 2.5G 网口;512MB 内存;IPQ5322", compat: "千兆宽带/大户型/多设备家庭首选" },
    { id: "n5", brand: "中兴",      model: "BE7200 Pro+",           name: "中兴 BE7200 Pro+", searchName: "中兴 BE7200 Pro+", style: "WiFi7 路由", price: [459, 539],   rating: 5, valueGrade: "A", valueNote: "双 2.5G 口加 MLO 多链路聚合与 8 天线，游戏低延迟抗干扰，大户型优选。比小米 BE6500 贵约 150 元，房间不大或宽带没到千兆就吃不到这个差价。",                    use: ["game", "create"], audience: ["gamer"], tags: ["电竞", "强信号"], specs: "WiFi7;双 2.5G;MLO 多链路聚合;8 天线", compat: "电竞玩家与大平层覆盖" }
,
    { id: "n6",  brand: "华硕",      model: "TUF BE3600",        name: "华硕 TUF BE3600", searchName: "华硕 TUF BE3600", style: "WiFi7 路由", price: [299, 399], rating: 4, valueGrade: "A", valueNote: "军规散热与游戏加速引擎，电竞玩家在意的稳定性够。规格是 WiFi7 入门档、只有一个 2.5G 口；同价小米 BE6500 接口更满，买它主要买品牌固件。",          use: ["game"],           audience: ["gamer"], tags: ["电竞", "稳定"], specs: "WiFi7;2.5G 口;游戏加速引擎", compat: "电竞玩家，大户型可组 Mesh" },

    { id: "n7", brand: "小米", model: "AX3000T", name: "小米 AX3000T", searchName: "小米 AX3000T", style: "WiFi6 路由", price: [119, 143], rating: 4, valueGrade: "S", valueNote: "百元档 AX3000 双频，米家生态一键配网，小户型与宿舍覆盖够用。没有 2.5G 口，超千兆宽带跑不满；大户型请上看 BE6500 或 Mesh 组网。", use: ["office"], audience: ["student", "office"], tags: ["高性价比", "稳定"], specs: "AX3000双频;4千兆口;支持Mesh;256MB内存", compat: "千兆内宽带/小户型，米家用户优先" },
    { id: "n8", brand: "TP-LINK", model: "TL-SH1005 2.5G版", name: "TP-LINK TL-SH1005 2.5G版", searchName: "TP-LINK TL-SH1005 2.5G版", style: "2.5G 交换机", price: [220, 260], rating: 4, valueGrade: "A", valueNote: "两百出头把 NAS、电脑、路由全拉上 2.5G 内网，金属壳无风扇静音、即插即用。非网管型没有 VLAN 与链路聚合；折腾软路由的请看网管款。", use: ["office", "create"], audience: ["office", "creator"], tags: ["高速", "全2.5G口"], specs: "5×2.5G电口;金属外壳;无风扇;即插即用", compat: "NAS/2.5G 内网升级枢纽" },
  ],

  /* ---------- 拓展坞 ---------- */
  dock: [
    { id: "d1", brand: "绿联",      model: "Type-C 7合1",           name: "绿联 Type-C 7合1", searchName: "绿联 Type-C 7合1", style: "便携拓展坞", price: [80, 179],   rating: 5, valueGrade: "S", valueNote: "轻薄本标配，HDMI 4K 加三个 USB3.0、PD 100W 与读卡槽，一线连全解决。7 合 1 没有双 HDMI 与网口，要外接双屏或有线网络得换 10 合 1。",                  use: ["portable", "office"], audience: ["mobile", "student"], tags: ["便携", "高性价比"], specs: "HDMI 4K+USB3.0×3+PD 100W+SD", compat: "MacBook/轻薄本扩展接口必买" },
    { id: "d2", brand: "倍思",      model: "Type-C 集线器",          name: "倍思 Type-C 集线器", searchName: "倍思 Type-C 集线器", style: "便携拓展坞", price: [55, 129],   rating: 4, valueGrade: "A", valueNote: "基础扩展的低价方案，出差备用不心疼，铝合金机身。只有 HDMI 加三个 USB，没有 PD 快充与读卡；当长期主力坞建议上绿联 7 合 1。",                      use: ["portable"],             audience: ["student", "mobile"], tags: ["便携", "高性价比"], specs: "HDMI+USB3.0×3;铝合金机身", compat: "接口紧张的基础解决方案" },
    { id: "d3", brand: "绿联",      model: "10合1 桌面坞",           name: "绿联 10合1 桌面坞", searchName: "绿联 10合1 桌面坞", style: "桌面拓展坞", price: [185, 299],   rating: 4, valueGrade: "A", valueNote: "双 HDMI 4K 加千兆网口、SD/TF 读卡与 PD，桌面一线到位，外接双屏与有线网络首选。桌面坞体积大不便携，常出差的人仍要再配一个便携款。",                  use: ["office", "create"], audience: ["office", "creator"], tags: ["多接口"], specs: "双 HDMI 4K;千兆网口;SD/TF 读卡;PD", compat: "外接双屏+有线网络首选" },
    { id: "d4", brand: "联想",      model: "Type-C 商务坞",          name: "联想 Type-C 商务坞", searchName: "联想 Type-C 商务坞", style: "桌面拓展坞", price: [120, 299],   rating: 4, valueGrade: "B", valueNote: "商务稳定之选，接口齐全并带 VGA，企业办公与会议室兼容老投影。规格不如同价绿联 10 合 1，消费级场景下价格也不占优，主要面向公事采购。",                          use: ["office"],               audience: ["office"], tags: ["稳定"], specs: "HDMI+VGA+USB×3+千兆;商用定位", compat: "企业办公与会议场景" },
    { id: "d5", brand: "绿联",      model: "雷电 4 拓展坞",          name: "绿联 雷电4 拓展坞", searchName: "绿联 雷电 4 拓展坞", style: "旗舰拓展坞", price: [199, 999],  rating: 4, valueGrade: "B", valueNote: "雷电 4 提供 40Gbps 带宽，8K 输出与高速存储扩展，MacBook Pro 等创作本的一步到位方案。普通 USB-C 笔记本用不上雷电带宽，别为它多花钱。",             use: ["create", "portable"], audience: ["creator", "mobile"], tags: ["旗舰", "高速"], specs: "雷电 4;40Gbps;8K 输出;高速存储", compat: "MacBook Pro/高性能笔记本创作用户" }
,
    { id: "d6",  brand: "惠普",      model: "USB-C 商务坞",      name: "惠普 USB-C 商务坞", searchName: "惠普 USB-C 商务坞", style: "桌面拓展坞", price: [199, 299], rating: 4, valueGrade: "B", valueNote: "HDMI 加 DP、四个 USB 与千兆网口，会议一线解决，商用定位。同为商务坞，比联想那款接口布局更现代；家用场景下同类产品价格更低。",          use: ["office"],          audience: ["office"], tags: ["稳定"],     specs: "HDMI+DP+USB×4+千兆;商用定位", compat: "企业办公与会议场景" },

    { id: "d7", brand: "绿联", model: "10Gbps Type-C 拓展坞", name: "绿联 10Gbps Type-C 拓展坞", searchName: "绿联 10Gbps Type-C 拓展坞", style: "便携拓展坞", price: [194, 254], rating: 4, valueGrade: "A", valueNote: "2.5G 网口加 HDMI 4K60 加 PD 100W 一线通，轻薄本接有线网与显示器的性价比解法。单屏输出，双屏需求请看桌面坞；先确认电脑 C 口支持视频输出。", use: ["office", "portable"], audience: ["office", "mobile"], tags: ["多接口", "高速"], specs: "2.5G网口;HDMI 4K60;PD 100W;10Gbps", compat: "轻薄本一线连，确认 C 口全功能" },
  ],

  /* ---------- 电源与机箱 ---------- */
  psu: [
    { id: "p1", brand: "长城",      model: "X5 650W 金牌全模",       name: "长城 X5 650W 金牌全模", searchName: "长城 X5 650W 金牌全模", style: "电源", price: [280, 399],   rating: 5, valueGrade: "S", valueNote: "650W 金牌全模的入门游戏机标配，i5/R5 配 RTX 5060 级平台刚好。上到 5070 级或长期高负载就该看 750W，别用电源余量换省钱。",                use: ["office", "game"], audience: ["student", "office"], tags: ["高性价比", "金牌"], specs: "650W;80PLUS 金牌;全模组", compat: "i5/R5+RTX 5060 级平台够用" },
    { id: "p2", brand: "鑫谷",      model: "GP750G",                name: "鑫谷 GP750G", searchName: "鑫谷 GP750G", style: "电源", price: [480, 570],   rating: 4, valueGrade: "A", valueNote: "750W 金牌直出，500 元档的实用之选。直出线材不好理线、也换不了定制线；愿意加一两百，长城 X8 的全模组与 ATX3.1 更值。",                 use: ["game"],               audience: ["student", "gamer"], tags: ["高性价比", "金牌"], specs: "750W;80PLUS 金牌;直出", compat: "预算型游戏平台推荐" },
    { id: "p3", brand: "长城",      model: "X8 750W 金牌全模",       name: "长城 X8 750W 金牌全模", searchName: "长城 X8 750W 金牌全模", style: "电源", price: [650, 750],   rating: 5, valueGrade: "S", valueNote: "750W 甜点，ATX3.1 加全日系电容、全模组与十年质保，RTX 5070 级平台的稳妥搭配。比鑫谷 GP750G 贵约 150 元，换的是模组化与质保年限。",             use: ["game", "create"], audience: ["gamer", "creator"], tags: ["ATX3.1", "金牌"], specs: "750W;ATX3.1;全日系电容;全模组;十年质保", compat: "RTX 5070 级显卡平台推荐" },
    { id: "p4", brand: "鑫谷",      model: "GP850G",                name: "鑫谷 GP850G", searchName: "鑫谷 GP850G", style: "电源", price: [550, 650],   rating: 4, valueGrade: "A", valueNote: "850W 主流之选，ATX3.1 带原生 12V-2x6，RTX 5070 Ti 级平台够用。比长城 X8 只贵一点却多 100W；追十年质保与用料口碑可以直接看海韵。",            use: ["game", "create"], audience: ["gamer", "creator"], tags: ["ATX3.1", "金牌"], specs: "850W;ATX3.1;原生 12V-2x6;全模组", compat: "RTX 5070 Ti 级平台推荐" },
    { id: "p5", brand: "海韵",      model: "FOCUS GX-1000",         name: "海韵 FOCUS GX-1000", searchName: "海韵 FOCUS GX-1000", style: "电源", price: [1080, 1240],  rating: 5, valueGrade: "B", valueNote: "1000W 十年质保旗舰，为 RTX 5080/5090 与未来升级留足冗余。价格是国产 850W 的两倍，只有上到旗舰显卡或长期满载渲染才值得花这笔钱。",                  use: ["create", "game"], audience: ["creator", "gamer"], tags: ["旗舰", "长质保"], specs: "1000W;ATX3.1;白金级用料;十年质保", compat: "RTX 5080/5090 与长期高负载" },
    { id: "p6", brand: "先马",      model: "平头哥 M2",              name: "先马 平头哥 M2", searchName: "先马 平头哥 M2", style: "机箱", price: [109, 149],   rating: 4, valueGrade: "S", valueNote: "百元级走线友好的 MATX 中塔，装机新手友好，与 A620M 这类小板尺寸正好匹配。只支持 240 水冷与 345mm 显卡，ATX 大板或 360 冷排要另选。",                use: ["game", "office"], audience: ["student", "gamer"], tags: ["高性价比", "走线"], specs: "MATX 中塔;支持 240 水冷;6 风扇位;CPU 限高 160mm;显卡限长 345mm", compat: "首台台式机通用之选" },
    { id: "p7", brand: "爱国者",    model: "星璨岚",                name: "爱国者 星璨 岚", searchName: "爱国者 星璨岚", style: "机箱", price: [289, 449],   rating: 4, valueGrade: "A", valueNote: "MATX 无立柱海景房，四面快拆免工具，360 水冷也塞得下。官方明确不支持 ATX 大主板，配 B760M/B650M 才合适；追大板与更长显卡请看霄Air。",                        use: ["game", "create"], audience: ["gamer", "creator"], tags: ["RGB", "颜值"], specs: "MATX 海景房;无立柱全景侧透;四面快拆;支持 360 水冷;CPU 限高 165mm;显卡限长 370mm", compat: "灯效爱好者与海景房主题装机" }
,
    { id: "p8",  brand: "微星",      model: "MAG A850GL",        name: "微星 MAG A850GL", searchName: "微星 MAG A850GL", style: "电源", price: [549, 699],  rating: 5, valueGrade: "S", valueNote: "850W ATX3.1 原生 12V-2x6 加全模组，比长城 X8 同档多 100W、价格相近。RTX 5070 Ti 级平台合适；追十年质保与用料口碑可看海韵。",       use: ["game", "create"], audience: ["gamer", "creator"], tags: ["ATX3.1", "金牌"], specs: "850W;ATX3.1;原生 12V-2x6;全模组", compat: "RTX 5070 Ti 级平台推荐" },
    { id: "p9",  brand: "乔思伯",    model: "D31 STANDARD",      name: "乔思伯 D31 STANDARD", searchName: "乔思伯 D31 STANDARD", style: "机箱", price: [299, 399], rating: 4, valueGrade: "A", valueNote: "MATX 海景房，支持 360 冷排、理线友好，与 B650M 尺寸正好匹配，数显屏可选。同样装不下 ATX 大板；追更多风扇位与背插走线可看 X400。",       use: ["game"],           audience: ["gamer"], tags: ["海景房", "MATX"], specs: "MATX 海景房;支持 360 冷排;数显屏可选", compat: "MATX 海景房主题装机" },
    { id: "p10", brand: "爱国者",  model: "星璨 霄Air",      name: "爱国者 星璨 霄Air", searchName: "爱国者 星璨 霄Air", style: "机箱", price: [259, 329], rating: 5, valueGrade: "S", valueNote: "259 元的 ATX 左右分仓海景房，360 冷排与 10 风扇位全给到，性价比拉满。CPU 限高 160mm，装双塔风冷要留意；追 270° 无立柱可上 NV5。", use: ["game", "create"], audience: ["gamer", "creator"], tags: ["海景房", "ATX", "高性价比"], specs: "ATX/MATX/ITX;无 A 柱左右分仓;支持 360 水冷;10 风扇位;显卡限长 400mm;CPU 限高 160mm", compat: "ATX 中端海景房首选，t12000 档对应" },
    { id: "p11", brand: "追风者",  model: "NV5",            name: "追风者 NV5", searchName: "追风者 NV5", style: "机箱", price: [499, 649], rating: 5, valueGrade: "A", valueNote: "无立柱 270° 海景房，8 风扇位还支持背插走线，Type-C 到 20Gbps。价格比霄Air 翻倍，买的是做工与背插；显卡限长 440mm，属于能长期使用的底子。", use: ["game", "create"], audience: ["gamer", "creator"], tags: ["海景房", "ATX", "背插"], specs: "ATX;无立柱 270° 海景房;支持 360 水冷;8 风扇位;Type-C 20Gbps;CPU 限高 180mm;显卡限长 440mm", compat: "高颜值 ATX 主线装机，配 5070 Ti 级平台" },
    { id: "p12", brand: "乔思伯",  model: "X400",           name: "乔思伯 X400", searchName: "乔思伯 X400", style: "机箱", price: [559, 599], rating: 4, valueGrade: "A", valueNote: "13 风扇位加主板仓导风，是海景房里少见的散热派，还支持背插 360 水冷。观感不如无立柱机型通透；追颜值选 NV5，追风道选它。", use: ["game", "create"], audience: ["gamer", "creator"], tags: ["海景房", "ATX", "背插"], specs: "ATX 海景房;支持背插 360 水冷;13 风扇位;主板仓导风结构", compat: "想走背插又怕闷罐的 ATX 平台" },
    { id: "p13", brand: "爱国者",  model: "星璨 大岚 双屏版", name: "爱国者 星璨 大岚 双屏版", searchName: "爱国者 星璨 大岚 双屏版", style: "机箱", price: [699, 749], rating: 4, valueGrade: "B", valueNote: "双 6 英寸高清屏的展示型旗舰，270° 全景加 460mm 显卡限长，硬件与面子都要。屏幕属于纯展示溢价，实用党同价能买到更好的风道。", use: ["create", "game"], audience: ["creator", "gamer"], tags: ["海景房", "旗舰", "双屏"], specs: "ATX 海景房;270° 全景;双 6 英寸高清屏;支持 360 水冷;7 扩展槽;CPU 限高 180mm;显卡限长 460mm", compat: "既要性能又要展示面的旗舰配置" },
    { id: "p14", brand: "联力",    model: "L217 鬼斧",       name: "联力 L217 鬼斧", searchName: "联力 L217 鬼斧", style: "机箱", price: [806, 869], rating: 5, valueGrade: "B", valueNote: "中塔里散热第一梯队，装得下 EATX、11 风扇位，压 5080/5090 的发热有底气。价格是霄Air 的三倍，只有旗舰配置才需要为散热花这笔钱。", use: ["create", "game"], audience: ["creator", "gamer"], tags: ["旗舰", "散热", "EATX"], specs: "中塔 EATX;11 风扇位;标配 3 把风扇;支持 360 水冷;CPU 限高 180mm;显卡限长 390mm", compat: "5090 级高发热平台的散热保险" },

    { id: "p15", brand: "航嘉", model: "JUMPER650B", name: "航嘉 JUMPER650B", searchName: "航嘉 JUMPER650B", style: "电源", price: [238, 260], rating: 4, valueGrade: "A", valueNote: "ATX 3.1 新规范铜牌 650W 才两百出头，带 7650 GRE/5060 级整机稳当。直出线材理线偏乱，走线强迫症请加钱上全模组 X5；三年质保中规中矩。", use: ["game", "office"], audience: ["student", "office"], tags: ["高性价比", "ATX3.1"], specs: "650W铜牌;ATX 3.1;直出线;12cm液压扇", compat: "7650 GRE/RTX 5060 级整机够用" },
    { id: "p16", brand: "长城", model: "猎金部落 TF750", name: "长城 猎金部落 TF750", searchName: "长城 猎金部落 TF750", style: "电源", price: [618, 629], rating: 4, valueGrade: "B", valueNote: "ITX 小钢炮的稳妥心脏，SFX 规格金牌全模还带宽幅温控。无原生 12V-2×6 接口，新旗舰 N 卡需转接；标准 ATX 机箱别花这个钱。", use: ["game", "portable"], audience: ["gamer", "mobile"], tags: ["小机箱", "金牌"], specs: "750W金牌;SFX规格;全模组;宽幅温控", compat: "ITX 小机箱专用，ATX 机箱勿选" },
    { id: "p17", brand: "振华", model: "LEADEX VII 1200W", name: "振华 LEADEX VII 1200W", searchName: "振华 LEADEX VII 1200W", style: "电源", price: [1199, 1299], rating: 5, valueGrade: "S", valueNote: "1200W 白金全模带原生 12V-2×6，5090D 级旗舰整机的心脏，全日系电容十年保，百补常到 1199。主流配置严重过剩，非旗舰显卡别浪费。", use: ["create", "game"], audience: ["creator", "gamer"], tags: ["旗舰", "ATX3.1", "长质保"], specs: "1200W白金;ATX 3.1;全模组;原生12V-2×6", compat: "RTX 5080/5090D 旗舰整机推荐" },
    { id: "p18", brand: "乔思伯", model: "NV10", name: "乔思伯 NV10", searchName: "乔思伯 NV10", style: "机箱", price: [379, 429], rating: 4, valueGrade: "A", valueNote: "15L 全景 ITX 小箱，钢化玻璃侧透颜值在线，还能挂显示器背后把主机藏起来。显卡限长与散热高度卡得严，高功耗配置别硬塞，下单前核对尺寸表。", use: ["game", "portable"], audience: ["mobile", "student"], tags: ["小机箱", "颜值"], specs: "ITX;约15L;钢化玻璃侧透;可壁挂", compat: "仅 ITX 主板+SFX 电源，显卡限长先核对" },
    { id: "p19", brand: "乔思伯", model: "D300", name: "乔思伯 D300", searchName: "乔思伯 D300", style: "机箱", price: [374, 449], rating: 4, valueGrade: "A", valueNote: "270° 曲面玻璃海景房，观感比星璨岚更越级，前置 Type-C 10G、长显卡随便塞。风道偏闷，高功耗平台建议加满风扇；只支持 MATX 主板别买错。", use: ["game", "office"], audience: ["gamer", "student"], tags: ["海景房", "MATX", "颜值"], specs: "MATX;270°曲面玻璃;前置Type-C 10G", compat: "仅 MATX 主板，建议加装机箱风扇" },
    { id: "p20", brand: "先马", model: "黑洞X", name: "先马 黑洞X", searchName: "先马 黑洞X", style: "机箱", price: [359, 399], rating: 4, valueGrade: "A", valueNote: "四面吸音棉加标配静音扇，办公室与卧室主机的降噪标杆，宽体五金做工对得起价。无侧透不透光，灯效玩家请绕；散热上限一般，闷罐配置慎入。", use: ["office", "create"], audience: ["office", "creator"], tags: ["静音", "ATX"], specs: "ATX;四面吸音棉;标配静音扇;宽体五金", compat: "ATX/MATX 主板通吃，静音优先" },
  ],
  /* ---------- CPU（2026-10 核验行情） ---------- */
  cpu: [
    { id: "u1", brand: "AMD",       model: "Ryzen 5 5500",          name: "AMD Ryzen 5 5500", searchName: "AMD Ryzen 5 5500", style: "入门6核", price: [540, 600],    rating: 4, valueGrade: "S", valueNote: "AM4 清库存甜点，板 U 套装极致性价比，预算敏感整机首选。Zen3 已是上代架构，没有核显也没有升级空间；追新平台请直接看 AM5 的 7500F。",                use: ["office", "game"], audience: ["student", "office"], tags: ["高性价比"], specs: "6核12线程;Zen3;65W;AM4", compat: "配 A520/B550，预算敏感整机首选" },
    { id: "u2", brand: "AMD",       model: "Ryzen 5 8500G",          name: "AMD Ryzen 5 8500G", searchName: "AMD Ryzen 5 8500G", style: "核显6核", price: [900, 1350],   rating: 5, valueGrade: "S", valueNote: "核显最强的入门选择，RDNA3 核显打轻度网游够用，办公机可免独显。CPU 性能弱于同价 7500F，日后加独显会先撞 CPU 瓶颈；纯办公最划算。",                 use: ["office", "portable"], audience: ["student", "office"], tags: ["核显", "高性价比"], specs: "6核12线程;RDNA3 核显740M;65W;AM5", compat: "配 A620/B650，核显机首选，日后可加独显" },
    { id: "u3", brand: "Intel",     model: "Core i3-14100F",         name: "Intel i3-14100F", searchName: "Intel Core i3-14100F", style: "入门4核", price: [700, 1050],   rating: 4, valueGrade: "A", valueNote: "4 核 8 线程入门，网游与办公够用，58W 低功耗好散热。核心数少，多开与轻剪辑会吃力；同价 8500G 带核显、7500F 游戏更强，它赢在平台便宜。",                     use: ["office", "game"], audience: ["student", "office"], tags: ["入门", "低功耗"], specs: "4核8线程;Raptor Lake;58W;LGA1700", compat: "配 H610M，性价比入门板U" },
    { id: "u4", brand: "AMD",       model: "Ryzen 5 9600X",          name: "AMD Ryzen 5 9600X", searchName: "AMD Ryzen 5 9600X", style: "游戏6核", price: [1200, 1350],  rating: 5, valueGrade: "S", valueNote: "Zen5 六核，游戏单核强、65W 好压，主流游戏机的甜点。六核在重度渲染与多开上不如 9700X；只玩游戏选它，兼顾创作就加钱上八核。",                  use: ["game", "office"], audience: ["gamer", "student"], tags: ["游戏", "高性价比"], specs: "6核12线程;Zen5;65W;AM5", compat: "配 B650M，主流游戏机首选" },
    { id: "u5", brand: "Intel",     model: "Core i5-14600KF",        name: "Intel i5-14600KF", searchName: "Intel Core i5-14600KF", style: "全能14核", price: [1450, 1700],  rating: 4, valueGrade: "A", valueNote: "14 核 20 线程全能，游戏多开加轻创作通吃。125W 功耗要配双塔或 240 水冷，且无核显；纯游戏场景 9600X 更省电也更便宜。",                   use: ["game", "create"], audience: ["gamer", "creator"], tags: ["全能"], specs: "14核20线程;Raptor Lake;125W;LGA1700", compat: "配 B760M，散热选双塔或 240 水冷" },
    { id: "u6", brand: "AMD",       model: "Ryzen 7 9700X",          name: "AMD Ryzen 7 9700X", searchName: "AMD Ryzen 7 9700X", style: "均衡8核", price: [1500, 1750],  rating: 4, valueGrade: "A", valueNote: "8 核 Zen5，剪辑渲染与游戏双修，65W 功耗对散热友好。游戏帧数不及 9800X3D，创作吞吐不及 Ultra 9；它是两头都不错的均衡牌。",                       use: ["create", "game"], audience: ["creator", "gamer"], tags: ["均衡"], specs: "8核16线程;Zen5;65W;AM5", compat: "配 B650，剪辑渲染+游戏双修" },
    { id: "u7", brand: "AMD",       model: "Ryzen 7 9800X3D",        name: "AMD Ryzen 7 9800X3D", searchName: "AMD Ryzen 7 9800X3D", style: "游戏旗舰", price: [2900, 3200],  rating: 5, valueGrade: "S", valueNote: "3D 缓存游戏王，FPS 帧数断崖领先，电竞旗舰的默认答案。生产力与同价八核持平甚至偏弱，只玩游戏才值这个溢价。",                          use: ["game", "create"], audience: ["gamer", "creator"], tags: ["游戏旗舰", "3D缓存"], specs: "8核16线程;Zen5 3D V-Cache;AM5", compat: "配 B650/X670，电竞旗舰首选" },
    { id: "u8", brand: "Intel",     model: "Core Ultra 9 285K",      name: "Intel Ultra 9 285K", searchName: "Intel Core Ultra 9 285K", style: "旗舰24核", price: [4400, 4800],  rating: 4, valueGrade: "A", valueNote: "24 核旗舰，生产力天花板，渲染导出比别人快一截。游戏帧数不及 9800X3D，125W 发热加 Z890 主板成本都不低；只有创作工作站才用得上。",                        use: ["create"], audience: ["creator"], tags: ["旗舰", "生产力"], specs: "24核24线程;Arrow Lake;125W;LGA1851", compat: "配 Z890 旗舰板，创作工作站级" }
,
    { id: "u9",  brand: "AMD",       model: "Ryzen 5 7500F",      name: "AMD Ryzen 5 7500F", searchName: "AMD Ryzen 5 7500F", style: "游戏6核", price: [900, 1000], rating: 5, valueGrade: "S", valueNote: "无核显游戏甜点，板 U 套装性价比极高，游戏入门首选。必须配独显，办公机不要选它；同价的 8500G 更适合免独显的办公场景。",      use: ["game"],           audience: ["gamer", "student"], tags: ["高性价比"], specs: "6核12线程;Zen4;65W;AM5", compat: "配 A620/B650，游戏入门首选" },
    { id: "u10", brand: "Intel",     model: "Core i5-14400F",     name: "Intel i5-14400F", searchName: "Intel Core i5-14400F", style: "全能10核", price: [1100, 1300], rating: 4, valueGrade: "A", valueNote: "10 核办公游戏通吃，65W 好散热，属于不会出错的选择。游戏性能不及 7500F，也没有核显；买它多半是坚持 Intel 平台求稳。",          use: ["office", "game"], audience: ["office", "gamer"], tags: ["全能"],     specs: "10核16线程;Raptor Lake;65W;LGA1700", compat: "配 B760M，办公游戏通吃" },

    { id: "u11", brand: "Intel", model: "Core i3-12100F", name: "Intel Core i3-12100F", searchName: "Intel Core i3-12100F", style: "入门4核", price: [500, 560], rating: 4, valueGrade: "B", valueNote: "全新带保里最便宜的能打游戏的 U，4 核 8 线程配入门独显刚好。比 5500 便宜约 100 却少 2 核，多开与新 3A 别指望；适合预算卡死的入门机。", use: ["office", "game"], audience: ["student"], tags: ["入门"], specs: "4核8线程;睿频4.3GHz;58W;LGA1700", compat: "配 H610 板最省，搭 RX 6500 XT/5050 级显卡" },
    { id: "u12", brand: "AMD", model: "Ryzen 5 5600", name: "AMD Ryzen 5 5600", searchName: "AMD Ryzen 5 5600", style: "AM4甜点6核", price: [649, 799], rating: 4, valueGrade: "A", valueNote: "AM4 末代甜点，B550+DDR4 把整机成本压到最低，比 5500 贵百来块换更高频率。新装机建议一步到位 AM5；手头有老板子升级或极限压价才选它。", use: ["office", "game"], audience: ["student", "office"], tags: ["高性价比"], specs: "6核12线程;Zen3;65W;AM4", compat: "配 B550+DDR4 最省，老 AM4 平台升级也合适" },
    { id: "u13", brand: "Intel", model: "Core i5-12600KF", name: "Intel Core i5-12600KF", searchName: "Intel Core i5-12600KF", style: "清库存10核", price: [979, 1100], rating: 4, valueGrade: "A", valueNote: "千元档多核最强，10 核 16 线程还能用便宜 DDR4，清库存价错过不再有。平台已无升级空间；想要新接口和后续升级，请加钱上 AM5 或 LGA1851。", use: ["game", "create"], audience: ["gamer", "student"], tags: ["高性价比"], specs: "10核16线程;睿频4.9GHz;125W;LGA1700", compat: "配 B760+DDR4 性价比最高，需百元级散热" },
    { id: "u14", brand: "Intel", model: "Core Ultra 5 245K", name: "Intel Core Ultra 5 245K", searchName: "Intel Core Ultra 5 245K", style: "新平台14核", price: [1450, 1500], rating: 4, valueGrade: "B", valueNote: "LGA1851 新平台中端，带核显、能效比好，办公创作兼顾。纯游戏帧率不如同价 7800X3D 散片；配套主板偏贵，预算紧的游戏机不如选 9600X。", use: ["office", "create"], audience: ["office", "creator"], tags: ["全能"], specs: "14核14线程;睿频5.2GHz;125W;LGA1851", compat: "配 B860 主板，办公+轻度创作均衡之选" },
    { id: "u15", brand: "AMD", model: "Ryzen 7 7800X3D", name: "AMD Ryzen 7 7800X3D", searchName: "AMD Ryzen 7 7800X3D", style: "游戏神U", price: [2050, 2499], rating: 5, valueGrade: "S", valueNote: "上代游戏神 U 散片两千出头，96MB 3D 缓存的游戏帧率至今第一梯队。生产力打不过同价 12 核；纯办公别浪费钱，它是为高刷电竞准备的。", use: ["game"], audience: ["gamer"], tags: ["游戏", "3D缓存"], specs: "8核16线程;96MB 3D缓存;120W;AM5", compat: "配 B650 即可，游戏帧率优先选它" },
    { id: "u16", brand: "Intel", model: "Core Ultra 7 265K", name: "Intel Core Ultra 7 265K", searchName: "Intel Core Ultra 7 265K", style: "新平台20核", price: [1865, 1980], rating: 4, valueGrade: "A", valueNote: "从 3000+ 跌到两千内的 20 核，多核生产力突然值回票价。游戏表现平庸，还要配中高端主板；渲染编译为主、游戏为辅的装机再考虑它。", use: ["create", "office"], audience: ["creator"], tags: ["生产力"], specs: "20核20线程;30MB L3;125W;LGA1851", compat: "生产力优先的全能机，配 B860/Z890" },
    { id: "u17", brand: "AMD", model: "Ryzen 9 9900X", name: "AMD Ryzen 9 9900X", searchName: "AMD Ryzen 9 9900X", style: "12核生产力", price: [2499, 2899], rating: 4, valueGrade: "A", valueNote: "自营 2499 的 12 核 Zen5，渲染编译性能对得起每一块钱。纯游戏不如便宜近千的 7800X3D；定位很明确：干活为主、游戏靠边。", use: ["create"], audience: ["creator"], tags: ["生产力"], specs: "12核24线程;Zen5;120W;AM5", compat: "渲染/编译主力机，配 B650 中高端板" },
    { id: "u18", brand: "AMD", model: "Ryzen 9 9950X", name: "AMD Ryzen 9 9950X", searchName: "AMD Ryzen 9 9950X", style: "16核生产力旗舰", price: [3599, 3999], rating: 4, valueGrade: "A", valueNote: "16 核 Zen5 自营 3599 史低，纯生产力场景的核心数天花板。游戏用不满 16 核，别为它多花钱；视频、渲染、虚拟机重度用户才值回票价。", use: ["create"], audience: ["creator"], tags: ["生产力", "旗舰"], specs: "16核32线程;Zen5;170W;AM5", compat: "重度生产力整机，建议配 360 水冷" },
    { id: "u19", brand: "AMD", model: "Ryzen 9 9950X3D", name: "AMD Ryzen 9 9950X3D", searchName: "AMD Ryzen 9 9950X3D", style: "双修旗舰", price: [4199, 4899], rating: 4, valueGrade: "A", valueNote: "游戏+生产力双料旗舰，16 核叠 3D 缓存，价格已破发。纯游戏买 9800X3D 省近千，纯干活买 9950X 也省；只有全都要的旗舰机才该选它。", use: ["game", "create"], audience: ["gamer", "creator"], tags: ["旗舰", "3D缓存"], specs: "16核32线程;144MB总缓存;170W;AM5", compat: "旗舰双修整机，配 X870E+360 水冷" },
  ],
  /* ---------- 显卡（2026-10 核验行情） ---------- */
  gpu: [
    { id: "g1", brand: "AMD",       model: "RX 7600 8G",             name: "AMD RX 7600 8G", searchName: "AMD RX 7600", style: "1080P 入门", price: [1600, 1900],  rating: 4, valueGrade: "A", valueNote: "1080P 高画质网游的入门独显，130W 功耗配 450W 电源即可。8G 显存与光追性能有限，2K 高画质或 3A 大作要上 5060 那一档。",                     use: ["game", "office"], audience: ["student", "gamer"], tags: ["高性价比"], specs: "8GB GDDR6;1080P 高画质;130W", compat: "配 450W 电源，1080P 入门首选" },
    { id: "g2", brand: "NVIDIA",    model: "RTX 5060 8G",            name: "NVIDIA RTX 5060 8G", searchName: "NVIDIA RTX 5060", style: "2K 入门", price: [2550, 3100],  rating: 5, valueGrade: "S", valueNote: "2K 入门甜点，DLSS4 加持，主流游戏机的默认答案，配 550-650W 电源。8G 显存在高材质 2K 下会吃紧，追战未来选 16G 的 9060 XT。",                         use: ["game", "create"], audience: ["gamer", "student"], tags: ["DLSS", "高性价比"], specs: "8GB GDDR7;2K 中高画质;DLSS4", compat: "配 550-650W 电源，主流游戏机首选" },
    { id: "g3", brand: "AMD",       model: "RX 9060 XT 16G",         name: "AMD RX 9060 XT 16G", searchName: "AMD RX 9060 XT", style: "2K 游戏", price: [2600, 3600],  rating: 4, valueGrade: "A", valueNote: "16G 显存战未来，2K 高画质通吃，A 卡性价比之选。光追与 DLSS 生态弱于 N 卡，N 卡专属优化游戏会吃亏；配 650W 电源即可。",                      use: ["game", "create"], audience: ["gamer", "creator"], tags: ["大显存"], specs: "16GB GDDR6;2K 高画质;FSR4", compat: "配 650W 电源，A 卡性价比之选" },
    { id: "g4", brand: "NVIDIA",    model: "RTX 5070 12G",           name: "NVIDIA RTX 5070 12G", searchName: "NVIDIA RTX 5070", style: "2K 高刷", price: [6300, 7200],  rating: 5, valueGrade: "A", valueNote: "2K 全特效加 DLSS4 帧生成，高帧电竞的稳妥选择，9 月京东非公已到 6799。价格较 618 明显上移，预算卡在 6000 内建议退回 5060 Ti。",                        use: ["game", "create"], audience: ["gamer", "creator"], tags: ["DLSS4", "电竞"], specs: "12GB GDDR7;2K 全特效;DLSS4 帧生成", compat: "配 650-750W 电源，高帧电竞" },
    { id: "g5", brand: "AMD",       model: "RX 9070 XT 16G",         name: "AMD RX 9070 XT 16G", searchName: "AMD RX 9070 XT", style: "2K 高刷", price: [5300, 5900],  rating: 4, valueGrade: "A", valueNote: "对标 RTX 5070，16G 显存加 FSR4，A 卡阵营的旗舰性价比。光追与专业软件加速不如 N 卡，配 750W 电源；纯游戏与差价敏感用户优先看它。",                use: ["game", "create"], audience: ["gamer", "creator"], tags: ["旗舰", "A卡"], specs: "16GB GDDR6;2K 全特效;FSR4", compat: "配 750W 电源" },
    { id: "g6", brand: "NVIDIA",    model: "RTX 5070 Ti 16G",        name: "NVIDIA RTX 5070 Ti 16G", searchName: "NVIDIA RTX 5070 Ti", style: "创作旗舰", price: [8700, 10500],  rating: 5, valueGrade: "S", valueNote: "16G 显存，创作与游戏双旗舰，NVENC 加速让剪辑导出更快；较 618 涨约 60%。当前价格含明显缺货溢价，非急需可等行情回落。",                    use: ["create", "game"], audience: ["creator", "gamer"], tags: ["创作", "旗舰"], specs: "16GB GDDR7;4K 入门;NVENC 加速", compat: "配 750-850W 电源，创作旗舰" },
    { id: "g7", brand: "NVIDIA",    model: "RTX 5080 16G",           name: "NVIDIA RTX 5080 16G", searchName: "NVIDIA RTX 5080", style: "4K 旗舰", price: [12300, 16000], rating: 5, valueGrade: "A", valueNote: "4K 高刷顶配与 AI 渲染利器；9 月封仓后一路涨到 1.2 万起步。配 850-1000W 电源，整机预算得留足；预算有限时 5070 Ti 是更理性的分界。",                       use: ["create", "game"], audience: ["creator"], tags: ["旗舰", "4K"], specs: "16GB GDDR7;4K 高刷;DLSS4", compat: "配 850-1000W 电源，顶配机" }
,
    { id: "g8",  brand: "AMD",       model: "RX 7800 XT 16G",     name: "AMD RX 7800 XT 16G", searchName: "AMD RX 7800 XT", style: "2K 高刷", price: [3800, 4400], rating: 4, valueGrade: "A", valueNote: "16G 大显存的 2K 全特效 A 卡主力，显存容量比同价 N 卡宽裕。上一代架构，光追与能效落后新卡；配 700W 电源，追新不如直接看 9060 XT。",         use: ["game", "create"], audience: ["gamer", "creator"], tags: ["大显存", "A卡"], specs: "16GB GDDR6;2K 全特效;FSR", compat: "配 700W 电源，A 卡性价比之选" },
    { id: "g9",  brand: "NVIDIA",    model: "RTX 5060 Ti 16G",    name: "NVIDIA RTX 5060 Ti 16G", searchName: "NVIDIA RTX 5060 Ti", style: "2K 甜点", price: [5000, 6000], rating: 5, valueGrade: "A", valueNote: "16G 显存甜点，DLSS4 战未来；2026-10 已涨至 5000 以上。性价比被涨价削弱，同价 A 卡显存相同、价格更低；配 650W 电源够用。",         use: ["game", "create"], audience: ["gamer", "student"], tags: ["DLSS", "大显存"], specs: "16GB GDDR7;2K 高画质;DLSS4", compat: "配 650W 电源，主流游戏创作" },
    { id: "g10", brand: "NVIDIA",    model: "RTX 5090D 32G",    name: "NVIDIA RTX 5090D 32G", searchName: "NVIDIA RTX 5090D", style: "4K 终极旗舰", price: [39999, 45000], rating: 5, valueGrade: "C", valueNote: "32G 显存天花板，4K 240Hz 与 AI 算力的终极答案。缺货溢价明显，需 1000W+ 电源与旗舰主板；除非专业刚需，否则这笔钱花得极不划算。", use: ["create", "game"], audience: ["creator"], tags: ["旗舰", "32G", "4K"], specs: "32GB GDDR7;4K 240Hz;DLSS4;AI 算力旗舰", compat: "需 1000W+ 电源与旗舰主板，理性看待溢价" },

    { id: "g11", brand: "AMD", model: "RX 6500 XT 8G", name: "AMD RX 6500 XT 8G", searchName: "AMD RX 6500 XT 8G", style: "千元亮机卡", price: [1049, 1499], rating: 4, valueGrade: "B", valueNote: "千元全新带保的唯一选择，8G 版缓解爆显存，老网游与亮机够用。PCIe x4 通道在老平台上掉性能；有两千预算请直接看 7650 GRE。", use: ["office", "game"], audience: ["student"], tags: ["入门", "低功耗"], specs: "8GB GDDR6;RDNA2;低功耗;无需外接供电", compat: "亮机/老网游，办公机免换电源" },
    { id: "g12", brand: "Intel", model: "Arc A750 8G", name: "Intel Arc A750 8G", searchName: "Intel Arc A750 8G", style: "Intel入门越级", price: [1300, 1700], rating: 4, valueGrade: "B", valueNote: "256bit 位宽越级打 RTX 3050 级，新 3A 表现惊喜。驱动对老 DX11 游戏优化参差，只玩新游戏可以捡；图省心还是加钱上 7650 GRE。", use: ["game"], audience: ["student", "gamer"], tags: ["高性价比"], specs: "8GB GDDR6;256bit;Xe-HPG;225W", compat: "需开启 Resizable BAR，配 550W 电源" },
    { id: "g13", brand: "AMD", model: "RX 7650 GRE 8G", name: "AMD RX 7650 GRE 8G", searchName: "AMD RX 7650 GRE 8G", style: "2K入门甜点", price: [1979, 2499], rating: 5, valueGrade: "S", valueNote: "性能看齐 RTX 4060 却便宜近 500，1080P 高画质通吃、2K 入门可战，涨价潮里的良心价。光追与 CUDA 生态是短板；AI/剪辑请选 N 卡。", use: ["game"], audience: ["student", "gamer"], tags: ["高性价比", "A卡"], specs: "8GB GDDR6;RDNA3;165W;性能≈RTX4060", compat: "配 550W 电源，1080P/2K 入门首选" },
    { id: "g14", brand: "Intel", model: "Arc B580 12G", name: "Intel Arc B580 12G", searchName: "Intel Arc B580 12G", style: "Intel甜点12G", price: [2400, 2800], rating: 4, valueGrade: "B", valueNote: "12G 显存在 2500 档无敌手，2K 中高画质能战，剪辑解码也强。已比发售涨约三成、低价车开走了；同价纯游戏更稳的选择是 7650 GRE。", use: ["game", "create"], audience: ["gamer"], tags: ["大显存"], specs: "12GB GDDR6;192bit;Battlemage;190W", compat: "需开启 Resizable BAR，2K 入门可战" },
    { id: "g15", brand: "NVIDIA", model: "RTX 5050 8G", name: "NVIDIA RTX 5050 8G", searchName: "NVIDIA RTX 5050 8G", style: "N卡入门新款", price: [2400, 3150], rating: 4, valueGrade: "B", valueNote: "DLSS 4 多帧生成加持的入门 N 卡，130W 低功耗，直播推流与浅度 AI 兼顾。8G 显存偏小、涨价后溢价明显；纯游戏 7650 GRE 便宜一大截。", use: ["game", "create"], audience: ["student", "gamer"], tags: ["DLSS4", "低功耗"], specs: "8GB GDDR6;DLSS4多帧生成;Blackwell;130W", compat: "小机箱/低功耗平台友好，配 450W 电源" },
    { id: "g16", brand: "AMD", model: "RX 9070 GRE 12G", name: "AMD RX 9070 GRE 12G", searchName: "AMD RX 9070 GRE 12G", style: "2K天花板", price: [4270, 5200], rating: 4, valueGrade: "A", valueNote: "性能贴着 RTX 5070 却便宜 2000+，2K 高刷天花板、4K 入门也能摸。近期跟涨明显，超 4800 就别追了；要 CUDA 生态的创作者请绕道。", use: ["game"], audience: ["gamer"], tags: ["高性价比", "A卡"], specs: "12GB GDDR6;256bit;RDNA4;对标RTX5070", compat: "配 750W 电源，2K 高刷显示器绝配" },
    { id: "g17", brand: "AMD", model: "RX 9070 16G", name: "AMD RX 9070 16G", searchName: "AMD RX 9070 16G", style: "2K中高端16G", price: [4699, 5599], rating: 4, valueGrade: "B", valueNote: "16G 大显存的 RDNA4 中坚，AI 与 Mod 游戏更从容。与 9070 XT 价差太小是硬伤，多数情况建议加几百上 XT；蹲到 4700 以下活动价再出手。", use: ["game", "create"], audience: ["gamer", "creator"], tags: ["大显存", "A卡"], specs: "16GB GDDR6;256bit;RDNA4;220W", compat: "配 750W 电源，下单前与 9070 XT 比价" },
    { id: "g18", brand: "AMD", model: "RX 7900 XT 20G", name: "AMD RX 7900 XT 20G", searchName: "AMD RX 7900 XT 20G", style: "清货20G大显存", price: [6000, 7870], rating: 4, valueGrade: "C", valueNote: "20G 显存曾是本地 AI 与生产力的性价比答案，如今尾货价已无优势。9070 XT 更新更便宜；二手低价多为矿卡，只建议买全新带票的尾货。", use: ["create", "game"], audience: ["creator"], tags: ["大显存", "A卡"], specs: "20GB GDDR6;320bit;RDNA3;315W", compat: "配 850W 电源，只考虑全新行货" },
  ]
};

/* ---------- 性价比 TOP 榜单（按品类分类排行，每类 2-3 款） ---------- */
window.PC_DATA = window.PC_DATA || {};
window.PC_DATA.topList = [
  { catId: "cooler", itemId: "c1", tier: "入门", grade: "S", reason: "百元内单塔解热 125W、148mm 高，兼容多数机箱，压 i3/R5 与办公平台足够；i7/R7 带 K 超频需要双塔，装前确认机箱限高 ≥150mm。" },
  { catId: "cooler", itemId: "c9", tier: "入门", grade: "S", reason: "4 热管带 ARGB 同步、130mm 高度不挡内存，小机箱与灯效装机的最低门槛；解热上限偏低，压不住高功耗 U。" },
  { catId: "cooler", itemId: "c2", tier: "入门", grade: "A", reason: "5 热管标称解热 220W，满载噪音压在 32dB 内，办公机静音之选；体积大于单塔，小机箱先量限高。" },
  { catId: "cooler", itemId: "c3", tier: "甜点", grade: "S", reason: "6 热管双塔解热 280W，压 i7/R7 与入门创作平台都稳，两百元内的散热甜点；157mm 限高且需避让高马甲内存。" },
  { catId: "cooler", itemId: "c8", tier: "甜点", grade: "S", reason: "双塔 6 热管解热 260W，静音调校比 PA120 更细，适合大机箱与追求安静的创作者；尺寸更大，装前量机箱。" },
  { catId: "cooler", itemId: "c11", tier: "进阶", grade: "A", reason: "双塔 5×8mm 热管配回流焊工艺，风冷天花板，压 i7 K 系毫无压力且免维护；158mm 高会遮挡高马甲内存。" },
  { catId: "cooler", itemId: "c10", tier: "进阶", grade: "S", reason: "240 冷排入门水冷标杆，解热越级打双塔风冷，ARGB 冷头兼顾颜值；冷头存在衰减风险，机箱需预留 240 排位。" },
  { catId: "cooler", itemId: "c5", tier: "进阶", grade: "A", reason: "360 冷排解热 280W 配五年质保，压 105W 级旗舰 CPU 同时保持安静；机箱装得下双塔且预算紧时，风冷更划算。" },
  { catId: "cooler", itemId: "c6", tier: "旗舰", grade: "S", reason: "38mm 厚排解热 330W，满载噪音反而低于薄排，Ultra 9/R9 长期渲染首选；六年质保，差价换的是顶格余量与质保。" },
  { catId: "cooler", itemId: "c12", tier: "旗舰", grade: "A", reason: "6.67 吋 AMOLED 曲屏冷头配 300W 解热与五年质保，展示型旗舰；价格约为中端 360 水冷的两倍，不看屏可省一半。" },
  { catId: "stand", itemId: "s8", tier: "入门", grade: "A", reason: "铝合金五档升降、折叠后巴掌大，通勤出差把笔记本垫到舒适高度；无旋转且承重一般，17.3 英寸以上游戏本不适合。" },
  { catId: "stand", itemId: "s9", tier: "入门", grade: "B", reason: "垫高 10cm 并附带键盘收纳位，桌面整洁度提升立竿见影；高度固定不可调，需要频繁调视角请选机械臂。" },
  { catId: "stand", itemId: "s2", tier: "甜点", grade: "S", reason: "双段机械臂承重 9kg，覆盖 17-32 英寸，显示器加笔记本双叠也能稳；外观偏实用派，需显示器带 VESA 孔。" },
  { catId: "stand", itemId: "s1", tier: "甜点", grade: "S", reason: "气弹簧顺滑、承重 9kg，覆盖 17-32 英寸的入门机械臂标准答案；夹桌厚度限 2-5cm，买前确认显示器有 VESA 孔。" },
  { catId: "stand", itemId: "s3", tier: "进阶", grade: "A", reason: "气弹簧升降 415mm、拉伸 538mm 并自带理线槽，办公进阶；适配尺寸只到 27 英寸，组双屏请直接看双臂款。" },
  { catId: "stand", itemId: "s7", tier: "进阶", grade: "A", reason: "承重 18kg 的双臂款，双屏或带鱼屏一托搞定，气弹簧结构省力；只挂双 27 英寸时，NB H180 的升降行程反而更宽裕。" },
  { catId: "stand", itemId: "s6", tier: "进阶", grade: "A", reason: "双屏办公利器，615mm 升降与 550mm 拉伸配理线槽，挂双 27 英寸各一支都稳；单屏用户用不上这个规格。" },
  { catId: "monitor", itemId: "m19", tier: "入门", grade: "A", reason: "23.8 英寸 1080P 100Hz 配低蓝光，入门办公屏守门员；分辨率与尺寸只够办公网课，游戏与设计需要另选。" },
  { catId: "monitor", itemId: "m7", tier: "入门", grade: "A", reason: "24 英寸 1080P 180Hz Fast IPS，FPS 小屏高帧之选，1080P 对显卡压力小；分辨率偏低，做设计与看细节不如 2K。" },
  { catId: "monitor", itemId: "m1", tier: "甜点", grade: "S", reason: "27 英寸 2K 120Hz 入门守门员，办公看剧都够，护眼屏适合久坐；追 170Hz 以上电竞需另选，一线连笔记本要 Type-C 版。" },
  { catId: "monitor", itemId: "m13", tier: "甜点", grade: "S", reason: "23.8 英寸 2K 180Hz 配升降旋转支架，小桌面电竞的甜点尺寸；亮度一般，靠窗强光位慎选。" },
  { catId: "monitor", itemId: "m14", tier: "甜点", grade: "S", reason: "27 英寸 2K 200Hz 堆到 HDR400、10bit 与硬件低蓝光，参数同价最满；IPS 常规对比度，影音发烧请考虑 MiniLED。" },
  { catId: "monitor", itemId: "m2", tier: "甜点", grade: "S", reason: "27 英寸 2K 235Hz 超频配 Fast IPS 与 HDR500，同价位刷新率无对手；显卡至少 RTX 5060 级才喂得满。" },
  { catId: "monitor", itemId: "m4", tier: "进阶", grade: "S", reason: "27 英寸 2K QD-MiniLED 配 HDR600 与 98% DCI-P3，游戏修图双修；比同价 IPS 高刷贵 200-400 元，差价换的是画质。" },
  { catId: "monitor", itemId: "m5", tier: "进阶", grade: "S", reason: "27 英寸 4K QD-MiniLED 配 Type-C 90W 反向充电，笔记本一线连首选，办公修图的性价比答案；60Hz 不适合硬核电竞。" },
  { catId: "monitor", itemId: "m16", tier: "进阶", grade: "A", reason: "27 英寸 4K 190Hz 与 1080P 380Hz 双模一键切换，兼顾 3A 画质与竞技帧率；双模切换有学习成本。" },
  { catId: "monitor", itemId: "m8", tier: "进阶", grade: "S", reason: "27 英寸 4K 160Hz / 1080P 320Hz 双模 MiniLED 配 HDR1000，一台兼顾画质与帧率；需 RTX 5070 级显卡，只玩 1080P 属浪费面板。" },
  { catId: "monitor", itemId: "m9", tier: "进阶", grade: "A", reason: "1152 分区 MiniLED 配 HDR1000，4K 高刷的稳当入门；分区数少于同价 P275MV MAX，HDR 高光细节差一口气。" },
  { catId: "monitor", itemId: "m6", tier: "进阶", grade: "A", reason: "2304 分区 MiniLED 配 4K 170Hz 与 340Hz 双模，两三千档画质天花板；需 RTX 5070 Ti 级显卡才跑得动。" },
  { catId: "monitor", itemId: "m18", tier: "旗舰", grade: "S", reason: "27 英寸 2K 240Hz QD-OLED，0.03ms 响应与真黑场碾压同价 LCD，三年烧屏包换；全屏亮度偏低，明亮环境慎用。" },
  { catId: "monitor", itemId: "m12", tier: "旗舰", grade: "A", reason: "31.5 英寸 4K 240Hz QD-OLED 配 Type-C，桌面旗舰终端；需 RTX 5080 级显卡，长期挂静态界面注意烧屏。" },
  { catId: "input", itemId: "k1", tier: "入门", grade: "S", reason: "104 键全尺寸带数字区，百元档机械键盘入门，办公与学生党首选；塑料外壳质感普通，想要软弹手感需加钱。" },
  { catId: "input", itemId: "k4", tier: "入门", grade: "S", reason: "PAW3395SE 传感器、48g 轻量化加三模，百元内无线鼠首选；传感器为精简版，大手型握着偏小。" },
  { catId: "input", itemId: "k13", tier: "入门", grade: "A", reason: "最便宜的 LIGHTSPEED 无线鼠，AA 电池续航半年以上，稳定免折腾；传感器已是上一代，也没有蓝牙。" },
  { catId: "input", itemId: "k2", tier: "甜点", grade: "S", reason: "87 键 Gasket 结构配三模与全键热插拔，两百元档配置拉满；砍掉数字小键盘，财务统计这类高频录入不适合。" },
  { catId: "input", itemId: "k5", tier: "甜点", grade: "S", reason: "PAW3395 满血传感器、56g 配 4K 回报率，类 GPW 模具，中大手 FPS 玩家的平价选择；比蜻蜓 R1 重 8g。" },
  { catId: "input", itemId: "k3", tier: "甜点", grade: "A", reason: "98 配列保留数字区却只比 87 键宽一点，三模配 8000mAh 电池，手感扎实；价格比狼蛛 F87 高一档。" },
  { catId: "input", itemId: "k7", tier: "甜点", grade: "A", reason: "84 配列矮轴三模，桌面紧张或通勤携带都能塞进包里；矮轴键程浅，手感上限低于常规轴体。" },
  { catId: "input", itemId: "k14", tier: "进阶", grade: "A", reason: "81 键磁轴 RT 配 Gasket 与全键热插拔，三百档磁轴键盘爆品，瓦与 CS 玩家平价上车；仅支持有线连接。" },
  { catId: "input", itemId: "k6", tier: "进阶", grade: "A", reason: "一线大厂轻量化配光学微动，耐用度与售后扎实；80-99g 在当下轻量化趋势里偏重，同价国产已能买到 50g 级。" },
  { catId: "input", itemId: "k15", tier: "进阶", grade: "A", reason: "铝壳 Gasket 三模，填充与声音手感越级，五百档几乎没有对手；分量不轻，经常带出门请选矮轴便携款。" },
  { catId: "input", itemId: "k16", tier: "进阶", grade: "S", reason: "旗舰模具配 HERO2 与 8K 回报率，58g 轻量化，FPS 一步到位；无灯、侧键少，多键需求与办公党另选。" },
  { catId: "input", itemId: "k11", tier: "旗舰", grade: "B", reason: "多设备切换与人机工学造型，剪辑、编程与多机办公的主力鼠；回报率与重量都不适合 FPS 场景。" },
  { catId: "input", itemId: "k10", tier: "旗舰", grade: "B", reason: "48g 超轻配 AimPoint Pro 42K 与 8K 无线，FPS 硬核玩家的下限保障；近千元属于竞技溢价，休闲玩家用不上。" },
  { catId: "input", itemId: "k9", tier: "旗舰", grade: "B", reason: "CNC 铝合金 96% Alice 配列，无线 8K 还能撑 660 小时，长时间码字肩腕更放松；Alice 配列需要适应期。" },
  { catId: "input", itemId: "k8", tier: "旗舰", grade: "B", reason: "全键热插拔配 2 英寸 OLED 与三面透光，旗舰手感与灯效天花板；价格已进入客制化成品区间。" },
  { catId: "audio", itemId: "a1", tier: "入门", grade: "S", reason: "百元档 2.0 蓝牙音箱，USB 即插即用，小桌面与宿舍省心不占地；音质只到够用级别，追低音要加钱。" },
  { catId: "audio", itemId: "a10", tier: "入门", grade: "A", reason: "USB 即插即用的心形指向电容麦，主动降噪压得住键盘声，网课直播与语音会议性价比之选；无 XLR 口，升级空间小。" },
  { catId: "audio", itemId: "a7", tier: "甜点", grade: "S", reason: "-49dB 降噪配 83 小时续航与 LDAC，三百档通勤降噪天花板；蓝牙延迟高，FPS 听声辨位不要选它。" },
  { catId: "audio", itemId: "a3", tier: "甜点", grade: "A", reason: "4 英寸中低音配丝绢高音与木质箱体，桌面近场 HiFi 的启蒙；接口只到蓝牙/AUX/LINE，接电视先看接口是否够用。" },
  { catId: "audio", itemId: "a2", tier: "甜点", grade: "A", reason: "四单元一体式设计，声音均衡，办公桌与客厅电视两用；一体式声场不如同价分体 2.0 宽松。" },
  { catId: "audio", itemId: "a9", tier: "进阶", grade: "A", reason: "53mm 单元配 USB 声卡与 DTS 空间音效，FPS 听声辨位口碑标杆，可拆降噪麦开黑清晰；有线束缚桌面，纯听歌不值这个价。" },
  { catId: "audio", itemId: "a4", tier: "进阶", grade: "A", reason: "猫眼号角高音通透，带同轴与光纤输入，接电视比同价音箱方便；比漫步者同档贵约 200 元，换的是高音解析与接口规格。" },
  { catId: "audio", itemId: "a5", tier: "旗舰", grade: "B", reason: "120W 功率配 5.5 英寸中低音，客厅当电视音响也够；桌面近场用体积偏大，小桌子建议退回 D1100。" },
  { catId: "audio", itemId: "a6", tier: "旗舰", grade: "A", reason: "5.25 英寸木质 2.0，近场监听味足，不少机主用十年不换；价格是入门箱的三倍以上，只求听个响属于浪费。" },
  { catId: "network", itemId: "n7", tier: "入门", grade: "S", reason: "百元档 AX3000 双频，米家生态一键配网，小户型与宿舍覆盖够用；没有 2.5G 口，超千兆宽带跑不满。" },
  { catId: "network", itemId: "n2", tier: "入门", grade: "A", reason: "固件稳定、故障率低，老房子与多设备家庭省心；制式停在 WiFi6 AX3000，同样没有 2.5G 口。" },
  { catId: "network", itemId: "n1", tier: "甜点", grade: "S", reason: "百元 WiFi7 带一个 2.5G 口，80-100㎡ 小户型性价比最高；单 2.5G 口，多设备有线互联要上 BE6500。" },
  { catId: "network", itemId: "n8", tier: "甜点", grade: "A", reason: "五个 2.5G 电口把 NAS、主机与路由拉进 2.5G 内网，金属无风扇静音即插即用；非网管型没有 VLAN 与链路聚合。" },
  { catId: "network", itemId: "n6", tier: "甜点", grade: "A", reason: "军规散热与游戏加速引擎，电竞场景稳定性够；规格为 WiFi7 入门档且只有一个 2.5G 口，买它主要买固件与品牌。" },
  { catId: "network", itemId: "n4", tier: "进阶", grade: "S", reason: "全 2.5G 网口的 WiFi7，千兆宽带、大户型与多设备家庭首选；天线增益一般，穿墙需求多的请看 BE7200 Pro+。" },
  { catId: "network", itemId: "n5", tier: "旗舰", grade: "A", reason: "双 2.5G 口配 MLO 多链路聚合与 8 天线，游戏低延迟抗干扰，大户型优选；房间不大或宽带未到千兆吃不到差价。" },
  { catId: "dock", itemId: "d2", tier: "入门", grade: "A", reason: "HDMI 加三个 USB3.0 的基础扩展，出差备用不心疼；没有 PD 快充与读卡，长期当主力建议上 7 合 1。" },
  { catId: "dock", itemId: "d1", tier: "甜点", grade: "S", reason: "HDMI 4K 加三个 USB3.0、PD 100W 与读卡槽，轻薄本一线连全解决；无双 HDMI 与网口，外接双屏要换 10 合 1。" },
  { catId: "dock", itemId: "d7", tier: "进阶", grade: "A", reason: "2.5G 网口加 HDMI 4K60 与 PD 100W 一线通，轻薄本接有线网与显示器的性价比解法；单屏输出，先确认 C 口支持视频。" },
  { catId: "dock", itemId: "d3", tier: "进阶", grade: "A", reason: "双 HDMI 4K 加千兆网口、SD/TF 读卡与 PD，桌面一线到位；桌面坞体积大不便携，常出差仍需再配便携款。" },
  { catId: "dock", itemId: "d4", tier: "进阶", grade: "B", reason: "接口齐全并带 VGA，兼容会议室老投影，企业办公稳定之选；消费级场景下价格与规格都不占优。" },
  { catId: "dock", itemId: "d6", tier: "进阶", grade: "B", reason: "HDMI 加 DP、四个 USB 与千兆网口，会议一线解决；同为商务坞，家用场景下同类产品价格更低。" },
  { catId: "dock", itemId: "d5", tier: "旗舰", grade: "B", reason: "雷电 4 提供 40Gbps 带宽，8K 输出与高速存储扩展，创作本一步到位；普通 USB-C 笔记本用不上这个带宽。" },
  { catId: "psu", itemId: "p6", tier: "入门", grade: "S", reason: "百元级走线友好的 MATX 中塔，与 A620M 这类小板尺寸正好匹配；只支持 240 水冷与 345mm 显卡，ATX 大板另选。" },
  { catId: "psu", itemId: "p15", tier: "入门", grade: "A", reason: "ATX 3.1 铜牌 650W 两百出头，带 7650 GRE / 5060 级整机稳当；直出线材理线偏乱，三年质保中规中矩。" },
  { catId: "psu", itemId: "p10", tier: "甜点", grade: "S", reason: "ATX 左右分仓海景房，360 冷排与 10 风扇位全给到，同价空间利用率最高；CPU 限高 160mm，装双塔风冷要留意。" },
  { catId: "psu", itemId: "p1", tier: "甜点", grade: "S", reason: "650W 金牌全模的入门游戏机标配，i5/R5 配 RTX 5060 级平台刚好；上到 5070 级或长期高负载应换 750W。" },
  { catId: "psu", itemId: "p7", tier: "甜点", grade: "A", reason: "MATX 无立柱海景房，四面快拆免工具且塞得下 360 水冷；官方明确不支持 ATX 大板，配 B760M/B650M 才合适。" },
  { catId: "psu", itemId: "p20", tier: "进阶", grade: "A", reason: "四面吸音棉加标配静音扇，办公与卧室主机的降噪标杆；无侧透不透光，散热上限一般，闷罐配置慎入。" },
  { catId: "psu", itemId: "p11", tier: "进阶", grade: "A", reason: "无立柱 270° 海景房，8 风扇位还支持背插走线，Type-C 到 20Gbps；价格比霄Air 翻倍，买的是做工与背插底子。" },
  { catId: "psu", itemId: "p2", tier: "进阶", grade: "A", reason: "750W 金牌直出，五百元档的实用之选；直出线不好理线也换不了定制线，加一两百可上全模组。" },
  { catId: "psu", itemId: "p8", tier: "进阶", grade: "S", reason: "850W ATX3.1 原生 12V-2x6 加全模组，RTX 5070 Ti 级平台合适；与长城 X8 同档却多 100W，价格相近。" },
  { catId: "psu", itemId: "p3", tier: "进阶", grade: "S", reason: "750W ATX3.1 配全日系电容、全模组与十年质保，RTX 5070 级平台的稳妥搭配；比直出款贵约 150 元。" },
  { catId: "psu", itemId: "p16", tier: "旗舰", grade: "B", reason: "SFX 规格金牌全模还带宽幅温控，ITX 小钢炮的稳妥心脏；无原生 12V-2×6 接口，新旗舰 N 卡需转接，标准 ATX 机箱别花这个钱。" },
  { catId: "psu", itemId: "p14", tier: "旗舰", grade: "B", reason: "中塔里散热第一梯队，装得下 EATX、11 风扇位，压 5080/5090 的发热有底气；价格约为入门海景房的三倍，只有旗舰配置需要为散热花这笔钱。" },
  { catId: "psu", itemId: "p5", tier: "旗舰", grade: "B", reason: "1000W 十年质保旗舰，为 RTX 5080/5090 与后续升级留足冗余；价格是国产 850W 的两倍，非旗舰显卡不划算。" },
  { catId: "psu", itemId: "p17", tier: "旗舰", grade: "S", reason: "1200W 白金全模配原生 12V-2×6，5090D 级旗舰整机的心脏，全日系电容十年保；主流配置严重过剩。" },
  { catId: "psu", itemId: "p13", tier: "旗舰", grade: "B", reason: "270° 全景配双 6 英寸高清屏与 460mm 显卡限长，硬件与展示性都要；屏幕属纯展示溢价，实用党同价能买到更好的风道。" },
  { catId: "cpu", itemId: "u11", tier: "入门", grade: "B", reason: "全新带保里最便宜的能打游戏的 U，4 核 8 线程配入门独显刚好；比 R5 5500 少 2 核，多开与新 3A 别指望。" },
  { catId: "cpu", itemId: "u1", tier: "入门", grade: "S", reason: "AM4 板 U 套装极致性价比，预算敏感整机的首选；Zen3 已是上代架构，没有核显也没有升级空间。" },
  { catId: "cpu", itemId: "u3", tier: "入门", grade: "A", reason: "4 核 8 线程、58W 低功耗好散热，网游与办公够用；核心数少，多开与轻剪辑会吃力。" },
  { catId: "cpu", itemId: "u2", tier: "甜点", grade: "S", reason: "RDNA3 核显打轻度网游够用，办公机可免独显，纯办公最划算；CPU 性能弱于同价 7500F，日后加独显会先撞瓶颈。" },
  { catId: "cpu", itemId: "u9", tier: "甜点", grade: "S", reason: "无核显游戏六核，AM5 板 U 套装性价比极高，游戏入门首选；必须配独显，办公机不要选它。" },
  { catId: "cpu", itemId: "u4", tier: "甜点", grade: "S", reason: "Zen5 六核单核强、65W 好压，主流游戏机的甜点；六核在重度渲染与多开上不如 9700X。" },
  { catId: "cpu", itemId: "u13", tier: "甜点", grade: "A", reason: "千元档多核最强，10 核 16 线程还能用便宜 DDR4，清库存价；平台已无升级空间，追新接口要另选。" },
  { catId: "cpu", itemId: "u5", tier: "进阶", grade: "A", reason: "14 核 20 线程游戏多开加轻创作通吃；125W 功耗需配双塔或 240 水冷，且无核显。" },
  { catId: "cpu", itemId: "u6", tier: "进阶", grade: "A", reason: "8 核 Zen5 剪辑渲染与游戏双修，65W 功耗对散热友好；游戏帧数不及 9800X3D，创作吞吐不及 Ultra 9。" },
  { catId: "cpu", itemId: "u15", tier: "进阶", grade: "S", reason: "96MB 3D 缓存的游戏帧率至今第一梯队，散片两千出头；生产力打不过同价十二核，纯办公别浪费钱。" },
  { catId: "cpu", itemId: "u17", tier: "旗舰", grade: "A", reason: "12 核 Zen5 自营 2499，渲染编译性能对得起每一块钱；纯游戏不如便宜近千的 7800X3D，定位明确。" },
  { catId: "cpu", itemId: "u7", tier: "旗舰", grade: "S", reason: "3D 缓存游戏王，FPS 帧数断崖领先，电竞旗舰的默认答案；生产力与同价八核持平甚至偏弱，只玩游戏才值这个溢价。" },
  { catId: "cpu", itemId: "u18", tier: "旗舰", grade: "A", reason: "16 核 Zen5 纯生产力场景的核心数天花板；游戏用不满 16 核，视频渲染与虚拟机重度用户才值回票价。" },
  { catId: "gpu", itemId: "g11", tier: "入门", grade: "B", reason: "千元全新带保的唯一选择，8G 版缓解爆显存，老网游与亮机够用；PCIe x4 通道在老平台掉性能。" },
  { catId: "gpu", itemId: "g1", tier: "入门", grade: "A", reason: "1080P 高画质网游的入门独显，130W 功耗配 450W 电源即可；8G 显存与光追性能有限，2K 高画质要上 5060 那一档。" },
  { catId: "gpu", itemId: "g13", tier: "甜点", grade: "S", reason: "性能看齐 RTX 4060 却便宜近 500，1080P 高画质通吃、2K 入门可战；光追与 CUDA 生态是短板，AI 与剪辑请选 N 卡。" },
  { catId: "gpu", itemId: "g2", tier: "甜点", grade: "S", reason: "2K 入门甜点，DLSS4 加持，主流游戏机的默认答案；8G 显存在高材质 2K 下会吃紧，追战未来选 16G 型号。" },
  { catId: "gpu", itemId: "g3", tier: "甜点", grade: "A", reason: "16G 显存战未来，2K 高画质通吃，A 卡性价比之选；光追与 DLSS 生态弱于 N 卡，N 卡专属优化游戏会吃亏。" },
  { catId: "gpu", itemId: "g8", tier: "进阶", grade: "A", reason: "16G 大显存的 2K 全特效 A 卡主力，显存比同价 N 卡宽裕；上一代架构，光追与能效落后新卡。" },
  { catId: "gpu", itemId: "g16", tier: "进阶", grade: "A", reason: "性能贴着 RTX 5070 却便宜 2000 以上，2K 高刷天花板、4K 入门也能摸；近期跟涨明显，超过 4800 就不建议追。" },
  { catId: "gpu", itemId: "g9", tier: "进阶", grade: "A", reason: "16G 显存甜点加 DLSS4；2026-10 已涨到 5000 以上，性价比被涨价削弱，同价 A 卡显存相同且更便宜。" },
  { catId: "gpu", itemId: "g5", tier: "进阶", grade: "A", reason: "对标 RTX 5070 配 16G 显存与 FSR4，A 卡阵营的旗舰性价比；光追与专业软件加速不如 N 卡。" },
  { catId: "gpu", itemId: "g4", tier: "进阶", grade: "A", reason: "2K 全特效加 DLSS4 帧生成，高帧电竞的稳妥选择；价格较 618 明显上移，预算卡在 6000 内建议退回 5060 Ti。" },
  { catId: "gpu", itemId: "g6", tier: "旗舰", grade: "S", reason: "16G 显存创作与游戏双旗舰，NVENC 加速让剪辑导出更快；当前价格含明显缺货溢价，非急需可等行情回落。" },
  { catId: "gpu", itemId: "g7", tier: "旗舰", grade: "A", reason: "4K 高刷顶配与 AI 渲染利器；配 850-1000W 电源，整机预算要留足，预算有限时 5070 Ti 是更理性的分界。" },
  { catId: "gpu", itemId: "g10", tier: "旗舰", grade: "C", reason: "32G 显存与 4K 240Hz 的终极答案；缺货溢价明显，需 1000W+ 电源与旗舰主板，除非专业刚需否则不划算。" },
];

/* ===========================================================
 * 颜值外观（Aesthetics）：6 种装机美学风格
 * 用于「颜值外观」画廊展示、配件价格库的「颜值风格」筛选、
 * 以及个性化测评中的颜值偏好加权。
 * =========================================================== */
window.PC_STYLES = [
  { id: "white",    name: "白色简约",  icon: "🤍", img: "assets/looks/look-white.webp",
    desc: "通体白色机箱配浅色桌面，干净通透，像把雪放进书房。明亮环境下最显干净，是「不费力就好看」的安全牌。",
    paletteName: "奶白 / 浅灰 / 银",
    palette: ["#f8fafc", "#e2e8f0", "#cbd5e1", "#94a3b8"],
    suits: "明亮书房、居家办公、学生宿舍、喜欢清爽感的人",
    caseType: "白色海景房 / 白色中塔",
    caseTip: "优先白色机身 + 白色显卡线 / 白色风扇，避免黑色件露馅；侧透版记得背线。",
    lighting: "几乎不用灯，或仅冷白低亮度氛围灯；靠材质与配色取胜。",
    accents: "浅木桌垫、白色支架、极简白色摆件，绿植选淡色盆。",
    avoid: "别混进黑色风扇或花线，一旦杂色整体就垮；也别堆太多摆件。",
    tips: ["白色海景房 / 白色显卡线，整体色调统一", "浅木或白桌，走线全部隐藏", "少即是多，桌面只留必需品"] },
  { id: "seaview",  name: "海景房",    icon: "🪟", img: "assets/looks/look-seaview.webp",
    desc: "全景双玻侧透，把硬件与风扇灯做成「展示柜」，硬件即装饰。出片率最高的风格，也是理线功力的试金石。",
    paletteName: "冰蓝 / 青 / 透白",
    palette: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#e0f2fe"],
    suits: "展示欲强、爱拍照分享、愿意花时间理线的玩家与创作者",
    caseType: "全景无 A 柱海景房（双仓）",
    caseTip: "选双仓海景房，显卡竖装 + 反向风扇统一风道；内部理线是颜值的一半。",
    lighting: "风扇 / 内存 / 水冷头统一冰蓝或青色，立式水冷管走位要对称才出片。",
    accents: "透明或浅色桌垫、ARGB 风扇包、显卡支架（延长线也选白色/透明）。",
    avoid: "海景房最怕露乱线。侧透机箱不理线，比不透明机箱更难看。",
    tips: ["双仓海景房机箱，无 A 柱遮挡视野", "反向风扇统一风道，理线规整", "风扇 / 灯效统一方向更出片"] },
  { id: "rgb",      name: "RGB 电竞",  icon: "🌈", img: "assets/looks/look-rgb.webp",
    desc: "暗色机身 + 多彩灯效，氛围感拉满，游戏桌的灵魂。贵在「同步与克制」，而非灯越多越好。",
    paletteName: "粉 / 紫 / 蓝 / 青",
    palette: ["#ec4899", "#8b5cf6", "#3b82f6", "#06b6d4"],
    suits: "游戏玩家、深夜党、追求沉浸氛围的桌面控",
    caseType: "黑色侧透 / 黑色网孔机箱",
    caseTip: "黑色机身更衬灯效；选侧透看内部，网孔版则靠外设灯出氛围。",
    lighting: "统一灯控软件（主板厂 / OpenRGB）让主板内存风扇同步；暗环境才出层次。",
    accents: "RGB 键鼠、灯带、桌垫灯边；灯色与墙色/桌垫呼应更协调。",
    avoid: "各灯各闪像 KTV，务必同步；亮度别拉满，过曝刺眼不耐看。",
    tips: ["统一灯控软件，主板 / 内存 / 风扇同步", "暗环境更能显出灯效层次", "灯色与桌面 / 墙色呼应更协调"] },
  { id: "business", name: "商务黑",    icon: "⚫", img: "assets/looks/look-business.webp",
    desc: "低调黑色 + 木质桌面，沉稳专业，会议室与居家都得体。靠克制的质感打动人，而非装饰。",
    paletteName: "炭黑 / 深灰 / 银",
    palette: ["#1f2937", "#374151", "#4b5563", "#9ca3af"],
    suits: "居家办公、自由职业、需要专业感又不张扬的人",
    caseType: "黑色哑光中塔",
    caseTip: "哑光黑机箱 + 黑色理线，克制不张扬；隐藏供电与多余灯。",
    lighting: "基本无灯或极弱冷白；靠金属与木纹质感，不靠光。",
    accents: "深色木桌 / 木纹桌垫、黑色机械臂支架、金属摆件。",
    avoid: "别加花哨 RGB，会破坏专业感；桌面别堆满，留白显克制。",
    tips: ["黑色哑光机箱，克制不张扬", "理线藏背，桌面清爽", "木质 / 深色木桌提升质感"] },
  { id: "wood",     name: "复古木质",  icon: "🪵", img: "assets/looks/look-wood.webp",
    desc: "原木机箱或木纹桌面，温润质感，给冷冰冰的硬件加点温度。治愈系桌面的顶流。",
    paletteName: "胡桃 / 焦糖 / 暖橙",
    palette: ["#b45309", "#92400e", "#a16207", "#d97706"],
    suits: "偏爱温暖治愈风、复古审美、居家慢生活的人",
    caseType: "木纹 / 原木机箱 或 深色中塔 + 木桌",
    caseTip: "木纹机箱是灵魂；没有就深色中塔配大块木桌，照样出味。",
    lighting: "暖白 / 暖黄低亮度氛围灯，比冷白温馨；可加小夜灯。",
    accents: "绿植、复古键帽、木质托盘、暖光小台灯，营造温度。",
    avoid: "冷白强光会破坏暖调；别堆冷色塑料感外设，选木质/金属质感。",
    tips: ["木纹机箱 / 木桌，暖光氛围灯", "绿植与复古键帽点缀", "暖白灯比冷白更温馨"] },
  { id: "portable", name: "便携简洁",  icon: "💻", img: "assets/looks/look-portable.webp",
    desc: "笔记本 + 极简外设，清爽随行，桌面永远不拥挤。把「少」做到极致，也最易保持整洁。",
    paletteName: "薄荷绿 / 浅绿 / 透白",
    palette: ["#10b981", "#34d399", "#6ee7b7", "#ecfdf5"],
    suits: "学生、移动办公、租房党、讨厌理线的极简控",
    caseType: "无需机箱（笔记本 + 拓展坞）",
    caseTip: "靠单线 Type-C 扩展坞一线连，外设全无线；桌下也别留线。",
    lighting: "基本无灯，靠整洁取胜；可加一块浅色桌垫统一视觉。",
    accents: "无线键鼠、便携支架、绿植小物，桌面大量留白。",
    avoid: "别接一堆线材和hub堆桌面；选无线+一线连才是精髓。",
    tips: ["无线键鼠，减少线材", "单线 Type-C 扩展坞一线连", "支架抬升视线，桌面留白"] }
];

/* 颜值搭配 6 大原则（用于「颜值搭配原则」区块） */
window.PC_LOOK_PRINCIPLES = [
  { icon: "🎨", title: "配色三色法则", text: "整机配色控制在 3 个以内色相：1 主色 + 1 辅色 + 1 点缀。全白 / 全黑 / 木纹最稳，杂色一多立刻显乱。" },
  { icon: "🧵", title: "藏线即高级",   text: "背线、束线、隐藏供电，是「高级感」与「廉价感」的分水岭。理线花 30 分钟，观感提升一个档次。" },
  { icon: "💡", title: "灯光讲统一",   text: "用同一软件让主板、内存、风扇同色同步，暗环境下才有层次。灯不是越多越好。" },
  { icon: "🪵", title: "材质要呼应",   text: "机箱、桌垫、支架、摆件材质一致（全白/全黑/木纹），整体氛围才闭环，单件再好看不搭也白费。" },
  { icon: "⚖️", title: "留白与呼吸",   text: "桌面留白，只留必需品，给视线一个落脚点。塞满的外设和摆件会压垮任何风格。" },
  { icon: "🪟", title: "机箱即展柜",   text: "海景房 / 侧透把硬件当装饰，选它就意味着内部也得经得起看：理线、走位、对称都得更讲究。" }
];

/* 颜值避坑指南（用于「避坑指南」区块） */
window.PC_LOOK_PITFALLS = [
  { bad: "杂色混搭", text: "机箱白、风扇黑、线材花——杂色最显乱。先定主色再买件，宁可少一件别错色。" },
  { bad: "RGB 各闪各", text: "各灯不同步像 KTV。务必用统一灯控软件同步，选单色或渐变比彩虹爆闪耐看。" },
  { bad: "只买侧透不理线", text: "海景房露出一团乱线，比不透明机箱更尴尬。买侧透前先练背线，或选带理线仓的机箱。" },
  { bad: "灯效拉满", text: "亮度过曝刺眼。降到 40-60% + 统一色温，长时间看更舒服也更显贵。" },
  { bad: "桌面堆满", text: "外设、摆件、线缆塞满桌面，失去呼吸感。定期断舍离，留白才是高级。" },
  { bad: "为颜值超预算", text: "海景房机箱、白色件、灯效件普遍溢价 20-50%。先定总预算，再为颜值留专项，别本末倒置。" }
];

/* 细节赏析图廊（用于「细节赏析」区块，补充图片样式） */
window.PC_LOOK_DETAILS = [
  { img: "assets/looks/look-detail-cable.webp", tag: "理线细节", text: "背线 + 束线 + 隐藏供电，是高级感的分水岭。" },
  { img: "assets/looks/look-detail-white.webp", tag: "白色海景房", text: "全白机身 + 白色延长线，纯净到像展品。" },
  { img: "assets/looks/look-detail-rgb.webp",   tag: "RGB 氛围",  text: "统一灯控下的暗房氛围，层次比亮度更重要。" }
];

/* 产品 → 颜值风格 映射（id 对应 PC_STYLES.id） */
window.PC_LOOKS = {
  c1: "white", c2: "white", c3: "white", c4: "business", c5: "rgb", c6: "business", c7: "white", c8: "white",
  s1: "white", s2: "white", s3: "business", s4: "business", s5: "white", s6: "business", s7: "business",
  m1: "white", m2: "rgb", m3: "rgb", m4: "rgb", m5: "white", m6: "rgb", m7: "rgb",
  k1: "white", k2: "white", k3: "business", k4: "white", k5: "rgb", k6: "rgb", k7: "white",
  a1: "white", a2: "business", a3: "wood", a4: "wood", a5: "wood", a6: "wood",
  n1: "white", n2: "business", n3: "business", n4: "white", n5: "rgb", n6: "rgb",
  d1: "portable", d2: "portable", d3: "business", d4: "business", d5: "business", d6: "business",
  p1: "white", p2: "white", p3: "white", p4: "white", p5: "business", p6: "white", p7: "seaview", p8: "white", p9: "seaview",
  u1: "white", u2: "white", u3: "business", u4: "white", u5: "business", u6: "white", u7: "business", u8: "business", u9: "white", u10: "business",
  g1: "white", g2: "rgb", g3: "rgb", g4: "rgb", g5: "rgb", g6: "rgb", g7: "rgb", g8: "rgb", g9: "rgb"
};
