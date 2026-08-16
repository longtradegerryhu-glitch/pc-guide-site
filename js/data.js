/* ===========================================================
 * data.js — 人群画像 / 搭配计划 / 测评定义 / 品类骨架
 * 真实型号数据见 models.js（PC_MODELS），由 recommend.js 合并。
 * 价格均为 2026-08 参考行情（人民币），以电商实时价为准。
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

  /* ---------- 搭配计划（6 档整机 + 1 套便携，含具体型号） ---------- */
  plans: [
    {
      id: "t3000", name: "核显入门档", icon: "🏠", budget: 3000, budgetLabel: "¥3000 档",
      price: [2900, 3600], personas: ["student", "office"], uses: ["office"], form: ["desktop"],
      summary: "锐龙 8500G 核显平台，办公/网课/轻度娱乐够用，日后可加独显升级。",
      parts: [
        ["CPU", "AMD R5 8500G（核显）", "¥1100"],
        ["主板", "A620M（DDR5）", "¥550"],
        ["内存", "DDR5 16G（8G×2）", "¥300"],
        ["硬盘", "PCIe4.0 1TB SSD", "¥459"],
        ["电源", "长城 X5 450W 级（450W 铜牌）", "¥220"],
        ["机箱", "先马 平头哥 M2", "¥200"],
        ["散热", "利民 AX120 R SE", "¥79"],
        ["显示器", '24" 1080P 100Hz（小米 Redmi 24A 级）', "¥550"],
        ["键鼠", "达尔优 DK100 + 百元鼠标", "¥150"]
      ],
      tip: "核显机主机约 ¥2900；先不买显卡，日后再加 RTX 5060 级独显即可升级为游戏机。"
    },
    {
      id: "t4500", name: "独显入门档", icon: "💻", budget: 4500, budgetLabel: "¥4500 档",
      price: [4500, 5500], personas: ["student", "gamer"], uses: ["office", "game"], form: ["desktop"],
      summary: "入门独显 1080P 流畅网游，预算敏感的首次装机甜点。",
      parts: [
        ["CPU", "Intel i3-14100F / R5 5500", "¥650"],
        ["显卡", "RX 7600 8G / RTX 4060", "¥1900-2200"],
        ["主板", "H610M / B650M", "¥600"],
        ["内存", "DDR4/DDR5 16G", "¥300"],
        ["硬盘", "PCIe4.0 1TB SSD", "¥459"],
        ["电源", "鑫谷 GP750G（550W 级）", "¥300"],
        ["机箱", "先马 平头哥 M2", "¥200"],
        ["散热", "九州风神 玄冰400 V5", "¥79"],
        ["显示器", '24" 1080P 高刷 / 27" 2K 入门', "¥550-800"],
        ["键鼠", "狼蛛 F87 + 迈从 A5", "¥330"]
      ],
      tip: "显卡优先于 CPU：先满足显卡，游戏帧率收益最大。"
    },
    {
      id: "t6000", name: "主流游戏档", icon: "🎮", budget: 6000, budgetLabel: "¥6000 档",
      price: [6000, 7500], personas: ["gamer", "student"], uses: ["game"], form: ["desktop"],
      summary: "RTX 5060 + 2K 高刷，1080P 通吃、2K 畅玩主流 3A，装机甜点区间。",
      parts: [
        ["CPU", "Intel i5-14600KF / R5 9600X", "¥1300-1600"],
        ["显卡", "RTX 5060 / RX 9060 XT", "¥2200-2700"],
        ["主板", "B760M / B650M", "¥800"],
        ["内存", "DDR5 32G（16G×2）", "¥600"],
        ["硬盘", "PCIe4.0 1TB SSD", "¥459"],
        ["电源", "长城 X5 650W 金牌全模", "¥350"],
        ["散热", "利民 PA120 SE", "¥137"],
        ["显示器", '27" 2K 高刷（泰坦军团 P2710R2+）', "¥800-950"],
        ["键鼠", "VGN V98 Pro V3 + 迈从 A5", "¥480"]
      ],
      tip: "这是大多数人毕业的第一台游戏机：2K 高刷+5060 的组合三年内不落伍。"
    },
    {
      id: "t8500", name: "高帧游戏档", icon: "⚡", budget: 8500, budgetLabel: "¥8500 档",
      price: [8500, 10500], personas: ["gamer"], uses: ["game", "create"], form: ["desktop"],
      summary: "RTX 5070 + 2K 高刷电竞屏，高帧电竞与 2K 全特效 3A 双满足。",
      parts: [
        ["CPU", "AMD R5 9600X / i5-14600KF", "¥1500-1600"],
        ["显卡", "RTX 5070 / RX 9070 XT", "¥4300-4800"],
        ["主板", "B650M / B760M", "¥900"],
        ["内存", "DDR5 32G（16G×2）", "¥600"],
        ["硬盘", "PCIe4.0 1TB SSD", "¥459"],
        ["电源", "长城 X8 750W 金牌全模", "¥450"],
        ["散热", "瓦尔基里 B360-GT（240/360 水冷）", "¥400-550"],
        ["显示器", '27" 2K 高刷（雷鸟 Q6 级）', "¥1200"],
        ["键鼠", "VGN V98 Pro V3 + 雷蛇毒蝰V3", "¥650"]
      ],
      tip: "FPS 玩家可加预算上 240Hz 屏；把显卡放第一位是游戏机的铁律。"
    },
    {
      id: "t12000", name: "创作旗舰档", icon: "🎬", budget: 12000, budgetLabel: "¥12000 档",
      price: [12000, 16000], personas: ["creator", "gamer"], uses: ["create", "game"], form: ["desktop"],
      summary: "八核 CPU + RTX 5070 Ti + 4K 高色域屏，剪辑/设计/AI 渲染生产力主机。",
      parts: [
        ["CPU", "AMD R7 9700X / R7 9850X3D", "¥1750-3700"],
        ["显卡", "RTX 5070 Ti", "¥6800"],
        ["主板", "B650E / X670E", "¥1300-1800"],
        ["内存", "DDR5 64G（32G×2）", "¥1300"],
        ["硬盘", "PCIe4.0 2TB SSD", "¥800"],
        ["电源", "鑫谷 GP850G 850W / 海韵 FOCUS GX-850", "¥500-700"],
        ["散热", "Arctic LF III 360", "¥650"],
        ["显示器", '27" 4K 高色域（雷鸟 U6 级）', "¥1500"],
        ["键鼠", "静音机械 + 人体工学鼠标", "¥800"]
      ],
      tip: "渲染吃 CPU 与内存，剪辑吃显卡编解码；显示器优先选出厂校色（ΔE<2）。"
    },
    {
      id: "t20000", name: "旗舰顶配档", icon: "👑", budget: 20000, budgetLabel: "¥20000+ 档",
      price: [18000, 25000], personas: ["creator", "gamer"], uses: ["create", "game"], form: ["desktop"],
      summary: "Ultra 9 + RTX 5080 + 4K 高刷，一步到位、五年不换机。",
      parts: [
        ["CPU", "Intel Ultra 9 285K / R9 7950X3D", "¥4000-4900"],
        ["显卡", "RTX 5080", "¥8300-8800"],
        ["主板", "Z790 / X670E 旗舰", "¥2000-2500"],
        ["内存", "DDR5 64G（32G×2）", "¥1500"],
        ["硬盘", "PCIe5.0 2TB + 4TB 素材盘", "¥1600"],
        ["电源", "海韵 FOCUS GX-1000（1000W）", "¥900"],
        ["散热", "360 水冷（B360-GT / LF III）", "¥550-650"],
        ["显示器", '27" 4K 高刷 / 32" 4K（泰坦 P275MV MAX 级）', "¥2300-3000"],
        ["键鼠", "客制化键盘 + 旗舰鼠标 + 桌面音箱", "¥2000"]
      ],
      tip: "旗舰配置重点考虑散热与电源冗余；显示器一步到位比 CPU 升级更值。"
    },
    {
      id: "mobile", name: "便携移动型", icon: "💻", budget: 1500, budgetLabel: "外设补强包",
      price: [800, 2500], personas: ["mobile", "student"], uses: ["portable"], form: ["laptop", "both"],
      summary: "笔记本用户的「外设补强包」：支架、散热、拓展坞与便携键鼠，把移动设备用出桌面级体验。",
      parts: [
        ["笔记本支架", "北弧/乐歌 铝合金升降支架", "¥100-200"],
        ["散热", "半导体散热器 / 散热底座", "¥100-260"],
        ["拓展坞", "绿联 Type-C 7合1", "¥99-199"],
        ["外接显示器", '27" 2K（小米 Redmi A27Q，Type-C）', "¥800-900"],
        ["便携键鼠", "轻薄无线键鼠", "¥150-400"],
        ["耳机/音箱", "漫步者 R20 / 无线耳机", "¥150-400"]
      ],
      tip: "优先买支架+拓展坞：久坐颈椎和接口焦虑两个痛点一次解决。"
    }
  ],

  /* ---------- 品类骨架（真实型号由 models.js 合并） ---------- */
  categories: [
    { id: "cooler",  name: "散热器",   icon: "❄️", items: [] },
    { id: "stand",   name: "支架",     icon: "🛠️", items: [] },
    { id: "monitor", name: "显示器",   icon: "🖥️", items: [] },
    { id: "input",   name: "键鼠外设", icon: "⌨️", items: [] },
    { id: "audio",   name: "音频设备", icon: "🎧", items: [] },
    { id: "network", name: "网络设备", icon: "📡", items: [] },
    { id: "dock",    name: "拓展坞",   icon: "🔌", items: [] },
    { id: "psu",     name: "电源与机箱", icon: "🔋", items: [] }
  ],

  /* ---------- 个性化测评问题（预算 6 档，与 plans.budget 对齐） ---------- */
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
        { id: "b3000",  label: "≤ 3000 元",   desc: "核显办公/学习" },
        { id: "b4500",  label: "3000-4500 元", desc: "独显入门" },
        { id: "b6000",  label: "4500-6000 元", desc: "主流游戏" },
        { id: "b8500",  label: "6000-8500 元", desc: "高帧游戏" },
        { id: "b12000", label: "8500-12000 元", desc: "创作旗舰" },
        { id: "b20000", label: "12000 元以上", desc: "旗舰顶配" }
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
