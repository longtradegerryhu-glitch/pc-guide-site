/* ===========================================================
 * recommend.js — 配件筛选 + 搭配计划渲染 + 个性化测评
 * 依赖：data.js（window.PC_DATA）
 * =========================================================== */
(function () {
  "use strict";

  var D = window.PC_DATA;
  if (!D) return;

  var useLabels = { office: "办公学习", game: "游戏电竞", create: "内容创作", portable: "移动便携" };
  var useIcons = { office: "💼", game: "🎮", create: "🎬", portable: "💻" };
  var audLabels = { student: "学生党", office: "办公族", gamer: "游戏党", creator: "创作者", mobile: "移动办公" };
  var audIcons = { student: "🎓", office: "💼", gamer: "🎮", creator: "🎬", mobile: "💻" };

  /* 合并后的「使用场景」：把原 use（场景）与 audience（人群）两套语义重叠的标签
     归并为 5 个用户能直接理解的用途。命中规则为「用途或人群任一匹配即算命中」，
     避免合并后反而筛掉了原本能看到的型号。 */
  var SCENES = [
    { id: "office", label: "办公学习", icon: "💼",
      use: ["office"], aud: ["office", "student"] },
    { id: "game", label: "游戏电竞", icon: "🎮",
      use: ["game"], aud: ["gamer"] },
    { id: "create", label: "内容创作", icon: "🎬",
      use: ["create"], aud: ["creator"] },
    { id: "portable", label: "移动便携", icon: "💻",
      use: ["portable"], aud: ["mobile"] },
    { id: "allround", label: "全能通用", icon: "✨", use: [], aud: [] }
  ];

  /* 判断型号是否命中某场景；allround 命中全部 */
  function sceneMatch(item, sid) {
    if (sid === "all") return true;
    var sc = SCENES.filter(function (x) { return x.id === sid; })[0];
    if (!sc) return true;
    if (sc.id === "allround") return true;
    var u = item.use || [], a = item.audience || [];
    for (var i = 0; i < sc.use.length; i++) if (u.indexOf(sc.use[i]) > -1) return true;
    for (var j = 0; j < sc.aud.length; j++) if (a.indexOf(sc.aud[j]) > -1) return true;
    return false;
  }
  var gradeOrder = { S: 4, A: 3, B: 1, C: -1 };
  // 档位 → 真实预算中值（与 plans.price 区间对齐）
  var budgetOrder = { b3000: 4800, b4500: 7500, b6000: 11000, b8500: 16000, b12000: 24000, b20000: 37000 };

  /* ---- 颜值风格（Aesthetics） ---- */
  var STYLES = window.PC_STYLES || [];
  var LOOKS = window.PC_LOOKS || {};
  var PRINCIPLES = window.PC_LOOK_PRINCIPLES || [];
  var PITFALLS = window.PC_LOOK_PITFALLS || [];
  var DETAILS = window.PC_LOOK_DETAILS || [];
  var styleById = {};
  STYLES.forEach(function (s) { styleById[s.id] = s; });
  /* LOOKS 只标了几十款。没标的机型按名字里明说的外观词兜底 ——
     「白色」「海景房」「木质」写在名字里就是事实描述，不是推测，不需要改数据。 */
  var LOOK_NAME_KW = [
    ["wood", /木质|胡桃木|实木/],
    ["seaview", /海景房|全景/],
    ["white", /白/],
    ["business", /黑/],
    ["rgb", /RGB|幻彩|灯条/i]
  ];
  function lookOf(item) {
    if (!item) return null;
    if (LOOKS[item.id]) return LOOKS[item.id];
    var s = String(item.name || "") + String(item.model || "") + String(item.style || "");
    for (var i = 0; i < LOOK_NAME_KW.length; i++) {
      if (LOOK_NAME_KW[i][1].test(s)) return LOOK_NAME_KW[i][0];
    }
    return null;
  }

  /* 型号 → 官方渠道：查真实产品图 + 查实时价（淘宝/京东搜索，纯前端跳转，无后端抓取）
   * 搜索词优先级：searchName（已优化，去描述词/容量后缀）> brand+model > name */
  function productImageLink(item) {
    if (!item || !item.name) return "";
    var n = item.searchName || (item.brand && item.model ? (item.brand + " " + item.model) : item.name);
    var img = "https://image.baidu.com/search/index?tn=baiduimage&word=" + encodeURIComponent(n);
    var tb = "https://s.taobao.com/search?q=" + encodeURIComponent(n);
    var jd = "https://search.jd.com/Search?keyword=" + encodeURIComponent(n);
    return '<div class="prod-link">' +
      '<a class="prod-img-btn" href="' + img + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="prod-ico">🔎</span>查看 ' + esc(item.name) + ' 真实产品图</a>' +
      '<span class="prod-hint">页面价为参考行情，点下方按钮查官方实时价：</span>' +
      '<span class="prod-price-links">' +
        '<a class="prod-shop prod-tb" href="' + tb + '" target="_blank" rel="noopener noreferrer">淘宝查价</a>' +
        '<a class="prod-shop prod-jd" href="' + jd + '" target="_blank" rel="noopener noreferrer">京东查价</a>' +
      '</span>' +
      jdLiveCard(n) +
    '</div>';
  }

  // 站内「查实时价」小卡片：直接跳京东搜索页。
  // 京东联盟 API 未启用（需 ICP 备案），改为官方搜索跳转
  function jdLiveCard(q) {
    var url = 'https://search.jd.com/Search?keyword=' + encodeURIComponent(q);
    return '<div class="jd-live jd-live-static">' +
      '<a class="jd-live-btn" href="' + url + '" target="_blank" rel="noopener noreferrer">' +
        '去京东搜「' + esc(q) + '」查实时价</a>' +
      '<div class="jd-live-hint">站内实时价暂未上线（联盟 API 合规受限），点上面按钮看官方实时价</div>' +
    '</div>';
  }
  /* 精简版查价入口：只保留淘宝/京东两个文字链接，去掉图片按钮与实时价提示块。
   * 专供列表类界面（配件库、榜单）使用，避免每张卡片塞进 4 个链接。 */
  function productLinksLite(item) {
    if (!item || !item.name) return "";
    var n = item.searchName || (item.brand && item.model ? (item.brand + " " + item.model) : item.name);
    var q = encodeURIComponent(n);
    return '<div class="prod-link prod-link-lite">' +
      '<a class="prod-shop prod-tb" href="https://s.taobao.com/search?q=' + q + '" target="_blank" rel="noopener noreferrer">淘宝查价</a>' +
      '<a class="prod-shop prod-jd" href="https://search.jd.com/Search?keyword=' + q + '" target="_blank" rel="noopener noreferrer">京东查价</a>' +
    '</div>';
  }

  function styleOf(id) { return styleById[id] || null; }
  function countByStyle(sid) {
    var n = 0;
    Object.keys(LOOKS).forEach(function (id) { if (LOOKS[id] === sid) n++; });
    return n;
  }

  /* ---- 合并真实型号数据（models.js） ---- */
  function mergeModels() {
    if (!window.PC_MODELS) return;
    D.categories.forEach(function (cat) {
      cat.items = window.PC_MODELS[cat.id] || [];
    });
  }

  /* ---- 方案配置单 → 配件目标价位 ---- */
  /* 部件名 → 配件库类别 id，用于反读「这套方案的同类部件是什么档次」 */
  var PART_CAT = {
    "CPU": "cpu", "显卡": "gpu", "主板": "mobo", "内存": "ram", "硬盘": "ssd",
    "散热": "cooler", "显示器": "monitor", "键鼠": "input", "电源": "psu", "机箱": "case",
    "音频": "audio", "音箱": "audio", "麦克风": "audio",
    "耳机": "earphone", "耳机/音箱": "earphone", "蓝牙耳机": "earphone",
    "降噪耳机": "earphone", "头戴耳机": "earphone", "真无线耳机": "earphone",
    "游戏耳机": "earphone", "监听耳机": "earphone", "有线耳机": "earphone",
    "运动耳机": "earphone", "开放式耳机": "earphone", "骨传导耳机": "earphone",
    "手表": "wearable", "手环": "wearable", "智能手表": "wearable",
    "运动手表": "wearable", "智能戒指": "wearable", "直播麦": "wearable",
    "摄像头": "wearable", "路由器": "wearable", "智能音箱": "wearable",
    "台灯": "wearable", "运动相机": "wearable", "无人机": "wearable",
    "相机": "wearable", "体脂秤": "wearable",
    "笔记本支架": "stand", "笔记本散热": "laptop-cool", "拓展坞": "dock",
    "外接显示器": "monitor", "便携键鼠": "input",
    "笔记本": "laptop",
    "手机": "phone", "平板": "tablet",
    "充电器": "charger", "数据线": "charger", "移动电源": "charger",
    "插线板": "charger", "转接器": "charger",
    "手机壳": "mobileacc", "保护膜": "mobileacc", "镜头膜": "mobileacc",
    "手机支架": "mobileacc", "张持杆": "mobileacc", "稳定器": "mobileacc",
    "游戏手柄": "mobileacc", "平板键盘": "mobileacc", "手写笔": "mobileacc",
    "触控板": "mobileacc", "散热配件": "mobileacc", "清洁工具": "mobileacc",
    "屏幕挂绳": "mobileacc", "指环支架": "mobileacc", "游戏配件": "mobileacc",
    "投屏器": "mobileacc", "存储": "ssd"
  };

  /* 杂物筐品类（charger / mobileacc / ssd）一个品类里混装多种物件，只按价位挑会跨类型：
     手机方案的「存储」行推出过氮化镓充电器、「手机壳」行推出过手机稳定器 ——
     两行还挑了同一件。行名本身说明了物类时先按关键词收窄，收窄后一件都没有就不硬挑，
     宁可按配置单原文给档位，也不给错的东西。 */
  var SUB_KW = {
    "存储": /存储卡|内存卡|移动固态|U盘|硬盘盒|TF|NM卡/i,
    "手机壳": /壳|保护套/i,
    "保护膜": /膜/i,
    "镜头膜": /镜头/i,
    "稳定器": /稳定器|云台/i,
    "手机支架": /支架|指环/i,
    "指环支架": /指环|支架/i,
    /* 笔类只写 /笔/ 会漏掉 Apple Pencil（中文名里没有「笔」字），
       iPad 主体因此永远拿不到唯一那支能用的笔 —— 加上 Pencil 才让生态判定有东西可判 */
    "手写笔": /笔|Pencil/i,
    "平板键盘": /键盘/i,
    "游戏手柄": /手柄/i,
    "散热配件": /散热|风扇|背夹/i,
    "充电器": /充电器|氮化镓|充电头/i,
    "数据线": /线/i,
    "移动电源": /移动电源|充电宝/i
    /* 「笔记本支架」不放在这里判：它的物类只写在 style 里，而这里判的是
       brand+model+name 的拼接串。按 name 判会稳定命中 s20（name 含「笔记本」、
       价格最低），而它是散热件 —— 详见下面的 SUB_STYLE。 */
  };
  /* 品类 id → 该品类的行名关键词收窄是否可信（品类里混装了多个物类时才需要） */
  var SUB_CAT = { charger: 1, mobileacc: 1, ssd: 1, stand: 1 };

  /* 物类写在 style 字段里的行，按 style 判而不是按 name 判（ORD-27 任务 7）。
     支架的 style 是「笔记本支架 / 笔记本立式支架 / 笔记本散热支架 / 双用支架」，
     name 是「北弧 LDT14 单屏气压弹簧臂」这类 —— 按 name 判不出用途。
     口径：style 以「笔记本」开头且不含「散热」→ 笔记本支架（s8/s21/vst6/s19 四件）；
     「笔记本散热支架」→ 不含「笔记本」开头以外…它确实以笔记本开头，但含散热 → 排除，
     它该走 laptop-cool 桶（配置单里本来就有「笔记本散热」这一行）；
     「双用支架」不以笔记本开头 → 留在 stand 通用组，不作笔记本支架行的主选。 */
  var SUB_STYLE = {
    "笔记本支架": function (it) {
      var s = String(it.style || "");
      return /^笔记本/.test(s) && !/散热/.test(s);
    }
  };

  /* 从方案自己的配置单提取各类部件的目标价位（取价格中值）。
     只读既有数据、不引入新价格：方案说配 RTX 5080，配件推荐就不该给 RTX 5060。 */
  /* 配置单里部分部件写的是组合价，折算到配件库的单件价位再用 */
  var PART_SPLIT = { "键鼠": 0.75 };   // 「客制化键盘 + 旗舰鼠标」是两件，单件目标按 75% 计

  /* 目标价按「配置单行」取，不按「品类」取。
     同一品类下不同行的价位能差 5 倍：手机影像档的「手机壳 ¥60-100」与「稳定器 ¥300-500」
     都映射到 mobileacc，按品类取 max 就把手机壳的目标价顶到 400 ——
     窗口随之上移到 240~600，79 块的壳不在窗口里，于是退到「同价位最近」，
     给 vivo 手机配了 149-199 的 iPhone 17 专用壳。这是甲方看到那一幕的第一层。
     品类聚合值只作兜底（行名为空时才用），且取中位数不用 max：
     max 每次都被最贵那行带走，等于把串味传染给同品类的其他行。 */
  /* 行名同类中位数（跨方案）：兜底值该按「同一个行名在其他方案里通常多少钱」取，
     而不是「同一套方案里另一个共用品类的行多少钱」。
     后者语义不通：手机影像档的「保护膜」行拿到「手写笔」行的 250，
     因为两行都映射 mobileacc —— 膜和笔的价格没有可比性。 */
  var ROW_MEDIAN_CACHE = null;
  function rowNameMedian() {
    if (ROW_MEDIAN_CACHE) return ROW_MEDIAN_CACHE;
    var acc = {};
    D.plans.forEach(function (p) {
      (p.parts || []).forEach(function (row) {
        var nums = String(row[2] || "").match(/\d+/g);
        if (!nums || !nums.length) return;
        var lo = parseInt(nums[0], 10);
        var hi = nums.length > 1 ? parseInt(nums[1], 10) : lo;
        var v = (lo + hi) / 2;
        if (PART_SPLIT[row[0]]) v *= PART_SPLIT[row[0]];
        (acc[row[0]] = acc[row[0]] || []).push(v);
      });
    });
    var out = {};
    Object.keys(acc).forEach(function (k) {
      var a = acc[k].slice().sort(function (x, y) { return x - y; });
      var n = a.length;
      out[k] = n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
    });
    ROW_MEDIAN_CACHE = out;
    return out;
  }

  function median(arr) {
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var n = a.length;
    if (!n) return 0;
    return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
  }

  /* ---------- 平台联动（ORD-25） ----------
     配置单原文自带歧义：t4500 主板行写「H610M / B650M」（LGA1700+DDR4 / AM5+DDR5），
     内存行写「DDR4/DDR5 16G」—— 两行各自独立的二选一，组合起来必然出现
     DDR5 主板 + DDR4 内存，插不上；AM5 主板 + Intel CPU 同理。
     这是配置单歧义，不是选件逻辑的错，所以修法是让后面的行跟着前面已选的件走：
     主板先定，内存按它的代际收窄，CPU 按它的插槽收窄。 */
  function socketOf(specs) {
    var m = String(specs || "").match(/AM5|AM4|LGA\s*1700|LGA\s*1851|LGA\s*1200|LGA\s*1151|sTRX4/i);
    return m ? m[0].toUpperCase().replace(/\s+/g, "") : "";
  }
  function ddrOf(specs) {
    var t = String(specs || "");
    var a = /DDR5/i.test(t), b = /DDR4/i.test(t);
    if (a && b) return "";          /* 两种都支持 = 不构成约束 */
    return a ? "DDR5" : (b ? "DDR4" : "");
  }

  function planPartTargets(plan) {
    var byPart = {}, acc = {};
    (plan.parts || []).forEach(function (row) {
      var cid = PART_CAT[row[0]];
      if (!cid) return;
      var nums = String(row[2] || "").match(/\d+/g);
      if (!nums || !nums.length) return;
      var lo = parseInt(nums[0], 10);
      var hi = nums.length > 1 ? parseInt(nums[1], 10) : lo;
      var v = (lo + hi) / 2;
      if (PART_SPLIT[row[0]]) v *= PART_SPLIT[row[0]];
      byPart[row[0]] = v;
      (acc[cid] = acc[cid] || []).push(v);
    });
    var rm = rowNameMedian();
    var byCat = {};
    Object.keys(acc).forEach(function (cid) {
      /* 先取每一行「跨方案的行名中位数」，再在这些行之间取中位数。
         现状 0 处走到这里（每行都写得出价格），但兜底值必须是对的：
         以后哪一行价格文本漏了数字，才不会拿隔壁行（膜 vs 笔）的价格顶上。 */
      var vals = [];
      Object.keys(byPart).forEach(function (p2) {
        if (PART_CAT[p2] === cid && rm[p2] != null) vals.push(rm[p2]);
      });
      byCat[cid] = vals.length ? median(vals) : median(acc[cid]);
    });
    return { byPart: byPart, byCat: byCat, rowMedian: rm };
  }

  /* ---------- 生态兼容（ORD-25 重做：判据从 brand 换成 compat 派生表） ----------
     ORD-21 用 brand 判「这件配件属于哪个生态」，方向是错的：
     brand 是「厂商归属」，不是「适配归属」。库里有 4 件厂商与适配生态无关 ——
     ma21 罗技 Combo Touch（iPad 专用）、ma4 绿联磁吸壳（MagSafe）、
     pw23 Anker MagGo（iPhone）、pw16 Anker Lightning 线（iPhone 15 以下）。

     现在分三层，数据一字不改（全部来自 js/compat-map.js，由 tools/build-compat-map.cjs
     从 compat 文本派生）：
       层1 ecoOfBrand(brand) 厂商 → 生态（214 个品牌全覆盖，表外归 other，绝不返回空）
       层2 fitOf(item)       件 → { eco, scope }，compat 里写明的硬边界
       层3 compatDrop(...)   通用件放行；专用件且生态或物类不符 → 排除并给可读理由
     只有 fit 表里的件（当前 25 件）会被判，其余全是通用件 ——
     这是「只锁物理上装不到别机」的实现方式，不再靠物类白名单猜：
     膜 / 背夹 / 支架 / 自拍杆 / 耳机 / 通用线材在 compat 里没有专属关系，自然不被判。
     「Anker 自拍杆」的 compat 写着「兼容 Type-C 与 Lightning」，
     按字面像苹果专用，可它夹任何手机都能用 —— 物类不排他，表里就不会有它。 */
  var COMPAT_MAP = (typeof window !== "undefined" && window.PC_COMPAT_MAP) || {};
  var COMPAT_SOFT = (typeof window !== "undefined" && window.PC_COMPAT_SOFT) || {};
  var ECO_BRAND_TBL = (typeof window !== "undefined" && window.PC_ECO_BRAND) || {};
  var ECO_BY_LOWER = null;

  /* 层1：厂商 → 生态。Apple 与 苹果 是同一家（手机库两种写法并存，不认这条就能绕过判定）；
     子品牌不合并（iqoo ≠ vivo、redmi ≠ xiaomi），合并会造出假的「同生态」。 */
  function ecoOfBrand(brand) {
    var b = String(brand || "").trim();
    if (!b) return "other";
    if (ECO_BRAND_TBL[b]) return ECO_BRAND_TBL[b];
    if (!ECO_BY_LOWER) {
      ECO_BY_LOWER = {};
      for (var k in ECO_BRAND_TBL) {
        if (Object.prototype.hasOwnProperty.call(ECO_BRAND_TBL, k)) ECO_BY_LOWER[k.toLowerCase()] = ECO_BRAND_TBL[k];
      }
    }
    return ECO_BY_LOWER[b.toLowerCase()] || "other";
  }

  /* 层2：件的适配边界。表里没有 = 通用件。 */
  function fitOf(it) {
    if (!it || !it.id) return null;
    return COMPAT_MAP[it.id] || null;
  }

  var ECO_LABEL = {
    apple: "苹果", huawei: "华为", samsung: "三星", xiaomi: "小米", redmi: "红米",
    honor: "荣耀", oppo: "OPPO", vivo: "vivo", iqoo: "iQOO", oneplus: "一加",
    realme: "realme", lenovo: "联想", zte: "中兴", google: "谷歌", other: "其他品牌"
  };
  var SCOPE_LABEL = { phone: "手机", tablet: "平板", laptop: "笔记本" };
  function ecoLabel(e) { return ECO_LABEL[e] || e; }

  /* 层3：返回排除理由，空串 = 可用。不用布尔值：页面要能说清「这一行为什么没有件」。 */
  function compatDrop(it, bodyEco, bodyCatId) {
    var f = fitOf(it);
    if (!f) return "";
    /* 没有本体信息就无从判断（台式方案没有手机/平板/笔记本本体） */
    if (!bodyEco && !bodyCatId) return "";
    if (f.scope && bodyCatId && f.scope.indexOf(bodyCatId) < 0) {
      return "只能配" + f.scope.map(function (s) { return SCOPE_LABEL[s] || s; }).join(" / ") +
        "，本体是" + (SCOPE_LABEL[bodyCatId] || bodyCatId);
    }
    if (f.eco && bodyEco && f.eco !== bodyEco) {
      return "生态不符（" + ecoLabel(f.eco) + "专用件，本体是" + ecoLabel(bodyEco) + "）";
    }
    return "";
  }

  /* 软边界：装得上但功能打折（AirPods 在安卓上能听歌、小米手表第三方功能受限）。
     只提示、不排除 —— 把「体验打折」当「装不上」排除，正是 ORD-21 把 AirPods 误杀的原因。 */
  function compatNote(it) {
    return it && it.id && COMPAT_SOFT[it.id] ? COMPAT_SOFT[it.id] : "";
  }

  /* 笔记本本体占预算大头，且不同档位机型差距大：目标价随预算上探，
     上限不超过本档配置单价位上限的 1.35 倍。原实现按模板行价固定取值，
     导致「预算拉满也只会拿到模板里那台入门本」。 */
  var WHOLE_BUDGET_SHARE = { laptop: 0.72, phone: 0.8, tablet: 0.82 };
  function laptopBudgetTarget(priceText, budgetCap, share) {
    if (!budgetCap) return 0;
    var nums = String(priceText || "").match(/\d+/g);
    if (!nums || !nums.length) return 0;
    var lo = parseInt(nums[0], 10);
    var hi = nums.length > 1 ? parseInt(nums[1], 10) : lo;
    return Math.min(Math.max(budgetCap * (share || 0.72), lo), hi * 1.35);
  }

  /* 移动设备的预算档与台式完全不同：手机 4000 — 6000、平板 900 — 12000。
     若直接拿台式的预算档，选手机就会被折扣到最低档（同样的陷阱）。
     按形态把同一档位重映射到该形态的真实价位轴。 */
  var MOBILE_BUDGET_AXIS = {
    phone:  [0, 1400, 2600, 4200, 6500, 9500, 14000],
    tablet: [0, 1300, 2400, 3600, 5200, 7500, 10500]
  };
  /* 形态匹配：选哪种设备就只进哪类方案，“多台互补”才不过滤 */
  function formFit(pl, form) {
    if (!form || form === "both") return true;
    return pl.form.indexOf(form) > -1;
  }
  function mobileBudgetCap(form, budgetKey) {
    var axis = MOBILE_BUDGET_AXIS[form];
    if (!axis) return budgetOrder[budgetKey] || 0;
    var order = ["b3000", "b4500", "b6000", "b8500", "b12000", "b20000"];
    var i = order.indexOf(budgetKey);
    return axis[i > -1 ? i + 1 : 3];
  }

  /* 预算与方案价的错位提示：快速推荐与深度测评共用，避免两条路径各写一套文案 */
  function budgetWarnHtml(plan, budgetCap, hasHigher, use, form, hasLower) {
    if (!plan || !budgetCap) return "";
    var head = '<div class="smart-budget-warn reveal in">你的预算（约 ¥' + budgetCap + "）";
    if (budgetCap < plan.price[0] * 0.85) {
      return head + "够不到「" + esc(plan.name) + "」的典型整机价 " + fmtPrice(plan.price) + "，这是最接近的一套；" +
        (hasLower
          ? "想压预算可切「省预算」档，或到「搭配计划」逐件调整。"
          : "站内这个用途的起点就是这一档，想压到预算内建议先放宽用途，或到「搭配计划」逐件缩减配置。") +
        "</div>";
    }
    if (budgetCap > plan.price[1] * 1.15) {
      return head + "高于「" + esc(plan.name) + "」的典型整机价 " + fmtPrice(plan.price) + "。" +
        (use === "office" ? "办公用途把预算堆得更高，流畅度几乎没有变化。" : "") +
        (form === "laptop" ? "笔记本这个形态本身有价位上限，同用途再往上只有一两千的差距。" : "") +
        (hasHigher
          ? "多出来的钱建议投在显示器素质、存储容量或静音上，比继续堆硬件更实在；也可以点「加预算」档看看更高一档的方案。"
          : "这已是该用途在站内的最高一档，再往上加预算提升有限，余量建议转到显示器、存储或外设上。") +
        "</div>";
    }
    return "";
  }

  /* 颜值风格没现货时必须说出来。静默退回默认款，用户会以为这道题白填了。 */
  var LOOK_CAT_LABEL = { case: "机箱", monitor: "显示器", input: "键鼠", stand: "支架", audio: "音频", dock: "拓展坞" };
  function lookMissTip(rows, look) {
    var miss = (rows && rows.lookMiss) || [];
    if (!look || look === "any" || look === "all" || !miss.length) return "";
    var names = miss.map(function (c) { return LOOK_CAT_LABEL[c] || c; });
    return '<div class="res-skip-note res-look-miss">库内暂时没有符合你所选外观的' + esc(names.join(" / ")) +
      "款，这几项按性能与价位优先挑选，外观没有强卡。想换款可以从配色更常见的选项里挑，或者先不定外观。</div>";
  }

  /* 全套配置单表格：结果页主角，快速推荐与深度测评共用。
     返回 { html, parts, total, skipped }。
     opts.rows = fullPartRows 的结果：有型号库命中就用型号库 price，
     plan.parts 里的字符串价降级为「无型号库时的兜底」——
     两套价源正是配置单与配件区价格对不上的根因。 */
  function specTableHtml(plan, opts) {
    if (!plan) return { html: "", parts: 0, total: [0, 0], skipped: [] };
    opts = opts || {};
    var rows = opts.rows || [];
    var skipped = rows.skipped || [];
    var bySrc = {};
    rows.forEach(function (r) {
      var k = r.srcPart || r.part;
      if (!bySrc[k]) bySrc[k] = [];
      bySrc[k].push(r);
    });
    var skipMap = {};
    skipped.forEach(function (s) { skipMap[s.part] = s; });

    var lo = 0, hi = 0, libRows = 0, tplRows = 0;
    var body = (plan.parts || []).map(function (r) {
      var part = r[0], config = String(r[1] || ""), priceText = String(r[2] || "");
      if (skipMap[part]) {
        return '<tr class="spec-row-skip"><td class="spec-part">' + esc(part) + "</td>" +
          '<td><span class="spec-skip">已跳过（你已有）：' + esc(config) + "</span></td>" +
          '<td class="spec-price">—</td></tr>';
      }
      var picked = bySrc[part] || [];
      var libPrice = null, names = [], blockedN = 0, blankWhy = "";
      picked.forEach(function (x) {
        if (x.compatBlocked) blockedN = x.compatBlocked;
        if (x.blankReason) blankWhy = x.blankReason;
        var it = x.pick && x.pick.item;
        if (!it || !it.price) return;
        libPrice = libPrice
          ? [libPrice[0] + it.price[0], libPrice[1] + it.price[1]]
          : [it.price[0], it.price[1]];
        names.push(it.name);
      });
      var cfgCell, priceCell;
      if (libPrice) {
        cfgCell = '<span class="spec-model">' + esc(names.join(" + ")) + "</span>" +
          '<span class="spec-orig">配置单原选：' + esc(config) + "</span>";
        priceCell = fmtPrice(libPrice);
        lo += libPrice[0]; hi += libPrice[1]; libRows++;
      } else {
        cfgCell = esc(config);
        /* 因生态排除而空手的行，表格里也要说明：只写「配置单原选」会让用户以为这就是推荐结果 */
        if (blockedN) cfgCell += '<span class="spec-orig spec-block">暂无可用配件（按当前主体排除 ' + blockedN + ' 件不兼容型号）</span>';
        else if (blankWhy) cfgCell += '<span class="spec-orig spec-block">暂无可用配件（' + esc(blankWhy) + '）</span>';
        priceCell = esc(priceText);
        var nums = String(priceText).match(/\d+/g);
        if (nums) {
          lo += parseInt(nums[0], 10);
          hi += nums.length > 1 ? parseInt(nums[1], 10) : parseInt(nums[0], 10);
          tplRows++;
        }
      }
      return '<tr><td class="spec-part">' + esc(part) + "</td><td>" + cfgCell + "</td>" +
        '<td class="spec-price">' + priceCell + "</td></tr>";
    }).join("");

    var counted = (plan.parts || []).length - skipped.length;
    var html =
      '<div class="smart-spec reveal in">' +
        '<h3 class="smart-spec-title">全套配置单（' + counted + " 个部件" +
          (skipped.length ? "，已跳过 " + skipped.length + " 项" : "") + "）</h3>" +
        '<div class="smart-spec-scroll"><table class="smart-spec-table">' +
        "<thead><tr><th>部件</th><th>配置</th><th>参考价</th></tr></thead><tbody>" +
        body +
        '<tr class="spec-total"><td>合计</td><td>按各行参考价累加，不含优惠</td>' +
        '<td class="spec-price">¥' + lo.toLocaleString() + " - ¥" + hi.toLocaleString() + "</td></tr>" +
        "</tbody></table></div>" +
        '<p class="smart-spec-tip">' + specTip(libRows, tplRows, skipped.length) + "</p>" +
      "</div>";
    return { html: html, parts: counted, total: [lo, hi], skipped: skipped };
  }

  /* 表格底注：把"价格从哪来"说清，用户才能判断该不该信这一行 */
  function specTip(libRows, tplRows, skippedN) {
    var s = "表内每个部件的价格取自下方配件区同一型号的报价，两处必然一致；";
    if (tplRows) s += "其中 " + tplRows + " 个部件站内没有独立型号库，价格是配置单的档位参考价；";
    if (skippedN) s += "已按你已有的 " + skippedN + " 项跳过，合计已相应减去；";
    return s + "合计按各行参考价累加，所以比方案卡片预算略宽：每行都挑高配就超、都挑低配就省。照单买法：把每行配置复制到京东/淘宝搜索比价下单。";
  }

  /* ---- 通用部件挑选：快速推荐与深度测评共用，保证两处口径一致 ---- */
  function mid(p) { return (p[0] + p[1]) / 2; }

  /* 配置单某类部件的型号行文本 */
  function planRowOf(plan, names) {
    var rows = (plan.parts || []).filter(function (r) { return names.indexOf(r[0]) !== -1; });
    return rows.length ? String(rows[0][1] || "") : "";
  }

  /* 库内型号与配置单行文本匹配，命中即「配置单同款」。
     配置单常用简称（R5 9600X、i5-14600KF），而库内是全称，
     所以除了整段比对，还要拿型号里的数字加字母组合（如 14600KF、B760M）去对。 */
  function matchAnchors(items, rowText) {
    if (!rowText) return [];
    var sq = function (s) { return String(s).replace(/\s+/g, ""); };
    var rowSq = sq(rowText);
    var segs = rowText.split(/[\/+＋、（(]/).map(function (s) { return sq(s); })
      .filter(function (s) { return s.length >= 4; });
    var codes = [];
    segs.forEach(function (seg) {
      (seg.match(/\d{3,}[A-Za-z]*/g) || []).forEach(function (c) {
        if (c.length < 4) return;
        /* 年份不是型号码：「无界14S 2026」里的 2026 会把一堆 2026 款认成同款 */
        if (/^(19|20)\d{2}$/.test(c)) return;
        codes.push(c.toLowerCase());
      });
    });
    return items.filter(function (it) {
      var mSq = sq(it.model);
      /* 库内 model 不含品牌（如「B360-GT」），配置单却常写「瓦尔基里 B360」，
         不带上品牌比对，这类行永远匹配不上同款，只能按价位瞎挑。 */
      var full = sq((it.brand || "") + it.model);
      var hay = (full + sq(it.name || "")).toLowerCase();
      if (mSq.length >= 2 && rowSq.indexOf(mSq) !== -1) return true;
      if (rowSq.indexOf(full) !== -1) return true;
      if (segs.some(function (seg) {
        return full.indexOf(seg) !== -1 || mSq.indexOf(seg) !== -1 ||
          (mSq.length >= 3 && seg.indexOf(mSq) !== -1);
      })) return true;
      return codes.some(function (c) { return hay.indexOf(c) > -1; });
    });
  }

  /* 严格同款：型号串必须完整出现在配置单行里。
     宽松版 matchAnchors 会拿"120se"这类去 hay 里找，把 PS120 SE 认成 PA120 SE 的同款；
     挑选时可以宽容（找不到就用相近的），但**贴标必须严格**，否则标记在撒谎。 */
  function matchAnchorsStrict(items, rowText) {
    if (!rowText) return [];
    var sq = function (s) { return String(s).replace(/\s+/g, "").toLowerCase(); };
    var rowSq = sq(rowText);
    return items.filter(function (it) {
      var mSq = sq(it.model || "");
      var full = sq((it.brand || "") + (it.model || ""));
      if (mSq.length >= 4 && rowSq.indexOf(mSq) !== -1) return true;
      if (full.length >= 5 && rowSq.indexOf(full) !== -1) return true;
      return false;
    });
  }

  /* 三态判定：
     exact    —— 配置单点名这一件，且型号完整命中
     candidate—— 配置单是二选一（"RTX 5060 Ti / RX 9060 XT"），命中其中一支
     chipset  —— 配置单只写芯片组/系列（B760M / B650M），配件给的是该档位的具体型号
     alt      —— 型号不一致，只能是同档位替代 */
  function anchorState(item, rowText) {
    if (!item || !rowText) return "alt";
    var sq = function (s) { return String(s).replace(/\s+/g, "").toLowerCase(); };
    var rowSq = sq(rowText);
    var mSq = sq(item.model || "");
    var full = sq((item.brand || "") + (item.model || ""));
    var same = (mSq.length >= 4 && rowSq.indexOf(mSq) !== -1) ||
               (full.length >= 5 && rowSq.indexOf(full) !== -1);
    var hasAlt = /[\/+＋]/.test(rowText);
    if (same) return hasAlt ? "candidate" : "exact";
    var segs = String(rowText).split(/[\/+＋、（(]/).map(sq)
      .filter(function (s) { return s.length >= 3; });
    if (segs.some(function (s) { return mSq.indexOf(s) !== -1 || full.indexOf(s) !== -1; })) return "chipset";
    return "alt";
  }

    var MOBILE_LOOK_KW = {
      p_white: ["白"], p_black: ["黑"], p_bright: ["亮", "彩"],
      p_slim: ["薄", "轻"], t_white: ["白"], t_gray: ["灰"],
      t_color: ["彩"], t_slim: ["薄", "轻"]
    };
    /* 「最看重什么」如果只用来做同档内微调，用户改变它时结果往往一模一样。
       真正能兑现偏好的做法是调这一类部件的目标价位：在意静音就多花在散热与机箱上，
       在意颜值就多花在机箱上，在意人体工学就多花在屏幕和键鼠上。 */
    function buildTargetScale(pref, exp, look, lifespan) {
      var map = {};
      if (pref === "quiet") { map.cooler = 1.25; map.case = 1.25; map.psu = 1.15; }
      else if (pref === "rgb") { map.case = 1.3; map.cooler = 1.25; }
      else if (pref === "ergo") { map.monitor = 1.3; map.input = 1.3; map.stand = 1.25; }
      else if (pref === "value") { map.cpu = 0.9; map.gpu = 0.9; map.ssd = 0.9; }
      else if (pref === "p_battery") { map.phone = 1.15; }
      else if (pref === "p_camera") { map.phone = 1.35; }
      else if (pref === "p_perf") { map.phone = 1.25; }
      else if (pref === "p_hand") { map.phone = 1.1; }
      else if (pref === "t_screen") { map.tablet = 1.3; }
      else if (pref === "t_ink") { map.tablet = 1.1; map.mobileacc = 1.5; }
      else if (pref === "t_battery") { map.tablet = 1.15; }
      else if (pref === "t_perf") { map.tablet = 1.25; }
      if (exp === "pro") { map.cooler = (map.cooler || 1) * 1.2; }
      else if (exp === "new") { map.cooler = (map.cooler || 1) * 0.9; }
      /* 机箱加价挪到 LOOK 分支里做：只有在真的挑得到该风格时才加，
         否则「复古木质」会变成「随便是谁但贵 20%」。 */
      /* 打算用多久决定该不该为寿命付溢价：用 5 年值得给固态和电源留余量，
         只用 1 年就不必。不加这条，y1 与 y3 会给出同一套（实测差 0 件）。 */
      if (lifespan === "y5") { map.ssd = (map.ssd || 1) * 1.2; map.psu = (map.psu || 1) * 1.2; }
      else if (lifespan === "y1") { map.ssd = (map.ssd || 1) * 0.85; map.psu = (map.psu || 1) * 0.88; }
      return function (cid) { return map[cid] || 1; };
    }

    /* 品牌偏好 → 品牌正则（ORD-27 任务 8）。
       pickOne 原来只有「品类 + 价位 + 用途」三个约束，品牌完全不参与 ——
       于是任何有品牌偏好的用户都推不出自己想要的品牌。苹果只是最容易发现的症状：
       站内 6 款 iPhone 在 26 套方案里一款都作不了主选，而配件页刚给他看过 iPhone 壳。
       子品牌不合并：红米不等于小米、荣耀不等于华为 —— 那是两条产品线，不是一家。
       不加「其他」：选「其他」就等于不限，走下面 brandOf=null 的原行为。 */
    var BRAND_RE = {
      b_apple: /apple|苹果/i,
      b_huawei: /华为|huawei/i,
      b_xiaomi: /小米|xiaomi/i,
      b_lenovo: /联想|lenovo|thinkpad|thinkbook/i,
      b_samsung: /三星|samsung/i
    };

    function buildBias(pref, exp, lifespan, look, brandPref) {
      var kw = [];
      if (pref === "quiet" || pref === "p_perf") kw = ["静音", "低噪", "安静", "风扇"];
      else if (pref === "rgb") kw = ["灯", "RGB", "幻彩"];
      else if (pref === "ergo") kw = ["人体工学", "护腕", "护眼", "升降"];
      else if (pref === "p_battery" || pref === "t_battery") kw = ["续航", "mAh", "电池"];
      else if (pref === "p_camera") kw = ["摄像", "主摄", "长焦", "影像", "像素"];
      else if (pref === "p_hand") kw = ["轻", "薄", "手感", "克"];
      else if (pref === "t_screen") kw = ["Hz", "分辨率", "色域", "2K", "OLED"];
      else if (pref === "t_ink") kw = ["压感", "延迟", "笔"];
      if (MOBILE_LOOK_KW[look]) kw = kw.concat(MOBILE_LOOK_KW[look]);
      if (exp === "new") kw = kw.concat(["开箱", "免驱", "一体"]);
      if (exp === "pro") kw = kw.concat(["旗舰", "堆料"]);
      if (lifespan === "y5") kw = kw.concat(["5 年", "质保", "年保"]);
      var wantValue = pref === "value" || pref === "p_value" || pref === "t_value";
      var fn = function (it) {
        var hay = String((it.style || "") + " " + (it.valueNote || "") + " " + (it.specs || ""));
        var hit = 0;
        kw.forEach(function (k) { if (k && hay.indexOf(k) > -1) hit++; });
        if (look && look !== "any" && !MOBILE_LOOK_KW[look] && lookOf(it) === look) hit += 2;
        if (wantValue) {
          if (it.valueGrade === "S") hit += 2;
          else if (it.valueGrade === "A") hit += 1;
        }
        return hit;
      };
      /* brandOf 由 pickOne 直接读：品牌是硬约束，不能混进 hit 计分
         （混进去会被「静音 +2 / 颜值 +2」压掉，等于没设偏好）。
         brandPref 为空或未知 → null → pickOne 走原逻辑，一个字节都不变。 */
      fn.brandOf = BRAND_RE[brandPref] || null;
      return fn;
    }

    /* 覆盖率诚实告知（ORD-31 任务 6）。
       品牌偏好只能在「库里已有的型号」里挑，而库里的苹果手机只有 6 款，
       小米/华为各几十款 —— 选了苹果，拿到的方案必然是「库里就这么多」的结果。
       ORD-29 补全品牌选项解决的是「选了苹果能不能得到苹果」，
       解决不了「站里 iPhone 型号太少」这个事实。事实就得说出来：
       不说，用户会以为「推荐结果就这些」；说了，他才知道该自己去比。
       判据：该形态下这个品牌的型号数少于 10 款，**或**不到最多品牌的三分之一。
       两条满足其一就说：6 款 iPhone 对 12 款华为（本库手机品类实测）不算「三分之一」，
       但对用户来说「只有 6 款可选」是必须知道的事实。 */
    var BRAND_LABEL = { b_apple: "苹果", b_huawei: "华为", b_xiaomi: "小米", b_lenovo: "联想", b_samsung: "三星" };
    function brandCoverageNote(form, brandPref) {
      var re = BRAND_RE[brandPref];
      if (!re) return "";
      var catId = form === "phone" ? "phone" : form === "tablet" ? "tablet" : "laptop";
      var cat = D.categories.filter(function (c) { return c.id === catId; })[0];
      var items = (cat && cat.items) || [];
      if (!items.length) return "";
      var mine = items.filter(function (it) { return re.test(String(it.brand || "")); }).length;
      var byBrand = {}, top = 0, topName = "";
      items.forEach(function (it) {
        var b = String(it.brand || "(未标)");
        byBrand[b] = (byBrand[b] || 0) + 1;
        if (byBrand[b] > top) { top = byBrand[b]; topName = b; }
      });
      if (!mine) {
        return '<div class="cover-note">本站' + (cat ? esc(cat.name) : "") + "里没有「" + BRAND_LABEL[brandPref] +
          "」品牌的型号，下面的方案在品牌上不会命中你的偏好。可以改选「不限品牌」，或到" +
          '<a href="accessories.html">配件与榜单</a>按型号自己查。</div>';
      }
      if (mine >= 10 && mine * 3 >= top) return "";
      /* 只陈述数字与后果，不做「覆盖很差」这种评价 ——
         9 款对 12 款说「明显少」是夸大，但「只有这 9 款可选」是事实。 */
      return '<div class="cover-note">本站「' + BRAND_LABEL[brandPref] + "」的" + (cat ? esc(cat.name) : "型号") +
        "能查到 <b>" + mine + " 款</b>（本类目最多的 " + esc(topName) + " 有 " + top +
        " 款，全类目 " + items.length + " 款）。下面的方案只在这个范围里挑，价格区间也容易跳档；" +
        "想要更完整的横向对比，可以改选「不限品牌」再看一遍。</div>";
    }

  /* 挑 top1 + 2 备选：配置单同款置顶，其余按价位距离 + 等级排序 */
  function pickOne(items, target, rowText, allItems, minAnchorMid, bias, preferOverAnchor) {
    if (!items.length) return null;
    var win = items.filter(function (it) {
      var m = mid(it.price);
      return m >= target * 0.6 && m <= target * 1.5;
    });
    var pool = win.length ? win : items;
    /* 偏好只在价位窗口内决定"同类里挑哪件"：
       静音/颜值这类偏好把 360 水冷换成百元风冷，是比不挑更糟的错。 */
    /* 用户在「最看重什么」里点了名的那一类，功能款要压过配置单模板点名的型号。
       不这么做，"静音散热"与"人体工学"会推出同一套 —— 这道题等于白问。 */
    var skipAnchor = false;
    if (bias) {
      /* 品牌偏好先于「最看重什么」：品牌是硬约束，静音/颜值是软偏好。
         只在候选池里真有这个品牌时收紧；一件都没有就退回原行为 ——
         品牌偏好不能把一行清空（那会让配置单少一件，比推错品牌更糟）。 */
      if (bias.brandOf) {
        var sameBrand = pool.filter(function (it) { return bias.brandOf.test(String(it.brand || "")); });
        if (sameBrand.length) { pool = sameBrand; skipAnchor = true; }
      }
      var liked = pool.filter(function (it) { return bias(it) > 0; });
      if (liked.length) { pool = liked; if (preferOverAnchor) skipAnchor = true; }
    }
    var ranked = pool.slice().sort(function (a, b) {
      var da = Math.abs(mid(a.price) - target), db = Math.abs(mid(b.price) - target);
      if (da !== db) return da - db;
      var d = (gradeOrder[b.valueGrade] || 0) - (gradeOrder[a.valueGrade] || 0);
      return d !== 0 ? d : b.rating - a.rating;
    });
    /* 同款要在「全量品类库」里找：候选池已被用途/价位过滤，可能把配置单点名的那件挤掉了 */
    var lib = allItems && allItems.length ? allItems : items;
    /* 先找严格同款；一件都没有才退回宽松匹配（此时不再算"同款"） */
    var strict = matchAnchorsStrict(lib, rowText);
    var anchors = strict.length ? strict : matchAnchors(lib, rowText);
    var top = null, isAnchor = false;
    var anchorTop = anchors.length ? anchors.slice().sort(function (a, b) {
      return Math.abs(mid(a.price) - target) - Math.abs(mid(b.price) - target);
    })[0] : null;
    /* 预算明显高于配置单同款时不再锁死同款：否则预算拉满也只能拿到模板里那件入门型号 */
    if (anchorTop && !skipAnchor && (minAnchorMid === undefined || mid(anchorTop.price) >= minAnchorMid)) {
      top = anchorTop;
      isAnchor = true;
    } else {
      top = ranked[0] || null;
    }
    if (!top) return null;
    var alts = ranked.filter(function (it) { return it.id !== top.id; }).slice(0, 2);
    /* 标记由严格判定给出，不再跟着"是不是 anchorTop"走 */
    return { item: top, anchor: isAnchor, state: anchorState(top, rowText), alts: alts };
  }

  /* 散热器形态由配置单决定（360 水冷 ≠ 下压风冷），用途标签对它没意义；
     不加这道闸会出现「配置单写 360 水冷、推荐 37mm 矮散热」这类跨形态错配。 */
  function coolerForm(items, rowText) {
    var t = String(rowText || "");
    var wantWater = /水冷|液冷|liquid|AIO/i.test(t) || /\b(240|360)\b/.test(t);
    var wantAir = /风冷|双塔|单塔|下压|塔式|原装/.test(t);
    if (!wantWater && !wantAir) return items;
    var hit = items.filter(function (it) {
      var s = (it.style || "") + (it.specs || "");
      var isWater = s.indexOf("水冷") !== -1 || s.indexOf("液冷") !== -1;
      return wantWater ? isWater : !isWater;
    });
    return hit.length ? hit : items;
  }

  /* 无独立型号库的部件（主板/内存/硬盘/机箱/笔记本散热）→ 按配置单价位从 partCatalog 档位直选 */
  var CATALOG_PARTS = {
    "主板": "主板", "内存": "内存", "硬盘": "硬盘", "机箱": "机箱", "笔记本散热": "笔记本散热"
  };

  function catalogPick(partName, target) {
    var key = CATALOG_PARTS[partName];
    if (!key || !D.partCatalog) return null;
    var group = null;
    D.partCatalog.forEach(function (g) { if (g.key === key) group = g; });
    if (!group || !group.options || !group.options.length) return null;
    var opts = group.options.slice().sort(function (a, b) { return a.p - b.p; });
    var top = opts.reduce(function (best, o) {
      return Math.abs(o.p - target) < Math.abs(best.p - target) ? o : best;
    }, opts[0]);
    var alts = opts.filter(function (o) { return o !== top; })
      .sort(function (a, b) { return Math.abs(a.p - target) - Math.abs(b.p - target); })
      .slice(0, 2);
    return { name: top.n, price: [top.p, top.p], alts: alts };
  }

  /* 全套部件逐项推荐：按配置单顺序输出，覆盖整机 + 外设的每一个部件。
     有型号库的类目走型号匹配，没有的走 partCatalog 档位直选。 */
  function fullPartRows(plan, opts) {
    opts = opts || {};
    /* 已算过就复用：配置单表格与配件区必须是同一份结果，否则价格又会分叉 */
    if (opts.rows) return opts.rows;
    var uses = opts.uses || [];
    var skipParts = opts.skipParts || [];
    var bias = typeof opts.bias === "function" ? opts.bias : null;
    var targetScale = opts.targetScale || 1;
    var scaleOf = typeof opts.scaleOf === "function" ? opts.scaleOf : null;
    var lookPref = opts.look || "";
    var pref = opts.pref || "";
    /* 颜值风格在哪些品类上没现货 —— 结果页必须说出来，静默退回等于骗人 */
    var lookMiss = [];
    var targets = planPartTargets(plan);
    var base = mid(plan.price || [0, 0]);
    var budgetCap = opts.budgetCap || 0;
    var out = [];
    var skipped = [];
    /* 同一套方案里不能给两行挑同一件（存储行与充电器行曾各推一个同款充电器） */
    var usedIds = {};
    /* 配件能不能用取决于本体是谁：iPhone 壳装不到 vivo 上。
       本体行一般排在配置单第一行，但「手机壳」也可能出现得比「手机」早 ——
       靠行序赌不可靠。先把本体行算出来拿到它的生态，再算剩下的行，最后按原序还原。 */
    var bodyEco = "", bodyCatId = "";
    /* 平台联动：CPU 先定（配置单这一行几乎总是点名具体型号）→ 主板按 CPU 插槽收窄
       → 内存按主板代际收窄。
       为什么不是主板先定：t4500 的主板行写「H610M / B650M」、CPU 行写「i3-14100F / R5 5500」，
       主板先定会挑中 B650M（AM5），而配置单点名的两颗 CPU 都不在 AM5 上（LGA1700 / AM4），
       结果只能从库里另挑一颗配置单没写的 CPU —— 配置单原文被整行换掉。
       CPU 先定则保住配置单点名的型号，主板跟着插槽走。 */
    var cpuSocket = "", moboDdr = "";
    var PRIO = { cpu: 1, mobo: 2, ram: 3 };
    var order = (plan.parts || []).map(function (r, i) { return { r: r, i: i }; });
    order.sort(function (a, b) {
      var ba = WHOLE_BUDGET_SHARE[PART_CAT[a.r[0]] || ""] ? 0 : (PRIO[PART_CAT[a.r[0]] || ""] || 4);
      var bb = WHOLE_BUDGET_SHARE[PART_CAT[b.r[0]] || ""] ? 0 : (PRIO[PART_CAT[b.r[0]] || ""] || 4);
      return ba - bb || a.i - b.i;
    });

    /* 用途只作软过滤：过滤后若覆盖不到配置单价位，就退回全库。
       否则「办公」场景会把配置单里的 360 水冷降成百元风冷、5070 降成入门卡。 */
    function narrow(items, target) {
      if (!uses.length) return items;
      var hit = items.filter(function (it) {
        return (it.use || []).some(function (u) { return uses.indexOf(u) !== -1; });
      });
      if (!hit.length) return items;
      var inBand = hit.filter(function (it) {
        var m = mid(it.price);
        return m >= target * 0.7 && m <= target * 1.3;
      });
      return inBand.length ? hit : items;
    }

    order.forEach(function (o) {
      var r = o.r;
      var part = r[0], config = String(r[1] || ""), priceText = String(r[2] || "");
      /* 已有件按"配置单行"跳过。按品类跳会连坐：charger 里同时装着充电器/数据线/移动电源 */
      if (skipParts.indexOf(part) > -1) {
        skipped.push({ part: part, config: config, priceText: priceText, _i: o.i });
        return;
      }
      var cid = PART_CAT[part] || null;
      var cat = null;
      if (cid) D.categories.forEach(function (c) { if (c.id === cid) cat = c; });
      var isBody = !!(cid && WHOLE_BUDGET_SHARE[cid]);
      var compatDropped = 0, compatBlocked = 0, blankReason = "";
      var target = (targets.byPart[part] || targets.byCat[cid] || base * 0.03) * targetScale * (scaleOf ? scaleOf(cid) : 1);
      if (PART_SPLIT[part]) target = target / PART_SPLIT[part];
      /* 笔记本本体按预算选档：配置单行价只是模板，不该锁死选择 */
      var minAnchorMid;
      /* 「你最看重什么」得压过配置单模板：偏好在某类上明显加码（≥1.2 倍）时，
         配置单点名那件若明显低于新目标就不再锁死同款，否则静音与人体工学推出同一套。 */
      var strongPref = !!(scaleOf && scaleOf(cid) > 1.25);
      if (strongPref) minAnchorMid = target * 0.95;
      if (WHOLE_BUDGET_SHARE[cid]) {
        var lapTarget = laptopBudgetTarget(priceText, budgetCap, WHOLE_BUDGET_SHARE[cid]);
        if (lapTarget > 0) {
          target = lapTarget;
          minAnchorMid = lapTarget * 0.6;
        }
      }

      /* 「最看重什么」里哪些选项在哪几个品类上有物理对应。只有列出来的才允许
         让功能款压过模板同款；没列的（如性价比）只调价位，不换型号。
         必须在这里算：下面键鼠分支就要用，放到 LOOK 块里会被 var 提升成 undefined。 */
      var PREF_CATS = {
        quiet: { cooler: 1, case: 1, psu: 1 },
        rgb: { case: 1, cooler: 1 },
        ergo: { input: 1, monitor: 1, stand: 1 },
        p_camera: { phone: 1 },
        p_battery: { phone: 1 },
        t_ink: { mobileacc: 1 },
        t_screen: { tablet: 1 }
      };
      var preferOverAnchor = !!(PREF_CATS[pref] && PREF_CATS[pref][cid]);

      // 键鼠是「键盘 + 鼠标」组合件，拆成两条，否则只出一件
      // 「便携键鼠」是笔记本方案里的同一件组合，同样要拆
      if ((part === "键鼠" || part === "便携键鼠") && cat && cat.items && cat.items.length) {
        var comboItem = cat.items;
        /* 点名"人体工学"时不能按用途过滤：人体工学键鼠都是办公款，
           按游戏用途筛完一个都不剩，这道题就被过滤掉了。 */
        if (uses.length && !preferOverAnchor) comboItem = narrow(comboItem, target);
        var kbSet = comboItem.filter(function (it) { return (it.style || "").indexOf("键盘") !== -1; });
        var msSet = comboItem.filter(function (it) { return (it.style || "").indexOf("鼠标") !== -1; });
        var segs = config.split(/[+＋]/);
        var kbPick = pickOne(kbSet.length ? kbSet : comboItem, target * 0.55, segs[0] || "", cat.items, undefined, bias, preferOverAnchor);
        var msPick = pickOne(msSet.length ? msSet : comboItem, target * 0.45, segs[1] || "", cat.items, undefined, bias, preferOverAnchor);
        if (kbPick) out.push({ part: "键盘", srcPart: part, icon: "⌨️", config: config, priceText: priceText, cat: cat, pick: kbPick, textPick: null });
        if (msPick) out.push({ part: "鼠标", srcPart: part, icon: "🖱️", config: config, priceText: priceText, cat: cat, pick: msPick, textPick: null });
        return;
      }

      var pick = null, textPick = null;
      if (cat && cat.items && cat.items.length) {
        var items = cat.items;
        /* 平台联动：主板已选定时，内存只留同代际、CPU 只留同插槽。
           收窄后一件都没有就不收窄（保持原有兜底），但下面的闸会把它抓出来。 */
        if (cid === "ram" && moboDdr) {
          var ddrHit = items.filter(function (it) { return ddrOf(it.specs) === moboDdr; });
          if (ddrHit.length) items = ddrHit;
        }
        if (cid === "mobo" && cpuSocket) {
          var sockHit = items.filter(function (it) { return socketOf(it.specs) === cpuSocket; });
          if (sockHit.length) items = sockHit;
        }
        // psu 类别混装电源与机箱，电源位只取电源
        if (cid === "psu") {
          var onlyPsu = items.filter(function (it) { return (it.style || "").indexOf("电源") !== -1; });
          if (onlyPsu.length) items = onlyPsu;
        }
        /* 散热按冷排规格选，不走用途软过滤：软过滤会把它整档降下来 */
        /* 行名说了物类就先收窄；typed 为空数组时不回落（空数组是 true，会把 pool 清空，
           pickOne 直接返回 null，随后走配置单原文兜底 —— 这是想要的结果） */
        /* style 也要进 haystack：支架类的物类只写在 style 里（「笔记本支架」/「显示器支架」），
           name 是「北弧 LDT14 单屏气压弹簧臂」这种，靠名字永远判不出是给谁用的。 */
        var typed = null;
        if (SUB_CAT[cid]) {
          if (SUB_STYLE[part]) {
            /* 按 style 判（比 name 准，见 SUB_STYLE 注释） */
            typed = items.filter(SUB_STYLE[part]);
          } else if (SUB_KW[part]) {
            typed = items.filter(function (it) {
              return SUB_KW[part].test(String(it.brand || "") + String(it.model || "") + String(it.name || "") + " " + String(it.style || ""));
            });
          }
        }
        /* 行名收窄后一件都没有：这一行宁可明说「暂无可用配件」，也不拿别的物类凑数。
           判定在下面 pick 为空时做，这里只保留 typed 供那段代码读。 */
        /* 生态过滤放在收窄之前：收窄（壳/笔/键盘…）的判定只看物类，
           不过滤就会出现「vivo 手机 + 苹果 iPhone 17 官方硅胶壳」。
           items 是 cat.items 的新数组（filter 不就地改），不会污染品类库。 */
        if (!isBody && bodyEco && typed) {
          var before = typed.length;
          typed = typed.filter(function (it) { return !compatDrop(it, bodyEco, bodyCatId); });
          compatDropped = before - typed.length;
        } else if (!isBody && bodyEco) {
          /* 没有行名收窄规则的品类（耳机/显示器/拓展坞…）也要挡一次：
             生态件混进通用品类同样会错配，只是这里不过滤物类。 */
          var before2 = items.length;
          items = items.filter(function (it) { return !compatDrop(it, bodyEco, bodyCatId); });
          compatDropped = before2 - items.length;
        }
        var avail = typed || items;
        if (typed && !typed.length) avail = [];
        var pool = typed && !typed.length ? []
          : (cid === "cooler" ? coolerForm(avail, target)
             : (preferOverAnchor ? avail : narrow(avail, target)));
        if (typed && typed.length) {
          pool = pool.filter(function (it) { return !usedIds[it.id]; });
        }
        /* 颜值偏好要压过"配置单同款"：用户明确说喜欢白色，配置单模板却点名海景房时，
           照模板推海景房再标"同款"，等于把这个回答当没听见。
           该风格有现货时，同款匹配也只在风格内找；没现货才退回全量。 */
        /* 同款匹配的全量池也必须过生态：用 cat.items 会把刚排除的件从后门捞回来 */
        var anchorPool = typed && typed.length ? typed : items;
        /* 只对外观看得见、同档能换的品类应用颜值偏好。
           显卡/CPU 也带风格标注，但把显卡按"白色"换掉等于按颜色换性能档，是错的。 */
        var LOOK_CATS = { case: 1, monitor: 1, input: 1, stand: 1, audio: 1, dock: 1 };
        if (lookPref && lookPref !== "any" && lookPref !== "all" && LOOK_CATS[cid]) {
          var styledAll = items.filter(function (it) { return lookOf(it) === lookPref; });
          if (!styledAll.length && lookMiss.indexOf(cid) === -1) lookMiss.push(cid);
          /* 款式过滤是"同档换壳"，不能拿来卡住用户明说最看重的那一件：
             该风格最高也就到目标价的九成时，功能优先，款式退让。 */
          var styledTop = 0;
          styledAll.forEach(function (it) { styledTop = Math.max(styledTop, mid(it.price)); });
          if (styledAll.length && (!strongPref || styledTop >= target * 0.9)) {
            anchorPool = styledAll;
            var styledPool = pool.filter(function (it) { return lookOf(it) === lookPref; });
            if (styledPool.length) pool = styledPool;
            /* 选中款式通常略贵：在这类上加一点预算，别让风格偏好压着便宜货走 */
            target = target * 1.12;
          }
        }
        pick = pickOne(pool, target, config, anchorPool, minAnchorMid, bias, preferOverAnchor);
        if (pick && pick.item && pick.item.id) usedIds[pick.item.id] = 1;
        /* 这一类有型号库但这一档挑不出东西时，退回档位直选：
           直接 filter 掉会让配置单少一行却不作声，用户以为是漏了。 */
        if (!pick) {
          /* 因生态排除而空手时不许拿档位充数：档位里就写着「苹果 20W 原装充电器」这种东西，
             填进来等于换个方式继续给安卓机配苹果件。这一行改为明写「暂无可用配件」。 */
          if (compatDropped) compatBlocked = compatDropped;
          /* 行名收窄后一件都没有（stand 里只有显示器支架、没有笔记本支架）：
             同样不许拿别的物类凑数，明说这一行没有可用件。 */
          else if (typed && !typed.length) blankReason = "库里没有符合「" + part + "」的型号";
          else textPick = catalogPick(part, target) || { name: config, price: [0, 0], alts: [] };
        }
      } else {
        textPick = catalogPick(part, target) || { name: config, price: [0, 0], alts: [] };
      }
      /* 本体行的选中件决定后面所有配件的生态。放在 push 前，配件行才能读到。 */
      if (isBody && pick && pick.item) {
        bodyCatId = cid;
        bodyEco = ecoOfBrand(pick.item.brand);
      }
      if (cid === "cpu" && pick && pick.item) cpuSocket = socketOf(pick.item.specs);
      if (cid === "mobo" && pick && pick.item) moboDdr = ddrOf(pick.item.specs);
      out.push({
        part: part, srcPart: part, config: config, priceText: priceText, cat: cat,
        pick: pick, textPick: textPick, compatBlocked: compatBlocked,
        blankReason: blankReason || "", softNote: (pick && pick.item) ? compatNote(pick.item) : "",
        _i: o.i
      });
    });
    /* 本体行被提前处理过，这里按配置单原序还原 */
    out.sort(function (a, b) { return a._i - b._i; });
    skipped.sort(function (a, b) { return a._i - b._i; });
    /* 有可推荐件、或有「无可用配件」明示，都算这一行交代清楚了；
       两个都没有才是静默消失（用户会以为漏配了） */
    var finalRows = out.filter(function (r) { return r.pick || r.textPick || r.compatBlocked || r.blankReason; });
    // filter 会返回新数组，跳过的行要挂回去供配置单表格使用
    finalRows.skipped = skipped;
    finalRows.lookMiss = lookMiss;
    return finalRows;
  }

  /* 全套部件推荐渲染：每行 = 部件 + 推荐型号 + 参考价 + 说明 + 备选（点备选去搜同型号）
     重点件置顶并展开；非重点件放进折叠区（仍在页面上，只是不占首屏）。
     只有真传了 priority 才折叠 —— 快速推荐没有"重点"概念，必须全展开。 */
  function fullPartsHtml(plan, opts) {
    if (!plan) return "";
    opts = opts || {};
    var pri = opts.priority || [];
    var rows = fullPartRows(plan, opts);
    if (!rows.length) return "";
    /* 先数命中，再决定折不折。只看"有没有勾重点"不看"勾的重点在不在这一套里"，
       结果是勾了「耳机与穿戴」却碰上不含耳机的方案时，整屏被收进折叠区，首屏变空白。 */
    var hotHits = 0;
    rows.forEach(function (r) {
      var keys = [r.srcPart, r.part, r.cat ? r.cat.id : ""];
      r.hot = keys.some(function (k) { return k && pri.indexOf(k) > -1; });
      if (r.hot) hotHits++;
    });
    /* 用户没点重点就不折叠：折叠区的标题是「其余部件」，没有重点就没有"其余"。 */
    var collapsible = pri.length > 0 && opts.fold !== false && hotHits > 0;
    /* 不折叠 = 全部行都进主列表。设成 false 会让 hotRows 与 restRows 双双落空，配件区整片消失。 */
    if (!collapsible) rows.forEach(function (r) { r.hot = true; });
    /* 标记必须属实：同款 / 候选之一 / 档位具体型号 / 同档位替代，不能一律写"同款" */
    function badgeOf(r) {
      var st = r.pick && r.pick.state;
      if (!st) return "";
      if (st === "exact") return '<span class="anchor-badge">配置单同款</span>';
      if (st === "candidate") return '<span class="anchor-badge anchor-cand">配置单候选之一</span>';
      if (st === "chipset") return '<span class="anchor-badge anchor-tier">配置单档位的具体型号</span>';
      return '<span class="fp-badge fp-alt-badge">同档位替代</span>';
    }
    function rowHtml(r) {
      var it = r.pick && r.pick.item;
      var icon = r.icon || (r.cat ? r.cat.icon : "🔧");
      // 有型号库的给具体型号；没有的（主板/内存/硬盘/机箱）直接展示配置单原选
      var name = it ? it.name : r.config;
      var priceTxt = it ? fmtPrice(it.price) : r.priceText;
      var badges = (r.hot && collapsible ? '<span class="fp-badge">升级重点</span>' : "") + badgeOf(r);
      if (!it && r.textPick) badges += '<span class="fp-badge fp-cat-badge">配置单原选</span>';
      if (r.compatBlocked || r.blankReason) badges += '<span class="fp-badge fp-block-badge">无可用件</span>';
      var why = "";
      if (!it) {
        if (r.compatBlocked) {
          /* 不许静默消失，也不许拿不兼容的件充数：说清为什么没有，并把决定权交回用户 */
          why = '<p class="fp-why fp-why-blocked">这一行暂无可用配件：按当前主体排除了 ' +
            r.compatBlocked + ' 件生态不兼容的型号。可以按配置单原选自行挑选。</p>';
        } else if (r.blankReason) {
          /* 行名收窄后没有对得上的件（支架行只收窄到笔记本支架，库里 34 件是显示器支架）：
             明说，不拿别的物类凑数 */
          why = '<p class="fp-why fp-why-blocked">' + esc(r.blankReason) +
            '。这一行暂无可用配件，可以按配置单原选（「' + esc(r.config) + '」）自行挑选。</p>';
        } else {
          why = '<p class="fp-why">这一类没有独立的型号库，上面就是配置单的原选；同价位档位参考「' +
            esc(r.textPick.name) + '（¥' + r.textPick.price[0] + '）」。装机时以主板接口与机箱限高为准。</p>';
        }
      } else {
        if (r.pick.state === "alt") {
          // 型号不一致就必须说清差在哪，否则用户会以为这就是配置单写的那件
          why += '<p class="fp-why fp-why-alt">配置单这一行写的是「' + esc(r.config) +
            "」，站内没有完全对得上的型号，此处给同档位的 " + esc(it.name) +
            "（" + fmtPrice(it.price) + "）。想更接近原选，点下面备选。</p>";
        }
        if (it.valueNote) why += '<p class="fp-why">' + esc(it.valueNote) + "</p>";
        /* 软边界：装得上但功能打折（AirPods 在安卓上、小米手表在第三方手机上）。
           提示而不排除 —— 排除了等于拿「体验打折」当「装不上」。 */
        if (r.softNote) why += '<p class="fp-why fp-soft-note">兼容提示：' + esc(r.softNote) + "</p>";
      }
      var cands = it
        ? (r.pick.alts || []).map(function (a) { return { label: a.name, q: a.searchName || a.name, price: fmtPrice(a.price) }; })
        : ((r.textPick && r.textPick.alts) || []).map(function (a) { return { label: a.n, q: a.n, price: "¥" + a.p }; });
      var alts = cands.length
        ? '<div class="fp-alts"><span class="fp-alts-label">备选</span>' + cands.map(function (c) {
            return '<a class="fp-alt" href="https://search.jd.com/Search?keyword=' + encodeURIComponent(c.q) + '" target="_blank" rel="noopener noreferrer">' +
              esc(c.label) + " " + c.price + "</a>";
          }).join("") + "</div>"
        : "";
      return '<div class="fp-row' + (r.hot && collapsible ? " fp-hot" : "") + '"' +
        (it ? ' data-model="' + esc(it.model || "") + '"' : "") + '>' +
        '<div class="fp-head"><span class="fp-cat">' + icon + " " + esc(r.part) + "</span>" + badges + "</div>" +
        '<div class="fp-body"><span class="fp-name">' + esc(name) + "</span>" +
        '<span class="fp-price">' + priceTxt + "</span></div>" +
        why + alts +
        (it ? productImageLink(it) : "") +
      "</div>";
    }
    var hotRows = rows.filter(function (r) { return r.hot; });
    var restRows = rows.filter(function (r) { return !r.hot; });
    var body = hotRows.map(rowHtml).join("");
    /* 不折叠时 restRows 就是全部行：这里必须受 collapsible 门控，否则首屏依然空白 */
    if (restRows.length && collapsible) {
      body += '<details class="fp-more"><summary>其余 ' + restRows.length +
        ' 个部件（不是这次的重点，点开看）</summary><div class="fp-list fp-list-sub">' +
        restRows.map(rowHtml).join("") + "</div></details>";
    }
    /* 重点项一件都没落地时必须说出来：用户勾了却看不到，会以为功能没生效 */
    /* pri 里混着选项 id（如 p_audio），只把部件名写给用户看 */
    var priNames = pri.filter(function (k) { return !/^[a-z][a-z0-9_]*$/.test(String(k)); });
    var missTip = (pri.length && !hotHits)
      ? '<div class="res-skip-note res-focus-miss">你勾的重点项（' + esc((priNames.length ? priNames : pri).join(" / ")) +
        "）在这套组合里没有对应部件，所以没有置顶，下面按整体优先排列。换一套方案或取消这几项勾选即可。</div>"
      : "";
    /* 部分落空必须逐项点名（ORD-15 §4）：勾了「耳机与穿戴」而方案只有手机与散热电源时，
       用户看到手机被置顶，会以为耳机也一并处理过了。只报缺失的那几项，已落地的绝不报。
       用独立 class res-focus-partial，不带 res-focus-miss —— A7 的明示判定不许被这里放水。 */
    var focusQ = (D.quiz || []).filter(function (x) { return x.id === "focus"; })[0];
    var pickedOpts = [];
    ((focusQ && focusQ.options) || []).forEach(function (o) {
      if (pri.indexOf(o.id) > -1) pickedOpts.push({ label: o.label, parts: o.parts || [] });
    });
    var landed = [];
    rows.forEach(function (r) { landed.push(r.part); if (r.srcPart) landed.push(r.srcPart); });
    var missLabels = [];
    pickedOpts.forEach(function (o) {
      var hit = o.parts.some(function (p) { return landed.indexOf(p) > -1; });
      if (!hit) missLabels.push(o.label);
    });
    /* 代替者取真正被置顶的部件（不含落空项），最多列三个，多了读不下去 */
    var altNames = [];
    hotRows.forEach(function (r) {
      if (altNames.indexOf(r.part) === -1) altNames.push(r.part);
    });
    var partialTip = (missLabels.length && hotHits)
      ? '<div class="res-skip-note res-focus-partial">你勾的「' + esc(missLabels.join(" / ")) +
        "」这套方案里没有对应部件，已按「" + esc((altNames.length ? altNames.slice(0, 3) : ["整体优先"]).join(" / ")) +
        "」代替。想补上就换一套方案，或取消这几项勾选。</div>"
      : "";
    return missTip + partialTip + '<div class="fp-list">' + body + "</div>";
  }

  /* 方案简述卡：名称 + 档位 + 参考预算 + 适合人群 + 一句话说明 */
  function planBriefHtml(plan) {
    var personas = (plan.personas || []).map(function (pid) {
      var p = D.personas.filter(function (x) { return x.id === pid; })[0];
      return p ? '<span class="tag-pill">' + p.icon + " " + p.name + "</span>" : "";
    }).join("");
    return (
      '<div class="smart-plan reveal in">' +
        '<div class="budget-head">' +
          '<span class="plan-icon">' + plan.icon + "</span>" +
          '<div><h3 class="plan-name">' + esc(plan.name) + '<span class="plan-tier">' + esc(plan.budgetLabel) + "</span></h3>" +
          '<span class="plan-budget">参考预算 ' + fmtPrice(plan.price) + " ｜ 适合人群 " + personas + "</span></div>" +
        "</div>" +
        '<p class="smart-summary">' + esc(plan.summary) + "</p>" +
      "</div>"
    );
  }

  /* 相邻档位三套对比：主方案前后各取一档；笔记本方案保持单套 */
  function planSiblingSets(plan, pool) {
    if (!plan) return [];
    var isMobile = plan.id === "mobile";
    var list = (pool || []).filter(function (pl) {
      return isMobile ? pl.id === "mobile" : pl.id !== "mobile";
    });
    if (!list.length) list = [plan];
    list = list.slice().sort(function (a, b) {
      return (a.price[0] + a.price[1]) - (b.price[0] + b.price[1]);
    });
    var idx = -1;
    list.forEach(function (pl, i) { if (pl.id === plan.id) idx = i; });
    if (idx === -1) return [{ plan: plan, tag: "为你匹配", main: true }];
    var sets = [];
    if (idx > 0) sets.push({ plan: list[idx - 1], tag: "省预算" });
    sets.push({ plan: list[idx], tag: "为你匹配", main: true });
    if (idx < list.length - 1) sets.push({ plan: list[idx + 1], tag: "加预算" });
    return sets;
  }

  /* 多套方案切换标签：单套时不渲染 */
  function planSetTabsHtml(sets, mainIdx) {
    if (!sets || sets.length <= 1) return "";
    return '<div class="filter-chips smart-set-tabs">' + sets.map(function (s, i) {
      return '<button type="button" class="chip' + (i === mainIdx ? " active" : "") + '" data-set="' + i + '">' +
        s.tag + "｜" + esc(s.plan.name) + " " + fmtPrice(s.plan.price) + "</button>";
    }).join("") + "</div>";
  }

  function bindPlanSetTabs(root, render) {
    if (!root) return;
    root.querySelectorAll(".smart-set-tabs .chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        root.querySelectorAll(".smart-set-tabs .chip").forEach(function (x) { x.classList.remove("active"); });
        chip.classList.add("active");
        render(parseInt(chip.getAttribute("data-set"), 10));
      });
    });
  }

  function fmtPrice(p) {
    if (!p) return "随行情";
    if (p[0] === 0 && p[1] === 0) return "随主板";
    if (p[0] === p[1]) return "¥" + p[0];
    return "¥" + p[0] + " - " + p[1];
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* 复制到剪贴板：优先 async clipboard，失败或不可用则用临时 textarea 兜底；
   * 成功后把按钮文字临时改成「已复制」再复原。 */
  function copyToClipboard(text, btn) {
    function flash() {
      if (!btn || !btn.textContent) return;
      var old = btn.textContent;
      btn.textContent = "已复制";
      setTimeout(function () { btn.textContent = old; }, 1600);
    }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flash, function () { fallback(); flash(); });
    } else {
      fallback();
      flash();
    }
  }

  /* ---- 术语悬停解释：题干 / 选项里的术语自动套 .term ---- */
  var KNOWN_TERMS = {
    "4K": "4K = 3840×2160 高清分辨率；剪辑 / 设计专用，普通桌面 1080p/2K 已够",
    "144Hz": "144Hz = 显示器每秒刷新 144 张画面，FPS 玩家更跟手；办公 60Hz 就够",
    "1ms": "1ms = 灰阶响应时间，FPS 玩家防拖影",
    "IPS": "IPS 面板：颜色准、可视角度广，主流选择",
    "OLED": "OLED 自发光：颜色最艳、对比度最高，但有烧屏风险（长期留同一画面会留痕）",
    "Mini-LED": "Mini-LED：背光分区，亮处更亮、暗处更暗，价格偏贵",
    "核显": "核显 = CPU 自带的显卡；办公 / 看视频够用，能省一笔独显钱",
    "独显": "独显 = 独立显卡；打游戏 / 剪辑 / 3D 必备",
    "3A": "3A = 高成本高画质单机大作，对显卡要求高",
    "FPS": "FPS = 第一人称射击（CS / 瓦罗兰特 / 吃鸡），看重刷新率",
    "MOBA": "MOBA = 多人在线竞技（LOL / Dota），对显卡要求低",
    "DDR5": "DDR5 = 第 5 代内存，2026 年主力，比 DDR4 更快更贵",
    "DDR4": "DDR4 = 第 4 代内存，便宜够用，老平台选",
    "NVMe": "NVMe = 高速 SSD 接口（M.2），比传统 SATA SSD 快 5–10 倍",
    "SSD": "SSD = 固态硬盘，比老机械硬盘快很多，开机 / 开软件飞快",
    "PCIe": "PCIe = 主板上的高速插槽，显卡和 SSD 都插这里",
    "Type-C": "Type-C：正反都能插的接口，传数据 / 充电 / 视频都能",
    "HDMI": "HDMI：显示器 / 电视接口，家用最常见",
    "DP": "DP（DisplayPort）：显示器主流接口，刷新率支持更好",
    "Wi-Fi 6E": "Wi-Fi 6E：第 6 代 Wi-Fi 增强版，多设备不挤",
    "Wi-Fi 6": "Wi-Fi 6：第 6 代 Wi-Fi，速度快、省电",
    "80 PLUS": "80 PLUS = 电源转换效率认证（金牌 / 白金省电发热低）",
    "RGB": "RGB = 可调灯效，纯颜值、不影响性能",
    "海景房": "海景房 = 四面透明玻璃机箱，把硬件都秀出来",
    "便携": "便携 = 能带着走的形态，笔记本 / 小主机为主",
    "静音": "静音 = 低噪音强散热（贵但舒适）"
  };

  /* 把字符串里出现的已知术语包成 .term 悬停 span。
   * 假设输入为纯文本（无 HTML）。按"从长到短、不重叠"原则一次性扫描所有术语位置，
   * 再按位置重组字符串——避免循环替换时下轮扫描到上轮已生成的 span 内文本
   * （例：「DDR5」的解释里出现「DDR4」字面量时被错误再套 span）。 */
  function termify(text) {
    var keys = Object.keys(KNOWN_TERMS).sort(function (a, b) { return b.length - a.length; });
    var src = String(text);
    var hits = [];
    for (var k = 0; k < keys.length; k++) {
      var term = keys[k];
      var escRe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var re = new RegExp(escRe, "g");
      var m;
      while ((m = re.exec(src)) !== null) {
        var conflict = false;
        for (var j = 0; j < hits.length; j++) {
          if (m.index < hits[j].end && m.index + term.length > hits[j].start) { conflict = true; break; }
        }
        if (!conflict) hits.push({ start: m.index, end: m.index + term.length, term: term });
      }
    }
    hits.sort(function (a, b) { return a.start - b.start; });
    var out = "";
    var cursor = 0;
    for (var i = 0; i < hits.length; i++) {
      out += src.slice(cursor, hits[i].start);
      out += '<span class="term" data-tip="' + KNOWN_TERMS[hits[i].term] + '" tabindex="0">' + hits[i].term + "</span>";
      cursor = hits[i].end;
    }
    out += src.slice(cursor);
    return out;
  }

  /* =========================================================
   * 一、配件价格库（#accessories）：品类/场景/预算 筛选 + 卡片
   * ========================================================= */
  function initAccessories() {
    var wrap = document.getElementById("accWrap");
    var catRow = document.getElementById("accCats");
    var sceneRow = document.getElementById("accScenes");
    var budgetRow = document.getElementById("accBudget");
    var countEl = document.getElementById("accCount");
    var searchEl = document.getElementById("accSearch");
    var searchHintEl = document.getElementById("accSearchHint");
    var hotEl = document.getElementById("accHot");
    var clearBtn = document.getElementById("accClearAll");
    var activeEl = document.getElementById("accActive");
    if (!wrap || !catRow || !sceneRow || !budgetRow) return;

    /* 分组渐进加载：每组先出 GROUP_PAGE 款，之后按「加载更多」每次追加 LOAD_STEP 款。
       分组不做折叠——内容一律直接可见，不要求用户点开任何东西。 */
    var lastSig = "";
    var GROUP_PAGE = 24;   // 每组首屏渲染条数
    var LOAD_STEP = 24;    // 「加载更多」每次追加条数
    var groupShown = {};   // 品类 id -> 已加载条数

    var state = { device: "all", cat: "all", scene: "all", look: "all", budget: "all", brand: "all", sort: "default", q: "" };

    /* 口语词与英文缩写映射到品类 id：搜「主板」「显卡」这类需求词时直接按品类命中，
       不需要型号名里真的出现这两个字 */
    /* schema 必须先于 recommend.js 加载：枚举别名与硬字段解释都读它。
       8 个页面都已按 scripts 顺序插入 js/specs-schema.js。 */
    var SPEC_SCHEMA = (typeof window !== "undefined" && window.PC_SCHEMA) || null;

    var ALIAS = {
      "cpu": "cpu", "处理器": "cpu",
      "主板": "mobo", "motherboard": "mobo", "板子": "mobo",
      "内存": "ram", "内存条": "ram", "ram": "ram",
      "硬盘": "ssd", "固态": "ssd", "固态硬盘": "ssd", "ssd": "ssd",
      "显卡": "gpu", "独显": "gpu", "gpu": "gpu", "图形卡": "gpu",
      "电源": "psu", "psu": "psu",
      "机箱": "case", "箱子": "case",
      "散热": "cooler", "散热器": "cooler", "风冷": "cooler", "水冷": "cooler", "冷排": "cooler",
      "显示器": "monitor", "monitor": "monitor", "屏幕": "monitor", "显示屏": "monitor",
      "音频": "audio", "audio": "audio",
      "网络": "network", "network": "network", "网卡": "network",
      "支架": "stand", "stand": "stand",
      "拓展坞": "dock", "扩展坞": "dock", "dock": "dock",
      "笔记本": "laptop", "轻薄本": "laptop", "上网本": "laptop", "laptop": "laptop",
      "手机": "phone", "智能手机": "phone", "强光手机": "phone",
      "游戏手机": "phone", "iphone": "phone", "phone": "phone",
      "平板": "tablet", "学习平板": "tablet", "ipad": "tablet", "手写平板": "tablet",
      "影音平板": "tablet", "tablet": "tablet",
      "充电器": "charger", "充电头": "charger", "快充": "charger", "氮化锡": "charger",
      "数据线": "charger", "type-c": "charger", "线束": "charger", "移动电源": "charger",
      "充电宝": "charger", "车充": "charger", "无线充电": "charger", "投屏器": "charger",
      "转接器": "charger", "otg": "charger", "插线板": "charger",
      "手机壳": "mobileacc", "保护壳": "mobileacc", "手机模": "mobileacc", "保护膜": "mobileacc",
      "防窥": "mobileacc", "自拍杆": "mobileacc", "云台": "mobileacc", "手柄": "mobileacc",
      "手写笔": "mobileacc", "穿戴消毒": "mobileacc", "车载支架": "mobileacc",
      "平板键盘": "mobileacc", "手机支架": "mobileacc",
      /* 「键盘」有两个义项：电脑键盘（input 68 件）与平板键盘（mobileacc 5 件）。
         用户搜「键盘」要的是前者，但直接删掉 mobileacc 就等于平板键盘搜不到了。
         所以值写成数组：第 0 位是主流义项（一级命中），其余是次要义项（降一层、排在后面）。 */
      "键盘": ["input", "mobileacc"], "键鼠": "input", "键鼠外设": "input",
      /* 复合词整串入表（ORD-27 任务 1）。
         这些词的共同点是「拆成两个 token 后每个都必须成立」，而 ALIAS 的品类词要求
         条目属于该品类 —— 「笔记本支架」= laptop ∧ stand 于是必然 0 结果。
         整串作为一个键时，segmentQuery 按长度优先把它切成一个 token，不再拆成 AND。 */
      "笔记本支架": "stand", "显卡支架": "stand", "cpu散热器": "cooler",
      "电源适配器": "charger", "充电线": "charger",
      "硬盘盒": "dock", "屏幕保护": "mobileacc",
      "超级本": "laptop", "超极本": "laptop", "智能穿戴": "wearable",
      "耳机": "earphone", "耳麦": "earphone", "蓝牙耳机": "earphone", "降噪耳机": "earphone",
      "头戴": "earphone", "入耳": "earphone", "真无线": "earphone", "开放式耳机": "earphone",
      "骨传导": "earphone", "游戏耳机": "earphone", "监听耳机": "earphone", "有线耳机": "earphone",
      "音箱": "audio", "麦克风": "audio", "声卡": "audio", "桌面音箱": "audio",
      "手表": "wearable", "手环": "wearable", "智能手表": "wearable", "运动手表": "wearable",
      "智能戒指": "wearable", "体脂秤": "wearable", "无人机": "wearable", "运动相机": "wearable",
      "摄像头": "wearable", "路由器": "wearable", "智能音箱": "wearable", "台灯": "wearable",
      "相机": "wearable", "微单": "wearable"
    };

    /* ── 规格词 → 主体品类（ORD-25）────────────────────────────────────────
       这张表只回答一件事：用户打的这个词，指的是「哪一类东西本身」。
       为什么需要它：结构化字段（specsObj）只迁了 ssd 一个品类（53/1209 = 4.4%），
       其余 20 个品类的规格全在 specs 自由文本里，主排序键对它们完全失效 ——
       搜「DDR5」时 35 块主板的「DDR5 双通道」与 47 条内存的「DDR5」同层同权，
       主板在品类顺序里靠前，于是内存一条都进不了首屏。

       用法（判分，不改命中）：条目命中某个词、且该词把这个条目的品类列为主体时，
       记「主体命中」，权重 = 数组第 1 位 2 分 / 其余 1 分；排序按分数降序。
       条目必须真的命中该词才计分 —— 所以多列品类不会让空品类凭空拿到权重。

       收录纪律：
         ① 与 ALIAS 不重复。ALIAS 管「品类同义词」（内存/内存条→ram、ipad→tablet），
            本表管「规格词归属」（DDR5→ram）。同一个词只该出现在一张表里。
         ② 多品类映射必须说得出「为什么这个品类也是主体」，说不出就只留一个。
            反例：M.2 只归 ssd，不归 mobo —— 57 块主板的「1×M.2」说的是插槽，
            把 mobo 列进来就等于把 ORD-17 修掉的「搜 M.2 看到主板」重新做一遍。
         ③ 数据里 0 命中的词不收录（内存颗粒 / 16g显存 / 24g显存 / atx机箱 / 120水冷 /
            atx板）：写了也不会生效，留着只是让表看起来比实际宽。 */
    var SPEC_CAT = {
      /* 内存代际：内存条是主体；主板的「DDR5 双通道」是板载规格，
         但 DDR4 板与 DDR5 板本身就是两个选购分类，故列次要主体 */
      "ddr5": ["ram", "mobo"],
      "ddr4": ["ram", "mobo"],

      /* 固态：m.2 只归 ssd（见纪律②）；nvme 硬盘盒（dock）以 NVMe 为主语
         （ORD-27 任务 9）pcie4.0/5.0 从 ssd+mobo 收窄成 ssd（5.0 另加 gpu）：
         「PCIe 4.0 ×4」出现在主板上说的是插槽版本，说不通「主板也该排前面」——
         这正是 M.2 那条教训（搜 M.2 看到主板）的同型错误，不能在下一条重犯。 */
      "m.2": ["ssd"],
      "nvme": ["ssd", "dock"],
      "pcie4.0": ["ssd"],
      "pcie5.0": ["ssd", "gpu"],

      /* 电源：认证等级、模组化、功率档都是电源的主语。
         「atx」收窄成 case+mobo（ORD-27 任务 9）：ATX 是版型/箱型标准，
         电源的 ATX 命中全部来自「ATX3.1」子串，而 ATX3.1 另有专键 ——
         裸词 ATX 归电源等于让 24 件电源顶满首屏（实测首屏 8 张全电源）。 */
      "atx3.1": ["psu"],
      "atx": ["case", "mobo"],
      "金牌": ["psu"],
      "铜牌": ["psu"],
      "模组": ["psu"],
      "750w": ["psu"],
      "850w": ["psu"],

      /* 网络：速率词的主语是网络设备；带 2.5G 网口的拓展坞同属主体。
         wifi7/wifi6e 收窄成 network（ORD-27 任务 9）：主板上的「WiFi7」是板载网卡规格，
         说不通「主板也该排前面」—— 实测首屏 8 张全是主板，41 件网络设备一件没有。 */
      "2.5g": ["network", "dock"],
      "千兆": ["network", "dock"],
      "万兆": ["network"],
      "网口": ["network", "dock"],
      "wifi7": ["network"],
      "wifi6e": ["network"],

      /* 平台/插槽/芯片组：插槽是主板的物理属性，CPU 是「适配该插槽」，故主板在前 */
      "am5": ["mobo", "cpu"],
      "am4": ["mobo", "cpu"],
      "lga1700": ["mobo", "cpu"],
      "lga1851": ["mobo", "cpu"],
      "b650": ["mobo"],
      "b760": ["mobo"],
      "x670": ["mobo"],
      "z790": ["mobo"],
      "matx": ["mobo", "case"],
      "itx": ["case", "mobo"],

      /* 机箱形态词 */
      "玻璃侧透": ["case"],
      "海景房": ["case"],

      /* 散热：风冷/水冷/冷排已在 ALIAS，这里只补带规格的说法 */
      "360水冷": ["cooler"],
      "240水冷": ["cooler"],
      "热管": ["cooler"],

      /* 显示：分辨率/刷新率/面板都是显示器的选购主轴。
         （ORD-27 任务 9）144hz/240hz 收窄成 monitor：把「144Hz 显示器」的需求
         用映射引到平板上，是拿规则掩盖数据缺 —— 显示器库 76 款里只有 3 款写 144Hz，
         这是数据债（已记账），不是靠「平板也算主体」就能变成对的。
         ips 补 tablet：平板面板确实以 IPS 为主语，这一条说得通。 */
      "2k": ["monitor"],
      "4k": ["monitor"],
      "1080p": ["monitor"],
      "144hz": ["monitor"],
      "240hz": ["monitor"],
      "高刷": ["monitor", "tablet", "phone"],
      "ips": ["monitor", "tablet", "laptop"],
      "oled": ["monitor", "phone", "tablet", "laptop"],
      "护眼": ["monitor", "phone", "laptop"],

      /* 显卡：RTX 既是显卡型号线，也是游戏本的卖点线 */
      "rtx": ["gpu", "laptop"],
      "显存": ["gpu"],

      /* 键鼠：三模（蓝牙/2.4G/有线）是键鼠与耳机的共同卖点 */
      "机械键盘": ["input"],
      "无线鼠标": ["input"],
      "三模": ["input", "earphone"],
      "客制化": ["input"],

      /* 接口：雷电是笔记本接口，拓展坞以它为主语 */
      "雷电4": ["laptop", "dock"],
      "雷电5": ["laptop", "dock"],

      /* 移动 SoC：手机与平板共用同一颗芯片 */
      "骁龙": ["phone", "tablet"],
      "麒麟": ["phone", "tablet"],
      "天玑": ["phone", "tablet"]
    };

    /* 该词把该品类列为主体时返回权重（2 主体 / 1 次要主体 / 0 无关） */
    function specCatWeight(t, catId) {
      var arr = SPEC_CAT[t];
      if (!arr) return 0;
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] === catId) return i === 0 ? 2 : 1;
      }
      return 0;
    }

    /* 主观需求词映射到规格关键词，让「白色」「静音」「大显存」这类说法也能搜到结果 */
    var NEED = {
      "白色": ["白", "ice", "冰"],
      "静音": ["静音", "噪音", "安静"],
      "灯效": ["rgb", "argb", "灯"],
      "无线": ["无线", "蓝牙", "三模", "2.4g"],
      "蓝牙": ["蓝牙", "无线"],
      "小机箱": ["itx", "matx", "sfx", "紧凑"],
      "高刷": ["高刷", "hz"],
      "游戏": ["游戏", "电竞", "高刷"],
      "剪辑": ["创作", "剪辑", "生产力", "渲染"],
      "大显存": ["16g", "24g", "大显存"],
      "长质保": ["质保"],
      "性价比": ["高性价比"],
      "ddr5": ["ddr5"], "ddr4": ["ddr4"],
      "nvme": ["nvme", "pcie"],
      "白色": ["白", "ice", "冰"],
      "itx": ["itx"], "matx": ["matx", "matx"], "atx": ["atx", "eatx"],
      "长续航": ["续航", "容量", "大电池", "mah", "大容量"],
      "快充": ["快充", "w 快充", "充电速度"],
      "薄薄": ["薄", "轻", "权重"],
      "折叠屏": ["折叠"], "大折叠": ["折叠"],
      "护眼": ["护眼", "类纸", "防闪光"],
      "手写": ["手写", "笔", "压感", "类纸"],
      "影像": ["影像", "主摄", "长焦", "影像旗舰"],
      "单手": ["单手", "轻薄", "小屏"],
      "端耐": ["端耐", "防护", "抗摔", "坚固"],
      "安全": ["安全", "认证", "质量"],
      "笔记本敢": ["容量", "纯碰盘", "面积", "录像"],
      "容量大": ["大容量", "20000mah", "256g", "512g", "1tb"],
      "定位": ["定位", "额外追踪", "卡"],
      "音质": ["音质", "解析", "声场", "单元", "低频", "人声"],
      "降噪强": ["降噪", "隔音", "主动降噪", "通透"],
      "佩戴舒服": ["佩戴", "舒适", "轻", "不夹", "耳压"],
      "长续航耳机": ["续航", "小时", "充电盒"],
      "运动耳机": ["运动", "跑步", "骑行", "耳挂", "不入耳", "防水"],
      "低延迟耳机": ["延迟", "游戏模式", "电竞"],
      "健康": ["健康", "心率", "血氧", "睡眠", "血压", "压力"],
      "独立通话": ["通话", "esim", "蓝牙通话", "麦克风"],
      "双设备": ["双设备", "多点", "两台", "切换"],
      "直播麦": ["直播", "配音", "话筒", "拾音", "心形"],
      "智能家居": ["智能", "米家", "物联", "摄像", "看家"]
    };

    /* 拉丁串空白/连字符归一（ORD-27 任务 3）。
       用户打「RTX5080」而库里写「NVIDIA RTX 5080 16G」，打「WiFi 7」而库里写「WiFi7」，
       字面包含两边都不成立：实测搜 RTX5080 命中 1 件（还是笔记本），搜 RTX 5080 命中 11 件；
       搜 WiFi 7 首屏 8 张全是主板，搜 wifi7 命中 41 件全是网络设备。
       只处理「拉丁字母/数字之间」的空格与连字符 —— 中文之间的空格另有语义
       （「机械 键盘」是两个词），一个字节都不动。 */
    function normLatin(s) {
      return String(s).toLowerCase()
        .replace(/([a-z0-9])[ \t]*[-\u2013\u2014][ \t]*(?=[a-z0-9])/g, "$1")
        .replace(/([a-z])[ \t]+(?=[0-9])/g, "$1")
        .replace(/([0-9])[ \t]+(?=[a-z])/g, "$1");
    }
    /* 拉丁串与汉字的边界切分（ORD-31 任务 1.5）。
       中国用户的真实写法是连写：「DDR5内存」「2K显示器」，中间不空格。
       而 tokens() 只按空格切词，整串进 haystack 一个也找不到 ——
       实测搜「DDR5内存」0 命中、「DDR5 内存」49 命中；「2K显示器」0、「2K 显示器」41。
       这不是词表缺条目：给「DDR5内存」补一条映射，用户下次打「DDR5内存条」「ddr5内存」
       还得再补，写法有无穷多种。要修的是切词规则本身。
       只切「拉丁字母/数字」与「汉字」的交界；汉字之间的空格一个字节不动
       （「机械 键盘」是两个词，另有语义）。 */
    function splitCJK(s) {
      return String(s)
        .replace(/([a-z0-9])([\u4e00-\u9fa5])/g, "$1 $2")
        .replace(/([\u4e00-\u9fa5])([a-z0-9])/g, "$1 $2");
    }
    /* 这里只按空格切，不做拉丁/汉字边界切分 —— 边界切分放在 segmentQuery 里做，
       因为「整串本身就是一个已知词」的必须先判（例如「CPU散热器」「笔记本支架」
       整串在 ALIAS 里；先切就会变成 cpu ∧ 散热器 两个条件同时成立 → 必然 0 结果）。 */
    function tokens(q) { return normLatin(q).split(/\s+/).filter(Boolean); }
    /* 高亮要用用户原文，不能用归一后的串（归一后「wifi7」在「WiFi 7」里找不到，整页不高亮） */
    function rawTokens(q) { return splitCJK(String(q).toLowerCase()).split(/\s+/).filter(Boolean); }

    /* 中文没有空格分词，「长续航手机」「折叠屏手机」会被当成整串去匹配而落空。
       先用 ALIAS / NEED 的词表做贪心切分，把整串拆成可判定的语义单元。 */
    function segmentQuery(q) {
      var raw = tokens(q);
      /* schema 里配的枚举人话别名也参与切分。
         不加这一步，「机械硬盘」会被切成「机械」+「硬盘」：后半段命中品类 ssd，
         前半段只在「建议搭配机械盘做冷备」这类备注里出现，于是搜机械硬盘会捞出一堆固态。
         整体成一个 token 之后，它就只按 kind 的别名表判定。 */
      var extra = [];
      if (SPEC_SCHEMA && SPEC_SCHEMA.cats) {
        Object.keys(SPEC_SCHEMA.cats).forEach(function (cid) {
          (SPEC_SCHEMA.cats[cid].fields || []).forEach(function (f) {
            if (!f.lbl) return;
            Object.keys(f.lbl).forEach(function (v) {
              f.lbl[v].forEach(function (a) { if (extra.indexOf(a) < 0) extra.push(a); });
            });
          });
        });
      }
      /* SPEC_CAT 的键也要参与切分，否则「机械键盘」会被「键盘」切成
         「机械」+「键盘」，而 ALIAS 里「键盘」指向 mobileacc（平板键盘）——
         搜机械键盘会整屏手机平板键盘，一个真正的键盘都没有。 */
      var keys = Object.keys(ALIAS).concat(Object.keys(NEED)).concat(Object.keys(SPEC_CAT)).concat(extra)
        .filter(function (k) { return k.length > 1; })
        .sort(function (a, b) { return b.length - a.length; });
      var keyset = {};
      keys.forEach(function (k) { keyset[k] = 1; });

      var out = [];
      raw.forEach(function (t) {
        /* 一、整串本身就是一个已知词 → 不再拆。
           「CPU散热器」「笔记本支架」「机械键盘」整串都在 ALIAS 里；
           先切就会变成 cpu ∧ 散热器 两个条件同时成立，结果必然是 0 ——
           这正是 ORD-27 修过的那批复合词，不许在这里退回去。 */
        if (keyset[t]) { out.push(t); return; }
        /* 二、拉丁/汉字连写要在交界处切开（「DDR5内存」→ ddr5 + 内存）。
           只切交界：汉字之间的空格与连写一个字节不动。 */
        splitCJK(t).split(/\s+/).filter(Boolean).forEach(function (seg) {
          if (!/^[\u4e00-\u9fa5]+$/.test(seg) || keyset[seg]) { out.push(seg); return; }
          /* 三、纯汉字段再做贪心切分（长度优先、命中才切）。
             每个汉字段都切（原来只切第一个）：连写切出来的汉字段可能落在第二位，
             「DDR5内存条」这类组合否则就再也切不动。 */
          var rest = seg, buf = "", i = 0;
          while (i < rest.length) {
            var hit = null;
            for (var j = 0; j < keys.length; j++) {
              if (rest.slice(i, i + keys[j].length) === keys[j]) { hit = keys[j]; break; }
            }
            if (hit) { if (buf) { out.push(buf); buf = ""; } out.push(hit); i += hit.length; }
            else { buf += rest[i]; i += 1; }
          }
          if (buf) out.push(buf);
        });
      });
      return out.length ? out : raw;
    }

    /* ── 命中分层 ──────────────────────────────────────────────────────────
       原来是一个 haystack 字符串包含，谁能命中全凭字段拼在一起的先后，分不出层级：
       搜「M.2」时主体命中 58 条全是主板（specs 里写着 M.2 插槽），44 块 M.2 固态一条进不来。
       现在拆成三层，返回值即排序权重：
         1 = 字段命中（specs 原文 / specsObj 结构化取值）
         2 = 型号 / 品牌命中（name brand model searchName style），品类别名也归这层
         3 = 只命中软文本（valueNote / compat / tags）
         0 = 不命中
       多词查询取「最弱」的那层（max），这样「字段 + 软文本」混命中不会冒充纯字段命中。

       为什么 specsObj 必须单独取值而不是拼进 specs 字符串：
       specs 是人类可读的自由文本（「PCIe 4.0×4;1TB;TLC…」），结构化值（kind=HDD）
       本来就不在字符串里。不读 specsObj，第 0 批的 schema 就是零收益。 */
    function specsObjText(item) {
      var o = item && item.specsObj;
      if (!o) return "";
      var out = [];
      for (var k in o) {
        if (Object.prototype.hasOwnProperty.call(o, k)) out.push(String(o[k]));
      }
      return out.join(" ").toLowerCase();
    }

    /* 枚举值的人话别名（schema 里配的 lbl）：库里存 HDD，用户搜「机械硬盘」。
       只在 schema 里配了别名时才生效，没配就老实按取值原文匹配，不做模糊猜测。 */
    function enumLabels(catId, key, val) {
      if (!SPEC_SCHEMA) return null;
      var cat = SPEC_SCHEMA.cats && SPEC_SCHEMA.cats[catId];
      if (!cat) return null;
      var fs2 = cat.fields || [], f = null;
      for (var i = 0; i < fs2.length; i++) { if (fs2[i].k === key) { f = fs2[i]; break; } }
      if (!f || !f.lbl) return null;
      return f.lbl[val] || null;
    }

    function specObjHit(item, catId, t) {
      var o = item && item.specsObj;
      if (!o) return false;
      for (var k in o) {
        if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
        if (String(o[k]).toLowerCase().indexOf(t) > -1) return true;
        var labs = enumLabels(catId, k, o[k]);
        if (!labs) continue;
        for (var i = 0; i < labs.length; i++) {
          var lab = String(labs[i]).toLowerCase();
          if (lab === t) return true;
          /* 只允许「用户词是别名的一部分」（机械 ⊂ 机械硬盘），不允许反过来。
             反向包含会出事：搜「移动固态」时 t 里含别名「固态」，
             于是 46 块普通固态全部命中 —— 实测踩过一次。 */
          if (t.length > 1 && lab.indexOf(t) > -1) return true;
        }
      }
      return false;
    }

    /* 「这个词在库里有结构化字段能精确表达」的判定集合。
       有了它才能把「主体规格」和「顺带提及」分开：
       搜「M.2」时 57 块主板的 specs 里都写着「1×M.2」（说的是插槽），
       44 块 M.2 固态的 specsObj.form 才是「这件东西本身就是 M.2」。
       两者原来都算字段命中，于是主板全部排在固态前面。
       只对「库里真有结构化表述」的词生效：GDDR7 这类既没有 specsObj 也不在 SPEC_CAT 里，
       行为与原来完全一致，不会被误伤。 */
    var structTokCache = {};
    function structTokens(toks) {
      var key = toks.join("\u0000");
      if (structTokCache[key]) return structTokCache[key];
      var set = {};
      toks.forEach(function (t) {
        /* 规格词表里有的词，库里必然有品类以它为主体 —— 直接算「可结构化表达」，
           不必等 specsObj 迁到那个品类（现在只迁了 ssd 一个）。 */
        if (SPEC_CAT[t]) { set[t] = 1; return; }
        for (var c = 0; c < D.categories.length && !set[t]; c++) {
          var items = D.categories[c].items;
          for (var i = 0; i < items.length; i++) {
            if (specObjHit(items[i], D.categories[c].id, t)) { set[t] = 1; break; }
          }
        }
      });
      structTokCache[key] = set;
      return set;
    }

    /* 返回 { rank, struct }：
       rank   = 命中层级（1 字段 / 2 型号品牌 / 3 软文本 / 0 不命中）
       struct = 有几个词是靠结构化字段命中的（不是靠自由文本顺带提到）
       分层排序时 struct 是第二关键字：用户搜规格词，主体本身就是该规格的型号
       必须排在「规格里提到它」的型号前面。 */
    function matchInfo(item, catId, toks, structSet) {
      /* 三段 haystack 都做拉丁串归一：库里写「RTX 5080」，用户打「RTX5080」，
         不归一就是两个不同的串。中文之间的空格原样保留。 */
      var spec = normLatin(String(item.specs || "") + " " + specsObjText(item));
      var idHay = normLatin([item.name, item.brand, item.model, item.searchName, item.style]
        .filter(Boolean).join(" "));
      var soft = normLatin([item.valueNote, item.compat].concat(item.tags || [])
        .filter(Boolean).join(" "));
      function anyAlt(hay, t) {
        var alts = NEED[t];
        return !!(alts && alts.some(function (a) { return hay.indexOf(a) > -1; }));
      }
      var so = structSet || {};
      var rank = 0, struct = 0;
      for (var i = 0; i < toks.length; i++) {
        var t = toks[i], lv = 0, byObj = false, mainCat = false, multi = false;
        var asCat = ALIAS[t];
        if (asCat) {
          /* 品类词只按所属品类判定，避免命中别的品类里「提及」它的型号。
             值可以是数组（一个词有多个义项）：
               第 0 位 = 主流义项 → 一级命中 + 主体分 2（压过品类顺序）
               其余   = 次要义项 → 软层（仍能搜到，但排在主流之后）
             这样「键盘」既能给出机械键盘（input），又不会把平板键盘弄丢。 */
          var arr = Object.prototype.toString.call(asCat) === "[object Array]" ? asCat : [asCat];
          var at = arr.indexOf(catId);
          if (at < 0) return { rank: 0, struct: 0 };
          mainCat = at === 0;
          multi = arr.length > 1;
          lv = mainCat ? 2 : 3;
        } else if ((byObj = specObjHit(item, catId, t))) {
          lv = 1;
        } else if (spec.indexOf(t) > -1 || anyAlt(spec, t)) {
          /* 这个词在别处有结构化表述、这里只是自由文本顺带提到 → 降一层。
             主板「1×M.2 插槽」不等于 M.2 固态，不该占据主体层。
             例外：身份字段（名称/型号）里就带着这个词 —— 那等于「它本身就是这个」，
             「海备思 M.2 硬盘盒拓展坞」不该被当成顺带提及。 */
          var byName = idHay.indexOf(t) > -1 || anyAlt(idHay, t);
          /* 主体品类里提到它 = 这件东西本身就是这个规格，不降层。
             降的只是「别的品类顺带提到」：主板写「DDR5 双通道」不算内存，
             但主板自己支持 DDR5 是事实，所以 ddr5→mobo 有权重时不降。 */
          lv = (so[t] && !byName && !specCatWeight(t, catId)) ? 2 : 1;
        } else if (idHay.indexOf(t) > -1 || anyAlt(idHay, t)) {
          lv = 2;
        } else if (soft.indexOf(t) > -1 || anyAlt(soft, t)) {
          lv = 3;
        } else {
          return { rank: 0, struct: 0 };
        }
        /* 主体命中才计分：这个词指的是「哪一类东西本身」。
           权重 2/1 让多品类映射里排第一的品类天然靠前，
           否则 ddr5→[ram,mobo] 这种并列主体会退回品类顺序（mobo 在 ram 前面），
           等于把「搜 DDR5 看到主板」重新做一遍。 */
        var w = specCatWeight(t, catId);
        if (w) struct += w;
        else if (byObj) struct++;
        /* 多义项词的主流义项也要有主体分，否则「键盘」的 input 组与 mobileacc 组
           同为 struct 0，分组顺序由品类表决定（mobileacc 在 input 前面）——
           主流义项就白标了。 */
        else if (mainCat && multi) struct += 2;
        if (lv > rank) rank = lv;
      }
      return { rank: rank, struct: struct };
    }

    function matchRank(item, catId, toks, structSet) {
      return matchInfo(item, catId, toks, structSet).rank;
    }

    /* 命中关键词高亮，单字不高亮以免整页都是标记 */
    function hl(text, toks) {
      var out = esc(text);
      if (!toks || !toks.length) return out;
      var seen = {};
      toks.forEach(function (t) {
        if (t.length < 2 || seen[t]) return;
        seen[t] = 1;
        var re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        out = out.replace(re, function (m) { return '<mark class="acc-hl">' + m + "</mark>"; });
      });
      return out;
    }

    /* 跨品类通用价位档：配件从几十元到几万元都有，档位要能覆盖全区间 */
    var BANDS = [
      { id: "all",  label: "全部价位" },
      { id: "b50",  label: "50 元内",      lo: 0,    hi: 50 },
      { id: "b300", label: "50-300 元",     lo: 50,   hi: 300 },
      { id: "b800", label: "300-800 元",   lo: 300,  hi: 800 },
      { id: "b2k",  label: "800-2000 元",  lo: 800,  hi: 2000 },
      { id: "b5k",  label: "2000-5000 元", lo: 2000, hi: 5000 },
      { id: "b8k",  label: "5000-8000 元", lo: 5000, hi: 8000 },
      { id: "bhih", label: "8000-12000 元", lo: 8000, hi: 12000 },
      { id: "bhi",  label: "12000 元以上", lo: 12000, hi: Infinity }
    ];

    function matchesBudget(item, budget) {
      if (budget === "all") return true;
      var band = null;
      BANDS.forEach(function (b) { if (b.id === budget) band = b; });
      if (!band) return true;
      var m = (item.price[0] + item.price[1]) / 2;
      return m >= band.lo && m < band.hi;
    }

    // 从其他页面带参数跳进来：颜值页带 look，榜单带 cat，搜索建议带 q
    try {
      var sp = new URLSearchParams(window.location.search);
      var lp = sp.get("look");
      if (lp && styleById[lp]) state.look = lp;
      var dp = sp.get("dev");
      if (dp && (D.devices || []).some(function (d) { return d.id === dp; })) state.device = dp;
      var cp = sp.get("cat");
      if (cp) state.cat = cp;
      var qp = sp.get("q");
      if (qp) state.q = qp;
    } catch (e) {}
    if (state.q && searchEl) searchEl.value = state.q;

    function catName(id) {
      var n = "";
      D.categories.forEach(function (c) { if (c.id === id) n = c.name; });
      return n;
    }

    /* ---------- 同型号去重（ORD-08） ----------
       同一型号在库里可能存了两条记录：不同 id、不同价格区间。
       页面只出一条合并卡：价格取并集，标注「价格存疑」，不替用户选其中一条。
       口径来自 js/dup-core.js —— 与入库闸、审计断言共用同一份实现，不许在这儿另写一套。 */
    var DupCore = window.PCDup || null;

    function mergeEntries(list) {
      /* rank / struct 必须跟着合并卡一起传下去：分组顺序要用它们判断
         「这一组有没有结构化字段命中」。丢掉的话 groupStruct 永远是 0，
         搜「M.2」的分组顺序又会退回品类顺序（主板在前）。
         分组取组内第一条（合并保留 order，第一条就是该组最靠前的条目）。 */
      if (!DupCore) {
        return list.map(function (o) {
          return { cat: o.cat, item: o.item, merge: null, rank: o.rank, struct: o.struct, label: o.label };
        });
      }
      var order = [], bucket = {};
      list.forEach(function (o) {
        var k = DupCore.keyOf(o.cat.id, o.item);
        if (!bucket[k]) { bucket[k] = { cat: o.cat, items: [], rank: o.rank, struct: o.struct, label: o.label }; order.push(k); }
        bucket[k].items.push(o.item);
      });
      return order.map(function (k) {
        var b = bucket[k];
        if (b.items.length === 1) return { cat: b.cat, item: b.items[0], merge: null, rank: b.rank, struct: b.struct, label: b.label };
        var m = DupCore.mergeGroup(b.cat.id, b.items);
        return { cat: b.cat, item: m.item, merge: m, rank: b.rank, struct: b.struct, label: b.label };
      });
    }

    /* 全量合并后的卡片数：用来判断"是否处于未筛选状态"，不能再用原始 1209 条 */
    var mergedTotalCache = null;
    function mergedTotal() {
      if (mergedTotalCache != null) return mergedTotalCache;
      var all = [];
      D.categories.forEach(function (c) {
        c.items.forEach(function (it) { all.push({ cat: c, item: it }); });
      });
      mergedTotalCache = mergeEntries(all).length;
      return mergedTotalCache;
    }


    /* 搜索自检出口：给 tests/ 与验收脚本读「条目口径」。
       卡片数 ≠ 条目数（49 组重复合并成 1160 张卡），只看 DOM 数不出「44 块 M.2 是否全覆盖」。
       返回的是与渲染走同一份 matchInfo 的原始结果，只读，不写状态。
       合并式赋值：targets/rows/compat 由 IIFE 顶层挂载，这里不能整体覆盖。 */
    if (typeof window !== "undefined") {
      var DGS = window.PCRecoDiag = window.PCRecoDiag || {};
      DGS.segment = function (q) { return segmentQuery(q); };
      /* 规格词表只读出口：闸门要验「表外词行为没变」，就得能判断一个词在不在表内 */
      DGS.specCat = function () { return Object.keys(SPEC_CAT); };
      DGS.alias = function () { return Object.keys(ALIAS); };
      DGS.rank = function (q) {
        var toks = q ? segmentQuery(q) : null;
        var so = toks ? structTokens(toks) : null;
        var out = [];
        D.categories.forEach(function (cat) {
          cat.items.forEach(function (item) {
            var mi = toks ? matchInfo(item, cat.id, toks, so) : { rank: 0, struct: 0 };
            if (mi.rank) out.push({ cat: cat.id, id: item.id, name: item.name, rank: mi.rank, struct: mi.struct });
          });
        });
        return out;
      };
    }

    /* 词组收窄（ORD-27 任务 1）。
       整串已在 ALIAS 里（所以不会被拆成 AND 后必然 0 结果），但「笔记本支架」落到
       stand 全品类 40 件还不够 —— 用户要的是那 4 件笔记本用的，不是显示器支架臂。
       表里每条 = 在目标品类内再按子类筛一次；筛完数量够就用筛完的，
       不够就保留全品类命中（宁可给多了，也不凭空给「暂无」）。 */
    var PHRASE = {
      "笔记本支架": { cat: "stand", min: 3, label: "笔记本支架", test: function (it) {
        /* 口径按 style 判（ORD-27 任务 7）：style 以「笔记本」开头且不含「散热」。
           不按 name 判的理由：s20 的 name 含「笔记本」、价格最低，
           会稳定抢到主选，而它是散热件（该走 laptop-cool 桶），
           推给轻办公本是噪音错配（它的 compat 自己写着「需接受风扇噪音」）。 */
        var s = String(it.style || "");
        return /^笔记本/.test(s) && !/散热/.test(s);
      } },
      "显卡支架": { cat: "stand", min: 1, test: function (it) {
        return /显卡|gpu|支撑/i.test(String(it.style || "") + " " + String(it.name || ""));
      } },
      "平板键盘": { cat: "mobileacc", min: 3, test: function (it) { return /键盘/.test(String(it.name || "")); } },
      "手机支架": { cat: "mobileacc", min: 3, test: function (it) {
        return /支架/.test(String(it.style || "") + String(it.name || ""));
      } },
      "充电线": { cat: "charger", min: 4, test: function (it) { return /线/.test(String(it.name || "")); } },
      "屏幕保护": { cat: "mobileacc", min: 1, test: function (it) { return /膜|保护/.test(String(it.name || "")); } }
    };

    function collect() {
      var list = [];
      var toks = state.q ? segmentQuery(state.q) : null;
      var so = toks ? structTokens(toks) : null;
      D.categories.forEach(function (cat) {
        if (state.device !== "all" && cat.device !== state.device) return;
        if (state.cat !== "all" && cat.id !== state.cat) return;
        cat.items.forEach(function (item) {
          if (state.scene !== "all" && !sceneMatch(item, state.scene)) return;
          if (state.look !== "all" && lookOf(item) !== state.look) return;
          if (state.brand !== "all" && item.brand !== state.brand) return;
          if (!matchesBudget(item, state.budget)) return;
          var mi = { rank: 0, struct: 0 };
          if (toks) {
            mi = matchInfo(item, cat.id, toks, so);
            if (!mi.rank) return;
          }
          list.push({ cat: cat, item: item, rank: mi.rank, struct: mi.struct });
        });
      });
      /* 有查询时按命中层级升序（字段 → 型号 → 软文本）。同层保持原顺序，
         否则每次输入一个字符卡片就会互相跳位。无查询时全是 0，跳过排序。 */
      if (toks && list.length) {
        /* 先按命中层级，再按「结构化字段命中数」降序：
           ORD-17 的验收要求是「结构化命中的品类排在仅靠原串文本命中的品类之前」，
           只排 rank 做不到 —— 主板和固态同属字段层，主板在品类顺序里靠前。 */
        list.sort(function (a, b) { return (a.rank - b.rank) || (b.struct - a.struct); });
      }
      /* 词组收窄：整串命中一个词组时，在目标品类内再筛一层子类 */
      if (toks && toks.length === 1 && PHRASE[toks[0]] && list.length) {
        var ph = PHRASE[toks[0]];
        var sub = list.filter(function (o) { return o.cat.id === ph.cat && ph.test(o.item); });
        if (sub.length >= (ph.min || 1)) {
          if (ph.label) sub.forEach(function (o) { o.label = ph.label; });
          list = sub;
        }
      }
      return mergeEntries(list);
    }

    function renderChips(row, items, key) {
      row.innerHTML = items.map(function (it) {
        var active = state[key] === it.id ? " active" : "";
        return '<button class="chip' + active + '" data-id="' + esc(it.id) + '">' + esc(it.label) + "</button>";
      }).join("");
      row.querySelectorAll(".chip").forEach(function (b) {
        b.addEventListener("click", function () {
          state[key] = b.getAttribute("data-id");
          renderChips(row, items, key);
          if (key === "cat") renderBrands();
          renderCards();
        });
      });
    }

    /* 品牌行按当前品类实际存在的品牌生成，避免选了品牌再切品类出现空结果。
       全量设备下有近 200 个品牌，平铺无法使用：
       默认只显示型号数最多的 TOP_BRAND_LIMIT 个常用品牌，其余收进「更多品牌」折叠区，
       另配品牌搜索框直达。已选品牌始终显示在常用区。 */
    var brandRow = document.getElementById("accBrands");
    var brandPool = [];
    var TOP_BRAND_LIMIT = 12;
    var brandAllOpen = false;
    var brandQuery = "";

    function collectBrands() {
      brandPool = [];
      D.categories.forEach(function (cat) {
        if (state.device !== "all" && cat.device !== state.device) return;
        if (state.cat !== "all" && cat.id !== state.cat) return;
        cat.items.forEach(function (it) { if (it.brand) brandPool.push(it.brand); });
      });
      var n = {}, order = [];
      brandPool.forEach(function (b) { if (!n[b]) { n[b] = 0; order.push(b); } n[b]++; });
      order.sort(function (a, b) { return n[b] - n[a] || (a < b ? -1 : 1); });
      return { order: order, count: n };
    }

    function renderBrands() {
      if (!brandRow) return;
      var b = collectBrands();
      var order = b.order, n = b.count;
      if (state.brand !== "all" && order.indexOf(state.brand) === -1) state.brand = "all";

      // 搜索过滤
      var shown = order;
      if (brandQuery) {
        var q = brandQuery.toLowerCase();
        shown = order.filter(function (x) { return x.toLowerCase().indexOf(q) > -1; });
      }

      var top = shown.slice(0, TOP_BRAND_LIMIT);
      var rest = shown.slice(TOP_BRAND_LIMIT);
      // 已选品牌若在「更多」里，提到常用区首位
      if (state.brand !== "all" && rest.indexOf(state.brand) > -1) {
        rest = rest.filter(function (x) { return x !== state.brand; });
        top = [state.brand].concat(top.filter(function (x) { return x !== state.brand; }));
      }

      var mk = function (list) {
        return list.map(function (x) { return { id: x, label: x + " " + n[x] }; });
      };

      var html = '<div class="acc-brand-top">' +
        '<button class="chip' + (state.brand === "all" ? " active" : "") + '" data-id="all">全部品牌</button>' +
        mk(top).map(function (it) {
          return '<button class="chip' + (state.brand === it.id ? " active" : "") + '" data-id="' + esc(it.id) + '">' + esc(it.label) + "</button>";
        }).join("") +
        "</div>";

      if (rest.length) {
        html += '<div class="acc-brand-rest"' + (brandAllOpen ? "" : " hidden") + ">" +
          mk(rest).map(function (it) {
            return '<button class="chip' + (state.brand === it.id ? " active" : "") + '" data-id="' + esc(it.id) + '">' + esc(it.label) + "</button>";
          }).join("") + "</div>";
        html += '<button type="button" class="acc-brand-more" id="accBrandMore">' +
          (brandAllOpen ? "收起品牌" : "更多品牌 " + rest.length + " 个") + "</button>";
      }

      brandRow.innerHTML = html;
      brandRow.querySelectorAll(".chip").forEach(function (b2) {
        b2.addEventListener("click", function () {
          state.brand = b2.getAttribute("data-id");
          renderBrands();
          renderCards();
        });
      });
      var more = document.getElementById("accBrandMore");
      if (more) {
        more.addEventListener("click", function () {
          brandAllOpen = !brandAllOpen;
          renderBrands();
        });
      }
    }

    function cardHtml(o, toks) {
      var it = o.item;
      var look = lookOf(it);
      var style = look ? styleOf(look) : null;
      // 外观风格小圆点：不再单占筛选维度，点一下即按该外观筛选
      var lookDot = style
        ? '<button type="button" class="acc-look-dot' + (state.look === style.id ? " active" : "") +
          '" data-look="' + esc(style.id) + '" title="按「' + esc(style.name) + '」外观筛选" ' +
          'style="background:linear-gradient(120deg,' + style.palette[0] + ',' + style.palette[1] + ');">' +
          '<span aria-hidden="true">' + style.icon + '</span>' +
          '<span class="acc-look-dot-name">' + esc(style.name) + '</span></button>'
        : '';
      var tags = (it.tags || []).map(function (t) { return '<span class="tag-pill">' + hl(t, toks) + "</span>"; }).join("");
      var uses = (it.use || []).map(function (u) {
        return '<span class="use-dot" title="' + useLabels[u] + '">' + useIcons[u] + "</span>";
      }).join("");
      var stars = "\u2605\u2605\u2605\u2605\u2605".slice(0, it.rating) + "\u2606\u2606\u2606\u2606\u2606".slice(0, 5 - it.rating);
      var grade = it.valueGrade ? '<span class="grade grade-' + it.valueGrade + '">' + it.valueGrade + "</span>" : "";
      /* 合并卡：把"两条记录"这件事显式说出来，藏起来等于骗人 */
      var badge = "", caliber = "";
      if (o.merge) {
        if (o.merge.dispute) {
          badge = '<span class="acc-merge-badge warn" title="\u540c\u578b\u53f7\u4e24\u6761\u8bb0\u5f55\u62a5\u4ef7\u533a\u95f4\u4e0d\u91cd\u53e0">\u4ef7\u683c\u5b58\u7591</span>';
          caliber = '<div class="acc-caliber"><b>\u4ef7\u683c\u5b58\u7591</b>\uff1a\u5e93\u5185\u540c\u578b\u53f7\u6709 ' +
            o.merge.ids.length + ' \u6761\u8bb0\u5f55\uff0c\u62a5\u4ef7\u533a\u95f4\u4e0d\u91cd\u53e0\uff08' +
            o.merge.ranges.map(function (r) { return fmtPrice(r); }).join(" \u4e0e ") +
            '\uff09\u3002\u6b64\u5904\u53d6\u5e76\u96c6\u533a\u95f4\u663e\u793a\uff0c\u672a\u66ff\u4f60\u9009\u5176\u4e2d\u4e00\u6761\uff0c\u4e0b\u5355\u524d\u8bf7\u81ea\u884c\u6bd4\u4ef7\u3002</div>';
        } else {
          badge = '<span class="acc-merge-badge" title="\u540c\u578b\u53f7\u91cd\u590d\u5f55\u5165\uff0c\u5df2\u5408\u5e76\u4e3a\u4e00\u6761">\u5df2\u5408\u5e76 ' + o.merge.ids.length + " \u6761</span>";
          caliber = '<div class="acc-caliber">\u5e93\u5185\u540c\u578b\u53f7\u6709 ' + o.merge.ids.length +
            ' \u6761\u91cd\u590d\u8bb0\u5f55\uff0c\u62a5\u4ef7\u533a\u95f4\u4e00\u81f4\uff0c\u5df2\u5408\u5e76\u4e3a\u4e00\u6761\u663e\u793a\u3002</div>';
        }
      }
      return (
        '<article class="acc-card reveal in">' +
          '<div class="acc-head">' +
            '<div><span class="acc-cat">' + o.cat.icon + " " + esc(o.label || o.cat.name) + "</span>" +
            '<h4 class="acc-name">' + hl(it.name, toks) + "</h4>" +
            (it.brand && it.model ? '<span class="acc-model">' + esc(it.brand + " " + it.model) + "</span>" : "") +
            "</div>" +
            '<span class="acc-price">' + fmtPrice(it.price) + "</span>" + badge +
          "</div>" +
          '<div class="acc-meta">' +
            '<span class="acc-style">' + hl(it.style, toks) + "</span>" +
            '<span class="acc-rating" title="\u63a8\u8350\u5ea6 ' + it.rating + '/5">' + stars + "</span>" +
            grade + uses + lookDot +
          "</div>" +
          (it.valueNote ? '<div class="acc-note">' + hl(it.valueNote, toks) + "</div>" : "") +
          '<div class="acc-specs">' + hl(it.specs, toks) + "</div>" +
          caliber +
          '<div class="acc-detail">' +
            (tags ? '<div class="acc-tags">' + tags + "</div>" : "") +
            (it.compat ? '<div class="acc-compat">\u642d\u914d\uff1a' + hl(it.compat, toks) + "</div>" : "") +
            productLinksLite(it) +
          "</div>" +
          '<button type="button" class="acc-detail-toggle" aria-expanded="false">详情</button>' +
        "</article>"
      );
    }

    /* 已选条件回显：每个条件都能单独点掉 */
    function renderActive() {
      if (!activeEl) return;
      var chips = [];
      if (state.q) chips.push({ k: "q", label: "\u641c\u7d22\u300c" + state.q + "\u300d" });
      if (state.cat !== "all") chips.push({ k: "cat", label: catName(state.cat) });
      if (state.budget !== "all") {
        var bl = "";
        BANDS.forEach(function (b) { if (b.id === state.budget) bl = b.label; });
        chips.push({ k: "budget", label: bl });
      }
      if (state.brand !== "all") chips.push({ k: "brand", label: state.brand });
      if (state.scene !== "all") {
        var scName = state.scene;
        SCENES.forEach(function (x) { if (x.id === state.scene) scName = x.label; });
        chips.push({ k: "scene", label: scName });
      }
      if (state.look !== "all") {
        var ln = "";
        STYLES.forEach(function (st) { if (st.id === state.look) ln = st.name; });
        chips.push({ k: "look", label: ln });
      }
      activeEl.hidden = !chips.length;
      if (clearBtn) clearBtn.hidden = !chips.length;
      if (!chips.length) { activeEl.innerHTML = ""; return; }
      activeEl.innerHTML = '<span class="acc-active-label">\u5f53\u524d\u6761\u4ef6</span>' +
        chips.map(function (c) {
          return '<button type="button" class="acc-active-chip" data-k="' + c.k + '">' + esc(c.label) +
            '<span class="acc-active-x" aria-hidden="true">\u00d7</span></button>';
        }).join("") +
        '<button type="button" class="acc-active-reset">\u6e05\u7a7a</button>';
      activeEl.querySelectorAll(".acc-active-chip").forEach(function (b) {
        b.addEventListener("click", function () {
          var k = b.getAttribute("data-k");
          state[k] = (k === "q") ? "" : "all";
          syncControls();
          renderCards();
        });
      });
      var reset = activeEl.querySelector(".acc-active-reset");
      if (reset) reset.addEventListener("click", clearAll);
    }

    function clearAll() {
      state.device = "all"; state.cat = "all"; state.scene = "all"; state.look = "all";
      state.budget = "all"; state.brand = "all"; state.q = "";
      state.sort = "default";
      syncControls();
      renderCards();
    }

    // 状态变化后把界面控件同步回去
    function syncControls() {
      if (searchEl) searchEl.value = state.q;
      renderDevices();
      renderChips(catRow, catItems(), "cat");
      renderBrands();
      renderChips(sceneRow, sceneItems(), "scene");
      renderChips(budgetRow, BANDS.map(function (b) { return { id: b.id, label: b.label }; }), "budget");
      if (sortSel) sortSel.value = state.sort;
    }

    function catItems() {
      var cats = D.categories.filter(function (c) {
        return state.device === "all" || c.device === state.device;
      });
      var head = state.device === "all"
        ? [{ id: "all", label: "全部品类" }]
        : [{ id: "all", label: "该设备全部品类" }];
      return head.concat(cats.map(function (c) {
        return { id: c.id, label: c.icon + " " + c.name };
      }));
    }

    /* 设备切换行：先选设备（电脑 / 手机 / 平板 / 耳机与穿戴），品类行随之收敛 */
    var deviceRow = document.getElementById("accDevices");
    function renderDevices() {
      if (!deviceRow) return;
      var opts = [{ id: "all", name: "全部设备", icon: "\ud83c\udf0d", desc: "全部品类" }].concat(D.devices || []);
      deviceRow.innerHTML = opts.map(function (d) {
        var on = state.device === d.id;
        return '<button type="button" class="acc-device' + (on ? " active" : "") + '" data-id="' + esc(d.id) + '">' +
          '<span class="acc-device-icon">' + d.icon + "</span>" +
          '<span class="acc-device-body"><span class="acc-device-name">' + esc(d.name) + "</span>" +
          '<span class="acc-device-desc">' + esc(d.desc || "") + "</span></span>" +
          '<span class="acc-device-arrow" aria-hidden="true">\u2192</span></button>';
      }).join("");
      deviceRow.querySelectorAll(".acc-device").forEach(function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-id");
          state.device = id;
          // 切设备后原品类可能不属于新设备，重置品类与品牌
          if (state.cat !== "all") {
            var cur = D.categories.filter(function (x) { return x.id === state.cat; })[0];
            if (cur && id !== "all" && cur.device !== id) state.cat = "all";
          }
          state.brand = "all";
          renderDevices();
          renderChips(catRow, catItems(), "cat");
          renderBrands();
          renderCards();
        });
      });
    }
    function sceneItems() {
      return [{ id: "all", label: "全部场景" }].concat(SCENES.map(function (x) {
        return { id: x.id, label: x.icon + " " + x.label };
      }));
    }
    /* 「组装电脑 / 主机 / 台式机 / 游戏」—— 新手的第一大意图，而站的主资产是 26 套配置单。
       库里没有整机件，所以结果区第一眼必须是通往方案页的入口：
       在一个有 26 套方案、1209 款型号的站里只回一句「换个关键词试试」，
       用户会以为站里根本没有整机，这是误导。
       注意它**不是** .acc-card（零件卡）—— 方案入口不该被算成「首屏 8 张零件」之一。 */
    var PLAN_INTENT = /组装电脑|整机|主机|台式机|装机|diy|游戏/i;
    function planCardHtml() {
      return '<a class="acc-plan-entry" href="plans.html">' +
        '<span class="acc-plan-badge">整机方案</span>' +
        '<span class="acc-plan-title">26 套配置单：按用途与预算直接选</span>' +
        '<span class="acc-plan-desc">办公 / 游戏 / 创作 / 便携 · 每套列明型号与单价区间</span>' +
        '<span class="acc-plan-go">查看 →</span>' +
        '</a>';
    }

    function renderCards() {
      var list = collect();
      /* 高亮用原文 token：归一后的「wifi7」在「WiFi 7」里找不到，整页会一个字都不亮 */
      var toks = state.q ? rawTokens(state.q) : null;

      /* 分组顺序也要让位给「结构化字段命中」。原来分组顺序写死在 D.categories 里，
         collect() 排得再对也没用：搜「M.2」时 mobo 整组排在 ssd 组前面，
         用户第一眼看到的 8 张卡全是主板 —— 这就是 ORD-17 缺陷 2 的现场。
         只提升「有结构化命中」的组，其余组维持品类顺序：
         对「5070 Ti」这类没有结构化字段的查询，分组顺序一个字节都不变，
         不会因为顺手改了排序把别的搜索的观感也一起改掉。 */
      var groupStruct = {};
      list.forEach(function (o) {
        if (o.struct > (groupStruct[o.cat.id] || 0)) groupStruct[o.cat.id] = o.struct;
      });

      if (state.sort === "ratingDesc") {
        list.sort(function (a, b) { return b.item.rating - a.item.rating; });
      } else if (state.sort === "gradeDesc") {
        list.sort(function (a, b) { return (gradeOrder[b.item.valueGrade] || 0) - (gradeOrder[a.item.valueGrade] || 0); });
      }

      var allN = mergedTotal();
      countEl.textContent = (list.length === allN)
        ? D.updated + " \u884c\u60c5"
        : "\u7b5b\u51fa " + list.length + " \u6b3e";
      if (searchHintEl) {
        searchHintEl.textContent = state.q
          ? (list.length
              ? "\u300c" + state.q + "\u300d\u547d\u4e2d " + list.length + " \u6b3e"
              : "\u6ca1\u6709\u5339\u914d\u300c" + state.q + "\u300d\u7684\u578b\u53f7\uff0c\u6362\u4e2a\u5173\u952e\u8bcd\u8bd5\u8bd5")
          : "";
      }

      renderActive();

      var planIntent = !!(state.q && PLAN_INTENT.test(state.q));
      var planCard = planIntent ? planCardHtml() : "";
      if (!list.length) {
        wrap.innerHTML = planCard + (state.q
          ? '<div class="empty-box">没有匹配「' + esc(state.q) + '」的型号。可以换个说法' +
            '（例如用「显卡」代「显卡支架」、「机械键盘」代「键盘」），' +
            '或直接看 <a href="plans.html">26 套整机配置单</a>。</div>'
          : '<div class="empty-box">\u6ca1\u6709\u5339\u914d\u9879\u3002\u53ef\u4ee5\u8bd5\u8bd5\u4e0b\u9762\u7684\u70ed\u95e8\u641c\u7d22\uff0c\u6216\u70b9\u4e0a\u65b9\u6e05\u7a7a\u6761\u4ef6\u91cd\u65b0\u7b5b\u9009\u3002</div>');
        return;
      }

      var groups = [];
      D.categories.forEach(function (cat) {
        var sub = list.filter(function (o) { return o.cat.id === cat.id; });
        if (sub.length) groups.push({ cat: cat, items: sub });
      });
      groups.sort(function (a, b) { return (groupStruct[b.cat.id] || 0) - (groupStruct[a.cat.id] || 0); });

      /* 整机意图时首屏零件压到 6 张以内：用户搜「主机」「游戏」要的是整机方案，
         给他 8 张 CPU 只会更迷路。6 是「不误杀台式机现状（库里只有 6 件）
         但不放过霸占首屏」的分界。被截掉的用一行说明代替「加载更多」按钮 ——
         在这一屏里继续加载零件没有意义，该让他去方案页或换具体关键词。 */
      var cutNote = {};
      if (planIntent) {
        var capParts = 6, usedParts = 0;
        groups = groups.map(function (g) {
          var room = Math.max(0, capParts - usedParts);
          var keep = g.items.slice(0, room);
          usedParts += keep.length;
          if (g.items.length > keep.length) cutNote[g.cat.id] = g.items.length - keep.length;
          return { cat: g.cat, items: keep };
        }).filter(function (g) { return g.items.length > 0; });
      }

      /* 所有分组直接渲染，不折叠。条件变化时重置每组已加载条数 */
      var sig = state.device + "|" + state.cat + "|" + state.scene + "|" +
                state.look + "|" + state.budget + "|" + state.brand + "|" + state.q;
      if (sig !== lastSig) {
        lastSig = sig;
        groupShown = {};
      }

      wrap.innerHTML = planCard + groups.map(function (g) {
        var cid = g.cat.id;
        var total = g.items.length;
        var shown = Math.max(groupShown[cid] || GROUP_PAGE, GROUP_PAGE);
        var slice = g.items.slice(0, shown);
        var more = total - slice.length + (cutNote[cid] || 0);
        return '<section class="acc-group" data-cat="' + esc(cid) + '">' +
          '<div class="acc-group-head">' +
            "<h3>" + g.cat.icon + " " + esc(g.cat.name) + "</h3>" +
            '<span class="acc-group-count">' + total + " \u6b3e</span>" +
            /* 价格时效：categoryUpdated 是 data.js 顶部的核验账本（21 个品类都填了），
               但页面上从来没显示过 —— 用户只能说「2026-10 参考行情」，
               却不知道这一组是不是同一批核验的。按品类贴出来，
               等某个品类掉队（下一季度只核了一部分）用户就能一眼看见。 */
            (D.categoryUpdated && D.categoryUpdated[cid]
              ? '<span class="acc-group-upd" title="该品类价格的最近核验月份">价格核验 ' + esc(D.categoryUpdated[cid]) + "</span>"
              : "") +
          "</div>" +
          '<div class="acc-group-body">' +
            '<div class="acc-grid">' + slice.map(function (o) { return cardHtml(o, toks); }).join("") + "</div>" +
            (more > 0
              ? (planIntent
                  ? '<div class="acc-cut-note">还有 ' + more + ' 款，用更具体的关键词（如「显卡」「i5」）查看</div>'
                  : '<button type="button" class="acc-group-more" data-more="' + esc(cid) + '">\u52a0\u8f7d\u66f4\u591a\uff08\u8fd8\u6709 ' + more + " \u6b3e\uff09</button>")
              : "") +
          "</div>" +
        "</section>";
      }).join("");

      bindMore();
      bindDetailToggles();
      bindLookDots();
    }

    /* 「加载更多」：每步追加 LOAD_STEP 款，只影响该分组 */
    function bindMore() {
      wrap.querySelectorAll(".acc-group-more").forEach(function (b) {
        b.addEventListener("click", function () {
          var cid = b.getAttribute("data-more");
          groupShown[cid] = (groupShown[cid] || GROUP_PAGE) + LOAD_STEP;
          renderCards();
        });
      });
    }

    /* 外观小圆点：点击即按该外观风格筛选 */
    function bindLookDots() {
      wrap.querySelectorAll(".acc-look-dot").forEach(function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-look");
          state.look = state.look === id ? "all" : id;
          renderCards();
        });
      });
    }

    /* 卡片「详情」展开：默认收起，点击后显示标签/搭配/查价 */
    function bindDetailToggles() {
      wrap.querySelectorAll(".acc-detail-toggle").forEach(function (b) {
        b.addEventListener("click", function () {
          var card = b.closest(".acc-card");
          var detail = card && card.querySelector(".acc-detail");
          if (!detail) return;
          var open = b.getAttribute("aria-expanded") === "true";
          b.setAttribute("aria-expanded", open ? "false" : "true");
          b.textContent = open ? "详情" : "收起";
          detail.classList.toggle("open", !open);
        });
      });
    }

    // 热门搜索：覆盖型号、品类、需求词三种典型查法
    var HOT = ["5070", "\u4e3b\u677f", "\u767d\u8272 \u673a\u7bb1", "2K \u9ad8\u5237", "DDR5", "1TB", "\u65e0\u7ebf\u9f20\u6807", "\u98ce\u51b7", "16G \u663e\u5b58", "\u5c0f\u673a\u7bb1"];
    if (hotEl) {
      hotEl.innerHTML = '<span class="acc-hot-label">\u70ed\u95e8\u641c\u7d22</span>' +
        HOT.map(function (t) { return '<button type="button" class="acc-hot-chip" data-q="' + esc(t) + '">' + esc(t) + "</button>"; }).join("");
      hotEl.querySelectorAll(".acc-hot-chip").forEach(function (b) {
        b.addEventListener("click", function () {
          state.q = b.getAttribute("data-q");
          if (searchEl) searchEl.value = state.q;
          renderCards();
        });
      });
    }

    var sortSel = document.getElementById("accSort");
    if (sortSel) {
      sortSel.value = state.sort;
      sortSel.addEventListener("change", function () { state.sort = sortSel.value; renderCards(); });
    }

    if (searchEl) {
      searchEl.addEventListener("input", function () { state.q = searchEl.value.trim(); renderCards(); });
      searchEl.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { searchEl.value = ""; state.q = ""; renderCards(); }
      });
    }
    if (clearBtn) clearBtn.addEventListener("click", clearAll);

    /* 支持从其它页面或 AI 回答里带条件跳进来：/accessories?q=显卡&cat=gpu&budget=b2k */
    (function fromUrl() {
      var qs;
      try { qs = new URLSearchParams(window.location.search); } catch (e) { return; }
      var q0 = (qs.get("q") || "").trim();
      if (q0) state.q = q0;
      var c0 = qs.get("cat");
      if (c0 && D.categories.some(function (c) { return c.id === c0; })) state.cat = c0;
      var b0 = qs.get("budget");
      if (b0 && BANDS.some(function (b) { return b.id === b0; })) state.budget = b0;
      var s0 = qs.get("scene");
      if (s0 && Object.keys(useLabels).some(function (k) { return k === s0; })) state.scene = s0;
    })();

    syncControls();
    renderCards();
  }

  /* =========================================================
   * 二、搭配计划（#plans）
   * ========================================================= */
  /* 站内对外发布的方案深链（index.html 三张方案卡的「查看该方案配置单」指向它们）。
     为什么单独登记一份字面量：卡片 id 是渲染时拼的（"plan-" + pl.id），
     只在运行时存在；而浏览器解析 #fragment 发生在渲染之前，所以要渲染完再补一次定位，
     否则用户点了锚点只会落在页面顶部（这正是 ORD-31 修的 3 条死锚点）。
     这份清单同时是「站内到底发布了哪几条深链」的唯一记录，
     静态检查（tests/promises.cjs 的 P2）也只能查到字面量。 */
  var PLAN_DEEPLINK = ["plan-t3000", "plan-t6000", "plan-t12000"];

  function initPlans() {
    var wrap = document.getElementById("plansWrap");
    if (!wrap) return;

    /* 这套配置的「价格核验月份」= 它所有部件里最旧的那一个。
       取最旧而不是最新：用户要知道的是「这套单子里最不可信的那个数是什么时候核的」。
       部件名靠 PART_CAT 映射回品类，再查 data.js 的 categoryUpdated 账本。 */
    function planUpdatedOf(pl) {
      var map = D.categoryUpdated || {};
      var months = [];
      (pl.parts || []).forEach(function (r) {
        var cid = PART_CAT[r[0]];
        var m = cid && map[cid];
        if (m && months.indexOf(m) === -1) months.push(m);
      });
      if (!months.length) return "";
      months.sort();
      return months[0];
    }

    // 人群画像速览
    var pWrap = document.getElementById("personasWrap");
    if (pWrap) {
      pWrap.innerHTML = D.personas.map(function (p) {
        return (
          '<article class="card persona-card reveal">' +
            '<div class="card-icon">' + p.icon + "</div>" +
            '<h3 class="card-title">' + esc(p.name) + "</h3>" +
            "<p class=\"card-text\">" + esc(p.desc) + "</p>" +
          "</article>"
        );
      }).join("");
    }

    wrap.innerHTML = D.plans.map(function (pl) {
      var personas = (pl.personas || []).map(function (pid) {
        var p = D.personas.filter(function (x) { return x.id === pid; })[0];
        return p ? '<span class="tag-pill">' + p.icon + " " + p.name + "</span>" : "";
      }).join("");
      var rows = (pl.parts || []).map(function (r) {
        var detail = r[3] ? '<span class="plan-detail">' + esc(r[3]) + "</span>" : "";
        return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + detail + "</td><td class=\"plan-price\">" + esc(r[2]) + "</td></tr>";
      }).join("");
      return (
        '<article class="plan-card reveal in" id="plan-' + esc(pl.id) + '">' +
          '<div class="plan-head">' +
            '<span class="plan-icon">' + pl.icon + "</span>" +
            '<div><h3 class="plan-name">' + esc(pl.name) + "</h3>" +
            '<span class="plan-budget">参考预算 ' + fmtPrice(pl.price) + "</span>" +
            (planUpdatedOf(pl) ? '<span class="plan-updated">价格核验 ' + esc(planUpdatedOf(pl)) + "</span>" : "") +
            (pl.budgetLabel ? '<span class="plan-tier">' + esc(pl.budgetLabel) + "</span>" : "") +
            "</div>" +
          "</div>" +
          "<p class=\"plan-summary\">" + esc(pl.summary) + "</p>" +
          '<div class="plan-personas">' + personas + "</div>" +
          '<table class="plan-table"><thead><tr><th>部件</th><th>推荐</th><th>参考价</th></tr></thead><tbody>' + rows + "</tbody></table>" +
          '<p class="plan-tip">' + esc(pl.tip) + "</p>" +
        "</article>"
      );
    }).join("");

    /* 深链补定位：卡片刚渲染完，浏览器不会再解析一次 #fragment，
       必须自己滚到目标卡。只在真的是 #plan-* 时做，避免干扰普通访问。
       jsdom 没有布局引擎（scrollIntoView 是空实现），所以这段的验证靠
       「调用证据」而不是「滚到了哪」——见 wr 文件的任务 2 一节。 */
    var hash = String(window.location.hash || "").replace(/^#/, "");
    if (hash && /^plan-/.test(hash)) {
      var target = document.getElementById(hash);
      if (target && target.scrollIntoView) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (PLAN_DEEPLINK.indexOf(hash) > -1) {
        /* 对外发布的深链落空 = 站内死链。宁可留痕，也不要静默落回页面顶部。 */
        if (window.console && window.console.warn) window.console.warn("[plans] 深链目标不存在：" + hash);
      }
    }
  }

  /* =========================================================
   * 三、性价比 TOP 榜单（#toplist）
   * ========================================================= */
  function initTopList() {
    var tabs = document.getElementById("topTabs");
    var wrap = document.getElementById("topWrap");
    if (!tabs || !wrap || !D.topList) return;

    var byCat = {};
    D.categories.forEach(function (c) { byCat[c.id] = c; });

    var TIERS = ["入门", "甜点", "进阶", "旗舰"];
    var TIER_CLS = { "入门": "t0", "甜点": "t1", "进阶": "t2", "旗舰": "t3" };
    var state = { mode: "cat", tier: "all" };

    function lookup(entry) {
      var cat = byCat[entry.catId];
      if (!cat) return null;
      var item = cat.items.filter(function (x) { return x.id === entry.itemId; })[0];
      return item ? { cat: cat, item: item, entry: entry } : null;
    }

    var ALL = D.topList.map(lookup).filter(Boolean);

    function rankSort(a, b) {
      return gradeOrder[b.entry.grade] - gradeOrder[a.entry.grade] ||
        (a.item.price[0] + a.item.price[1]) / 2 - (b.item.price[0] + b.item.price[1]) / 2;
    }

    function cardHtml(o, rankLabel) {
      var e = o.entry;
      var q = encodeURIComponent(o.item.name);
      return (
        '<article class="top-card reveal in">' +
          '<span class="top-rank">' + rankLabel + "</span>" +
          '<div class="top-main">' +
            '<h4 class="top-name">' + esc(o.item.name) + "</h4>" +
            '<p class="top-reason">' + esc(e.reason) + "</p>" +
            '<div class="top-links">' +
              '<a class="top-shop top-tb" href="https://s.taobao.com/search?q=' + q + '" target="_blank" rel="noopener noreferrer">淘宝查价</a>' +
              '<a class="top-shop top-jd" href="https://search.jd.com/Search?keyword=' + q + '" target="_blank" rel="noopener noreferrer">京东查价</a>' +
            "</div>" +
          "</div>" +
          '<div class="top-side">' +
            '<span class="top-meta">' + esc(o.cat.name) +
              (o.item.style ? " · " + esc(o.item.style) : "") + "</span>" +
            '<span class="top-badges">' +
              '<span class="top-tier ' + (TIER_CLS[e.tier] || "") + '">' + esc(e.tier) + "</span>" +
              '<span class="grade grade-' + e.grade + '">' + e.grade + "</span>" +
            "</span>" +
            '<span class="top-price">' + fmtPrice(o.item.price) + "</span>" +
          "</div>" +
        "</article>"
      );
    }

    function summaryHtml(n) {
      var tiers = TIERS.map(function (t) {
        return t + " " + ALL.filter(function (o) { return o.entry.tier === t; }).length;
      }).join(" · ");
      return '<p class="top-summary reveal in">共 <b>' + n + "</b> 款上榜，覆盖 " +
        D.categories.length + " 个品类（" + tiers +
        "）。同一档位内先按性价比等级、再按参考均价排序。</p>";
    }

    /* 品类分组：标题栏可点击折叠/展开，默认展开前 3 组 */
    var DEFAULT_OPEN = 3;

    function groupHtml(cat, group, open) {
      var cards = group.map(function (o, i) {
        return cardHtml(o, '<span class="group-rank r' + (i + 1) + '">#' + (i + 1) + "</span>");
      }).join("");
      var best = group[0];
      return (
        '<section class="top-group reveal in' + (open ? " open" : "") + '" data-cat="' + cat.id + '">' +
          '<button type="button" class="top-group-head" aria-expanded="' + (open ? "true" : "false") + '">' +
            '<span class="top-group-icon">' + cat.icon + "</span>" +
            '<h3 class="top-group-name">' + esc(cat.name) + "</h3>" +
            '<span class="top-group-count">' + group.length + " 款</span>" +
            '<span class="top-group-lead">' + esc(best.item.name) + " · " +
              esc(best.entry.grade) + " 级 " + esc(best.entry.tier) + "</span>" +
            '<span class="top-group-caret" aria-hidden="true"></span>' +
          "</button>" +
          '<div class="top-group-grid"' + (open ? "" : " hidden") + ">" + cards + "</div>" +
        "</section>"
      );
    }

    function render() {
      var rows = state.tier === "all" ? ALL.slice()
        : ALL.filter(function (o) { return o.entry.tier === state.tier; });
      var html = summaryHtml(rows.length);
      if (!rows.length) {
        wrap.innerHTML = html + '<div class="empty-box">该档位暂无上榜型号，切回「全部档位」查看。</div>';
        return;
      }
      if (state.mode === "cat") {
        var groups = D.categories.map(function (cat) {
          var g = rows.filter(function (o) { return o.cat.id === cat.id; }).sort(rankSort);
          return g.length ? { cat: cat, rows: g } : null;
        }).filter(Boolean);
        html += groups.map(function (x, i) {
          return groupHtml(x.cat, x.rows, i < DEFAULT_OPEN);
        }).join("");
        html += '<div class="top-expand-all">' +
          '<button type="button" class="chip" id="topToggleAll">展开全部 ' + groups.length + " 个品类</button></div>";
      } else {
        rows.sort(rankSort);
        html += rows.map(function (o, i) { return cardHtml(o, "#" + (i + 1)); }).join("");
      }
      wrap.innerHTML = html;
      bindGroups();
    }

    /* 折叠交互：标题栏点击展开/收起，另有「展开全部」 */
    function bindGroups() {
      wrap.querySelectorAll(".top-group-head").forEach(function (h) {
        h.addEventListener("click", function () {
          var g = h.closest(".top-group");
          var open = g.classList.toggle("open");
          h.setAttribute("aria-expanded", open ? "true" : "false");
          var body = g.querySelector(".top-group-grid");
          if (body) body.hidden = !open;
        });
      });
      var t = document.getElementById("topToggleAll");
      if (!t) return;
      var allOpen = wrap.querySelectorAll(".top-group.open").length ===
        wrap.querySelectorAll(".top-group").length;
      t.textContent = allOpen ? "收起全部品类" : "展开全部 " +
        wrap.querySelectorAll(".top-group").length + " 个品类";
      t.addEventListener("click", function () {
        var open = t.textContent.indexOf("收起") !== 0;
        wrap.querySelectorAll(".top-group").forEach(function (g) {
          g.classList.toggle("open", open);
          g.querySelector(".top-group-head").setAttribute("aria-expanded", open ? "true" : "false");
          var b = g.querySelector(".top-group-grid");
          if (b) b.hidden = !open;
        });
        t.textContent = open ? "收起全部品类" : "展开全部 " +
          wrap.querySelectorAll(".top-group").length + " 个品类";
      });
    }

    tabs.innerHTML =
      '<div class="top-tabs-row">' +
        '<span class="top-tabs-label">排行方式</span>' +
        '<button class="chip active" data-mode="cat">按品类</button>' +
        '<button class="chip" data-mode="all">全站总榜</button>' +
      "</div>" +
      '<div class="top-tabs-row">' +
        '<span class="top-tabs-label">价位档位</span>' +
        '<button class="chip active" data-tier="all">全部</button>' +
        TIERS.map(function (t) {
          return '<button class="chip" data-tier="' + t + '">' + t + "</button>";
        }).join("") +
      "</div>";

    tabs.querySelectorAll(".chip").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = b.getAttribute("data-mode"), t = b.getAttribute("data-tier");
        if (m) state.mode = m; else state.tier = t;
        tabs.querySelectorAll(".chip").forEach(function (x) {
          var sameGroup = m ? x.getAttribute("data-mode") : x.getAttribute("data-tier");
          if (sameGroup) x.classList.toggle("active", x === b);
        });
        render();
      });
    });
    render();
  }

  /* =========================================================
   * 四、个性化测评（#quiz）：问答 → 生成方案
   * ========================================================= */
  function isMobileForm(form) {
    return form === "phone" || form === "tablet";
  }

  // 取避坑条目（HTML 渲染与文本导出共用）
  function pitfallItems(uses, form) {
    var map = (window.PC_DATA && window.PC_DATA.pitfalls) || {};
    var keys = [];
    /* 手机/平板只给移动向避坑：装机、显卡、DDR4 那一套对它们是噪音，
       而"问题必须始终对这个人成立"同样适用于结果页里的建议。 */
    if (isMobileForm(form)) {
      keys.push(form === "tablet" ? "tablet" : "mobile");
      var seenM = {}, itemsM = [];
      keys.forEach(function (k) {
        (map[k] || []).forEach(function (x) { if (x && !seenM[x]) { seenM[x] = 1; itemsM.push(x); } });
      });
      return itemsM;
    }
    if (Array.isArray(uses)) {
      uses.forEach(function (u) { if (u && u !== "all") keys.push(u); });
      keys.push("common");
    } else if (typeof uses === "string" && uses && uses !== "all") {
      keys.push(uses); keys.push("common");
    } else {
      keys.push("common");
    }
    var seen = {}, items = [];
    keys.forEach(function (k) {
      (map[k] || []).forEach(function (t) {
        if (t && !seen[t]) { seen[t] = 1; items.push(t); }
      });
    });
    return items;
  }

  function pitfallsHTML(uses, form, exp) {
    var items = pitfallItems(uses, form);
    /* 经验这一题不改型号（配置单同款优先），但必须改变"接下来怎么做"：
       纯新手多一条装机顺序提示，老玩家不占版面。 */
    if (exp === "new" && !isMobileForm(form)) {
      items = items.concat(["第一次自己装机：先把 CPU、内存、散热装到主板上再进机箱，最后接电源线；不确定就走「使用指南」的装机步骤，或约京东上门装机（约 100-200 元）。"]);
    }
    if (!items.length) return "";
    return '<div class="res-section"><span class="res-label">避坑提示：这几处最容易翻车</span>' +
      '<div class="look-pitfalls">' +
      items.map(function (t) { return '<div class="pitfall">' + esc(t) + "</div>"; }).join("") +
      "</div></div>";
  }


  function initQuiz() {
    var box = document.getElementById("quizBox");
    if (!box) return;

    var answers = {}; // { qid: [optionIds] }
    var steps = D.quiz;

    /* 题目与选项都可以带 when:{form:[...]}；没有 when 视为全形态适用。
       第 1 题（设备）未选时只渲染第 1 题 —— 连"要不要问装机经验"都还不成立。 */
    function fitsWhen(node, form) {
      if (!node || !node.when || !node.when.form) return true;
      return !!form && node.when.form.indexOf(form) > -1;
    }
    function currentForm() {
      return (answers.form && answers.form[0]) || null;
    }
    function visibleSteps() {
      var form = currentForm();
      if (!form) return steps.filter(function (q) { return !q.when; });
      return steps.filter(function (q) { return fitsWhen(q, form); });
    }
    function optionsOf(q, form) {
      return q.options.filter(function (o) { return fitsWhen(o, form); });
    }
    function titleOf(q, form) {
      if (typeof q.title === "string") return q.title;
      return (form && q.title[form]) || q.title["default"] || "";
    }
    /* 换形态后，旧答案里属于其它形态的选项必须清掉；
       否则提交时带着用户看不见的脏答案，推荐会被不存在的选择带偏。 */
    function pruneAnswers(form) {
      steps.forEach(function (q) {
        if (!fitsWhen(q, form)) { delete answers[q.id]; return; }
        if (!answers[q.id]) return;
        var keep = {};
        optionsOf(q, form).forEach(function (o) { keep[o.id] = 1; });
        answers[q.id] = answers[q.id].filter(function (id) { return keep[id]; });
        if (!answers[q.id].length) delete answers[q.id];
      });
    }

    function render() {
      var form = currentForm();
      var vis = visibleSteps();
      box.innerHTML = vis.map(function (q, qi) {
        var opts = optionsOf(q, form).map(function (o) {
          var sel = answers[q.id] && answers[q.id].indexOf(o.id) > -1 ? " selected" : "";
          return (
            '<button class="q-opt' + sel + '" data-q="' + q.id + '" data-o="' + o.id + '">' +
              '<span class="q-opt-label">' + termify(o.label) + "</span>" +
              '<span class="q-opt-desc">' + termify(esc(o.desc)) + "</span>" +
            "</button>"
          );
        }).join("");
        // 编号跟着可见题目数实时重算：手机 9 题、台式 10 题
        var stepBadge = '<span class="q-step">' + (qi + 1) + "/" + vis.length + "</span>";
        return (
          '<div class="quiz-step" data-step="' + q.id + '">' +
            '<div class="q-title">' + stepBadge + " " + termify(titleOf(q, form)) + "</div>" +
            '<div class="q-opts" data-multi="' + (q.multi ? "1" : "0") + '">' + opts + "</div>" +
          "</div>"
        );
      }).join("") +
      '<button class="btn btn-primary q-submit" id="quizSubmit">生成我的方案</button>';

      box.querySelectorAll(".q-opt").forEach(function (b) {
        b.addEventListener("click", function () {
          var qid = b.getAttribute("data-q");
          var oid = b.getAttribute("data-o");
          var multi = b.parentNode.getAttribute("data-multi") === "1";
          if (!answers[qid]) answers[qid] = [];
          if (multi) {
            // 「都没有」与其它项互斥，同勾会让"跳过清单"自相矛盾
            if (oid === "none") {
              answers[qid] = ["none"];
            } else {
              answers[qid] = answers[qid].filter(function (x) { return x !== "none"; });
              var i = answers[qid].indexOf(oid);
              if (i > -1) answers[qid].splice(i, 1); else answers[qid].push(oid);
            }
          } else {
            answers[qid] = [oid];
          }
          if (qid === "form") pruneAnswers(oid);
          render();
        });
      });

      var submit = document.getElementById("quizSubmit");
      if (submit) submit.addEventListener("click", generate);
    }

    function answerOf(qid) {
      return answers[qid] || [];
    }


    /* 选项查表：形态相关的 id（p_photo / t_draw）要映射回方案池的四种用途，
       不能直接把新 id 丢给 pickPlan —— 那里的 uses 只有 office/game/create/portable。 */
    function optionOf(qid, oid) {
      var q = steps.filter(function (x) { return x.id === qid; })[0];
      if (!q) return null;
      return q.options.filter(function (o) { return o.id === oid; })[0] || null;
    }
    function canonicalUses(rawIds) {
      var out = [];
      rawIds.forEach(function (id) {
        var opt = optionOf("use", id);
        var mapped = (opt && opt.use) ||
          (["office", "game", "create", "portable"].indexOf(id) > -1 ? [id] : []);
        mapped.forEach(function (u) { if (out.indexOf(u) === -1) out.push(u); });
      });
      return out;
    }
    /* 已有件 → 配置单行名。按"行"跳过而不是按品类跳过：
       charger 类里同时装着充电器/数据线/移动电源，按品类跳会连带删掉没勾的那几件。 */
    function skipPartsOf(rawIds) {
      var out = [];
      rawIds.forEach(function (id) {
        var opt = optionOf("existing", id);
        ((opt && opt.parts) || []).forEach(function (p) {
          if (out.indexOf(p) === -1) out.push(p);
        });
      });
      return out;
    }
    function labelOfOption(qid, oid) {
      var opt = optionOf(qid, oid);
      return (opt && opt.label) || oid;
    }
    function partsOfOption(qid, oid) {
      var opt = optionOf(qid, oid);
      return (opt && opt.parts) || [];
    }
    function defaultPrefOf(form) {
      return isMobileForm(form) ? (form === "tablet" ? "t_value" : "p_value") : "value";
    }
    function defaultLookOf(form) {
      return form === "tablet" ? "t_any" : form === "phone" ? "p_any" : "any";
    }

    /* 偏好打分：只决定"同类里挑哪件"，绝不越过价位窗口。
       把 360 水冷换成百元风冷是另一种错，所以偏好只在窗口内做筛选。 */



    function generate() {
      var form = answerOf("form")[0] || "";
      if (!form) {
        box.innerHTML = '<div class="empty-box">请先在第 1 题选择你要的设备，后面的题目会跟着变化。</div>';
        render();
        return;
      }
      /* 用途答案是形态内 id（p_photo / t_draw），先映射回方案池的四种用途，
         否则 pickPlan 一个方案都拿不到。 */
      var rawUse = answerOf("use");
      var use = canonicalUses(rawUse);
      var budget = answerOf("budget")[0] || "b6000";
      var pref = answerOf("pref")[0] || defaultPrefOf(form);
      var look = answerOf("look")[0] || defaultLookOf(form);
      var style = styleOf(look);
      var intensity = answerOf("intensity")[0] || "mid";
      var lifespan = answerOf("lifespan")[0] || "y3";
      // 手机/平板不答装机经验，默认空串，画像里就不显示这一项
      var exp = answerOf("exp")[0] || "";
      var rawExisting = answerOf("existing");
      var rawFocus = answerOf("focus");

      if (!use.length) {
        box.innerHTML = '<div class="empty-box">请至少选择一项用途再生成方案。</div>';
        render(); // 恢复可交互
        return;
      }
      /* 已有件 → 配置单行名。按行跳过而不是按品类跳过：
         charger 类里同时装着充电器 / 数据线 / 移动电源，按品类跳会连带删掉没勾的那几件。 */
      var skipParts = skipPartsOf(rawExisting);
      var skipLabels = rawExisting.filter(function (id) { return id !== "none"; })
        .map(function (id) { return labelOfOption("existing", id); });

      var focus = rawFocus.slice();
      if (!focus.length) {
        // 未选重点时按用途推断默认
        if (use.indexOf("portable") > -1) focus = ["stand", "dock", "cooler"];
        else if (use.indexOf("game") > -1) focus = ["monitor", "input", "cooler"];
        else if (use.indexOf("create") > -1) focus = ["monitor", "input", "audio"];
        else focus = ["monitor", "stand", "input"];
      }
      // 「整机核心件」展开为具体类别；形态内的选项（p_body 等）展开为配置单行名
      var focusIds = focus.slice();
      if (focusIds.indexOf("core") > -1) {
        focusIds = focusIds.concat(["cpu", "gpu", "mobo", "ram", "ssd", "psu", "case", "cooler"]);
      }
      focus.forEach(function (fid) {
        partsOfOption("focus", fid).forEach(function (pn) {
          if (focusIds.indexOf(pn) === -1) focusIds.push(pn);
        });
      });
      /* 已勾"有这件"又把它设成"重点配好" → 必须点明，不能只做一半 */
      var focusConflict = [];
      focus.forEach(function (fid) {
        var fParts = partsOfOption("focus", fid);
        if (fParts.some(function (pn) { return skipParts.indexOf(pn) > -1; })) {
          focusConflict.push(labelOfOption("focus", fid));
        }
      });

      var budgetCap = MOBILE_BUDGET_AXIS[form] ? mobileBudgetCap(form, budget) : budgetOrder[budget];
      /* 品牌偏好（ORD-27 任务 8）：没答这题、或选「不限」→ b_any → brandOf=null，
         pickOne 走原逻辑，行为一个字节都不变。 */
      var brandPref = answerOf("brand")[0] || "b_any";
      var bias = buildBias(pref, exp, lifespan, look, brandPref);
      // 使用强度真实影响目标价位：轻度往下收，重度往上放
      var targetScale = intensity === "light" ? 0.85 : intensity === "heavy" ? 1.12 : 1;
      var partOpts = {
        uses: use, priority: focusIds, budgetCap: budgetCap,
        skipParts: skipParts, bias: bias, targetScale: targetScale,
        scaleOf: buildTargetScale(pref, exp, look, lifespan), look: look, pref: pref,
        fold: rawFocus.length > 0
      };

      // 1) 基础整机方案（年限/强度参与匹配）
      var plan = pickPlan(use, form, budgetCap, lifespan, intensity);

      // 2) 候选池取相邻档位，结果页给 2-3 套对比（与快速推荐同口径）
      //    用途不匹配的方案不入池：游戏用户不该看到只标了办公的核显机
      var pool = D.plans.filter(function (pl) {
        if (!formFit(pl, form)) return false;
        return pl.uses.some(function (u) { return use.indexOf(u) > -1; });
      });
      if (!pool.length) {
        pool = D.plans.filter(function (pl) { return formFit(pl, form); });
      }
      var sets = planSiblingSets(plan, pool);
      var mainSetIdx = 0;
      sets.forEach(function (s, i) { if (s.main) mainSetIdx = i; });

      // 3) 配件推荐跟着当前展示的整机方案走，避免整机与配件档次脱节
      function picksOf(p) {
        return p ? focus.map(function (catId) {
          return pickItems(catId, use, pref, budgetCap, p, intensity, look);
        }).filter(Boolean) : [];
      }
      function totalsOf(p, pk) {
        var lo = p ? p.price[0] : 0, hi = p ? p.price[1] : 0;
        (pk || []).forEach(function (x) { lo += x.item.price[0]; hi += x.item.price[1]; });
        return [lo, hi];
      }
      var curPlan = plan;
      var curRows = [];
      // 导出文本也用全套部件，避免导出结果只剩外设
      function partRowsToPicks(pl) {
        // 每次重算：否则切到第二套方案会复用上一套的行
        partOpts.rows = null;
        curRows = pl ? fullPartRows(pl, partOpts) : [];
        // 配置单表格复用同一份型号结果，价格与配件区必然一致（单一价源）
        partOpts.rows = curRows;
        return curRows.map(function (r) {
          var it = r.pick && r.pick.item;
          return {
            cat: { name: r.part, icon: r.cat ? r.cat.icon : "🔧" },
            item: it || { name: r.config, price: r.textPick ? r.textPick.price : [0, 0] },
            why: it && it.valueNote ? it.valueNote : "配置单原选 " + r.config + "（" + r.priceText + "）"
          };
        });
      }
      var curPicks = partRowsToPicks(plan);

      // 4) 人群画像      // 3) 人群画像
      var personaIds = use.map(function (u) {
        if (u === "office") return "office";
        if (u === "game") return "gamer";
        if (u === "create") return "creator";
        if (u === "portable") return "mobile";
      });
      var personas = personaIds.map(function (pid) {
        var p = D.personas.filter(function (x) { return x.id === pid; })[0];
        return p ? '<span class="tag-pill big">' + p.icon + " " + esc(p.name) + "</span>" : "";
      }).join("");

      // 4) 需求画像（强度/年限/经验/已有外设）
      var intLabel = { light: "轻度使用", mid: "中度使用", heavy: "重度使用" }[intensity] || "";
      var lifeLabel = { y1: "短期过渡", y3: "主流 3 年", y5: "战未来 5 年+" }[lifespan] || "";
      var expLabel = exp ? ({ new: "纯新手", some: "会折腾", pro: "老玩家" }[exp] || "") : "";
      var existTxt = !skipLabels.length ? "全部从零开始配" : "已有" + skipLabels.join(" / ");
      var profile =
        '<span class="tag-pill">' + esc(intLabel) + "</span>" +
        '<span class="tag-pill">' + esc(lifeLabel) + "</span>" +
        (expLabel ? '<span class="tag-pill">' + esc(expLabel) + "</span>" : "") +
        '<span class="tag-pill">' + esc(existTxt) + "</span>";
      if (look && look !== "any" && styleOf(look)) {
        profile += '<span class="tag-pill">' + esc(styleOf(look).name) + "</span>";
      }

      function picksHtmlOf(pk) {
        return pk.map(function (p) {
          var item = p.item;
          var cat = p.cat;
          return (
            '<div class="pick-item">' +
              '<span class="pick-icon">' + cat.icon + "</span>" +
              '<div class="pick-main"><span class="pick-name">' + esc(item.name) + "</span>" +
              '<span class="pick-why">' + esc(p.why) + "</span>" +
              productImageLink(item) +
              "</div>" +
              '<span class="pick-price">' + fmtPrice(item.price) + "</span>" +
            "</div>"
          );
        }).join("");
      }

      var lookHtml = "";
      if (style) {
        var sw = (style.palette || []).map(function (c) {
          return '<span class="look-swatch sm" style="background:' + c + '"></span>';
        }).join("");
        lookHtml =
          '<div class="res-section res-look">' +
            '<span class="res-label">你偏好的颜值风格</span>' +
            '<div class="res-look-card">' +
              '<img class="res-look-img" src="' + style.img + '" alt="' + esc(style.name) + '" loading="lazy" />' +
              '<div class="res-look-body">' +
                '<div class="res-look-head">' + esc(style.name) +
                  '<span class="res-look-pal">' + sw + "</span></div>" +
                '<p class="res-look-desc">' + esc(style.desc) + "</p>" +
                '<p class="res-look-tip">' + esc((style.tips && style.tips[0]) || "") + "</p>" +
                '<button class="btn btn-ghost res-look-jump" data-look="' + style.id + '">看这类风格配件 →</button>' +
              "</div>" +
            "</div>" +
          "</div>";
      }

      box.innerHTML =
        '<div class="result-box reveal in">' +
          '<h3 class="result-title">你的个性化方案</h3>' +
          '<div class="result-persona"><span class="res-label">需求画像</span>' + profile + "</div>" +
          '<div class="result-persona"><span class="res-label">适合人群</span>' + personas + "</div>" +
          brandCoverageNote(form, brandPref) +
          lookHtml +
          '<div class="smart-res-head reveal in">' +
            (sets.length > 1 ? "为你匹配 " + sets.length + " 套方案，点标签切换对比；每套都含全套配置单" : "你的全套配置单") +
          "</div>" +
          planSetTabsHtml(sets, mainSetIdx) +
          '<div id="quizSetBody"></div>' +
          pitfallsHTML(use, form, exp) +
          '<div class="res-actions">' +
            '<button class="btn btn-ghost q-copy">复制方案文本</button>' +
            '<button class="btn btn-ghost q-reset">重新测评</button>' +
          "</div>" +
        "</div>";

      var quizBody = document.getElementById("quizSetBody");
      function renderQuizSet(si) {
        var s = sets[si];
        var p = s.plan;
        curPlan = p;
        curPicks = partRowsToPicks(p);
        if (!quizBody) return;
        var warn = budgetWarnHtml(p, budgetCap, sets.length > si + 1,
          use.indexOf("office") > -1 ? "office" : use[0], form, si > 0);
        var spec = p ? specTableHtml(p, { rows: curRows }) : { html: "", total: [0, 0] };
        /* 跳过的件必须有说明：静默消失会被当成功能坏了 */
        var skipTip = (curRows.skipped && curRows.skipped.length)
          ? '<div class="res-skip-note">已按你的实际情况跳过 ' + curRows.skipped.length + " 项（" +
              curRows.skipped.map(function (x) { return esc(x.part); }).join("、") +
              "），合计已相应减去。" +
              (skipLabels.length ? "你勾选的是：" + esc(skipLabels.join(" / ")) + "。" : "") +
            "</div>"
          : "";
        var conflictTip = (focusConflict.length && skipTip)
          ? '<div class="res-skip-note res-skip-warn">你把「' + esc(focusConflict.join(" / ")) +
              "」同时标成了重点配好，但它在已勾选的已有件里，已按跳过处理。想要新的就先取消已有件。</div>"
          : "";
        var lookTip = p ? lookMissTip(curRows, look) : "";
        quizBody.innerHTML =
          warn +
          (p ? planBriefHtml(p) : '<div class="res-plan">未匹配到整机方案，请参考「搭配计划」板块。</div>') +
          skipTip + conflictTip + lookTip +
          spec.html +
          '<div class="res-section"><span class="res-label">每个部件买什么型号（整机件 + 外设全覆盖，升级重点已置顶）</span>' +
            (p ? (fullPartsHtml(p, partOpts) || '<div class="empty-box">未匹配到可推荐的部件型号，请参考上方配置单。</div>') : "") +
          "</div>" +
          '<div class="res-total">整体投入参考：<b>' + fmtPrice(spec.total) + "</b>（按配置单各行参考价累加，不含优惠；与上方配件同型号同价）</div>" +
          '<div class="res-note">' + esc(isMobileForm(form) && D.noteMobile ? D.noteMobile : D.note) +
            "。方案为规则推荐，购机前请复核接口兼容性与电商实时价。</div>";
      }
      bindPlanSetTabs(box, renderQuizSet);
      renderQuizSet(mainSetIdx);

      var reset = box.querySelector(".q-reset");
      if (reset) reset.addEventListener("click", function () {
        answers = {};
        render();
      });

      var copyBtn = box.querySelector(".q-copy");
      if (copyBtn) copyBtn.addEventListener("click", function () {
        copyToClipboard(quizPlanText({
          use: use,
          profileParts: [intLabel, lifeLabel, expLabel, existTxt],
          personas: personaIds.map(function (pid) {
            var p = D.personas.filter(function (x) { return x.id === pid; })[0];
            return p ? p.name : "";
          }).filter(Boolean),
          style: (look && look !== "any") ? styleOf(look) : null,
          plan: curPlan,
          form: form,
          picks: curPicks,
          // 配置单本身已含这些部件，整体投入直接取配置单合计，避免重复计价
          total: curPlan ? specTableHtml(curPlan, { rows: curRows }).total : [0, 0]
        }), copyBtn);
      });

      var lookJump = box.querySelector(".res-look-jump");
      if (lookJump) lookJump.addEventListener("click", function () {
        var id = lookJump.getAttribute("data-look");
        window.location.href = "accessories.html?look=" + encodeURIComponent(id);
      });
    }

    /* 把测评方案导出成纯文本（方便贴给店家、发群里问或自己存档） */
    function quizPlanText(ctx) {
      var L = [];
      var sep = "----------------------------------------";
      L.push("【深度测评方案】" + ctx.use.map(function (u) { return useLabels[u] || u; }).join(" / "));
      L.push("需求画像：" + ctx.profileParts.filter(Boolean).join(" · "));
      if (ctx.personas.length) L.push("适合人群：" + ctx.personas.join("、"));
      if (ctx.style) L.push("颜值风格：" + ctx.style.name + "（配色 " + ctx.style.paletteName + "）");
      if (ctx.plan) {
        L.push("整机方案：" + ctx.plan.name + "，参考 " + fmtPrice(ctx.plan.price) + "（" + ctx.plan.budgetLabel + "）");
        L.push("全套配置单：");
        (ctx.plan.parts || []).forEach(function (r) {
          L.push("· " + r[0] + "：" + r[1] + "（" + r[2] + "）");
        });
      } else {
        L.push("整机方案：未匹配到，建议放宽预算或调整用途再看一次");
      }
      L.push(sep);
      L.push("部件推荐（整机件 + 外设）：");
      if (ctx.picks.length) {
        ctx.picks.forEach(function (p) {
          L.push("· " + p.cat.name + "：" + p.item.name + "（" + fmtPrice(p.item.price) + "）");
        });
      } else {
        L.push("· 暂无匹配配件");
      }
      L.push(sep);
      L.push("整体投入参考：" + fmtPrice(ctx.total) + "（按配置单各行参考价累加，不含优惠）");
      var ps = pitfallItems(ctx.use, ctx.form);
      if (ps.length) {
        L.push("");
        L.push("避坑提醒：");
        ps.forEach(function (t) { L.push("· " + t); });
      }
      L.push("");
      // 月份取 D.updated，行情核验时无需改这里
      var updatedTag = String(D.updated || "").split("（")[0] || "最新";
      L.push("价格区间为 " + updatedTag + " 核验参考行情，购机请以电商实时价为准。");
      L.push("本方案由规则生成，请自行复核接口兼容性。");
      return L.join("\n");
    }

    function pickPlan(use, form, budgetCap, lifespan, intensity) {
      var candidates = D.plans.filter(function (pl) {
        if (!formFit(pl, form)) return false;
        var hit = pl.uses.some(function (u) { return use.indexOf(u) > -1; });
        return hit;
      });
      // 选了笔记本/手机/平板却没命中任何同形态方案时，退回全部同形态方案，
      // 不能返回 null（曾出现「选笔记本推不出方案」）
      if (!candidates.length && form && form !== "both") {
        candidates = D.plans.filter(function (pl) { return pl.form.indexOf(form) > -1; });
      }
      if (!candidates.length) return null;
      // 预算内可供选择的方案（战未来放宽 35% 上浮）
      var cap = (lifespan === "y5" ? budgetCap * 1.35 : budgetCap * 1.15);
      function scoreOf(pl) {
        return pl.uses.filter(function (u) { return use.indexOf(u) > -1; }).length;
      }
      // 按「起步价」判断够不够得着：够不着就退回最便宜的一套，
      // 不能在超预算时反而推旗舰（曾出现 4800 预算匹配到 3 万 2 旗舰机）
      var pool = candidates.filter(function (pl) { return pl.price[0] <= cap; });
      if (!pool.length) {
        return candidates.reduce(function (best, pl) {
          return pl.price[0] < best.price[0] ? pl : best;
        });
      }
      /* 先按预算挑最贵的一档，再看用途匹配度。
         反着来（用途匹配数优先）会让多用途方案永远压住单用途方案：
         t6000 同时标了 game 和 create 就拿 2 分，预算 13000 也顶不到 t8500。
         上限用 price[1] 兜住，避免为了够预算挑中尾巴爆表的方案。 */
      var fit = pool.filter(function (pl) { return pl.price[1] <= budgetCap * 1.5; });
      var band = fit.length ? fit : pool;
      return band.reduce(function (best, pl) {
        if (pl.price[0] !== best.price[0]) return pl.price[0] > best.price[0] ? pl : best;
        var score = scoreOf(pl);
        var bestScore = scoreOf(best);
        return score > bestScore ? pl : best;
      }, band[0]);
    }

    function pickItems(catId, use, pref, budgetCap, plan, intensity, look) {
      var cat = D.categories.filter(function (c) { return c.id === catId; })[0];
      if (!cat) return null;
      // 目标价位取方案配置单同类部件价位
      var targets = planPartTargets(plan);
      var allowance = targets.byCat[catId] || budgetCap * 0.2;
      if (catId === "cooler" && use.indexOf("portable") === -1) allowance = Math.max(allowance, 150);
      // 电源与机箱同属 psu 类别；推荐「电源」位时排除机箱（与快速推荐同口径）
      var pool = cat.items;
      if (catId === "psu") {
        var onlyPsu = pool.filter(function (it) { return (it.style || "").indexOf("电源") !== -1; });
        if (onlyPsu.length) pool = onlyPsu;
      }

      var scored = pool.map(function (it) {
        var s = 0;
        // 场景匹配
        it.use.forEach(function (u) { if (use.indexOf(u) > -1) s += 3; });
        // 人群匹配
        it.audience.forEach(function (a) {
          var pids = use.map(function (u) {
            return u === "office" ? "office" : u === "game" ? "gamer" : u === "create" ? "creator" : "mobile";
          });
          if (pids.indexOf(a) > -1) s += 2;
        });
        // 预算匹配：越贴近目标价位且不超支越优。权重须高于性价比等级，
        // 否则高预算会被 S 级甜点件（通常正是中端价位）一路压回低档。
        var mid = (it.price[0] + it.price[1]) / 2;
        var ratio = allowance > 0 ? mid / allowance : 1;
        if (ratio <= 1) s += 2 + 5 * ratio;
        else if (ratio <= 1.5) s += 2;
        else s -= 3;
        // 偏好加成
        if (pref === "quiet" && it.tags.indexOf("静音") > -1) s += 2;
        if (pref === "rgb" && it.tags.indexOf("RGB") > -1) s += 2;
        if (pref === "ergo" && it.tags.indexOf("人体工学") > -1) s += 2;
        if (pref === "value" && it.tags.indexOf("高性价比") > -1) s += 1;
        if (look && look !== "any" && lookOf(it) === look) s += 3;
        s += it.rating * 0.5;
        // 性价比等级加权
        if (it.valueGrade && gradeOrder[it.valueGrade] !== undefined) s += gradeOrder[it.valueGrade];
        // 重度使用：静音/散热优先
        if (intensity === "heavy" && (it.tags.indexOf("静音") > -1 || it.tags.indexOf("散热") > -1)) s += 2;
        return { item: it, score: s };
      }).sort(function (a, b) { return b.score - a.score; });

      var top = scored[0];
      if (!top || top.score <= 0) return null;

      var why = "推荐理由：";
      var reasons = [];
      var hitUse = top.item.use.filter(function (u) { return use.indexOf(u) > -1; });
      if (hitUse.length) reasons.push("契合" + hitUse.map(function (u) { return useLabels[u]; }).join("/") + "场景");
      var mid = (top.item.price[0] + top.item.price[1]) / 2;
      if (mid <= allowance) reasons.push("在预算内");
      if (pref === "quiet" && top.item.tags.indexOf("静音") > -1) reasons.push("静音调校好");
      if (pref === "rgb" && top.item.tags.indexOf("RGB") > -1) reasons.push("RGB 灯效");
      if (pref === "ergo" && top.item.tags.indexOf("人体工学") > -1) reasons.push("符合人体工学");
      if (look && look !== "any" && lookOf(top.item) === look) {
        var _st = styleOf(look);
        if (_st) reasons.push("契合" + _st.name + "风格");
      }
      if (top.item.valueGrade) reasons.push("性价比等级 " + top.item.valueGrade);
      if (top.item.rating >= 5) reasons.push("推荐度满分");
      if (!reasons.length) reasons.push("综合性价比高");
      why += reasons.join("，") + "。" + (top.item.valueNote || top.item.specs);

      return { cat: cat, item: top.item, why: why };
    }

    render();
  }

  /* =========================================================
   * 五、预算适配器（#budget）：输入预算 → 自动匹配方案
   * ========================================================= */
  function initBudgetTool() {
    var input = document.getElementById("budgetInput");
    var chips = document.getElementById("budgetChips");
    var useRow = document.getElementById("budgetUse");
    var result = document.getElementById("budgetResult");
    if (!input || !chips || !useRow || !result) return;

    var state = { budget: 6000, use: "all", plan: null, rows: [], total: 0 };
    // 预设档与 plans.price 区间对齐
    var presets = [5000, 8000, 12000, 17000, 25000, 37000];

    function renderChips() {
      chips.innerHTML = presets.map(function (b) {
        var active = state.budget === b ? " active" : "";
        return '<button class="chip' + active + '" data-b="' + b + '">¥' + b + "</button>";
      }).join("");
      chips.querySelectorAll(".chip").forEach(function (b) {
        b.addEventListener("click", function () {
          state.budget = parseInt(b.getAttribute("data-b"), 10);
          input.value = state.budget;
          renderChips();
          renderResult();
        });
      });

      useRow.innerHTML = [{ id: "all", label: "全部用途" }, { id: "office", label: "办公学习" }, { id: "game", label: "游戏" }, { id: "create", label: "创作" }, { id: "portable", label: "便携" }].map(function (u) {
        var active = state.use === u.id ? " active" : "";
        return '<button class="chip' + active + '" data-u="' + u.id + '">' + u.label + "</button>";
      }).join("");
      useRow.querySelectorAll(".chip").forEach(function (b) {
        b.addEventListener("click", function () {
          state.use = b.getAttribute("data-u");
          renderChips();
          renderResult();
        });
      });
    }

    input.addEventListener("input", function () {
      var v = parseInt(input.value, 10);
      if (!isNaN(v) && v >= 1000) {
        state.budget = v;
        renderChips();
        renderResult();
      }
    });

    function matchPlan(budget) {
      var pool = D.plans.filter(function (pl) {
        if (pl.id === "mobile") return false; // 台式整机预算，不含便携补强包
        if (state.use !== "all" && pl.uses.indexOf(state.use) === -1) return false;
        return true;
      });
      if (!pool.length) pool = D.plans.filter(function (pl) { return pl.id !== "mobile"; });

      // 预算区间包含该预算 → 直接命中；否则取中值最接近的档位
      var hit = pool.filter(function (pl) { return budget >= pl.price[0] * 0.85 && budget <= pl.price[1] * 1.15; });
      if (hit.length) {
        return hit.reduce(function (best, pl) {
          var dBest = Math.abs((best.price[0] + best.price[1]) / 2 - budget);
          var dPl = Math.abs((pl.price[0] + pl.price[1]) / 2 - budget);
          return dPl < dBest ? pl : best;
        });
      }
      return pool.reduce(function (best, pl) {
        var dBest = Math.abs((best.price[0] + best.price[1]) / 2 - budget);
        var dPl = Math.abs((pl.price[0] + pl.price[1]) / 2 - budget);
        return dPl < dBest ? pl : best;
      });
    }

    function catalogOf(key) {
      return (D.partCatalog || []).filter(function (c) { return c.key === key; })[0] || null;
    }

    /* 「¥900-1300」→ 900。
       原来写的是 replace(/[^0-9]/g,"")，区间会被拼成 9001300 ——
       于是 defaultOpt 永远挑到目录里最贵的那一件：¥5000 预算选到核显入门档，
       配置单里却是 Ultra 9 285K + DDR5 64G，合计 ¥26799。
       功能没挂载过，所以这个 bug 一直没人看见（本次挂上去才暴露）。
       取区间下限作为「参考价」：配置单写的就是这个档位的起步价。 */
    function refPriceOf(s) {
      var m = String(s == null ? "" : s).replace(/,/g, "").match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    }

    /* 型号里的可比串：i5-14600KF → i5 / 14600kf、DDR5 32G → ddr5 / 32g。
       只留长度 ≥3 的：'r5' 'i5' 这类系列名在不同档位里重复出现，拿它比必然误配，
       而 '32g' '16g' 这种容量串恰恰是要比的。 */
    function modelKeys(s) {
      return (String(s || "").match(/[A-Za-z]*\d+[A-Za-z0-9]*/g) || [])
        .map(function (x) { return x.toLowerCase(); })
        .filter(function (x) { return x.length >= 3; });
    }

    function defaultOpt(part) {
      var cat = catalogOf(part[0]);
      if (!cat) return -1;
      /* 配置单这一行已经点名了型号，目录里若有同型号的档位，先认它。
         只按价位最近挑会挑出冲突件：核显入门档的 CPU 行（R5 8500G ¥900-1300）
         最近的是「i3-14100F / R5 5500 ¥800」——14100F 没有核显，
         而这条方案里根本没有独显行，点上就是一台点不亮的机器。
         按「命中几个型号串」打分而不是「命中任意一个」：
         'RTX 5060 Ti 16G' 与 'RTX 5060' 共有一个 5060，只看有无就会挑到便宜那档。 */
      var want = modelKeys(part[1]);
      var named = -1, namedScore = 0;
      cat.options.forEach(function (o, i) {
        var hit = modelKeys(o.n).filter(function (k) { return want.indexOf(k) > -1; }).length;
        if (hit > namedScore) { namedScore = hit; named = i; }
      });
      if (named > -1) return named;
      var refPrice = refPriceOf(part[2]);
      var best = 0, bd = Infinity;
      cat.options.forEach(function (o, i) {
        var d = Math.abs(o.p - refPrice);
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    }

    function buildRows(plan) {
      state.plan = plan;
      state.rows = plan.parts.map(function (part) {
        var opt = defaultOpt(part);
        var cat = catalogOf(part[0]);
        var price = opt >= 0
          ? cat.options[opt].p
          : refPriceOf(part[2]);
        var name = opt >= 0 ? cat.options[opt].n : part[1];
        return { part: part, opt: opt, price: price, name: name };
      });
    }

    function updateTotal() {
      var t = 0;
      state.rows.forEach(function (r) { t += r.price || 0; });
      state.total = t;
    }

    function renderResult() {
      var b = state.budget;
      var plan = matchPlan(b);
      if (!plan) { result.innerHTML = '<div class="empty-box">暂无匹配方案。</div>'; return; }
      if (state.plan !== plan) buildRows(plan);
      updateTotal();
      renderTable(plan, b);
    }

    function renderTable(plan, b) {
      var trs = state.rows.map(function (r, i) {
        var part = r.part;
        var cat = catalogOf(part[0]);
        var detail = part[3] ? '<span class="plan-detail">' + esc(part[3]) + "</span>" : "";
        var ctrl;
        if (cat) {
          var opts = cat.options.map(function (o, oi) {
            return '<option value="' + oi + '"' + (oi === r.opt ? " selected" : "") + ">" + esc(o.n) + "（¥" + o.p + "）</option>";
          }).join("");
          ctrl =
            '<div class="part-ctrl">' +
              '<select class="part-select" data-i="' + i + '" aria-label="' + esc(part[0]) + ' 型号">' + opts + "</select>" +
              '<span class="part-price-box"><span class="part-currency">¥</span>' +
              '<input type="number" class="part-price" data-i="' + i + '" min="0" step="50" value="' + r.price + '" aria-label="' + esc(part[0]) + ' 价格" /></span>' +
            "</div>" + detail;
        } else {
          ctrl = '<span class="part-static">' + esc(part[1]) + "</span>" + detail;
        }
        return "<tr><td>" + esc(part[0]) + "</td><td>" + ctrl + "</td><td class=\"plan-price\">" + (cat ? "¥" + r.price : esc(part[2])) + "</td></tr>";
      }).join("");

      var personas = (plan.personas || []).map(function (pid) {
        var p = D.personas.filter(function (x) { return x.id === pid; })[0];
        return p ? '<span class="tag-pill">' + p.icon + " " + p.name + "</span>" : "";
      }).join("");

      var diff = b - state.total;
      var tipHtml;
      if (diff >= 0 && diff <= b * 0.05) {
        tipHtml = '<div class="budget-tip">当前配置总价 <b>¥' + state.total + '</b>，预算 ¥' + b + '，<b>刚好达标</b>，可直接照单购买。</div>';
      } else if (diff > b * 0.05) {
        tipHtml = '<div class="budget-tip">当前配置总价 ¥' + state.total + '，比预算省 <b>¥' + diff + '</b>。富余可：升级显示器 4K / 加 2TB 硬盘 / 升键鼠。</div>';
      } else if (diff >= -b * 0.1) {
        tipHtml = '<div class="budget-tip warn">当前配置总价 ¥' + state.total + '，超预算 <b>¥' + (-diff) + '</b>（约 ' + Math.round(-diff / b * 100) + '%）。建议：最贵的部件降一档，或去掉可后补的外设。</div>';
      } else {
        tipHtml = '<div class="budget-tip warn">超预算较多（¥' + (-diff) + '，' + Math.round(-diff / b * 100) + '%）。建议：切换更低档方案，或逐件下调，优先动显卡和显示器，体验影响最可控。</div>';
      }

      result.innerHTML =
        '<div class="budget-result reveal in">' +
          '<div class="budget-head">' +
            '<span class="plan-icon">' + plan.icon + "</span>" +
            '<div><h3 class="plan-name">' + esc(plan.name) + '<span class="plan-tier">' + esc(plan.budgetLabel) + "</span></h3>" +
            '<span class="plan-budget">适合人群 ' + personas + " ｜ 每个部件都可换型号、改价格</span></div>" +
            '<button type="button" class="budget-copy" title="复制当前配置单为文本">复制配置单</button>' +
          "</div>" +
          '<table class="plan-table part-table"><thead><tr><th>部件</th><th>型号 / 档位（下拉可换）＋ 价格（可改）</th><th>小计</th></tr></thead><tbody>' + trs + "</tbody></table>" +
          '<div class="res-total">当前配置合计：<b>¥' + state.total + '</b> ｜ 你的预算 <b>¥' + b + '</b> ｜ ' +
            (diff >= 0 ? "结余 <b style=\"color:#16a34a\">¥" + diff + "</b>" : "超支 <b style=\"color:#dc2626\">¥" + (-diff) + "</b>") +
          "</div>" +
          tipHtml +
          '<div class="res-note">' + esc(D.note) + "。改动价格仅用于预算试算，购机请以电商实时价为准。</div>" +
          pitfallsHTML(state.use) +
        "</div>";

      // 绑定交互：换型号
      result.querySelectorAll(".part-select").forEach(function (sel) {
        sel.addEventListener("change", function () {
          var i = parseInt(sel.getAttribute("data-i"), 10);
          var opt = parseInt(sel.value, 10);
          var o = catalogOf(state.rows[i].part[0]).options[opt];
          state.rows[i].opt = opt;
          state.rows[i].price = o.p;
          state.rows[i].name = o.n;
          updateTotal();
          renderTable(plan, b);
        });
      });
      // 绑定交互：改价格（仅更新合计与提示，避免整表重渲染丢焦点）
      result.querySelectorAll(".part-price").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var i = parseInt(inp.getAttribute("data-i"), 10);
          var v = parseInt(inp.value, 10);
          state.rows[i].price = isNaN(v) ? 0 : Math.max(0, v);
          updateTotal();
          var t = state.total, d = b - t;
          var totalEl = result.querySelector(".res-total");
          if (totalEl) {
            totalEl.innerHTML = '当前配置合计：<b>¥' + t + '</b> ｜ 你的预算 <b>¥' + b + '</b> ｜ ' +
              (d >= 0 ? "结余 <b style=\"color:#16a34a\">¥" + d + "</b>" : "超支 <b style=\"color:#dc2626\">¥" + (-d) + "</b>");
          }
          var tipEl = result.querySelector(".budget-tip");
          if (tipEl) tipEl.className = "budget-tip" + (d < 0 ? " warn" : "");
        });
      });
      // 绑定交互：复制配置单
      var copyBtn = result.querySelector(".budget-copy");
      if (copyBtn) copyBtn.addEventListener("click", copyPlan);
    }

    function copyPlan() {
      var plan = state.plan;
      if (!plan || !state.rows.length) return;
      var sep = "----------------------------------------";
      var lines = [];
      lines.push("【" + plan.name + "】 " + plan.budgetLabel);
      lines.push("预算：¥" + state.budget + " ｜ 当前配置合计：¥" + state.total);
      lines.push(sep);
      state.rows.forEach(function (r) {
        lines.push("· " + r.part[0] + "：" + r.name + "（¥" + r.price + "）");
        if (r.part[3]) lines.push("　  " + r.part[3]);
      });
      lines.push(sep);
      lines.push(D.note);
      copyToClipboard(lines.join("\n"), result.querySelector(".budget-copy"));
    }

    renderChips();
    renderResult();
  }

  /* =========================================================
   * 颜值外观画廊（#looks）
   * ========================================================= */
  function initLooks() {
    var wrap = document.getElementById("lookGallery");
    if (!wrap || !STYLES.length) return;

    wrap.innerHTML = STYLES.map(function (s) {
      var sw = (s.palette || []).map(function (c) {
        return '<span class="look-swatch" style="background:' + c + '"></span>';
      }).join("");
      var cnt = countByStyle(s.id);
      return (
        '<article class="look-card reveal in">' +
          '<div class="look-cover">' +
            '<img src="' + s.img + '" alt="' + esc(s.name) + ' 风格参考图" loading="lazy" />' +
            '<span class="look-badge">' + esc(s.name) + "</span>" +
          "</div>" +
          '<div class="look-body">' +
            "<h3 class=\"look-name\">" + esc(s.name) + "</h3>" +
            '<p class="look-desc">' + esc(s.desc) + "</p>" +
            '<div class="look-pal"><span class="look-pal-name">配色 · ' + esc(s.paletteName || "") + "</span>" +
              '<div class="look-swatches">' + sw + "</div></div>" +
            '<ul class="look-meta">' +
              '<li><span class="lm-k">适合</span><span class="lm-v">' + esc(s.suits || "") + "</span></li>" +
              '<li><span class="lm-k">机箱</span><span class="lm-v">' + esc(s.caseType || "") + " — " + esc(s.caseTip || "") + "</span></li>" +
              '<li><span class="lm-k">灯光</span><span class="lm-v">' + esc(s.lighting || "") + "</span></li>" +
              '<li><span class="lm-k">点缀</span><span class="lm-v">' + esc(s.accents || "") + "</span></li>" +
              '<li class="lm-avoid"><span class="lm-k">避坑</span><span class="lm-v">' + esc(s.avoid || "") + "</span></li>" +
            "</ul>" +
            '<div class="look-foot">' +
              '<span class="look-count">' + cnt + " 款配件适配</span>" +
              '<button class="btn btn-ghost look-jump" data-look="' + s.id + '">查看该风格配件 →</button>' +
            "</div>" +
          "</div>" +
        "</article>"
      );
    }).join("");

    wrap.querySelectorAll(".look-jump").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-look");
        window.location.href = "accessories.html?look=" + encodeURIComponent(id);
      });
    });
  }

  /* 颜值搭配 6 大原则 */
  function initLookPrinciples() {
    var wrap = document.getElementById("lookPrinciples");
    if (!wrap || !PRINCIPLES.length) return;
    wrap.innerHTML = PRINCIPLES.map(function (p) {
      return (
        '<article class="card reveal in">' +
          '<div class="card-icon">' + p.icon + "</div>" +
          '<h3 class="card-title">' + esc(p.title) + "</h3>" +
          '<p class="card-text">' + esc(p.text) + "</p>" +
        "</article>"
      );
    }).join("");
  }

  /* 机箱 × 风格 速查 */
  function initLookCases() {
    var wrap = document.getElementById("lookCases");
    if (!wrap || !STYLES.length) return;
    wrap.innerHTML = STYLES.map(function (s) {
      var sw = (s.palette || []).slice(0, 3).map(function (c) {
        return '<span class="look-swatch sm" style="background:' + c + '"></span>';
      }).join("");
      return (
        '<div class="case-row reveal in">' +
          '<div class="case-head">' +
            '<span class="case-icon">' + s.icon + "</span>" +
            '<div class="case-titles"><span class="case-name">' + esc(s.name) + "</span>" +
              '<span class="case-type">' + esc(s.caseType || "") + "</span></div>" +
            '<div class="look-swatches">' + sw + "</div>" +
          "</div>" +
          '<p class="case-tip">' + esc(s.caseTip || "") + "</p>" +
        "</div>"
      );
    }).join("");
  }

  /* 细节赏析图廊 */
  function initLookDetails() {
    var wrap = document.getElementById("lookDetails");
    if (!wrap || !DETAILS.length) return;
    wrap.innerHTML = DETAILS.map(function (d) {
      return (
        '<figure class="detail-fig reveal in">' +
          '<div class="detail-cover"><img src="' + d.img + '" alt="' + esc(d.tag) + '" loading="lazy" />' +
            '<span class="detail-tag">' + esc(d.tag) + "</span></div>" +
          '<figcaption class="detail-cap">' + esc(d.text) + "</figcaption>" +
        "</figure>"
      );
    }).join("");
  }

  /* 颜值避坑指南 */
  function initLookPitfalls() {
    var wrap = document.getElementById("lookPitfalls");
    if (!wrap || !PITFALLS.length) return;
    wrap.innerHTML = PITFALLS.map(function (p) {
      return (
        '<div class="pitfall reveal in">' +
          '<span class="pf-badge">✕ ' + esc(p.bad) + "</span>" +
          '<p class="pf-text">' + esc(p.text) + "</p>" +
        "</div>"
      );
    }).join("");
  }

  /* =========================================================
   * 智能推荐（#smart）：3 个关键问题 → 方案 + 核心配件
   * ========================================================= */
  function initSmart() {
    var wrap = document.getElementById("smartResult");
    var qBudget = document.getElementById("smartBudget");
    var qUse = document.getElementById("smartUse");
    var qForm = document.getElementById("smartForm");
    var qIntensity = document.getElementById("smartIntensity");
    var qMonitor = document.getElementById("smartMonitor");
    var qLook = document.getElementById("smartLook");
    var btn = document.getElementById("smartGo");
    if (!wrap || !qBudget || !qUse || !qForm || !btn) return;

    var state = { budget: null, use: null, form: null, look: null, intensity: "mid", monitor: "need" };
    // 档位 label 与 budget 值与 plans.price 区间对齐
    var budgetOpts = [
      { id: "3000", label: "5500 元以内", budget: 4800 },
      { id: "4500", label: "5500-8500 元", budget: 7500 },
      { id: "6000", label: "8500-13000 元", budget: 11000 },
      { id: "8500", label: "13000-18500 元", budget: 16000 },
      { id: "12000", label: "18500-30000 元", budget: 24000 },
      { id: "20000", label: "30000 元以上", budget: 37000 }
    ];
    var useOpts = [
      { id: "office", label: "办公学习" },
      { id: "game", label: "游戏电竞" },
      { id: "create", label: "内容创作" },
      { id: "portable", label: "移动便携" }
    ];
    var formOpts = [
      { id: "desktop", label: "台式整机" },
      { id: "laptop", label: "笔记本电脑" },
      { id: "phone", label: "手机" },
      { id: "tablet", label: "平板" },
      { id: "both", label: "多台互补" }
    ];
    var intensityOpts = [
      { id: "light", label: "轻量够用" },
      { id: "mid", label: "主流均衡" },
      { id: "heavy", label: "性能拉满" }
    ];
    var monitorOpts = [
      { id: "need", label: "需要一起配" },
      { id: "have", label: "已有显示器" }
    ];

    function renderRow(row, items, key) {
      row.innerHTML = items.map(function (it) {
        var active = state[key] === it.id ? " active" : "";
        return '<button type="button" class="chip' + active + '" data-v="' + it.id + '">' + termify(it.label) + "</button>";
      }).join("");
      row.querySelectorAll(".chip").forEach(function (b) {
        b.addEventListener("click", function () {
          var v = b.getAttribute("data-v");
          state[key] = state[key] === v ? null : v;
          renderRow(row, items, key);
          updateHint();
        });
      });
    }

    // 进度提示：告诉用户还差哪几项必答（第 4-6 题可跳过，按默认值走）
    var hintEl = document.getElementById("smartHint");
    function updateHint() {
      if (!hintEl) return;
      var missing = [];
      if (!state.budget) missing.push("预算");
      if (!state.use) missing.push("用途");
      if (!state.form) missing.push("设备形态");
      if (missing.length) {
        hintEl.className = "smart-hint";
        hintEl.textContent = "还差 " + missing.join("、") + " 没选（共 3 项必答）。第 4-6 题可以跳过，不选就按主流默认给；勾了「已有显示器」会把显示器从配置单里去掉，合计同步减少。";
      } else {
        hintEl.className = "smart-hint ready";
        hintEl.textContent = "必答 3 项已选好，点「生成推荐」出方案。第 4-6 题可跳过。";
      }
    }

    renderRow(qBudget, budgetOpts, "budget");
    renderRow(qUse, useOpts, "use");
    renderRow(qForm, formOpts, "form");
    if (qIntensity) renderRow(qIntensity, intensityOpts, "intensity");
    if (qMonitor) renderRow(qMonitor, monitorOpts, "monitor");
    if (qLook) {
      renderRow(qLook, [{ id: "all", label: "不限定" }].concat(STYLES.map(function (s) {
        return { id: s.id, label: s.name };
      })), "look");
    }
    updateHint();

    /* 方案匹配：预算、用途、形态三者都参与，"不超预算"优先。
       旧实现只看区间中心距离，于是 ① 上限允许到 1.15 倍，超预算也算命中
       ② 办公与游戏都落到同一套（因为那套的 uses 同时写着两个用途）。 */
    function matchPlan() {
      // state.budget 是档位 id，先换算成真实预算
      var opt = budgetOpts.filter(function (o) { return o.id === state.budget; })[0];
      var b = (opt && opt.budget) || 11000;
      if (MOBILE_BUDGET_AXIS[state.form]) b = mobileBudgetCap(state.form, {
        3000: "b3000", 4500: "b4500", 6000: "b6000",
        8500: "b8500", 12000: "b12000", 20000: "b20000"
      }[state.budget] || "b6000");
      var pool = D.plans.filter(function (pl) {
        if (!formFit(pl, state.form)) return false;
        if (state.use && state.use !== "all" && pl.uses.indexOf(state.use) === -1) return false;
        return true;
      });
      if (!pool.length) {
        pool = D.plans.filter(function (pl) { return formFit(pl, state.form); });
      }
      function scoreOf(pl) {
        var s;
        if (pl.price[0] <= b) {
          // 起步价在预算内：吃到的预算越多越好；上限远超预算要扣
          s = 40 + Math.min(40, (pl.price[0] / b) * 45);
          if (pl.price[1] > b * 1.35) s -= 15;
        } else {
          // 起步就超预算：差得越多越靠后
          s = 10 - Math.min(30, ((pl.price[0] - b) / b) * 30);
        }
        // 用途专门度：只服务这一个用途的方案更贴题，办公与游戏因此分开
        if (state.use && state.use !== "all" && pl.uses.length === 1 && pl.uses[0] === state.use) s += 8;
        return s;
      }
      var best = pool.reduce(function (a, pl) { return scoreOf(pl) > scoreOf(a) ? pl : a; }, pool[0]);
      return {
        plan: best,
        fit: (b >= best.price[0] * 0.85 && b <= best.price[1] * 1.15) ? "exact" : "nearest",
        budget: b,
        pool: pool
      };
    }

    // 推荐理由：基于用途与强度
    function pickWhy(item, use, intensity) {
      var parts = [];
      if (use && item.use.indexOf(use) !== -1) parts.push("适配" + (useLabels[use] || use) + "场景");
      if (intensity === "heavy" && (item.valueGrade === "S" || item.valueGrade === "A")) parts.push("高强度下性价比高");
      if (intensity === "light" && (item.valueGrade === "S" || item.valueGrade === "A")) parts.push("预算内最优解");
      return parts.length ? "推荐理由：" + parts.join("、") : "";
    }

    function recommendItems(plan, use, intensity, needMonitor) {
      var cats = needMonitor
        ? ["cpu", "gpu", "cooler", "monitor", "input", "audio", "psu"]
        : ["cpu", "gpu", "cooler", "input", "audio", "psu"];
      var out = [];
      var capBase = plan.price[1];
      var cap = intensity === "light" ? capBase * 0.72
              : intensity === "heavy" ? capBase * 1.08
              : capBase * 0.92;
      var base = mid(plan.price);
      var targets = planPartTargets(plan);
      var hasGpu = !!(plan.parts || []).filter(function (r) { return r[0] === "显卡"; }).length;
      var partNames = {
        cpu: ["CPU"], gpu: ["显卡"], cooler: ["散热"], monitor: ["显示器"],
        input: ["键鼠"], audio: ["音频", "耳机/音箱"], psu: ["电源"]
      };
      cats.forEach(function (cid) {
        // 核显机不推独显
        if (cid === "gpu" && !hasGpu) return;
        var cat = null;
        D.categories.forEach(function (c) { if (c.id === cid) cat = c; });
        if (!cat || !cat.items.length) return;
        // 用途严格匹配
        var items = cat.items.filter(function (it) {
          if (!use) return true;
          return it.use.indexOf(use) !== -1;
        });
        if (!items.length) items = cat.items.slice();
        var rowText = planRowOf(plan, partNames[cid]);

        // 键鼠拆成键盘、鼠标两张卡，组合目标价 55/45 拆分
        if (cid === "input") {
          var combo = targets.byCat.input ? targets.byCat.input / (PART_SPLIT["键鼠"] || 1) : base * 0.05;
          combo = Math.min(combo, cap);
          var segs = rowText.split(/[+＋]/);
          var kbItems = items.filter(function (it) { return (it.style || "").indexOf("键盘") !== -1; });
          var msItems = items.filter(function (it) { return (it.style || "").indexOf("鼠标") !== -1; });
          var kbPick = pickOne(kbItems.length ? kbItems : items, combo * 0.55, segs[0] || "", cat.items);
          var msPick = pickOne(msItems.length ? msItems : items, combo * 0.45, segs[1] || "", cat.items);
          if (kbPick) out.push({ cat: cat, label: "键盘", pick: kbPick });
          if (msPick) out.push({ cat: cat, label: "鼠标", pick: msPick });
          return;
        }
        if (cid === "psu") {
          // psu 类别含机箱，电源位须先排除
          var onlyPsu = items.filter(function (it) { return (it.style || "").indexOf("电源") !== -1; });
          if (onlyPsu.length) items = onlyPsu;
          // SFX 仅 ITX 用，现有方案不需要
          var noSfx = items.filter(function (it) { return (it.specs || "").indexOf("SFX") === -1; });
          if (noSfx.length) items = noSfx;
        }
        if (cid === "audio") {
          // 音频不走价位窗口，按场景过滤取等级最高者
          var ranked = items.slice().sort(function (a, b) {
            var d = (gradeOrder[b.valueGrade] || 0) - (gradeOrder[a.valueGrade] || 0);
            return d !== 0 ? d : b.rating - a.rating;
          });
          if (ranked[0]) out.push({ cat: cat, pick: { item: ranked[0], anchor: false, alts: ranked.slice(1, 3) } });
          return;
        }
        // 目标价位取配置单同类部件价位，未列的按整机中值 3% 兜底
        var target = Math.min(targets.byCat[cid] || base * 0.03, cap);
        var p = pickOne(items, target, rowText, cat.items);
        if (p) out.push({ cat: cat, pick: p });
      });
      return out;
    }

    btn.addEventListener("click", function () {
      if (!state.budget || !state.use) {
        wrap.innerHTML = '<div class="empty-box">请先选择「预算」和「用途」，再点击生成推荐。</div>';
        return;
      }
      var m = matchPlan();
      var use = state.use === "portable" ? null : state.use;
      var intensity = state.intensity || "mid";
      /* 第 5 题「已有显示器」现在真的生效：按配置单行跳过，合计同步减去。
         旧实现只拿它去过滤一份没被使用的推荐列表，结果页照样算钱。 */
      var skipParts = state.monitor === "have" ? ["显示器", "外接显示器"] : [];
      var skipLabels = state.monitor === "have" ? ["显示器"] : [];
      var lookPref = (state.look && state.look !== "all") ? state.look : "any";
      var bias = buildBias("all", "", "", lookPref);
      var targetScale = intensity === "light" ? 0.85 : intensity === "heavy" ? 1.12 : 1;
      // 主推 + 相邻两档：同用途整机方案按整机价排序，取主推前后各一档
      var desk = (m.pool || [m.plan]).filter(function (pl) { return pl.id !== "mobile"; });
      if (!desk.length) desk = [m.plan];
      var sorted = desk.slice().sort(function (a, b) { return mid(a.price) - mid(b.price); });
      var mainIdx = 0;
      sorted.forEach(function (pl, i) { if (pl.id === m.plan.id) mainIdx = i; });
      var sets = [];
      if (mainIdx > 0) sets.push({ plan: sorted[mainIdx - 1], tag: "省预算" });
      sets.push({ plan: m.plan, tag: "为你匹配", main: true });
      var mainSetIdx = sets.length - 1;
      if (mainIdx < sorted.length - 1) sets.push({ plan: sorted[mainIdx + 1], tag: "加预算" });
      var warnHtml = budgetWarnHtml(m.plan, m.budget, mainIdx < sorted.length - 1, use, state.form, mainIdx > 0);
      /* 结果页组装：配置单表格与方案卡用模块级函数 */
      /* 单张配件卡：cur = { item, anchor, alts } */
      function cardHtml(o, cur) {
        var it = cur.item;
        var grade = it.valueGrade ? '<span class="grade grade-' + it.valueGrade + '">' + it.valueGrade + "</span>" : "";
        var st = cur.state;
        var anchorBadge = st === "exact" ? '<span class="anchor-badge">配置单同款</span>'
          : st === "candidate" ? '<span class="anchor-badge anchor-cand">配置单候选之一</span>'
          : st === "chipset" ? '<span class="anchor-badge anchor-tier">配置单档位的具体型号</span>'
          : st === "alt" ? '<span class="fp-badge fp-alt-badge">同档位替代</span>'
          : "";
        var altsHtml = (cur.alts && cur.alts.length)
          ? '<div class="smart-alts">备选：' + cur.alts.map(function (a, ai) {
              return '<button type="button" class="smart-alt-chip" data-alt="' + ai + '">' + esc(a.model) + "</button>";
            }).join("") + "</div>"
          : "";
        var why = pickWhy(it, use, intensity);
        return (
          '<article class="acc-card reveal in">' +
            '<div class="acc-head"><div><span class="acc-cat">' + o.cat.icon + " " + esc(o.label || o.cat.name) + anchorBadge + "</span>" +
            '<h4 class="acc-name">' + esc(it.name) + "</h4>" +
            (it.brand && it.model ? '<span class="acc-model">' + esc(it.brand + " " + it.model) + "</span>" : "") + "</div>" +
            '<span class="acc-price">' + fmtPrice(it.price) + "</span></div>" +
            '<div class="acc-meta"><span class="acc-style">' + esc(it.style) + "</span>" +
            '<span class="acc-rating">' + "★★★★★".slice(0, it.rating) + "</span>" + grade + "</div>" +
            (why ? '<div class="smart-why">' + esc(why) + "</div>" : "") +
            (it.valueNote ? '<div class="acc-note">' + esc(it.valueNote) + "</div>" : "") +
            productImageLink(it) +
            altsHtml +
          "</article>"
        );
      }
      function renderSlot(picks, i, cur) {
        var el = document.getElementById("smartSlot-" + i);
        if (!el) return;
        var o = picks[i];
        el.innerHTML = cardHtml(o, cur);
        el.querySelectorAll(".smart-alt-chip").forEach(function (chip) {
          chip.addEventListener("click", function () {
            var ai = parseInt(chip.getAttribute("data-alt"), 10);
            var chosen = cur.alts[ai];
            var newAlts = cur.alts.slice();
            newAlts.splice(ai, 1, cur.item);
            renderSlot(picks, i, { item: chosen, anchor: false, state: "alt", alts: newAlts });
          });
        });
      }
      function renderSet(si) {
        var s = sets[si];
        var body = document.getElementById("smartSetBody");
        if (!body) return;
        // 每次切换方案都新建 opts：复用上一套的 rows 会让两套结果串味
        var opts = {
          uses: use ? [use] : [], priority: [], budgetCap: m.budget,
          skipParts: skipParts, bias: bias, targetScale: targetScale,
          scaleOf: buildTargetScale("all", "", lookPref), look: lookPref
        };
        var rows = fullPartRows(s.plan, opts);
        opts.rows = rows;
        var spec = specTableHtml(s.plan, { rows: rows });
        var skipTip = (rows.skipped && rows.skipped.length)
          ? '<div class="res-skip-note">已按你勾选的「' + esc(skipLabels.join(" / ")) +
              "」跳过 " + rows.skipped.length + " 个部件（" +
              rows.skipped.map(function (x) { return esc(x.part); }).join("、") +
              "），合计已相应减去。</div>"
          : "";
        body.innerHTML =
          (s.main ? warnHtml : "") +
          planBriefHtml(s.plan) +
          skipTip +
          spec.html +
          '<h3 class="smart-sub-title reveal in">每个部件买什么型号</h3>' +
          '<p class="smart-sub-title-note">按配置单顺序逐项给型号与备选，整机件和外设都在内。标「配置单同款」的是配置单点名且型号完全一致的；标「配置单候选之一」的说明配置单写的是二选一；标「同档位替代」的表示库里没有完全对得上的型号，已在上方写明差异。主板、内存、硬盘、机箱没有独立型号库，按配置单档位直选。</p>' +
          fullPartsHtml(s.plan, opts) +
          '<div class="res-total">整体投入参考：<b>' + fmtPrice(spec.total) + "</b>（按配置单各行参考价累加，与上方配件同型号同价）</div>" +
          '<p class="smart-note">' + esc((state.form === "phone" || state.form === "tablet") && D.noteMobile ? D.noteMobile : D.note) + "</p>";
      }
      wrap.innerHTML =
        '<div class="smart-res-head reveal in">' +
        (sets.length > 1 ? "为你匹配 " + sets.length + " 套方案，点标签切换对比" : "你的推荐配置单") +
        "</div>" +
        planSetTabsHtml(sets, mainSetIdx) +
        '<div id="smartSetBody"></div>';
      bindPlanSetTabs(wrap, renderSet);
      renderSet(mainSetIdx);
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---- 启动 ---- */
  function boot() {
    mergeModels();
    initAccessories();
    initPlans();
    initTopList();
    initLooks();
    initLookPrinciples();
    initLookCases();
    initLookDetails();
    initLookPitfalls();
    initSmart();
    initQuiz();
    initBudgetTool();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
      /* 搜索自检出口：给 tests/ 与验收脚本读「条目口径」。
         卡片数 ≠ 条目数（49 组重复合并成 1160 张卡），只看 DOM 数不出「44 块 M.2 是否全覆盖」。
         这里返回的是与渲染走同一份 matchRank 的原始结果，只读，不写状态。 */
      /* 配置单价与生态判定不依赖配件页 DOM，挂到 IIFE 顶层，所有页面（含 smart.html）都能读。
         搜索自检（segment/rank）依赖 initAccessories 作用域里的 matchInfo/segmentQuery，
         仍留在那边挂载；两处都用合并式赋值，谁先执行都不会把对方覆盖掉。 */
      if (typeof window !== "undefined") {
        var DGX = window.PCRecoDiag = window.PCRecoDiag || {};
        /* 配置单每行的目标价（测试与验收读这里，别在测试里复算 —— 复算一份就等于两套实现）。
           byPart = 行名口径（实际使用值），byCat = 品类中位数兜底。 */
        DGX.targets = function (planId) {
          var pl = null;
          D.plans.forEach(function (p) { if (p.id === planId) pl = p; });
          return pl ? planPartTargets(pl) : null;
        };
        /* 生态判定单测出口：C2 要求「苹果件在苹果主体下不被误杀」，
           但站内推荐当前挑不到苹果机型（实测 50 组问卷 0 次），端到端不可达，
           只能在这里直接验判定本身。只读。 */
        DGX.compat = function (itemName, bodyEco, bodyCatId) {
          var LIB = (typeof window !== "undefined" && window.PC_MODELS) || {};
          var hit = null;
          Object.keys(LIB).forEach(function (k) {
            (LIB[k] || []).forEach(function (it) { if (!hit && it.name === itemName) hit = it; });
          });
          if (!hit) return { found: false };
          return {
            found: true, id: hit.id, brand: hit.brand,
            eco: ecoOfBrand(hit.brand), fit: fitOf(hit),
            drop: compatDrop(hit, bodyEco, bodyCatId),
            note: compatNote(hit)
          };
        };
        /* 配置单每行的选件结果（26 套方案全覆盖用）。传 opts 可指定 budgetCap / uses / pref，
           与页面同一份 fullPartRows，不另算一套。 */
        DGX.rows = function (planId, opts) {
          var pl = null;
          D.plans.forEach(function (p) { if (p.id === planId) pl = p; });
          if (!pl) return null;
          var rs = fullPartRows(pl, opts || {});
          return {
            plan: pl.id,
            rows: rs.map(function (r) {
              var it = r.pick && r.pick.item;
              return {
                part: r.part, srcPart: r.srcPart || r.part, cat: r.cat ? r.cat.id : "", config: r.config,
                id: it ? it.id : null, name: it ? it.name : null, brand: it ? it.brand : null,
                specs: it ? it.specs : null,
                price: it ? it.price : null,
                text: r.textPick ? r.textPick.name : null,
                blocked: r.compatBlocked || 0,
                blank: r.blankReason || "",
                soft: r.softNote || ""
              };
            }),
            skipped: (rs.skipped || []).map(function (s2) { return s2.part; }),
            planParts: (pl.parts || []).map(function (r) { return r[0]; })
          };
        };
      }

})();
