/* ===========================================================
 * models.js — 真实产品型号数据库（2026-08 参考行情）
 * 价格区间为人民币参考价（京东自营/电商 2026 年 8 月联网核验行情），
 * 随促销、补贴波动，购机请以电商实时价为准。
 * 字段：
 *   id / brand / model / name(品牌+型号展示名) / style / price([min,max])
 *   rating(0-5) / valueGrade(S/A/B/C) / valueNote(一句话点评)
 *   use(适用场景) / audience(适合人群) / tags / specs / compat(搭配建议)
 * =========================================================== */
window.PC_MODELS = {
  /* ---------- 散热器 ---------- */
  cooler: [
    { id: "c1",  brand: "利民",      model: "AX120 R SE",         name: "利民 AX120 R SE", style: "风冷单塔", price: [60, 89],    rating: 5, valueGrade: "S", valueNote: "百元内单塔之王，四热管压主流 CPU 无压力。",        use: ["office", "portable"], audience: ["student", "office"], tags: ["高性价比"],  specs: "4×6mm 热管;解热 125W;148mm 高;三年质保", compat: "i3/R5 及办公机首选，注意机箱限高 ≥150mm" },
    { id: "c2",  brand: "九州风神",  model: "玄冰 400 V5",         name: "九州风神 玄冰400 V5", style: "风冷单塔", price: [69, 109],   rating: 4, valueGrade: "A", valueNote: "5 热管+大鳍片，办公机静音优选。",                  use: ["office", "game"],     audience: ["student", "office"], tags: ["静音"],      specs: "5×6mm 热管;解热 220W;≤31.6dB(A)", compat: "i5 全系/办公娱乐够用，RGB 版可选" },
    { id: "c3",  brand: "利民",      model: "PA120 SE",           name: "利民 PA120 SE", style: "风冷双塔", price: [138, 179],   rating: 5, valueGrade: "S", valueNote: "双塔性价比标杆，i7/R7 也能压得住。",              use: ["game", "create"],     audience: ["gamer", "student"], tags: ["高性价比"],  specs: "6×6mm 热管;解热 280W;157mm 高", compat: "主流游戏/创作平台首选，注意机箱限高与内存避让" },
    { id: "c4",  brand: "九州风神",  model: "大霜塔 V5",           name: "九州风神 大霜塔 V5", style: "风冷双塔", price: [135, 199],   rating: 4, valueGrade: "A", valueNote: "6 热管双塔，静音调校好，价格略高于 PA120。",      use: ["game", "create"],     audience: ["gamer", "creator"], tags: ["静音"],      specs: "6×6mm 热管;解热 200W;159mm 高", compat: "静音党优先，大机箱更从容" },
    { id: "c5",  brand: "瓦尔基里",  model: "B360-GT",             name: "瓦尔基里 B360-GT", style: "360水冷", price: [499, 590],   rating: 5, valueGrade: "A", valueNote: "中端 360 水冷性能王者，五年质保。",              use: ["create", "game"],     audience: ["creator", "gamer"], tags: ["RGB", "静音"], specs: "360mm 冷排;解热 280W;五年质保", compat: "需机箱支持 360 冷排位，旗舰 CPU 推荐" },
    { id: "c6",  brand: "Arctic",    model: "LF III 360",          name: "Arctic 液冷 LF III 360", style: "360水冷", price: [599, 720], rating: 5, valueGrade: "S", valueNote: "S 级水冷，300W+ 顶级解热，满载噪音反而更低。",      use: ["create"],             audience: ["creator"], tags: ["静音", "长质保"], specs: "38mm 厚排;解热 330W;六年质保", compat: "Ultra9/R9 级旗舰与长期高负载渲染首选" }
  ],

  /* ---------- 支架 ---------- */
  stand: [
    { id: "s1", brand: "北弧",      model: "Brateck E350",       name: "北弧 Brateck E350", style: "单臂支架", price: [99, 129],   rating: 5, valueGrade: "S", valueNote: "入门单臂性价比之王，气弹簧顺滑。",                  use: ["office", "game"], audience: ["office", "student"], tags: ["人体工学", "高性价比"], specs: "VESA 75/100;承重 9kg;17-32 英寸", compat: "确认显示器带 VESA 孔；夹桌厚 2-5cm" },
    { id: "s2", brand: "NB",        model: "F80",                 name: "NB F80", style: "单臂支架", price: [69, 129],   rating: 5, valueGrade: "S", valueNote: "9kg 真机械臂，百元档越级做工。",                    use: ["office", "game"], audience: ["student", "office"], tags: ["人体工学", "高性价比"], specs: "双段机械臂;承重 9kg;17-32 英寸;阻尼油芯", compat: "显示器+笔记本双叠也能稳，理线方便" },
    { id: "s3", brand: "NB",        model: "F160",                name: "NB F160", style: "单臂支架", price: [170, 259],   rating: 4, valueGrade: "A", valueNote: "气弹簧顺滑，自带理线槽，办公进阶之选。",            use: ["office"],             audience: ["office"], tags: ["人体工学", "理线"], specs: "气弹簧;415mm 升降;538mm 拉伸;17-27 英寸", compat: "双屏组建建议选双臂款" },
    { id: "s4", brand: "乐歌",      model: "DLB502-D",            name: "乐歌 DLB502-D", style: "单臂支架", price: [298, 399],   rating: 4, valueGrade: "A", valueNote: "自由悬停升降顺滑，外观硬朗有辨识度。",              use: ["office", "create"], audience: ["office", "creator"], tags: ["人体工学"], specs: "承重 2-9kg;395mm 悬停升降;17-30 英寸", compat: "对支架质感有要求的中高端办公场景" },
    { id: "s5", brand: "AOC",       model: "AM400PLUS",           name: "AOC AM400PLUS", style: "一体升降", price: [299, 399],   rating: 4, valueGrade: "B", valueNote: "一体式设计不沉头，适合懒人快装。",                  use: ["office"],             audience: ["office", "student"], tags: ["省事"], specs: "一体式桌面升降;承重 6kg;22-32 英寸", compat: "免 VESA 改造？仍需确认显示器带孔" },
    { id: "s6", brand: "NB",        model: "H180",                name: "NB H180 双臂", style: "双臂支架", price: [299, 499],   rating: 4, valueGrade: "A", valueNote: "双屏办公利器，理线槽设计到位。",                    use: ["office", "create"], audience: ["office", "creator"], tags: ["多屏", "理线"], specs: "承重 12kg;22-32 英寸;550mm 拉伸/615mm 升降", compat: "双 27 英寸内各一支，注意桌面厚度" }
  ],

  /* ---------- 显示器 ---------- */
  monitor: [
    { id: "m1", brand: "小米",      model: "Redmi A27Q",          name: "小米 Redmi A27Q", style: "27英寸 2K", price: [609, 899],   rating: 5, valueGrade: "S", valueNote: "27 英寸 2K 入门高性价比，办公游戏两相宜。",         use: ["office", "game"], audience: ["student", "office"], tags: ["高性价比"], specs: "27\";2K 75Hz;IPS;Type-C 可选", compat: "入门显卡即可带动，办公/轻度游戏首选" },
    { id: "m2", brand: "泰坦军团",  model: "P2710R2+",             name: "泰坦军团 P2710R2+", style: "27英寸 2K 高刷", price: [749, 949],   rating: 5, valueGrade: "S", valueNote: "2K 高刷卷王，799 元档无对手。",                    use: ["game", "office"], audience: ["gamer", "student"], tags: ["高性价比", "电竞"], specs: "27\";2K 180Hz;Fast IPS;1ms", compat: "RTX 5060 级显卡可带满帧率" },
    { id: "m3", brand: "AOC",       model: "Q27G4SP",             name: "AOC Q27G4SP", style: "27英寸 2K 高刷", price: [1150, 1350],  rating: 4, valueGrade: "A", valueNote: "一线大厂 2K 高刷甜点，品控与售后更稳。",            use: ["game", "office"], audience: ["gamer", "office"], tags: ["电竞", "大品牌"], specs: "27\";2K 170Hz;IPS;HDR10", compat: "品牌控优先，比白牌贵约 200 买放心" },
    { id: "m4", brand: "雷鸟",      model: "Q6",                   name: "雷鸟 Q6", style: "27英寸 2K 高刷", price: [1190, 1399],  rating: 5, valueGrade: "S", valueNote: "高刷+广色域双修，游戏设计兼顾。",                  use: ["game", "create"], audience: ["gamer", "creator"], tags: ["电竞", "高色域"], specs: "27\";2K 170Hz;DCI-P3 95%+", compat: "游戏党升级首选，兼顾轻度修图" },
    { id: "m5", brand: "雷鸟",      model: "U6",                   name: "雷鸟 U6", style: "27英寸 4K", price: [1249, 1399],  rating: 5, valueGrade: "S", valueNote: "4K 性价比之王，办公修图闭眼入。",                    use: ["office", "create"], audience: ["office", "creator"], tags: ["高性价比", "清晰"], specs: "27\";4K 60Hz;IPS;Type-C 90W 反向充电", compat: "笔记本外接首选，Type-C 一线连" },
    { id: "m6", brand: "泰坦军团",  model: "P275MV MAX",           name: "泰坦军团 P275MV MAX", style: "27英寸 4K 高刷", price: [1990, 2499], rating: 4, valueGrade: "A", valueNote: "MiniLED 4K 高刷，同价位画质天花板。",               use: ["game", "create"], audience: ["creator", "gamer"], tags: ["旗舰", "MiniLED"], specs: "27\";4K 160Hz;MiniLED;HDR1000", compat: "需 RTX 5070 Ti 级显卡跑 4K 高刷" }
  ],

  /* ---------- 键鼠外设 ---------- */
  input: [
    { id: "k1", brand: "达尔优",    model: "DK100",               name: "达尔优 DK100", style: "机械键盘", price: [79, 109],   rating: 4, valueGrade: "S", valueNote: "百元内机械键盘入门，办公学生党首选。",              use: ["office"],             audience: ["student", "office"], tags: ["高性价比"], specs: "104 键;青/黑轴;混光背光", compat: "预算型办公与备用键盘" },
    { id: "k2", brand: "狼蛛",      model: "F87",                  name: "狼蛛 F87", style: "机械键盘", price: [149, 199],   rating: 5, valueGrade: "S", valueNote: "200 元档 Gasket 卷王，三模热插拔全都有。",            use: ["game", "office"], audience: ["gamer", "student"], tags: ["高性价比", "三模"], specs: "87 键;Gasket;三模;全键热插拔;4000mAh", compat: "游戏办公通吃，性价比天花板" },
    { id: "k3", brand: "VGN",       model: "V98 Pro V3",           name: "VGN V98 Pro V3", style: "机械键盘", price: [239, 289],   rating: 5, valueGrade: "A", valueNote: "98 配列长期标杆，冰淇淋轴手感扎实。",                use: ["game", "create"], audience: ["gamer", "creator"], tags: ["手感", "三模"], specs: "98 键;三模;冰淇淋/极地狐轴;8000mAh", compat: "带数字区的游戏/办公主力键盘" },
    { id: "k4", brand: "VGN",       model: "蜻蜓 R1",              name: "VGN 蜻蜓 R1", style: "无线鼠标", price: [69, 99],    rating: 5, valueGrade: "S", valueNote: "百元内 3395 传感器卷王，轻至 48g。",                  use: ["game", "portable"], audience: ["student", "gamer"], tags: ["高性价比", "轻量化"], specs: "PAW3395SE;48g;三模;2K 回报率", compat: "小手抓握/指握玩家首选" },
    { id: "k5", brand: "迈从",      model: "A5",                   name: "迈从 A5", style: "无线鼠标", price: [170, 240],   rating: 5, valueGrade: "S", valueNote: "4K 回报率类 GPW 模具，旗舰体验平民价。",             use: ["game"],               audience: ["gamer"], tags: ["电竞", "高回报率"], specs: "PAW3395;56g;4K 回报率;类 GPW 模具", compat: "FPS/MOBA 玩家，中大手抓握" },
    { id: "k6", brand: "雷蛇",      model: "毒蝰 V3 极速版",        name: "雷蛇 毒蝰V3极速版", style: "无线鼠标", price: [269, 340],  rating: 4, valueGrade: "A", valueNote: "一线大厂轻量化甜点，Faker 同款。",                  use: ["game"],               audience: ["gamer"], tags: ["电竞", "大品牌"], specs: "80-99g;≥1000mAh;光学微动", compat: "品牌控与长时间游戏用户" }
  ],

  /* ---------- 音频设备 ---------- */
  audio: [
    { id: "a1", brand: "漫步者",    model: "R20",                  name: "漫步者 R20", style: "桌面音箱", price: [155, 200],   rating: 4, valueGrade: "S", valueNote: "百元档蓝牙 2.0，桌面影音够用。",                    use: ["office", "game"], audience: ["student", "office"], tags: ["高性价比"], specs: "2.0 声道;蓝牙 6.0;USB 即插即用", compat: "小桌面/宿舍首选，省心不占地" },
    { id: "a2", brand: "漫步者",    model: "D12",                  name: "漫步者 D12", style: "桌面音箱", price: [307, 440],   rating: 4, valueGrade: "A", valueNote: "四单元一体式，音质均衡性价比高。",                  use: ["office", "game"], audience: ["office", "student"], tags: ["音质"], specs: "2.0 声道;4 单元;DSP 数字音频;蓝牙 5.0", compat: "办公桌与客厅电视两用" },
    { id: "a3", brand: "漫步者",    model: "R1080BT",              name: "漫步者 R1080BT", style: "桌面音箱", price: [230, 419],   rating: 4, valueGrade: "A", valueNote: "入门木质箱体标杆，小空间 HiFi 启蒙。",               use: ["office", "create"], audience: ["office", "creator"], tags: ["音质", "木质箱体"], specs: "4 英寸中低音+丝绢高音;蓝牙/AUX/LINE", compat: "桌面近场听音首选，预算友好" },
    { id: "a4", brand: "惠威",      model: "D1100",                name: "惠威 D1100", style: "桌面音箱", price: [659, 799],   rating: 5, valueGrade: "A", valueNote: "进阶 HiFi 甜点，猫眼号角高音通透。",                use: ["create", "office"], audience: ["creator", "office"], tags: ["音质", "HiFi"], specs: "20mm 球顶高音+4 英寸中低音;同轴/光纤输入", compat: "对音质有要求的创作者与听音党" },
    { id: "a5", brand: "漫步者",    model: "S1000MKII",            name: "漫步者 S1000MKII", style: "桌面音箱", price: [898, 1299], rating: 5, valueGrade: "B", valueNote: "HiFi 级 2.0，120W 大功率，客厅电视也够用。",         use: ["create"],             audience: ["creator"], tags: ["HiFi", "大功率"], specs: "钛顶高音+5.5 英寸中低音;120W;APTX 蓝牙", compat: "预算充足的影音发烧友" }
  ],

  /* ---------- 网络设备 ---------- */
  network: [
    { id: "n1", brand: "小米",      model: "BE3600 2.5G 版",        name: "小米 BE3600 2.5G 版", style: "WiFi7 路由", price: [140, 180],  rating: 5, valueGrade: "S", valueNote: "百元 WiFi7 带 2.5G 口，小户型神器。",                use: ["office", "portable"], audience: ["student", "office"], tags: ["高性价比", "WiFi7"], specs: "WiFi7;高通四核;1×2.5G 口;支持 Mesh", compat: "80-100㎡ 小户型，宽带 ≥500M 优先 2.5G 口" },
    { id: "n2", brand: "TP-LINK",   model: "XDR3010 易展版",        name: "TP-LINK XDR3010 易展版", style: "WiFi6 路由", price: [135, 150],  rating: 4, valueGrade: "A", valueNote: "固件稳定、故障率低，老房子稳定之选。",               use: ["office"],             audience: ["student", "office"], tags: ["稳定"], specs: "WiFi6;AX3000;易展 Mesh", compat: "多设备家庭，追求省心" },
    { id: "n3", brand: "红米",      model: "AX5400",               name: "红米 AX5400", style: "WiFi6 路由", price: [319, 399],   rating: 4, valueGrade: "A", valueNote: "家用爆款，带机量大发热控制好。",                    use: ["game", "office"], audience: ["office", "gamer"], tags: ["带机强", "稳定"], specs: "WiFi6;AX5400;大内存", compat: "100-130㎡ 家用主力" },
    { id: "n4", brand: "小米",      model: "BE6500",               name: "小米 BE6500", style: "WiFi7 路由", price: [279, 420],   rating: 5, valueGrade: "S", valueNote: "最便宜的全 2.5G 口 WiFi7，300 元档王者。",            use: ["game", "create"], audience: ["gamer", "creator"], tags: ["WiFi7", "全2.5G口"], specs: "WiFi7;全 2.5G 网口;512MB 内存;IPQ5322", compat: "千兆宽带/大户型/多设备家庭首选" },
    { id: "n5", brand: "中兴",      model: "BE7200 Pro+",           name: "中兴 BE7200 Pro+", style: "WiFi7 路由", price: [459, 539],   rating: 5, valueGrade: "A", valueNote: "游戏低延迟抗干扰，大户型优选。",                    use: ["game", "create"], audience: ["gamer"], tags: ["电竞", "强信号"], specs: "WiFi7;双 2.5G;MLO 多链路聚合;8 天线", compat: "电竞玩家与大平层覆盖" }
  ],

  /* ---------- 拓展坞 ---------- */
  dock: [
    { id: "d1", brand: "绿联",      model: "Type-C 7合1",           name: "绿联 Type-C 7合1", style: "便携拓展坞", price: [80, 179],   rating: 5, valueGrade: "S", valueNote: "轻薄本标配，HDMI+USB+PD 一线连。",                  use: ["portable", "office"], audience: ["mobile", "student"], tags: ["便携", "高性价比"], specs: "HDMI 4K+USB3.0×3+PD 100W+SD", compat: "MacBook/轻薄本扩展接口必买" },
    { id: "d2", brand: "倍思",      model: "Type-C 集线器",          name: "倍思 Type-C 集线器", style: "便携拓展坞", price: [55, 129],   rating: 4, valueGrade: "A", valueNote: "基础扩展低价方案，出差备用。",                      use: ["portable"],             audience: ["student", "mobile"], tags: ["便携", "高性价比"], specs: "HDMI+USB3.0×3;铝合金机身", compat: "接口紧张的基础解决方案" },
    { id: "d3", brand: "绿联",      model: "10合1 桌面坞",           name: "绿联 10合1 桌面坞", style: "桌面拓展坞", price: [185, 299],   rating: 4, valueGrade: "A", valueNote: "双 HDMI+千兆+读卡，桌面一步到位。",                  use: ["office", "create"], audience: ["office", "creator"], tags: ["多接口"], specs: "双 HDMI 4K;千兆网口;SD/TF 读卡;PD", compat: "外接双屏+有线网络首选" },
    { id: "d4", brand: "联想",      model: "Type-C 商务坞",          name: "联想 Type-C 商务坞", style: "桌面拓展坞", price: [120, 299],   rating: 4, valueGrade: "B", valueNote: "商务稳定之选，接口齐全。",                          use: ["office"],               audience: ["office"], tags: ["稳定"], specs: "HDMI+VGA+USB×3+千兆;商用定位", compat: "企业办公与会议场景" },
    { id: "d5", brand: "绿联",      model: "雷电 4 拓展坞",          name: "绿联 雷电4 拓展坞", style: "旗舰拓展坞", price: [199, 999],  rating: 4, valueGrade: "B", valueNote: "40Gbps 带宽，创作者高性能外设一步到位。",             use: ["create", "portable"], audience: ["creator", "mobile"], tags: ["旗舰", "高速"], specs: "雷电 4;40Gbps;8K 输出;高速存储", compat: "MacBook Pro/高性能笔记本创作用户" }
  ],

  /* ---------- 电源与机箱 ---------- */
  psu: [
    { id: "p1", brand: "长城",      model: "X5 650W 金牌全模",       name: "长城 X5 650W 金牌全模", style: "电源", price: [280, 399],   rating: 5, valueGrade: "S", valueNote: "650W 金牌高性价比，入门游戏机标配。",                use: ["office", "game"], audience: ["student", "office"], tags: ["高性价比", "金牌"], specs: "650W;80PLUS 金牌;全模组", compat: "i5/R5+RTX 5060 级平台够用" },
    { id: "p2", brand: "鑫谷",      model: "GP750G",                name: "鑫谷 GP750G", style: "电源", price: [480, 570],   rating: 4, valueGrade: "A", valueNote: "750W 金牌直出，500 元档实用之选。",                 use: ["game"],               audience: ["student", "gamer"], tags: ["高性价比", "金牌"], specs: "750W;80PLUS 金牌;直出", compat: "预算型游戏平台推荐" },
    { id: "p3", brand: "长城",      model: "X8 750W 金牌全模",       name: "长城 X8 750W 金牌全模", style: "电源", price: [650, 750],   rating: 5, valueGrade: "S", valueNote: "750W 甜点，ATX3.1 全日系电容，热销王。",             use: ["game", "create"], audience: ["gamer", "creator"], tags: ["ATX3.1", "金牌"], specs: "750W;ATX3.1;全日系电容;全模组;十年质保", compat: "RTX 5070 级显卡平台推荐" },
    { id: "p4", brand: "鑫谷",      model: "GP850G",                name: "鑫谷 GP850G", style: "电源", price: [550, 650],   rating: 4, valueGrade: "A", valueNote: "850W 主流之选，ATX3.1 带原生 12V-2x6。",            use: ["game", "create"], audience: ["gamer", "creator"], tags: ["ATX3.1", "金牌"], specs: "850W;ATX3.1;原生 12V-2x6;全模组", compat: "RTX 5070 Ti 级平台推荐" },
    { id: "p5", brand: "海韵",      model: "FOCUS GX-1000",         name: "海韵 FOCUS GX-1000", style: "电源", price: [1080, 1240],  rating: 5, valueGrade: "B", valueNote: "十年质保旗舰，为未来升级留足冗余。",                  use: ["create", "game"], audience: ["creator", "gamer"], tags: ["旗舰", "长质保"], specs: "1000W;ATX3.1;白金级用料;十年质保", compat: "RTX 5080/5090 与长期高负载" },
    { id: "p6", brand: "先马",      model: "平头哥 M2",              name: "先马 平头哥 M2", style: "机箱", price: [109, 230],   rating: 4, valueGrade: "S", valueNote: "百元级走线友好的中塔，装机新手友好。",                use: ["game", "office"], audience: ["student", "gamer"], tags: ["高性价比", "走线"], specs: "中塔 ATX;支持 240/360 冷排;侧透可选", compat: "首台台式机通用之选" },
    { id: "p7", brand: "爱国者",    model: "星璨岚",                name: "爱国者 星璨 岚", style: "机箱", price: [199, 350],   rating: 4, valueGrade: "A", valueNote: "入门海景房，颜值与风道兼顾。",                        use: ["game", "create"], audience: ["gamer", "creator"], tags: ["RGB", "颜值"], specs: "全景侧透;支持 360 冷排;ATX", compat: "灯效爱好者与海景房主题装机" }
  ]
};

