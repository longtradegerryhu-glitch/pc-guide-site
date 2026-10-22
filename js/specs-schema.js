/* 21 品类 specs schema 定义 · ORD-06 第 0 批
   状态：第 1 批已接线（ORD-14）。本文件仍不解析、不写数据，只做字段定义；
   解析在 tools/specs-derive.cjs，产物写进 js/models-data.js 的 specsObj，
   搜索（js/recommend.js 的 matchRank）读硬字段层，第 4 批对比表读同一份定义。
   字段排序 = 用户选购决策顺序：硬约束（装不装得上）→ 性能 → 体验 → 外观。
   键名约定：k=key n=显示名 t=类型 u=单位 r=必填(1/0) ex=示例值
             d=数据来源 derive(可从现有 specs 解析) / manual(现库没有，须外部核验补录)
             e=枚举取值 s=该字段应能响应的搜索词 */
(function (global) {
  'use strict';

  var VERSION = 1;

  /* 类型：num 数值(可比较) / enum 枚举(可分组) / bool 布尔 / text 自由文本(不参与对比排序) */
  var TYPES = ['num', 'enum', 'bool', 'text'];

  var CATS = {

    /* ── CPU ── 现库位置：[0]核线程 [1]架构/插槽/频率 [2]功耗/插槽/核显 [3]插槽/功耗/工艺
       实测 61 款，3~7 段。插槽出现在 [1][2][3] 三个位置，位置对齐必然错位。 */
    cpu: { label: 'CPU', fields: [
      { k: 'socket',      n: '插槽',     t: 'enum', r: 1, ex: 'AM5', d: 'derive', open: 1, s: ['am5', 'lga1700', 'am4', 'lga1851'] },
      { k: 'cores',       n: '核心数',   t: 'num',  u: '核',   r: 1, ex: '8',  d: 'derive', s: ['8核', '核心'] },
      { k: 'threads',     n: '线程数',   t: 'num',  u: '线程', r: 1, ex: '16', d: 'derive', s: ['16线程'] },
      { k: 'pCores',      n: 'P 核数',   t: 'num',  u: '核',   r: 0, ex: '6',  d: 'derive', s: ['p核'] },
      { k: 'eCores',      n: 'E 核数',   t: 'num',  u: '核',   r: 0, ex: '8',  d: 'derive', s: ['e核'] },
      { k: 'boostClock',  n: '加速频率', t: 'num',  u: 'GHz',  r: 1, ex: '5.2', d: 'derive', s: ['5.2ghz', '睿频'] },
      { k: 'baseClock',   n: '基础频率', t: 'num',  u: 'GHz',  r: 0, ex: '3.8', d: 'manual' },
      { k: 'tdp',         n: 'TDP',      t: 'num',  u: 'W',    r: 1, ex: '65', d: 'derive', s: ['65w', '功耗'] },
      { k: 'l3cache',     n: '三级缓存', t: 'num',  u: 'MB',   r: 0, ex: '32', d: 'manual', s: ['32mb缓存'] },
      { k: 'lithography', n: '制程',     t: 'num',  u: 'nm',   r: 0, ex: '4',  d: 'derive' },
      { k: 'igpu',        n: '核显',     t: 'enum', r: 1, ex: 'Radeon Graphics', d: 'derive', e: ['有', '无'], s: ['核显', '无核显'] },
      { k: 'arch',        n: '架构',     t: 'text', r: 1, ex: 'Zen 5', d: 'derive' },
      { k: 'overclock',   n: '可超频',   t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['超频'] }
    ]},

    /* ── 主板 ── 现库 6~10 段，[5][6][7] 段里板型和 WiFi 混排，是错位最严重的品类之一 */
    mobo: { label: '主板', fields: [
      { k: 'socket',     n: '插槽',       t: 'enum', r: 1, ex: 'AM5', d: 'derive', open: 1, s: ['am5', 'lga1700'] },
      { k: 'chipset',    n: '芯片组',     t: 'enum', r: 1, ex: 'B850', d: 'derive', open: 1, s: ['b850', 'x870e', 'z890'] },
      { k: 'formFactor', n: '板型',       t: 'enum', r: 1, ex: 'ATX', d: 'derive', e: ['EATX', 'ATX', 'MATX', 'ITX'], s: ['atx', 'matx', 'itx'] },
      { k: 'memType',    n: '内存类型',   t: 'enum', r: 1, ex: 'DDR5', d: 'derive', e: ['DDR5', 'DDR4'], s: ['ddr5'] },
      { k: 'memSlots',   n: '内存插槽',   t: 'num',  u: '条',  r: 0, ex: '4', d: 'manual' },
      { k: 'memMax',     n: '最大内存',   t: 'num',  u: 'GB',  r: 0, ex: '192', d: 'derive', s: ['192gb'] },
      { k: 'pcieVer',    n: 'PCIe 版本',  t: 'enum', r: 0, ex: '5.0', d: 'derive', e: ['5.0', '4.0'], s: ['pcie5'] },
      { k: 'm2Slots',    n: 'M.2 槽位',   t: 'num',  u: '个',  r: 1, ex: '4', d: 'derive', s: ['m.2', 'm2'] },
      { k: 'sataPorts',  n: 'SATA 口',    t: 'num',  u: '个',  r: 0, ex: '4', d: 'manual' },
      { k: 'vrmPhases',  n: '供电相数',   t: 'text', r: 0, ex: '16+2+1', d: 'derive' },
      { k: 'lan',        n: '有线网口',   t: 'enum', r: 1, ex: '2.5G', d: 'derive', e: ['5G', '2.5G', '1G'], s: ['2.5g网口'] },
      { k: 'wifi',       n: '无线',       t: 'enum', r: 1, ex: 'WiFi 7', d: 'derive', e: ['WiFi 7', 'WiFi 6E', 'WiFi 6', '无'], s: ['wifi7', '无线'] },
      { k: 'usb4',       n: 'USB4/雷电',  t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['usb4', '雷电'] }
    ]},

    /* ── 内存 ── 现库 4~6 段，[0][1] 段混了代数与容量、频率与代数 */
    ram: { label: '内存', fields: [
      { k: 'gen',         n: '代数',     t: 'enum', r: 1, ex: 'DDR5', d: 'derive', e: ['DDR5', 'DDR4'], s: ['ddr5', 'ddr4'] },
      { k: 'capacity',    n: '总容量',   t: 'num',  u: 'GB',  r: 1, ex: '32', d: 'derive', s: ['32g', '32gb'] },
      { k: 'kit',         n: '套装条数', t: 'num',  u: '条',  r: 1, ex: '2', d: 'derive' },
      { k: 'speed',       n: '频率',     t: 'num',  u: 'MHz', r: 1, ex: '6400', d: 'derive', s: ['6400mhz', '6000'] },
      { k: 'cl',          n: 'CAS 延迟', t: 'num',  u: '',   r: 1, ex: '32', d: 'derive', s: ['cl32', '时序'] },
      { k: 'form',        n: '形态',     t: 'enum', r: 1, ex: 'DIMM', d: 'derive', e: ['DIMM', 'SO-DIMM'], s: ['笔记本内存', 'so-dimm'] },
      { k: 'voltage',     n: '电压',     t: 'num',  u: 'V',   r: 0, ex: '1.35', d: 'derive' },
      { k: 'height',      n: '高度',     t: 'num',  u: 'mm',  r: 0, ex: '42', d: 'derive', s: ['矮条', '内存高度'] },
      { k: 'heatspreader', n: '马甲/灯效', t: 'enum', r: 0, ex: '铝制马甲', d: 'derive', e: ['无', '铝制马甲', '散热马甲', 'RGB'], s: ['灯条', 'rgb内存'] },
      { k: 'die',         n: '颗粒',     t: 'text', r: 0, ex: '海力士 A-die', d: 'derive', s: ['海力士', 'a-die'] }
    ]},

    /* ── 显卡 ── ORD-06 给定的参照品类。现库 3~8 段，
       核心频率与 PCIe 版本在 specs 里 0 覆盖（必须补录），这是对比表最大的空洞。 */
    gpu: { label: '显卡', fields: [
      { k: 'vram',       n: '显存容量', t: 'num',  u: 'GB',  r: 1, ex: '16',   d: 'derive', s: ['16g显卡', '大显存'] },
      { k: 'vramType',   n: '显存类型', t: 'enum', r: 1, ex: 'GDDR7', d: 'derive', e: ['GDDR7', 'GDDR6X', 'GDDR6'], s: ['gddr7'] },
      { k: 'busWidth',   n: '位宽',     t: 'num',  u: 'bit', r: 1, ex: '256',  d: 'derive', s: ['256bit'] },
      { k: 'boostClock', n: '核心频率', t: 'num',  u: 'MHz', r: 1, ex: '2617', d: 'manual', s: ['核心频率'] },
      { k: 'cuda',       n: '流处理器', t: 'num',  u: '个',  r: 0, ex: '8960', d: 'derive', s: ['cuda'] },
      { k: 'tdp',        n: 'TDP',      t: 'num',  u: 'W',   r: 1, ex: '250',  d: 'derive', s: ['250w', '功耗'] },
      { k: 'powerConn',  n: '供电接口', t: 'text', r: 1, ex: '1×16pin', d: 'derive', s: ['16pin', '8pin'] },
      { k: 'pcieVer',    n: 'PCIe 版本', t: 'enum', r: 1, ex: '5.0', d: 'manual', e: ['5.0', '4.0'], s: ['pcie5'] },
      { k: 'length',     n: '卡长',     t: 'num',  u: 'mm',  r: 0, ex: '304',  d: 'derive', s: ['卡长', '长度'] },
      { k: 'slots',      n: '占用槽位', t: 'num',  u: '槽',  r: 0, ex: '2',    d: 'derive', s: ['双槽', '三槽'] },
      { k: 'outputs',    n: '视频接口', t: 'text', r: 1, ex: '3×DP2.1 + 1×HDMI2.1', d: 'derive', s: ['dp2.1', 'hdmi2.1'] },
      { k: 'recPSU',     n: '建议电源', t: 'num',  u: 'W',   r: 0, ex: '750',  d: 'derive', s: ['750w电源'] },
      { k: 'arch',       n: '架构',     t: 'text', r: 0, ex: 'Blackwell', d: 'derive' }
    ]},

    /* ── 固态 ── ORD-06 点名品类。
       实测：M.2 总命中 25 条，specs 主体 0 条；SATA 主体 6 条；U.2 零款。
       按型号/接口推断实际 44 款是 M.2、6 款 SATA、3 款移动固态。
       搜「M.2」当前只召回 24 款固态，漏 20 款。接口/形态是必填硬字段。 */
    ssd: { label: '固态硬盘', fields: [
      /* 品类内实测混入 3 块 3.5 英寸机械盘（紫盘/酷狼/Exos），无 kind 会被强标 SATA 与固态并列 */
      { k: 'kind',      n: '类型',     t: 'enum', r: 1, ex: 'SSD', d: 'derive', e: ['SSD', 'HDD', '移动固态'], s: ['固态', '机械硬盘', '移动固态'],
        /* 枚举值是人话别名的机器形态：用户搜「机械硬盘」，库里存的是 HDD。
           别名表放在 schema 而不是散在 matchQuery 里，是为了让对比表（第 4 批）
           和搜索读同一份映射 —— 两处各写一份必然漂移。 */
        lbl: { 'SSD': ['固态硬盘', '固态'], 'HDD': ['机械硬盘', '机械盘'], '移动固态': ['移动固态', '便携固态'] } },
      /* 形态与接口必须分开：SATA 是接口，M.2/U.2 是形态，混在一个字段里会把 3.5 寸机械盘标成 SATA 形态 */
      { k: 'form',      n: '形态',     t: 'enum', r: 1, ex: 'M.2', d: 'derive', e: ['M.2', '2.5 英寸', '3.5 英寸', 'U.2', 'mSATA', '便携'], s: ['m.2', '2280', '2230', '2.5英寸', '3.5英寸', 'u.2'] },
      { k: 'iface',     n: '接口',     t: 'enum', r: 1, ex: 'NVMe (PCIe)', d: 'derive', e: ['NVMe (PCIe)', 'SATA', 'USB'], s: ['sata', 'nvme', 'm.2', 'usb'] },
      { k: 'ifaceVer',  n: '接口版本', t: 'enum', r: 1, ex: 'PCIe 4.0×4', d: 'derive', e: ['PCIe 5.0×4', 'PCIe 4.0×4', 'PCIe 3.0×4', 'SATA 3.0', 'USB 3.2 Gen2'], s: ['pcie4', 'nvme', 'pcie5'] },
      { k: 'capacity',  n: '容量',     t: 'num',  u: 'GB',  r: 1, ex: '2000', d: 'derive', s: ['1tb', '2tb'] },
      { k: 'length',    n: '长度',     t: 'num',  u: 'mm',  r: 0, ex: '80',   d: 'manual', e: undefined, s: ['2280', '2230'] },
      { k: 'nand',      n: '闪存类型', t: 'enum', r: 1, ex: 'TLC', d: 'derive', e: ['TLC', 'QLC', 'MLC'], s: ['tlc', 'qlc'] },
      { k: 'dram',      n: '独立缓存', t: 'enum', r: 1, ex: '无（HMB）', d: 'derive', e: ['有', '无', '无（HMB）'], s: ['独立缓存', '有缓'] },
      { k: 'seqRead',   n: '顺序读',   t: 'num',  u: 'MB/s', r: 1, ex: '7000', d: 'derive', s: ['7000mb/s', '读速'] },
      { k: 'seqWrite',  n: '顺序写',   t: 'num',  u: 'MB/s', r: 0, ex: '6000', d: 'derive' },
      { k: 'tbw',       n: '写入寿命', t: 'num',  u: 'TBW', r: 0, ex: '1200', d: 'derive', s: ['tbw'] },
      { k: 'warranty',  n: '质保',     t: 'num',  u: '年',  r: 1, ex: '5',    d: 'derive', s: ['5年保'] },
      { k: 'controller', n: '主控',    t: 'text', r: 0, ex: '联芸 1602', d: 'manual' }
    ]},

    /* ── 电源 ── 现库 3~8 段，认证等级在 [1][2] 两个位置重复出现 */
    psu: { label: '电源', fields: [
      { k: 'wattage',  n: '额定功率', t: 'num',  u: 'W',  r: 1, ex: '750', d: 'derive', s: ['750w', '850w电源'] },
      { k: 'efficiency', n: '80PLUS', t: 'enum', r: 1, ex: '金牌', d: 'derive', e: ['钛金牌', '白金牌', '金牌', '铜牌', '白牌'], s: ['金牌电源', '白金'] },
      { k: 'standard', n: 'ATX 规范', t: 'enum', r: 1, ex: 'ATX 3.1', d: 'derive', e: ['ATX 3.1', 'ATX 3.0', 'ATX 2.4'], s: ['atx3'] },
      { k: 'form',     n: '板型',     t: 'enum', r: 1, ex: 'ATX', d: 'derive', e: ['ATX', 'SFX', 'SFX-L', 'TFX'], s: ['sfx电源', '小电源'] },
      { k: 'modular',  n: '模组',     t: 'enum', r: 1, ex: '全模组', d: 'derive', e: ['全模组', '半模组', '直出线'], s: ['全模组'] },
      { k: 'length',   n: '长度',     t: 'num',  u: 'mm', r: 0, ex: '140', d: 'derive', s: ['电源长度'] },
      { k: 'fanSize',  n: '风扇尺寸', t: 'num',  u: 'mm', r: 0, ex: '120', d: 'derive' },
      { k: 'pcie5',    n: '原生 12V-2×6', t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['12vhpwr', '16pin'] },
      { k: 'cap',      n: '电容',     t: 'enum', r: 0, ex: '日系', d: 'derive', e: ['日系', '固态', '混合'], s: ['日系电容'] },
      { k: 'warranty', n: '质保',     t: 'num',  u: '年',  r: 1, ex: '10', d: 'derive', s: ['十年质保'] }
    ]},

    /* ── 机箱 ── 现库 4~9 段，[2][3][4] 段显卡限长重复三次 */
    case: { label: '机箱', fields: [
      { k: 'formSupport', n: '支持板型', t: 'enum', r: 1, ex: 'ATX', d: 'derive', e: ['EATX', 'ATX', 'MATX', 'ITX'], s: ['atx机箱', 'matx机箱', 'itx机箱'] },
      { k: 'gpuMax',   n: '显卡限长', t: 'num',  u: 'mm', r: 1, ex: '400', d: 'derive', s: ['显卡限长'] },
      { k: 'cpuMax',   n: 'CPU 限高', t: 'num',  u: 'mm', r: 1, ex: '170', d: 'derive', s: ['散热器限高'] },
      { k: 'radSupport', n: '冷排支持', t: 'text', r: 1, ex: '360/280/240', d: 'derive', s: ['360冷排', '支持水冷'] },
      { k: 'volume',   n: '容积',     t: 'num',  u: 'L',  r: 0, ex: '42', d: 'derive', s: ['小机箱', '大机箱'] },
      { k: 'size',     n: '尺寸',     t: 'text', r: 0, ex: '450×230×465mm', d: 'derive' },
      { k: 'fanSlots', n: '风扇位',   t: 'num',  u: '个', r: 0, ex: '7', d: 'derive', s: ['风扇位'] },
      { k: 'driveBays', n: '硬盘位',  t: 'text', r: 0, ex: '2×3.5 + 4×2.5', d: 'derive' },
      { k: 'color',    n: '颜色',     t: 'enum', r: 1, ex: '白色', d: 'derive', e: ['黑色', '白色', '黑白双色', '银白色'], s: ['白色机箱', '黑色机箱'] },
      { k: 'sidePanel', n: '侧板',    t: 'enum', r: 0, ex: '钢化玻璃', d: 'derive', e: ['钢化玻璃', '网面', '封闭'], s: ['海景房', '玻璃侧透'] },
      { k: 'frontIO',  n: '前置接口', t: 'text', r: 0, ex: 'Type-C 10Gbps + 2×USB-A', d: 'derive' },
      { k: 'weight',   n: '重量',     t: 'num',  u: 'kg', r: 0, ex: '8.5', d: 'derive' },
      { k: 'material', n: '材质',     t: 'text', r: 0, ex: 'SPCC 钢 + 铝', d: 'manual' }
    ]},

    /* ── 散热器 ── 现库 3~7 段，解热功率在 [1][3][4] 三段重复 */
    cooler: { label: '散热器', fields: [
      { k: 'type',     n: '类型',     t: 'enum', r: 1, ex: '双塔风冷', d: 'derive', e: ['单塔风冷', '双塔风冷', '下压式', '一体式水冷'], s: ['风冷', '水冷', '一体式水冷'] },
      { k: 'radSize',  n: '冷排规格', t: 'num',  u: 'mm', r: 0, ex: '360', d: 'derive', s: ['360水冷', '240水冷'] },
      { k: 'height',   n: '高度',     t: 'num',  u: 'mm', r: 1, ex: '157', d: 'derive', s: ['风冷高度', '限高'] },
      { k: 'tdpRating', n: '解热能力', t: 'num', u: 'W',  r: 1, ex: '260', d: 'derive', s: ['解热', '压制'] },
      { k: 'heatpipes', n: '热管数',  t: 'num',  u: '根', r: 0, ex: '6', d: 'derive', s: ['6热管'] },
      { k: 'sockets',  n: '支持插槽', t: 'text', r: 1, ex: 'AM5/AM4/LGA1700', d: 'derive', s: ['am5', 'lga1700'] },
      { k: 'fanSize',  n: '风扇尺寸', t: 'num',  u: 'mm', r: 0, ex: '120', d: 'derive' },
      { k: 'fanCount', n: '风扇数',   t: 'num',  u: '个', r: 0, ex: '2', d: 'derive', s: ['双风扇'] },
      { k: 'rgb',      n: '灯效',     t: 'enum', r: 0, ex: 'ARGB', d: 'derive', e: ['ARGB', 'RGB', '无'], s: ['argb', '灯效'] },
      { k: 'noise',    n: '噪音',     t: 'num',  u: 'dB', r: 0, ex: '28', d: 'manual', s: ['静音'] }
    ]},

    /* ── 显示器 ── 实测段数 3~12（最乱的品类）。分辨率在 [1][2] 混排，
       色域/亮度/响应时间在 [4][5] 三段重复。位置对齐必然把「亮度」和「色域」放同一行。 */
    monitor: { label: '显示器', fields: [
      { k: 'size',      n: '尺寸',     t: 'num',  u: '英寸', r: 1, ex: '27', d: 'derive', s: ['27英寸', '32寸'] },
      { k: 'resW',      n: '分辨率宽', t: 'num',  u: 'px',   r: 1, ex: '3840', d: 'derive', s: ['4k', '2k', '1080p'] },
      { k: 'resH',      n: '分辨率高', t: 'num',  u: 'px',   r: 1, ex: '2160', d: 'derive' },
      { k: 'panel',     n: '面板',     t: 'enum', r: 1, ex: 'Fast IPS', d: 'derive', e: ['IPS', 'Fast IPS', 'VA', 'TN', 'OLED', 'QD-OLED', 'MiniLED'], s: ['ips', 'oled', 'fast ips'] },
      { k: 'refresh',   n: '刷新率',   t: 'num',  u: 'Hz',   r: 1, ex: '180', d: 'derive', s: ['180hz', '高刷', '240hz'] },
      { k: 'response',  n: '响应时间', t: 'num',  u: 'ms',   r: 1, ex: '1', d: 'derive', s: ['1ms'] },
      { k: 'brightness', n: '亮度',    t: 'num',  u: 'cd/m²', r: 1, ex: '400', d: 'derive', s: ['400nit'] },
      { k: 'hdr',       n: 'HDR',      t: 'enum', r: 0, ex: 'HDR400', d: 'derive', e: ['HDR400', 'HDR600', 'HDR1000', 'True Black 400', '无'], s: ['hdr'] },
      { k: 'colorGamut', n: '色域',    t: 'text', r: 0, ex: '95% DCI-P3 / 100% sRGB', d: 'derive', s: ['广色域', 'dci-p3'] },
      { k: 'deltaE',    n: '色准',     t: 'num',  u: '',   r: 0, ex: '2', d: 'derive', s: ['色准'] },
      { k: 'bit',       n: '色深',     t: 'num',  u: 'bit', r: 0, ex: '10', d: 'derive', s: ['10bit'] },
      { k: 'iface',     n: '接口',     t: 'text', r: 1, ex: '2×HDMI2.1 + 1×DP1.4 + USB-C 90W', d: 'derive', s: ['hdmi2.1', 'dp1.4', 'typec'] },
      { k: 'usbcPower', n: 'USB-C 供电', t: 'num', u: 'W',  r: 0, ex: '90', d: 'derive', s: ['90w反向充电'] },
      { k: 'vesa',      n: 'VESA 孔位', t: 'text', r: 0, ex: '100×100', d: 'manual', s: ['vesa'] },
      { k: 'curve',     n: '曲率',     t: 'num',  u: 'R',  r: 0, ex: '1500', d: 'derive', s: ['曲面'] },
      { k: 'heightAdj', n: '升降旋转', t: 'bool', r: 0, ex: 'true', d: 'manual', s: ['升降'] }
    ]},

    /* ── 键鼠外设 ── 键盘与鼠标混在同一品类，必须先用 kind 分流。
       现库无 kind 字段，只能靠 style 猜，这是对比表无法生成的根本原因。 */
    input: { label: '键鼠外设', fields: [
      { k: 'kind',       n: '类型',     t: 'enum', r: 1, ex: '键盘', d: 'manual', e: ['键盘', '鼠标', '键鼠套装'], s: ['键盘', '鼠标'] },
      { k: 'connection', n: '连接',     t: 'enum', r: 1, ex: '三模', d: 'derive', e: ['有线', '2.4G', '蓝牙', '三模'], s: ['三模', '无线', '有线'] },
      { k: 'layout',     n: '配列',     t: 'enum', r: 0, ex: '87', d: 'derive', e: ['104', '98', '87', '75', '68', '60'], s: ['87配列', '98键'] },
      { k: 'switchType', n: '轴体类型', t: 'enum', r: 0, ex: '机械', d: 'derive', e: ['机械', '薄膜', '静电容', '光轴'], s: ['机械键盘', '薄膜'] },
      { k: 'switchModel', n: '轴体型号', t: 'text', r: 0, ex: 'Cherry 红轴', d: 'derive', s: ['红轴', '青轴', '茶轴'] },
      { k: 'hotswap',    n: '热插拔',   t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['热插拔'] },
      { k: 'keycap',     n: '键帽',     t: 'enum', r: 0, ex: 'PBT', d: 'derive', e: ['PBT', 'ABS'], s: ['pbt键帽'] },
      { k: 'polling',    n: '回报率',   t: 'num',  u: 'Hz', r: 0, ex: '1000', d: 'derive', s: ['1000hz', '回报率'] },
      { k: 'dpi',        n: '最高 DPI', t: 'num',  u: 'DPI', r: 0, ex: '26000', d: 'derive', s: ['26000dpi'] },
      { k: 'weight',     n: '重量',     t: 'num',  u: 'g',  r: 0, ex: '58', d: 'derive', s: ['轻量化', '重量'] },
      { k: 'battery',    n: '电池',     t: 'num',  u: 'mAh', r: 0, ex: '800', d: 'derive', s: ['续航'] },
      { k: 'rgb',        n: '灯效',     t: 'enum', r: 0, ex: 'RGB', d: 'derive', e: ['RGB', '白光', '无'], s: ['rgb', '灯效'] }
    ]},

    /* ── 网络设备 ── */
    network: { label: '网络设备', fields: [
      { k: 'kind',      n: '类型',     t: 'enum', r: 1, ex: '路由器', d: 'manual', e: ['路由器', 'Mesh 套装', 'AP', '网卡', '交换机'], s: ['路由器', 'mesh'] },
      { k: 'wifiStd',   n: 'WiFi 标准', t: 'enum', r: 1, ex: 'WiFi 7', d: 'derive', e: ['WiFi 7', 'WiFi 6', 'WiFi 5'], s: ['wifi7', 'wifi6', 'be6500'] },
      { k: 'band',      n: '频段',     t: 'enum', r: 1, ex: '三频', d: 'derive', e: ['双频', '三频'], s: ['三频', '双频'] },
      { k: 'speed',     n: '无线速率', t: 'num',  u: 'Mbps', r: 1, ex: '6500', d: 'derive', s: ['6500m', '速率'] },
      { k: 'lanSpeed',  n: '最大网口', t: 'num',  u: 'Gbps', r: 1, ex: '2.5', d: 'derive', s: ['2.5g网口', '万兆'] },
      { k: 'lanPorts',  n: '网口构成', t: 'text', r: 1, ex: '1×2.5G + 3×1G', d: 'derive' },
      { k: 'mesh',      n: 'Mesh 组网', t: 'bool', r: 1, ex: 'true', d: 'derive', s: ['mesh组网', '易展'] },
      { k: 'antennas',  n: '天线数',   t: 'num',  u: '根', r: 0, ex: '6', d: 'derive', s: ['天线'] },
      { k: 'usb',       n: 'USB 接口', t: 'text', r: 0, ex: '1×USB 3.0', d: 'derive' },
      { k: 'mem',       n: '内存',     t: 'num',  u: 'GB', r: 0, ex: '1', d: 'derive' },
      { k: 'fanless',   n: '无风扇',   t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['无风扇', '静音'] }
    ]},

    /* ── 支架 ── VESA 在 specs 只有 3/40，但这是支架最硬的规格，用户必搜 */
    stand: { label: '支架', fields: [
      { k: 'kind',       n: '类型',     t: 'enum', r: 1, ex: '显示器支架', d: 'manual', e: ['显示器支架', '升降桌', '笔记本支架', '双屏支架'], s: ['显示器支架', '升降桌'] },
      { k: 'screenSize', n: '适配尺寸', t: 'text', r: 1, ex: '17-32 英寸', d: 'derive', s: ['32英寸支架'] },
      { k: 'load',       n: '承重',     t: 'num',  u: 'kg', r: 1, ex: '9', d: 'derive', s: ['承重'] },
      { k: 'vesa',       n: 'VESA 孔位', t: 'text', r: 1, ex: '75×75 / 100×100', d: 'manual', s: ['vesa'] },
      { k: 'heightRange', n: '升降范围', t: 'text', r: 0, ex: '100-400mm', d: 'derive', s: ['升降'] },
      { k: 'tilt',       n: '倾仰角',   t: 'text', r: 0, ex: '+90°/-45°', d: 'derive' },
      { k: 'rotate',     n: '旋转',     t: 'text', r: 0, ex: '±90°', d: 'derive', s: ['旋转'] },
      { k: 'armCount',   n: '臂数',     t: 'num',  u: '个', r: 0, ex: '1', d: 'derive', s: ['双屏'] },
      { k: 'clampMax',   n: '桌夹厚度', t: 'num',  u: 'mm', r: 0, ex: '80', d: 'derive', s: ['桌夹'] },
      { k: 'material',   n: '材质',     t: 'enum', r: 0, ex: '铝合金', d: 'derive', e: ['铝合金', '钢制', '碳钢'], s: ['铝合金'] },
      { k: 'warranty',   n: '质保',     t: 'num',  u: '年', r: 0, ex: '10', d: 'derive', s: ['质保'] }
    ]},

    /* ── 拓展坞 ── 实测段数 1,2,3,4,5,6,7,9 — 唯一有 1 段的品类，位置完全不可靠 */
    dock: { label: '拓展坞', fields: [
      { k: 'hostIface',  n: '主机接口', t: 'enum', r: 1, ex: '雷电 4', d: 'derive', e: ['雷电 5', '雷电 4', '雷电 3', 'USB4', 'Type-C'], s: ['雷电4', 'thunderbolt'] },
      { k: 'usbPorts',   n: 'USB 口',   t: 'text', r: 1, ex: '2×USB-A 3.2 + 1×USB-C', d: 'derive', s: ['usb3.2'] },
      { k: 'hdmi',       n: 'HDMI 输出', t: 'text', r: 1, ex: '1×HDMI 2.1（4K120）', d: 'derive', s: ['hdmi2.1'] },
      { k: 'dpPorts',    n: 'DP 输出',  t: 'text', r: 0, ex: '1×DP 1.4', d: 'derive', s: ['dp1.4'] },
      { k: 'lanSpeed',   n: '网口',     t: 'num',  u: 'Gbps', r: 1, ex: '2.5', d: 'derive', s: ['2.5g网口', '千兆网口'] },
      { k: 'pdPower',    n: 'PD 供电',  t: 'num',  u: 'W',  r: 1, ex: '100', d: 'derive', s: ['pd100w', '供电'] },
      { k: 'displayOut', n: '外接屏数', t: 'num',  u: '台', r: 0, ex: '2', d: 'manual', s: ['双屏'] },
      { k: 'cardReader', n: '读卡器',   t: 'text', r: 0, ex: 'SD/TF', d: 'derive', s: ['读卡'] },
      { k: 'maxRes',     n: '最大分辨率', t: 'text', r: 0, ex: '8K60', d: 'derive' },
      { k: 'compat',     n: '兼容系统', t: 'text', r: 1, ex: 'Windows / macOS', d: 'derive', s: ['mac兼容'] }
    ]},

    /* ── 笔记本 ── 整机品类。实测接口在 specs 里 0/79，雷电 0/79，全在软文本。
       这是本批最严重的字段缺失：用户搜「雷电4笔记本」「HDMI2.1」一条都进不了主体。 */
    laptop: { label: '笔记本电脑', fields: [
      { k: 'cpu',        n: '处理器',   t: 'text', r: 1, ex: 'Ultra 9 285HX', d: 'derive', s: ['ultra9', 'cpu'] },
      { k: 'gpu',        n: '显卡',     t: 'text', r: 1, ex: 'RTX 5070', d: 'derive', s: ['rtx5070', '独显', '核显'] },
      { k: 'gpuVram',    n: '显存',     t: 'num',  u: 'GB', r: 0, ex: '8', d: 'derive' },
      { k: 'ram',        n: '内存',     t: 'num',  u: 'GB', r: 1, ex: '32', d: 'derive', s: ['32g内存'] },
      { k: 'ramType',    n: '内存类型', t: 'enum', r: 0, ex: 'LPDDR5X', d: 'derive', e: ['DDR5', 'LPDDR5X', '统一内存'], s: ['lpddr5x'] },
      { k: 'storage',    n: '存储',     t: 'num',  u: 'GB', r: 1, ex: '1024', d: 'derive', s: ['1tb'] },
      { k: 'storageSlots', n: '硬盘位', t: 'num',  u: '个', r: 0, ex: '2', d: 'manual', s: ['双硬盘位'] },
      { k: 'screenSize', n: '屏幕尺寸', t: 'num',  u: '英寸', r: 1, ex: '16', d: 'derive', s: ['16英寸'] },
      { k: 'resolution', n: '分辨率',   t: 'text', r: 1, ex: '2560×1600', d: 'derive', s: ['2.5k', '3.2k'] },
      { k: 'refresh',    n: '刷新率',   t: 'num',  u: 'Hz', r: 0, ex: '165', d: 'derive' },
      { k: 'panel',      n: '面板',     t: 'enum', r: 0, ex: 'IPS', d: 'derive', e: ['IPS', 'OLED', 'MiniLED', 'XDR'], s: ['oled屏'] },
      { k: 'weight',     n: '重量',     t: 'num',  u: 'kg', r: 1, ex: '2.1', d: 'derive', s: ['轻薄本', '1.5kg'] },
      { k: 'thickness',  n: '厚度',     t: 'num',  u: 'mm', r: 0, ex: '17.9', d: 'manual' },
      { k: 'battery',    n: '电池',     t: 'num',  u: 'Wh', r: 1, ex: '99', d: 'derive', s: ['续航'] },
      { k: 'iface',      n: '接口',     t: 'text', r: 1, ex: '2×雷电4 + 1×USB-A + 1×HDMI 2.1', d: 'manual', s: ['hdmi2.1', 'usb4', '接口'] },
      { k: 'thunderbolt', n: '雷电',    t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['雷电4', '雷电5'] },
      { k: 'tdpRelease', n: '性能释放', t: 'num',  u: 'W', r: 0, ex: '115', d: 'derive' },
      { k: 'keyboard',   n: '键盘',     t: 'text', r: 0, ex: '单键 RGB / 有小键盘', d: 'manual' }
    ]},

    /* ── 手机 ── IP 防水 1/93、5G 1/93，都是用户高频搜索词 */
    phone: { label: '手机', fields: [
      { k: 'soc',        n: '处理器',   t: 'text', r: 1, ex: '第五代骁龙 8 至尊版', d: 'derive', s: ['骁龙8', '天玑9500'] },
      { k: 'ram',        n: '内存',     t: 'num',  u: 'GB', r: 1, ex: '16', d: 'derive' },
      { k: 'storage',    n: '存储',     t: 'num',  u: 'GB', r: 1, ex: '512', d: 'derive' },
      { k: 'screenSize', n: '屏幕尺寸', t: 'num',  u: '英寸', r: 1, ex: '6.82', d: 'derive', s: ['6.8英寸'] },
      { k: 'resolution', n: '分辨率',   t: 'text', r: 1, ex: '3168×1440', d: 'derive', s: ['2k屏'] },
      { k: 'refresh',    n: '刷新率',   t: 'num',  u: 'Hz', r: 1, ex: '120', d: 'derive', s: ['120hz'] },
      { k: 'panel',      n: '面板',     t: 'enum', r: 0, ex: 'LTPO AMOLED', d: 'derive', e: ['LTPO AMOLED', 'AMOLED', 'OLED', 'LCD'], s: ['ltpo'] },
      { k: 'battery',    n: '电池',     t: 'num',  u: 'mAh', r: 1, ex: '6000', d: 'derive', s: ['6000mah', '大电池'] },
      { k: 'chargeWired', n: '有线快充', t: 'num', u: 'W',  r: 1, ex: '100', d: 'derive', s: ['100w快充'] },
      { k: 'chargeWireless', n: '无线快充', t: 'num', u: 'W', r: 0, ex: '80', d: 'derive', s: ['无线充电'] },
      { k: 'weight',     n: '重量',     t: 'num',  u: 'g',  r: 1, ex: '218', d: 'derive', s: ['轻薄手机'] },
      { k: 'thickness',  n: '厚度',     t: 'num',  u: 'mm', r: 0, ex: '8.2', d: 'derive' },
      { k: 'ipRating',   n: '防水等级', t: 'enum', r: 1, ex: 'IP69', d: 'derive', e: ['IP69', 'IP68', 'IP54', '无'], s: ['ip68', '防水'] },
      { k: 'network',    n: '网络',     t: 'enum', r: 1, ex: '5G', d: 'derive', e: ['5G', '4G'], s: ['5g手机'] },
      { k: 'camera',     n: '影像',     t: 'text', r: 0, ex: '1英寸主摄 + 3×长焦', d: 'derive', s: ['一英寸', '长焦'] },
      { k: 'satellite',  n: '卫星通信', t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['卫星通话'] },
      { k: 'nfc',        n: 'NFC',      t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['nfc'] }
    ]},

    /* ── 充电与供电 ── 充电器与移动电源混排，需 kind 分流 */
    charger: { label: '充电与供电', fields: [
      { k: 'kind',      n: '类型',     t: 'enum', r: 1, ex: '充电器', d: 'manual', e: ['充电器', '移动电源', '充电线', '无线充'], s: ['充电器', '充电宝'] },
      { k: 'power',     n: '总功率',   t: 'num',  u: 'W',  r: 1, ex: '100', d: 'derive', s: ['100w充电器'] },
      { k: 'pdMax',     n: '单口最大', t: 'num',  u: 'W',  r: 0, ex: '65', d: 'derive', s: ['单口65w'] },
      { k: 'capacity',  n: '容量',     t: 'num',  u: 'mAh', r: 0, ex: '20000', d: 'derive', s: ['20000mah'] },
      { k: 'ports',     n: '接口构成', t: 'text', r: 1, ex: '2×Type-C + 1×USB-A', d: 'derive', s: ['多口'] },
      { k: 'protocol',  n: '协议',     t: 'enum', r: 1, ex: 'PD3.1 + PPS', d: 'derive', e: ['PD3.1', 'PD3.0', 'PPS', 'QC5', '私有'], s: ['pps', 'pd3.1'] },
      { k: 'wireless',  n: '无线充电', t: 'num',  u: 'W',  r: 0, ex: '15', d: 'derive', s: ['无线充', '磁吸'] },
      { k: 'gan',       n: '氮化镓',   t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['氮化镓', 'gan'] },
      { k: 'foldPlug',  n: '折叠插脚', t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['折叠插脚'] },
      { k: 'weight',    n: '重量',     t: 'num',  u: 'g',  r: 0, ex: '210', d: 'derive' },
      { k: 'cableIncluded', n: '含线', t: 'bool', r: 0, ex: 'true', d: 'derive' }
    ]},

    /* ── 手机与平板配件 ── 最杂品类（壳/磁吸/支架/摄影），现库 3~4 段且字段互不通用 */
    mobileacc: { label: '手机与平板配件', fields: [
      { k: 'kind',       n: '类型',     t: 'enum', r: 1, ex: '保护壳', d: 'manual', e: ['保护壳', '磁吸配件', '支架', '摄影配件', '其他'], s: ['手机壳', '磁吸', '支架'] },
      { k: 'compatibility', n: '适配机型', t: 'text', r: 1, ex: 'iPhone 17 Pro Max', d: 'manual', s: ['iphone17', '适配'] },
      { k: 'material',   n: '材质',     t: 'text', r: 1, ex: '液态硅胶', d: 'derive', s: ['硅胶', '碳纤维'] },
      { k: 'magsafe',    n: 'MagSafe',  t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['magsafe', '磁吸'] },
      { k: 'wirelessCharge', n: '支持无线充', t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['无线充'] },
      { k: 'dropRating', n: '防摔认证', t: 'text', r: 0, ex: '军规 1.5m', d: 'derive', s: ['军规', '防摔'] },
      { k: 'angle',      n: '调节角度', t: 'text', r: 0, ex: '0-90°', d: 'derive' },
      { k: 'weight',     n: '重量',     t: 'num',  u: 'g',  r: 0, ex: '32', d: 'derive' },
      { k: 'color',      n: '颜色',     t: 'text', r: 0, ex: '钛灰', d: 'derive' }
    ]},

    /* ── 平板 ── 键盘 0/66、触控笔 0/66（39/29 款在软文本）。
       用户搜「能接键盘的平板」当前主体命中 0，这是 ORD-06 说的「用户真正会搜的规格词」典型。 */
    tablet: { label: '平板', fields: [
      { k: 'soc',        n: '处理器',   t: 'text', r: 1, ex: 'Apple M4', d: 'derive', s: ['m4', '骁龙8'] },
      { k: 'ram',        n: '内存',     t: 'num',  u: 'GB', r: 1, ex: '12', d: 'derive' },
      { k: 'storage',    n: '存储',     t: 'num',  u: 'GB', r: 1, ex: '256', d: 'derive' },
      { k: 'screenSize', n: '屏幕尺寸', t: 'num',  u: '英寸', r: 1, ex: '11', d: 'derive', s: ['11英寸'] },
      { k: 'resolution', n: '分辨率',   t: 'text', r: 1, ex: '2560×1600', d: 'derive' },
      { k: 'refresh',    n: '刷新率',   t: 'num',  u: 'Hz', r: 0, ex: '120', d: 'derive' },
      { k: 'panel',      n: '面板',     t: 'enum', r: 0, ex: 'IPS', d: 'derive', e: ['IPS', 'OLED', '柔性 OLED', 'LCD'], s: ['oled'] },
      { k: 'battery',    n: '电池',     t: 'num',  u: 'mAh', r: 1, ex: '8000', d: 'derive' },
      { k: 'charge',     n: '充电功率', t: 'num',  u: 'W',  r: 1, ex: '45', d: 'derive', s: ['45w快充'] },
      { k: 'weight',     n: '重量',     t: 'num',  u: 'g',  r: 1, ex: '460', d: 'derive' },
      { k: 'thickness',  n: '厚度',     t: 'num',  u: 'mm', r: 0, ex: '5.9', d: 'derive' },
      { k: 'iface',      n: '接口',     t: 'text', r: 1, ex: 'USB-C 3.2 Gen2', d: 'manual', s: ['usb-c', '接口'] },
      { k: 'stylus',     n: '触控笔支持', t: 'bool', r: 1, ex: 'true', d: 'derive', s: ['手写笔', '触控笔', 'apple pencil'] },
      { k: 'keyboard',   n: '键盘支持', t: 'bool', r: 1, ex: 'true', d: 'derive', s: ['键盘', '妙控键盘'] },
      { k: 'cellular',   n: '蜂窝版',   t: 'bool', r: 0, ex: 'false', d: 'derive', s: ['蜂窝版', '5g平板'] }
    ]},

    /* ── 耳机 ── 蓝牙版本只在 20/95 的 specs 里，75 款缺。
       用户搜「蓝牙5.4耳机」当前大量落空，这是规格词缺字段的典型。 */
    earphone: { label: '耳机与耳麦', fields: [
      { k: 'kind',        n: '类型',     t: 'enum', r: 1, ex: '真无线', d: 'manual', e: ['真无线', '头戴式', '颈挂式', '有线', '骨传导', '开放式'], s: ['真无线', '头戴', '骨传导'] },
      { k: 'anc',         n: '降噪',     t: 'enum', r: 1, ex: '主动降噪', d: 'derive', e: ['主动降噪', '被动降噪', '无'], s: ['降噪', '主动降噪'] },
      { k: 'ancDepth',    n: '降噪深度', t: 'num',  u: 'dB', r: 0, ex: '48', d: 'derive', s: ['48db降噪'] },
      { k: 'driverUnit',  n: '单元尺寸', t: 'num',  u: 'mm', r: 0, ex: '11', d: 'derive', s: ['13mm单元'] },
      { k: 'driverType',  n: '单元类型', t: 'enum', r: 0, ex: '动圈', d: 'derive', e: ['动圈', '动铁', '圈铁', '平板'], s: ['动圈', '动铁'] },
      { k: 'bluetooth',   n: '蓝牙版本', t: 'num',  u: '',   r: 1, ex: '5.4', d: 'manual', s: ['蓝牙5.4', '蓝牙5.3'] },
      { k: 'codec',       n: '编解码',   t: 'enum', r: 1, ex: 'LDAC', d: 'derive', e: ['LDAC', 'aptX Adaptive', 'aptX', 'AAC', 'SBC', 'LC3'], s: ['ldac', 'aptx'] },
      { k: 'batterySingle', n: '单次续航', t: 'num', u: 'h', r: 1, ex: '8', d: 'derive', s: ['续航'] },
      { k: 'batteryTotal', n: '总续航',  t: 'num',  u: 'h',  r: 0, ex: '36', d: 'derive', s: ['总续航'] },
      { k: 'weight',      n: '重量',     t: 'num',  u: 'g',  r: 0, ex: '4.8', d: 'derive', s: ['轻'] },
      { k: 'ipRating',    n: '防水等级', t: 'enum', r: 0, ex: 'IP54', d: 'derive', e: ['IPX4', 'IPX5', 'IP54', 'IP57', '无'], s: ['防水', 'ipx5'] },
      { k: 'latency',     n: '延迟',     t: 'num',  u: 'ms', r: 0, ex: '55', d: 'manual', s: ['低延迟'] },
      { k: 'micCount',    n: '麦克风数', t: 'num',  u: '个', r: 0, ex: '3', d: 'derive' }
    ]},

    /* ── 音箱与麦克风 ── 音箱/麦克风/声卡混排，必须 kind 分流 */
    audio: { label: '音箱与麦克风', fields: [
      { k: 'kind',       n: '类型',     t: 'enum', r: 1, ex: '音箱', d: 'manual', e: ['音箱', '麦克风', '声卡', '回音壁', '监听音箱'], s: ['音箱', '麦克风', '声卡'] },
      { k: 'channels',   n: '声道',     t: 'num',  u: '声道', r: 0, ex: '2', d: 'derive', s: ['2.0声道', '2.1'] },
      { k: 'power',      n: '功率',     t: 'num',  u: 'W',  r: 0, ex: '40', d: 'derive', s: ['40w'] },
      { k: 'freqResp',   n: '频响',     t: 'text', r: 1, ex: '45Hz-20kHz', d: 'derive', s: ['频响'] },
      { k: 'driver',     n: '单元',     t: 'text', r: 0, ex: '3 英寸中低音 + 丝绢高音', d: 'derive' },
      { k: 'connection', n: '连接',     t: 'text', r: 1, ex: '蓝牙5.3 / 光纤 / 同轴 / USB', d: 'derive', s: ['蓝牙', '光纤', 'usb'] },
      { k: 'micType',    n: '麦克风类型', t: 'enum', r: 0, ex: '电容', d: 'derive', e: ['电容', '动圈'], s: ['电容麦', '动圈麦'] },
      { k: 'polarPattern', n: '指向性', t: 'enum', r: 0, ex: '心形', d: 'derive', e: ['心形', '全指向', '8 字', '超心形'], s: ['心形指向'] },
      { k: 'sampleRate', n: '采样率',   t: 'num',  u: 'kHz', r: 0, ex: '48', d: 'derive', s: ['48khz'] },
      { k: 'bitDepth',   n: '位深',     t: 'num',  u: 'bit', r: 0, ex: '24', d: 'derive', s: ['24bit'] },
      { k: 'weight',     n: '重量',     t: 'num',  u: 'kg', r: 0, ex: '2.4', d: 'derive' }
    ]},

    /* ── 智能穿戴与配套 ── 实测含无人机/运动相机/体脂秤/台灯，kind 必须覆盖到 */
    wearable: { label: '智能穿戴与配套', fields: [
      { k: 'kind',       n: '类型',     t: 'enum', r: 1, ex: '智能手表', d: 'manual', e: ['智能手表', '手环', '智能戒指', '运动相机', '无人机', '体脂秤', '其他'], s: ['手表', '手环', '无人机'] },
      { k: 'screenSize', n: '屏幕尺寸', t: 'num',  u: '英寸', r: 0, ex: '1.43', d: 'derive', s: ['1.43英寸'] },
      { k: 'screenType', n: '屏幕',     t: 'enum', r: 0, ex: 'AMOLED', d: 'derive', e: ['AMOLED', 'LCD', '无屏'], s: ['amoled'] },
      { k: 'batteryLife', n: '续航',    t: 'num',  u: '天',  r: 1, ex: '14', d: 'derive', s: ['14天续航'] },
      { k: 'waterproof', n: '防水等级', t: 'enum', r: 1, ex: '5ATM', d: 'derive', e: ['5ATM', 'IP68', 'IPX8', '不防水'], s: ['5atm', '防水'] },
      { k: 'gps',        n: '定位',     t: 'enum', r: 0, ex: '双频六星', d: 'derive', e: ['单频', '双频', '双频六星', '无'], s: ['双频gps', '定位'] },
      { k: 'health',     n: '健康功能', t: 'text', r: 0, ex: '心率 / 血氧 / ECG / 体温', d: 'derive', s: ['血氧', '心电图'] },
      { k: 'esim',       n: 'eSIM 通话', t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['esim', '独立通话'] },
      { k: 'nfc',        n: 'NFC',      t: 'bool', r: 0, ex: 'true', d: 'derive', s: ['nfc'] },
      { k: 'weight',     n: '重量',     t: 'num',  u: 'g',  r: 0, ex: '32', d: 'derive' },
      { k: 'strap',      n: '表带材质', t: 'text', r: 0, ex: '氟橡胶', d: 'derive' }
    ]}
  };

  /* 校验：品类数、字段序号连续性、类型合法、必填字段不能是 manual 之外的怪值 */
  var ids = Object.keys(CATS);
  var errs = [];
  ids.forEach(function (id) {
    var fs = CATS[id].fields;
    if (!fs.length) errs.push(id + ': 无字段');
    var seen = {};
    fs.forEach(function (f, i) {
      if (!f.k || !f.n) errs.push(id + '[' + i + ']: 缺 k/n');
      if (TYPES.indexOf(f.t) < 0) errs.push(id + '.' + f.k + ': 类型非法 ' + f.t);
      if (seen[f.k]) errs.push(id + ': key 重复 ' + f.k);
      seen[f.k] = 1;
      if (f.t === 'enum' && !f.e && !f.open) errs.push(id + '.' + f.k + ': enum 缺取值表（封闭枚举须给 e，开放枚举标 open:1）');
      if (f.t === 'num' && f.u === undefined) errs.push(id + '.' + f.k + ': num 缺单位（无单位用空串）');
      if (f.r !== 0 && f.r !== 1) errs.push(id + '.' + f.k + ': 必填标记非 0/1');
      if (f.d !== 'derive' && f.d !== 'manual') errs.push(id + '.' + f.k + ': 来源标记非法');
    });
  });

  global.PC_SCHEMA = {
    VERSION: VERSION,
    STATUS: 'wired',             // ORD-14 第 1 批起：specsObj 由 tools/specs-derive.cjs 写入，搜索读硬字段层
    TYPES: TYPES,
    errors: errs,
    cats: CATS,
    /* 汇总：给迁移方案与对比表用的扁平视图 */
    summary: function () {
      var rows = [];
      ids.forEach(function (id) {
        var fs = CATS[id].fields;
        var derive = fs.filter(function (f) { return f.d === 'derive'; }).length;
        rows.push({
          id: id, label: CATS[id].label, fields: fs.length,
          required: fs.filter(function (f) { return f.r === 1; }).length,
          derive: derive, manual: fs.length - derive,
          searchable: fs.filter(function (f) { return f.s && f.s.length; }).length
        });
      });
      return rows;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
