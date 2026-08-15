/* ===========================================================
 * data.js — 配件行情与搭配数据库（2026-08 参考行情）
 * 价格区间为人民币参考价，基于 2026 年 6-8 月电商/评测行情整理，
 * 随促销、补贴波动，购机请以电商实时价为准。
 * 结构：
 *   PC_DATA.categories  — 配件品类与条目（含价格/样式/人群/搭配）
 *   PC_DATA.personas    — 适合人群画像
 *   PC_DATA.plans       — 搭配计划（整机方案）
 *   PC_DATA.quiz        — 个性化测评问题定义
 * =========================================================== */
window.PC_DATA = {
  updated: "2026-08",
  note: "价格区间为 2026-08 参考行情（人民币），随促销/补贴波动，以电商实时价为准",

  /* ---------- 适合人群画像 ---------- */
  personas: [
    { id: "student",    icon: "🎓", name: "学生党",    desc: "预算有限、性价比优先，兼顾学习与轻度娱乐，注重耐用与便携。" },
    { id: "office",     icon: "💼", name: "办公族",    desc: "文档/表格/会议为主，要求稳定安静、多屏效率，对性能要求不高。" },
    { id: "gamer",      icon: "🎮", name: "游戏党",    desc: "看重帧率与响应，显卡/高刷显示器为核心投入，散热与键鼠体验敏感。" },
    { id: "creator",    icon: "🎬", name: "创作者",    desc: "视频剪辑/设计/AI 渲染，重 CPU 多核、大内存、高色域显示器。" },
    { id: "mobile",     icon: "💻", name: "通勤族",    desc: "笔记本随行，重视支架/散热/拓展坞等外设与续航，轻量便携。" }
  ],

  /* ---------- 搭配计划（整机方案） ---------- */
  plans: [
    {
      id: "budget",
      name: "经济实用型",
      icon: "🏠",
      price: [4000, 5500],
      personas: ["student", "office"],
      uses: ["office"],
      form: ["desktop"],
      summary: "办公学习、网课追剧、轻度娱乐的入门台式机，够用且预算友好。",
      parts: [
        ["CPU", "R5 5600 散片 / i3-14100F", "¥450-650"],
        ["主板", "B650M / B760M", "¥750-900"],
        ["内存", "DDR5 16G×2（或 DDR4 双通道 16G）", "¥300-500"],
        ["硬盘", "PCIe4.0 1TB SSD", "¥459-600"],
        ["电源", "500-650W 铜牌/金牌", "¥300-400"],
        ["机箱", "标准中塔", "¥200"],
        ["散热", "百元级风冷单塔", "¥69-109"],
        ["显示器", '24" 1080P 高刷 / 27" 2K 入门', "¥500-800"],
        ["键鼠", "百元键鼠套装", "¥100-200"]
      ],
      tip: "可先配核显平台（如 R5 8500G）把预算压到 3000 内，日后再加显卡。"
    },
    {
      id: "mainstream",
      name: "主流游戏型",
      icon: "🎮",
      price: [7500, 9500],
      personas: ["gamer", "student"],
      uses: ["game"],
      form: ["desktop"],
      summary: "1080P-2K 高帧率畅玩主流 3A，性价比甜点区间。",
      parts: [
        ["CPU", "i5-14600KF / R5 9600X", "¥1300-1800"],
        ["显卡", "RTX 5060 / RX 9060 XT", "¥2200-2700"],
        ["主板", "B760M / B650M", "¥800-900"],
        ["内存", "DDR5 32G（16G×2）", "¥600-800"],
        ["硬盘", "PCIe4.0 1TB SSD", "¥459-600"],
        ["电源", "650-750W 金牌全模组", "¥400-600"],
        ["散热", "双塔风冷 / 240 水冷", "¥150-300"],
        ["显示器", '27" 2K 高刷（144Hz+）', "¥800-1300"],
        ["键鼠", "入门机械键盘 + 游戏鼠标", "¥200-400"]
      ],
      tip: "显卡优先于 CPU：同预算下先满足显卡，游戏帧率收益最大。"
    },
    {
      id: "creator",
      name: "创作旗舰型",
      icon: "🎬",
      price: [15000, 22000],
      personas: ["creator"],
      uses: ["create"],
      form: ["desktop"],
      summary: "视频剪辑、3D 设计、AI 渲染的生产力主机，多核强、内存大、色彩准。",
      parts: [
        ["CPU", "R7 9850X3D / Ultra 7 270K", "¥2500-3700"],
        ["显卡", "RTX 5070 Ti / RTX 5080", "¥6800-8800"],
        ["主板", "X670E / Z790", "¥1800-2500"],
        ["内存", "DDR5 64G（32G×2）", "¥1200-1600"],
        ["硬盘", "PCIe4.0 2TB SSD + 4TB 素材盘", "¥1300-1700"],
        ["电源", "850-1000W 金牌/白金", "¥600-1000"],
        ["散热", "360 一体式水冷", "¥400-650"],
        ["显示器", '27" 4K 高色域（≥99% sRGB）', "¥1500-2500"],
        ["键鼠", "静音/机械键盘 + 人体工学鼠标", "¥800-1500"]
      ],
      tip: "渲染吃 CPU 与内存，剪辑吃显卡编解码；显示器优先选出厂校色（ΔE<2）。"
    },
    {
      id: "mobile",
      name: "便携移动型",
      icon: "💻",
      price: [800, 2500],
      personas: ["mobile", "student"],
      uses: ["portable"],
      form: ["laptop", "both"],
      summary: "笔记本用户的「外设补强包」：支架、散热、拓展坞与便携键鼠，把移动设备用出桌面级体验。",
      parts: [
        ["笔记本支架", "铝合金升降支架", "¥100-200"],
        ["散热", "散热底座 / 半导体散热器", "¥100-260"],
        ["拓展坞", "Type-C 多口拓展坞", "¥100-400"],
        ["外接显示器", '27" 2K（Type-C 反向充电）', "¥800-1500"],
        ["便携键鼠", "轻薄无线键鼠", "¥150-400"],
        ["耳机/音箱", "无线耳机或桌面小音箱", "¥100-400"]
      ],
      tip: "优先买支架+拓展坞：久坐颈椎和接口焦虑两个痛点一次解决。"
    }
  ],

  /* ---------- 配件品类与条目 ---------- */
  categories: [
    {
      id: "cooler", name: "散热器", icon: "❄️",
      items: [
        { id: "c1",  name: "风冷单塔·入门",  style: "风冷单塔", price: [49, 99],  rating: 4, use: ["office", "portable"], audience: ["student", "office"], tags: ["高性价比", "静音"],        specs: "4-5 热管，压 125-150W，适合 i3/R5 及办公机", compat: "普通塔式机箱均可安装，注意高度 >150mm 时选大机箱" },
        { id: "c2",  name: "风冷单塔·主流",  style: "风冷单塔", price: [99, 159], rating: 4, use: ["office", "game"],     audience: ["student", "office", "gamer"], tags: ["高性价比"],  specs: "5-6 热管，压 180-220W，i5 全系/R7 低功耗版够用", compat: "百元甜点区，日常游戏首选；机箱宽度需 ≥155mm" },
        { id: "c3",  name: "风冷双塔·性价比", style: "风冷双塔", price: [137, 199], rating: 5, use: ["game", "create"],    audience: ["gamer", "student"], tags: ["高性价比"],  specs: "6-7 热管双塔，压 220-280W，i7/R7 无压力", compat: "高度 155-160mm，需确认机箱限高与内存避让" },
        { id: "c4",  name: "风冷双塔·旗舰",  style: "风冷双塔", price: [449, 699], rating: 5, use: ["game", "create"],    audience: ["gamer", "creator"], tags: ["静音", "长质保"],  specs: "7-8 热管，压 280-300W，6 年质保，静音标杆", compat: "高度 160mm+，大塔体需注意内存马甲高度" },
        { id: "c5",  name: "240 一体式水冷", style: "240水冷",   price: [179, 349], rating: 4, use: ["game", "create"],    audience: ["gamer", "creator"], tags: ["RGB", "颜值"],     specs: "压 250W 内，适合中塔机箱顶/前安装", compat: "需机箱支持 240 冷排位（顶部或前面板）" },
        { id: "c6",  name: "360 一体式水冷", style: "360水冷",   price: [379, 649], rating: 5, use: ["create", "game"],    audience: ["creator", "gamer"], tags: ["RGB", "静音"],     specs: "压 300-330W，旗舰 CPU 满载也能压住", compat: "需机箱支持 360 冷排位，大机箱才装得下" },
        { id: "c7",  name: "360 水冷·旗舰屏显", style: "360水冷", price: [899, 2699], rating: 4, use: ["create"],          audience: ["creator"], tags: ["RGB", "颜值"],             specs: "带 LCD 数显/冷头屏，性能与颜值兼备", compat: "溢价高，普通用户不必追求，看预算与喜好" },
        { id: "c8",  name: "笔记本散热底座",  style: "笔记本散热", price: [89, 259], rating: 4, use: ["portable"],          audience: ["mobile", "student"], tags: ["便携", "静音"],  specs: "6-8 风扇+金属网面，改善风道降温 5-10℃", compat: "选与笔记本尺寸匹配的规格，注意 USB 供电" },
        { id: "c9",  name: "半导体笔记本散热器", style: "笔记本散热", price: [99, 158], rating: 4, use: ["portable", "game"], audience: ["mobile", "gamer"], tags: ["便携", "降温强"], specs: "半导体+涡轮风冷双效，实测可降 15-19℃", compat: "适合高负载游戏/渲染的笔记本，注意噪音" },
        { id: "c10", name: "机箱风扇套装",    style: "风道配件",   price: [18, 120], rating: 4, use: ["game", "create"],    audience: ["gamer"], tags: ["RGB", "高性价比"],           specs: "12cm ARGB 风扇，正反叶搭配形成前进后出风道", compat: "按机箱风位数量选购，优先级：后出 > 前入 > 顶出" }
      ]
    },
    {
      id: "stand", name: "支架", icon: "🛠️",
      items: [
        { id: "s1", name: "显示器支架·单臂", style: "显示器支架", price: [89, 299], rating: 4, use: ["office", "game"], audience: ["office", "gamer"], tags: ["人体工学", "桌面空间"], specs: "VESA 75/100 孔位，支持升降/俯仰/旋转", compat: "确认显示器支持 VESA 孔（无孔需转接架）" },
        { id: "s2", name: "显示器支架·双臂", style: "显示器支架", price: [199, 499], rating: 5, use: ["office", "create"], audience: ["office", "creator"], tags: ["人体工学", "多屏"],   specs: "双屏各 27 英寸内，屏幕高度自由调节", compat: "夹桌或穿孔安装，桌板厚度需 2-5cm" },
        { id: "s3", name: "笔记本升降支架",   style: "笔记本支架", price: [29, 159], rating: 4, use: ["portable", "office"], audience: ["mobile", "student"], tags: ["便携", "人体工学"], specs: "铝合金折叠，抬高屏幕改善颈椎", compat: "选六档以上可调高度、带防滑硅胶" },
        { id: "s4", name: "笔记本散热增高支架", style: "笔记本支架", price: [89, 259], rating: 4, use: ["portable", "game"], audience: ["mobile", "gamer"], tags: ["散热", "人体工学"],    specs: "抬高 10-20cm 同时辅助散热", compat: "游戏本优先，兼顾打字角度的设计更佳" },
        { id: "s5", name: "立式笔记本支架",   style: "笔记本支架", price: [39, 129], rating: 4, use: ["portable"],         audience: ["mobile", "office"], tags: ["节省空间"],       specs: "立式收纳，外接屏用户释放桌面", compat: "适合合盖外接显示器使用，注意散热开盖建议" },
        { id: "s6", name: "平板/手机支架",    style: "桌面支架",   price: [19, 89],  rating: 4, use: ["office", "portable"], audience: ["student", "office"], tags: ["便携"],        specs: "多角度可调，网课/视频会议适用", compat: "桌面与床头两用，选承重合适的" },
        { id: "s7", name: "显示器增高架",     style: "桌面收纳",   price: [49, 199], rating: 4, use: ["office"],            audience: ["office", "student"], tags: ["收纳", "人体工学"], specs: "抬高显示器并收纳键盘/杂物", compat: "桌面深度 ≥60cm 更协调" },
        { id: "s8", name: "落地显示器支架",   style: "显示器支架", price: [299, 699], rating: 4, use: ["create", "office"], audience: ["creator", "office"], tags: ["人体工学"],      specs: "不夹桌，适合玻璃/薄桌板场景", compat: "站坐交替办公人群首选" }
      ]
    },
    {
      id: "monitor", name: "显示器", icon: "🖥️",
      items: [
        { id: "m1",  name: '24" 1080P 高刷',  style: "电竞屏", price: [487, 699],  rating: 4, use: ["game", "office"], audience: ["student", "gamer"], tags: ["高性价比", "电竞"], specs: "180Hz+ IPS，学生宿舍游戏甜点", compat: "入门显卡即可带动" },
        { id: "m2",  name: '27" 2K 高刷',     style: "电竞屏", price: [759, 1299], rating: 5, use: ["game", "office"], audience: ["gamer", "office"], tags: ["高性价比", "电竞"], specs: "2K 165-180Hz IPS，2026 主流甜点", compat: "需 RTX 5060 及以上显卡带满帧率" },
        { id: "m3",  name: '27" 2K 高刷·进阶', style: "电竞屏", price: [1300, 1700], rating: 5, use: ["game", "create"], audience: ["gamer", "creator"], tags: ["电竞", "高色域"],  specs: "2K 240Hz+ 或带 MiniLED 分区背光", compat: "FPS 玩家与兼顾设计人群" },
        { id: "m4",  name: '27" 4K 办公',     style: "办公屏", price: [999, 1499], rating: 4, use: ["office", "create"], audience: ["office", "creator"], tags: ["高性价比", "清晰"], specs: "4K 60Hz，文字细腻，Type-C 反向充电", compat: "办公与修图够用，游戏需高性能显卡" },
        { id: "m5",  name: '27" 4K 高刷',     style: "电竞屏", price: [1700, 3000], rating: 5, use: ["game", "create"], audience: ["creator", "gamer"], tags: ["旗舰", "电竞"],    specs: "4K 144-160Hz，旗舰显卡的完美搭档", compat: "需 RTX 5070 Ti 及以上才跑得动 4K 高刷" },
        { id: "m6",  name: '34" 带鱼屏',      style: "带鱼屏", price: [869, 2599], rating: 4, use: ["game", "create"], audience: ["creator", "gamer"], tags: ["沉浸", "多窗口"],  specs: "21:9 超宽，多窗口办公/赛车游戏沉浸", compat: "游戏需关注显卡兼容性与帧率" },
        { id: "m7",  name: "专业设计屏",      style: "专业屏", price: [1500, 3000], rating: 5, use: ["create"],         audience: ["creator"], tags: ["高色域", "校色"],        specs: "≥99% sRGB / DCI-P3，出厂校色 ΔE<2", compat: "平面设计/视频后期优先考虑" },
        { id: "m8",  name: "便携屏 15-16\"",   style: "便携屏", price: [500, 1200], rating: 4, use: ["portable"],         audience: ["mobile", "student"], tags: ["便携", "双屏"], specs: "Type-C 一线连，出差副屏", compat: "笔记本用户扩展视野利器" },
        { id: "m9",  name: '23.8" 办公护眼',  style: "办公屏", price: [399, 699],  rating: 4, use: ["office"],           audience: ["office", "student"], tags: ["护眼", "高性价比"], specs: "低蓝光+不闪屏，文字办公够用", compat: "预算紧张的办公场景首选" },
        { id: "m10", name: "高刷 4K 双模屏",  style: "旗舰屏", price: [1899, 3099], rating: 5, use: ["game", "create"], audience: ["gamer", "creator"], tags: ["旗舰", "电竞"],    specs: "4K 高刷 / 1080P 超高分双模切换", compat: "通吃办公与电竞的顶级选择" }
      ]
    },
    {
      id: "input", name: "键鼠外设", icon: "⌨️",
      items: [
        { id: "k1", name: "机械键盘·入门",  style: "机械键盘", price: [99, 199],  rating: 4, use: ["game", "office"], audience: ["student", "office"], tags: ["高性价比"],    specs: "国产轴热插拔，Gasket 结构下放", compat: "办公室注意选线性轴降噪" },
        { id: "k2", name: "机械键盘·主流",  style: "机械键盘", price: [200, 499],  rating: 5, use: ["game", "create"], audience: ["gamer", "creator"], tags: ["手感", "RGB"],   specs: "三模连接，客制化轴体手感天花板", compat: "游戏与长时间码字均适合" },
        { id: "k3", name: "机械键盘·静音轴", style: "机械键盘", price: [150, 350], rating: 4, use: ["office", "create"], audience: ["office", "creator"], tags: ["静音"],      specs: "静音轴/矮轴，办公不扰人", compat: "开放式工位强烈推荐" },
        { id: "k4", name: "无线办公鼠标",   style: "无线鼠标", price: [59, 129],  rating: 4, use: ["office", "portable"], audience: ["office", "mobile"], tags: ["便携", "静音"], specs: "轻量化+静音微动，蓝牙双模", compat: "通勤办公首选" },
        { id: "k5", name: "游戏鼠标",       style: "游戏鼠标", price: [149, 499],  rating: 5, use: ["game"],             audience: ["gamer"], tags: ["电竞", "高回报率"],      specs: "PAW 3395 级传感器，4K 回报率", compat: "FPS/MOBA 玩家优先" },
        { id: "k6", name: "人体工学鼠标",   style: "人体工学", price: [129, 399],  rating: 4, use: ["office", "create"], audience: ["office", "creator"], tags: ["人体工学", "护腕"], specs: "垂直握持，缓解腕管压力", compat: "长时间鼠标工作者强烈建议" },
        { id: "k7", name: "薄膜静音键鼠套", style: "键鼠套装", price: [69, 199],  rating: 4, use: ["office", "portable"], audience: ["student", "office"], tags: ["高性价比", "静音"], specs: "低噪剪刀脚，随取随用", compat: "预算型办公与备用外设" },
        { id: "k8", name: "桌面鼠标垫",     style: "鼠标垫",   price: [19, 99],   rating: 4, use: ["game", "office"], audience: ["gamer", "office"], tags: ["高性价比"],    specs: "细面布垫/大尺寸桌垫", compat: "游戏选顺滑布垫，办公选厚桌垫" },
        { id: "k9", name: "客制化/高端键盘", style: "机械键盘", price: [500, 1000], rating: 5, use: ["create", "game"], audience: ["creator", "gamer"], tags: ["手感", "颜值"],   specs: "铝坨坨/客制化轴体，一步到位", compat: "输入发烧友的选择" },
        { id: "k10", name: "便携折叠键盘",  style: "便携键盘", price: [99, 249],  rating: 4, use: ["portable"],         audience: ["mobile", "student"], tags: ["便携"],      specs: "折叠/超薄，配合平板出差", compat: "移动办公组合的补充" }
      ]
    },
    {
      id: "audio", name: "音频设备", icon: "🎧",
      items: [
        { id: "a1", name: "桌面音箱·入门",  style: "桌面音箱", price: [99, 249],  rating: 4, use: ["office", "game"], audience: ["student", "office"], tags: ["高性价比"],   specs: "2.0 书架箱，日常影音够用", compat: "办公桌小空间首选" },
        { id: "a2", name: "桌面音箱·主流",  style: "桌面音箱", price: [249, 599],  rating: 5, use: ["game", "create"], audience: ["gamer", "creator"], tags: ["音质"],       specs: "2.0/2.1 带独立低音炮", compat: "游戏与音乐用户甜点" },
        { id: "a3", name: "头戴耳机·入门",  style: "头戴耳机", price: [99, 299],  rating: 4, use: ["game", "portable"], audience: ["student", "gamer"], tags: ["高性价比"],   specs: "无线/有线可选，佩戴舒适", compat: "宿舍游戏不扰人" },
        { id: "a4", name: "头戴耳机·游戏",  style: "游戏耳机", price: [299, 899],  rating: 4, use: ["game"],            audience: ["gamer"], tags: ["电竞", "7.1声道"],     specs: "虚拟 7.1，听声辨位", compat: "FPS 玩家必备" },
        { id: "a5", name: "桌面麦克风",     style: "麦克风",   price: [89, 499],  rating: 4, use: ["create", "office"], audience: ["creator", "office"], tags: ["拾音"],      specs: "电容麦+支架，会议/直播/配音", compat: "视频会议与内容创作共用" },
        { id: "a6", name: "降噪无线耳机",   style: "无线耳机", price: [199, 899],  rating: 5, use: ["portable", "office"], audience: ["mobile", "office"], tags: ["降噪", "便携"], specs: "主动降噪+多设备切换", compat: "通勤与专注办公利器" }
      ]
    },
    {
      id: "network", name: "网络设备", icon: "📡",
      items: [
        { id: "n1", name: "WiFi 6 路由器",   style: "路由器", price: [129, 299], rating: 4, use: ["office", "portable"], audience: ["student", "office"], tags: ["高性价比"], specs: "AX1500-AX3000，宿舍/两居室够用", compat: "百兆宽带以上建议上 WiFi 6" },
        { id: "n2", name: "WiFi 7 路由器",   style: "路由器", price: [299, 699], rating: 5, use: ["game", "create"], audience: ["gamer", "creator"], tags: ["旗舰", "低延迟"], specs: "BE6500+，多设备低延迟", compat: "电竞与大户型覆盖推荐" },
        { id: "n3", name: "旗舰 Mesh 路由",  style: "路由器", price: [599, 1500], rating: 5, use: ["game", "office"], audience: ["office", "gamer"], tags: ["覆盖强"],      specs: "全屋无缝漫游，别墅/大平层", compat: "多台组网，信号无死角" },
        { id: "n4", name: "主板自带 WiFi",   style: "板载网络", price: [0, 0],     rating: 4, use: ["game", "office"], audience: ["office", "gamer"], tags: ["省事"],        specs: "AX210/AX411 级板载无线+蓝牙", compat: "装机选「WiFi 版」主板省一张网卡" },
        { id: "n5", name: "PCIe 无线网卡",   style: "无线网卡", price: [49, 199], rating: 4, use: ["game"],            audience: ["gamer"], tags: ["高性价比"],           specs: "AX210 级，老主板升级无线", compat: "不支持 WiFi 的台式机首选" },
        { id: "n6", name: "USB 无线网卡",    style: "无线网卡", price: [39, 159], rating: 4, use: ["portable", "office"], audience: ["mobile", "student"], tags: ["便携"],      specs: "即插即用，出差备用", compat: "桌面主机临时联网方案" }
      ]
    },
    {
      id: "dock", name: "拓展坞", icon: "🔌",
      items: [
        { id: "d1", name: "Type-C 便携拓展坞", style: "便携拓展坞", price: [79, 259], rating: 4, use: ["portable", "office"], audience: ["mobile", "student"], tags: ["便携"],     specs: "HDMI+USB+PD 充电，一线连", compat: "轻薄本扩展接口必买" },
        { id: "d2", name: "桌面多口拓展坞",   style: "桌面拓展坞", price: [199, 699], rating: 5, use: ["office", "create"], audience: ["office", "creator"], tags: ["多接口"],   specs: "双 4K 输出+千兆网口+SD 读卡", compat: "外接双屏+有线网络首选" },
        { id: "d3", name: "雷电 4 拓展坞",    style: "旗舰拓展坞", price: [899, 1999], rating: 5, use: ["create"],         audience: ["creator"], tags: ["旗舰", "高速"],      specs: "40Gbps 带宽，8K 输出+高速存储", compat: "创作者与高性能笔记本" },
        { id: "d4", name: "硬盘盒",          style: "存储配件",   price: [59, 249], rating: 4, use: ["create", "portable"], audience: ["creator", "mobile"], tags: ["扩容"],      specs: "NVMe 10Gbps 移动硬盘盒", compat: "闲置 SSD 变移动硬盘" },
        { id: "d5", name: "USB 集线器",      style: "集线器",     price: [29, 129], rating: 4, use: ["office"],            audience: ["student", "office"], tags: ["高性价比"],  specs: "4-7 口 USB 3.0，键鼠 U 盘扩展", compat: "接口紧张的基础解决方案" }
      ]
    },
    {
      id: "psu", name: "电源与机箱", icon: "🔋",
      items: [
        { id: "p1", name: "500-650W 金牌电源", style: "电源", price: [300, 450], rating: 4, use: ["office", "game"], audience: ["student", "office"], tags: ["高性价比"],  specs: "入门平台+中低端显卡够用", compat: "i5/R5 + RTX 5060 级推荐 650W" },
        { id: "p2", name: "750-850W 金牌全模组", style: "电源", price: [450, 700], rating: 5, use: ["game", "create"], audience: ["gamer", "creator"], tags: ["全模组", "长质保"], specs: "ATX3.1，10 年质保，主流游戏平台", compat: "RTX 5070 级显卡推荐 750W+" },
        { id: "p3", name: "1000W+ 白金电源",  style: "电源", price: [799, 1199], rating: 5, use: ["create", "game"], audience: ["creator", "gamer"], tags: ["旗舰", "高功率"],  specs: "RTX 5080/5090 与超频平台", compat: "顶级配置与未来升级冗余" },
        { id: "p4", name: "标准中塔机箱",     style: "机箱", price: [200, 450], rating: 4, use: ["game", "office"], audience: ["student", "gamer"], tags: ["高性价比"],  specs: "ATX 中塔，风道/理线兼顾", compat: "首台台式机通用之选" },
        { id: "p5", name: "海景房/侧透机箱",  style: "机箱", price: [300, 699], rating: 4, use: ["game", "create"], audience: ["gamer", "creator"], tags: ["RGB", "颜值"],    specs: "全景侧透+360 冷排位", compat: "灯效爱好者首选" },
        { id: "p6", name: "ITX 小机箱",       style: "机箱", price: [250, 600], rating: 4, use: ["portable", "game"], audience: ["mobile", "gamer"], tags: ["便携", "紧凑"],   specs: "10-15L 体积，桌面迷你主机", compat: "装机难度较高，新手慎选" }
      ]
    }
  ],

  /* ---------- 个性化测评问题 ---------- */
  quiz: [
    {
      id: "use", title: "你的主要用途是？（可多选）", multi: true,
      options: [
        { id: "office",   label: "💼 办公学习", desc: "文档/表格/网课" },
        { id: "game",     label: "🎮 游戏电竞", desc: "3A/FPS/MOBA" },
        { id: "create",   label: "🎬 内容创作", desc: "剪辑/设计/AI" },
        { id: "portable", label: "💻 移动便携", desc: "笔记本随行" }
      ]
    },
    {
      id: "budget", title: "整机预算大概在？", multi: false,
      options: [
        { id: "b1", label: "≤ 3000 元",   desc: "入门办公/学习" },
        { id: "b2", label: "3000-6000 元", desc: "性价比主流" },
        { id: "b3", label: "6000-10000 元", desc: "游戏/创作甜点" },
        { id: "b4", label: "10000 元以上",  desc: "旗舰生产力" }
      ]
    },
    {
      id: "form", title: "设备形态？", multi: false,
      options: [
        { id: "desktop", label: "🖥️ 台式机", desc: "性能优先" },
        { id: "laptop",  label: "💻 笔记本", desc: "便携优先" },
        { id: "both",    label: "两台都有", desc: "互补使用" }
      ]
    },
    {
      id: "pref", title: "你最看重什么？", multi: false,
      options: [
        { id: "value", label: "💎 性价比", desc: "花小钱办大事" },
        { id: "quiet", label: "🤫 静音散热", desc: "低噪音强散热" },
        { id: "rgb",   label: "✨ 颜值灯效", desc: "RGB 拉满" },
        { id: "ergo",  label: "🧍 人体工学", desc: "久坐舒适健康" }
      ]
    },
    {
      id: "focus", title: "外设升级重点？（可多选）", multi: true,
      options: [
        { id: "cooler",   label: "❄️ 散热器", desc: "CPU/笔记本散热" },
        { id: "monitor",  label: "🖥️ 显示器", desc: "屏幕素质" },
        { id: "input",    label: "⌨️ 键鼠", desc: "输入手感" },
        { id: "stand",    label: "🛠️ 支架", desc: "桌面人体工学" },
        { id: "dock",     label: "🔌 拓展坞", desc: "接口扩展" },
        { id: "audio",    label: "🎧 音频", desc: "听感与拾音" }
      ]
    }
  ]
};