/* ---------- 性价比 TOP 榜单（按品类分类排行，每类 2-3 款） ---------- */
window.PC_DATA = window.PC_DATA || {};
window.PC_DATA.topList = [
  { catId: "cooler",  itemId: "c1", grade: "S", reason: "百元内单塔之王，四热管压主流 CPU，闭眼入。" },
  { catId: "cooler",  itemId: "c3", grade: "S", reason: "双塔性价比标杆，200 元内压住 i7/R7。" },
  { catId: "cooler",  itemId: "c2", grade: "A", reason: "5 热管+大鳍片，办公机静音优选。" },
  { catId: "stand",   itemId: "s1", grade: "S", reason: "入门单臂性价比之王，109 元解锁人体工学。" },
  { catId: "stand",   itemId: "s2", grade: "S", reason: "9kg 真机械臂，百元档越级做工。" },
  { catId: "stand",   itemId: "s3", grade: "A", reason: "气弹簧顺滑自带理线槽，办公进阶之选。" },
  { catId: "monitor", itemId: "m2", grade: "S", reason: "2K 180Hz 卷到 800 元档，游戏党首选。" },
  { catId: "monitor", itemId: "m5", grade: "S", reason: "4K 性价比之王，Type-C 一线连笔记本。" },
  { catId: "monitor", itemId: "m1", grade: "S", reason: "27 英寸 2K 入门高性价比，办公游戏两相宜。" },
  { catId: "input",   itemId: "k4", grade: "S", reason: "百元内 3395 传感器+48g 轻量化，卷无可卷。" },
  { catId: "input",   itemId: "k2", grade: "S", reason: "200 元档 Gasket 三模热插拔全配齐。" },
  { catId: "input",   itemId: "k1", grade: "S", reason: "百元内机械键盘入门，办公学生党首选。" },
  { catId: "audio",   itemId: "a1", grade: "S", reason: "155 元蓝牙 2.0，桌面影音一步到位。" },
  { catId: "audio",   itemId: "a2", grade: "A", reason: "四单元一体式，音质均衡性价比高。" },
  { catId: "audio",   itemId: "a3", grade: "A", reason: "入门木质箱体标杆，小空间 HiFi 启蒙。" },
  { catId: "network", itemId: "n4", grade: "S", reason: "最便宜的全 2.5G 口 WiFi7，300 元档王者。" },
  { catId: "network", itemId: "n1", grade: "S", reason: "百元 WiFi7 带 2.5G 口，小户型神器。" },
  { catId: "network", itemId: "n3", grade: "A", reason: "家用爆款，带机量大发热控制好。" },
  { catId: "dock",    itemId: "d1", grade: "S", reason: "轻薄本标配，HDMI+USB+PD 一线连。" },
  { catId: "dock",    itemId: "d2", grade: "A", reason: "基础扩展低价方案，出差备用。" },
  { catId: "dock",    itemId: "d3", grade: "A", reason: "双 HDMI+千兆+读卡，桌面一步到位。" },
  { catId: "psu",     itemId: "p3", grade: "S", reason: "750W ATX3.1 全日系电容，十年质保热销王。" },
  { catId: "psu",     itemId: "p1", grade: "S", reason: "650W 金牌高性价比，入门游戏机标配。" },
  { catId: "psu",     itemId: "p6", grade: "S", reason: "百元级走线友好的中塔，装机新手友好。" }
];

/* ===========================================================
 * 颜值外观（Aesthetics）：6 种装机美学风格
 * 用于「颜值外观」画廊展示、配件价格库的「颜值风格」筛选、
 * 以及个性化测评中的颜值偏好加权。
 * =========================================================== */
window.PC_STYLES = [
  { id: "white",    name: "白色简约",  icon: "🤍", img: "assets/looks/look-white.png",
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
  { id: "seaview",  name: "海景房",    icon: "🪟", img: "assets/looks/look-seaview.png",
    desc: "全景双玻侧透，把硬件与风扇灯做成「展示柜」，硬件即装饰。出片率最高的风格，也是理线功力的试金石。",
    paletteName: "冰蓝 / 青 / 透白",
    palette: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#e0f2fe"],
    suits: "展示欲强、爱拍照分享、愿意花时间理线的玩家与创作者",
    caseType: "全景无 A 柱海景房（双仓）",
    caseTip: "选双仓海景房，显卡竖装 + 反向风扇统一风道；内部理线是颜值的一半。",
    lighting: "风扇 / 内存 / 水冷头统一冰蓝或青色，立式水冷管走位要对称才出片。",
    accents: "透明或浅色桌垫、ARGB 风扇包、显卡支架（延长线也选白色/透明）。",
    avoid: "海景房最怕露乱线——只买侧透不理线，比不透明机箱更尴尬。",
    tips: ["双仓海景房机箱，无 A 柱遮挡视野", "反向风扇统一风道，理线规整", "风扇 / 灯效统一方向更出片"] },
  { id: "rgb",      name: "RGB 电竞",  icon: "🌈", img: "assets/looks/look-rgb.png",
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
  { id: "business", name: "商务黑",    icon: "⚫", img: "assets/looks/look-business.png",
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
  { id: "wood",     name: "复古木质",  icon: "🪵", img: "assets/looks/look-wood.png",
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
  { id: "portable", name: "便携简洁",  icon: "💻", img: "assets/looks/look-portable.png",
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
  { icon: "💡", title: "灯光讲统一",   text: "RGB 贵在「同步与统一」——用同一软件让主板/内存/风扇同色同呼吸，暗环境才出层次，而非灯越多越好。" },
  { icon: "🪵", title: "材质要呼应",   text: "机箱、桌垫、支架、摆件材质一致（全白/全黑/木纹），整体氛围才闭环，单件再好看不搭也白费。" },
  { icon: "⚖️", title: "留白与呼吸",   text: "桌面留白，只留必需品，给视线一个落脚点。塞满的外设和摆件会压垮任何风格。" },
  { icon: "🪟", title: "机箱即展柜",   text: "海景房 / 侧透把硬件当装饰，选它就要接受「内部也得上相」——理线、走位、对称都得更讲究。" }
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
  { img: "assets/looks/look-detail-cable.png", tag: "理线细节", text: "背线 + 束线 + 隐藏供电，是高级感的分水岭。" },
  { img: "assets/looks/look-detail-white.png", tag: "白色海景房", text: "全白机身 + 白色延长线，纯净到像展品。" },
  { img: "assets/looks/look-detail-rgb.png",   tag: "RGB 氛围",  text: "统一灯控下的暗房氛围，层次比亮度更重要。" }
];

/* 性价比榜单实物图：品类 → 产品实物参考图（用于榜单项卡片） */
window.PC_TOP_IMG = {
  cooler:  "assets/top/top-cooler.png",
  stand:   "assets/top/top-stand.png",
  monitor: "assets/top/top-monitor.png",
  input:   "assets/top/top-input.png",
  audio:   "assets/top/top-audio.png",
  network: "assets/top/top-network.png",
  dock:    "assets/top/top-dock.png",
  psu:     "assets/top/top-psu.jpg"
};

/* 产品 → 颜值风格 映射（id 对应 PC_STYLES.id） */
window.PC_LOOKS = {
  c1: "white", c2: "white", c3: "white", c4: "business", c5: "rgb", c6: "business",
  s1: "white", s2: "white", s3: "business", s4: "business", s5: "white", s6: "business",
  m1: "white", m2: "rgb", m3: "rgb", m4: "rgb", m5: "white", m6: "rgb",
  k1: "white", k2: "white", k3: "business", k4: "white", k5: "rgb", k6: "rgb",
  a1: "white", a2: "business", a3: "wood", a4: "wood", a5: "wood",
  n1: "white", n2: "business", n3: "business", n4: "white", n5: "rgb",
  d1: "portable", d2: "portable", d3: "business", d4: "business", d5: "business",
  p1: "white", p2: "white", p3: "white", p4: "white", p5: "business", p6: "white", p7: "seaview"
};
