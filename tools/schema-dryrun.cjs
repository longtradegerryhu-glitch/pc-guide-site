/* ORD-06 dry-run：验证 schema 里标记 derive 的字段，在真实数据上到底能不能解析出来。
   只读，不写任何数据文件。产出 reports/specs-parse-coverage.md
   目的不是迁移，是回答一个排期问题：哪些字段可以自动生成，哪些必须人工补录。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = path.resolve(__dirname, '..');
const c = { window: {} }; vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(SITE, 'js/models-data.js'), 'utf8'), c);
const M = c.window.PC_MODELS;
vm.runInContext(fs.readFileSync(path.join(SITE, 'js/specs-schema.js'), 'utf8'), c);
// specs-schema 是 (function(global){})(window||globalThis) 形态，在 vm 里挂到 window
const SCH = c.window.PC_SCHEMA || c.PC_SCHEMA;

/* 把 specs 切成片段，并保留原串，用于跨字段共享上下文 */
function segs(it) {
  return String(it.specs || '').split(/[;；]/).map(s => s.trim()).filter(Boolean);
}
const ALL = it => [String(it.specs || ''), String(it.valueNote || ''), String(it.compat || ''), String(it.name || ''), String(it.model || '')].join(' ; ');

/* ── 提取规则：每条 [正则, 取值函数]。命中第一个即返回 ──
   原则：只在 specs 里找（不借 valueNote/compat），因为 specs 才是硬规格。
   唯一例外标为 soft:1，用来量化「这个字段现在只能靠软文本」。 */
const R = {
  cpu: {
    socket:   [/AM[45]\b/i, /LGA\s?-?\s?(\d{3,4})/i, /sTR5/i],
    cores:    [/(\d+)\s*核/, /(\d+)\s*P\s*\+/],
    threads:  [/(\d+)\s*线程/],
    pCores:   [/(\d+)\s*P\s*\+/],
    eCores:   [/(\d+)\s*E\s*[=+]/, /E\s*(\d+)\s*核/],
    boostClock: [/最高\s*([\d.]+)\s*GHz/i, /([\d.]+)\s*GHz/i],
    tdp:      [/TDP\s*([\d]+)\s*W/i, /(?:^|[^\d])([\d]{2,3})\s*W\b/],
    lithography: [/(?:TSMC\s*)?N?(\d+)\s*nm/i],
    igpu:     [/无核显/, /核显/, /集成显卡/, /UHD\s*\d*/i, /Radeon/i, /Graphics/i],
    arch:     [/Zen\s?\d/i, /Raptor\s*Lake/i, /Arrow\s*Lake/i, /Meteor\s*Lake/i, /Lunar\s*Lake/i, /Granite\s*Ridge/i],
    overclock:[/可超频/, /超频/]
  },
  mobo: {
    socket:     [/AM[45]\b/i, /LGA\s?-?\s?(\d{3,4})/i],
    chipset:    [/\b([ABHXZ]\d{3}E?)\b\s*芯片组/i, /\b([ABHXZ]\d{3}E?)\b/],
    formFactor: [/E-?ATX|EATX/i, /\bMATX\b|M-ATX/i, /\bATX\b/i, /\bITX\b/i],
    memType:    [/DDR[45]/i],
    memMax:     [/最高\s*(\d+)\s*GB/i, /(\d+)\s*GB\s*最高/i],
    pcieVer:    [/PCIe\s*([45])\.0/i, /Gen\s*([45])/i],
    m2Slots:    [/(\d+)\s*[×x]\s*M\.2/i, /M\.2\s*[×x]\s*(\d+)/i],
    vrmPhases:  [/(\d+\s*\+\s*\d+(?:\s*\+\s*\d+)?)\s*相/],
    lan:        [/双?\s*(\d+(?:\.\d+)?)\s*G\w*\s*有线网/i, /(\d+(?:\.\d+)?)\s*GbE/i, /(千兆)/],
    wifi:       [/WiFi\s*7/i, /WiFi\s*6E/i, /WiFi\s*6/i, /无\s*WiFi/i],
    usb4:       [/USB4/i, /雷电/i, /Thunderbolt/i]
  },
  ram: {
    gen:      [/DDR([45])/i],
    capacity: [/(\d+)\s*G(?:B)?\s*[×x]\s*\d+/i, /(\d+)\s*GB/i],
    kit:      [/\d+\s*G(?:B)?\s*[×x]\s*(\d+)/i, /[（(]\s*\d+\s*[×x]\s*(\d+)\s*[)）]/],
    speed:    [/(\d{4,5})\s*MHz/i],
    cl:       [/CL\s*(\d+)/i],
    form:     [/SO-?DIMM/i, /\bDIMM\b/i, /./],
    voltage:  [/([\d.]+)\s*V\b/],
    height:   [/高\s*([\d.]+)\s*mm/i, /([\d.]+)\s*mm\s*高/i],
    heatspreader: [/RGB/i, /铝制马甲/, /散热马甲/, /马甲/],
    die:      [/海力士\s*A-?die/i, /海力士颗粒/, /三星颗粒/, /美光颗粒/]
  },
  gpu: {
    vram:      [/(\d+)\s*GB?\s*GDDR/i, /(\d+)\s*GB\s*$/],
    vramType:  [/GDDR(\d+X?)/i],
    busWidth:  [/(\d+)\s*bit/i],
    cuda:      [/(\d{3,5})\s*(?:CUDA|流处理器)/i],
    tdp:       [/TDP\s*(\d+)\s*W/i, /(?:^|[^\d])(\d{2,3})\s*W\b/],
    powerConn: [/(\d+)\s*[×x]\s*(\d+)\s*pin/i, /(\d+)\s*pin/i, /无需外接供电/, /无需外接/],
    length:    [/卡长\s*([\d.]+)/i, /([\d]{2,3})\s*mm/i],
    slots:     [/([一二三四1-4])\s*槽/i, /([\d.]+)\s*槽/],
    outputs:   [/(\d+\s*[×x]\s*DP[\d.]*)/i, /(DP[\d.]*\s*\+?\s*(?:\d+\s*[×x]\s*)?HDMI)/i, /HDMI/i],
    recPSU:    [/(?:建议|官方建议)\s*(\d+)\s*W/i, /建议电源\s*(\d+)/i],
    arch:      [/Blackwell/i, /RDNA\s*\d/i, /Ada/i, /Lovelace/i]
  },
  ssd: {
    /* 关键字段：specs 里几乎没有，靠型号/接口推断 —— 这正是 ORD-06 点名的缺失 */
    /* 推断而非明文：PCIe×4 的消费级固态就是 M.2（U.2/AIC 极罕见且会写明 U.2） */
    kind:     [/3\.5\s*英寸/i, /\d{4}\s*rpm/i, /移动固态|便携/i, /TLC|QLC|MLC/i, /PCIe|NVMe/i],
    form:     [/U\.2/i, /mSATA/i, /M\.2/i, /3\.5\s*英寸/i, /2\.5\s*英寸/i, /SATA/i, /PCIe\s*[\d.]+\s*[×x]\s*\d/i, /PCIe\s*[\d.]+/i, /移动固态|便携|USB\s*[\d.]*/i],
    iface:    [/SATA/i, /USB\s*[\d.]*/i, /PCIe|NVMe/i],
    ifaceVer: [/PCIe\s*([\d.]+)\s*[×x]\s*\d/i, /SATA\s*([\d.]+)/i, /USB\s*([\d.]+)/i],
    capacity: [/(\d+)\s*TB/i, /(\d+)\s*GB/i],
    nand:     [/TLC/i, /QLC/i, /MLC/i],
    dram:     [/无独立缓存/, /独立缓存/, /\bHMB\b/i, /无缓/, /有缓/],
    seqRead:  [/读\s*(?:速\s*)?([\d,]+)\s*MB\/s/i, /([\d,]+)\s*MB\/s\s*读/i, /顺序读\s*([\d,]+)/i],
    seqWrite: [/写\s*(?:速\s*)?([\d,]+)\s*MB\/s/i, /([\d,]+)\s*MB\/s\s*写/i],
    tbw:      [/([\d,]+)\s*TBW/i],
    warranty: [/(\d+)\s*年\s*[保质]/]
  },
  psu: {
    wattage:   [/(\d{3,4})\s*W/i],
    efficiency:[/钛金/i, /白金/i, /金牌/i, /铜牌/i, /白牌/i],
    standard:  [/ATX\s*(3\.1|3\.0|2\.\d)/i],
    form:      [/SFX-?L/i, /\bSFX\b/i, /\bTFX\b/i, /\bATX\b/i],
    modular:   [/全模组/, /半模组/, /直出/, /非模组/],
    length:    [/(\d{3})\s*mm/i],
    fanSize:   [/(\d{2,3})\s*mm\s*风扇/i, /(\d{2,3})\s*风扇/i],
    pcie5:     [/原生\s*1[26]V/i, /12V-?2[×x]6/i, /16\s*pin/i],
    cap:       [/日系电容/, /固态电容/, /混合电容/],
    warranty:  [/(\d+)\s*年\s*[保质]/, /([一二三四五六七八九十两]+)\s*年\s*[保质]/, /([一二三四五六七八九十两]+)年保/]
  },
  case: {
    formSupport: [/E-?ATX\/ATX/i, /\bE-?ATX\b/i, /\bATX\b/i, /\bMATX\b|M-ATX/i, /\bITX\b/i],
    gpuMax:      [/显卡限长\s*(\d+)/i, /限长\s*(\d+)/i],
    cpuMax:      [/CPU\s*限高\s*(\d+)/i, /限高\s*(\d+)/i],
    radSupport:  [/(\d{2,3})\s*(?:\/\s*\d{2,3})*\s*(?:水冷|冷排)/i, /支持\s*(\d{2,3})\s*水冷/],
    volume:      [/约?\s*(\d+)\s*L\b/i],
    size:        [/(\d{3}\s*[×x]\s*\d{3}\s*[×x]\s*\d{3}\s*mm)/i],
    fanSlots:    [/(\d+)\s*风扇位/, /(\d+)\s*个?\s*风扇位/],
    driveBays:   [/(\d+\s*[×x]\s*3\.5[^\s;]*)/i, /(硬盘位)/],
    color:       [/黑白双色/, /银白色/, /白色/, /黑色/],
    sidePanel:   [/海景房/, /钢化玻璃/, /玻璃侧透/, /网面/, /侧透/],
    frontIO:     [/Type-?C\s*([\d.]+\s*Gbps)?/i],
    weight:      [/([\d.]+)\s*kg/i]
  },
  cooler: {
    type:      [/一体式水冷/, /双塔/, /单塔/, /下压式/, /风冷/],
    radSize:   [/(\d{2,3})\s*冷排/, /冷排\s*(\d{2,3})/, /(\d{2,3})\s*mm\s*冷排/i],
    height:    [/高\s*([\d.]+)\s*mm/i, /([\d.]+)\s*mm\s*高/i],
    tdpRating: [/解热\s*(\d+)\s*W/i, /压制\s*(\d+)\s*W/i],
    heatpipes: [/(\d+)\s*热管/, /\d+\s*[×x]\s*\d+\s*mm\s*热管/],
    sockets:   [/支持\s*(AM[45]|LGA\s?\d+)/i, /(AM[45])/i, /(LGA\s?\d+)/i],
    fanSize:   [/(\d{2,3})\s*mm\s*风扇/i, /(\d{1,2})\s*cm\s*风扇/i],
    fanCount:  [/([一二三四1-4])\s*风扇/, /(\d+)\s*风扇/],
    rgb:       [/ARGB/i, /RGB/i]
  },
  monitor: {
    size:       [/(\d{2}(?:\.\d)?)\s*英寸/, /(\d{2}(?:\.\d)?)\s*"/],
    resW:       [/(\d{4})\s*[×x]\s*(\d{3,4})/, /\b(4K|2K|1080P)\b/i],
    resH:       [/(\d{3,4})\s*[×x]\s*(\d{3,4})/],
    panel:      [/Fast\s*IPS/i, /QD-?OLED/i, /QD-?MiniLED/i, /MiniLED/i, /\bOLED\b/i, /\bIPS\b/i, /\bVA\b/i, /\bTN\b/i],
    refresh:    [/(\d{2,3})\s*Hz/i],
    response:   [/([\d.]+)\s*ms/i],
    brightness: [/(\d{3,4})\s*(?:cd\/m²|nit)/i],
    hdr:        [/HDR\s*(400|600|1000|1400)/i, /True\s*Black\s*(400|500)/i, /HDR10/],
    colorGamut: [/(\d{2,3}\s*%\s*(?:DCI-P3|sRGB|AdobeRGB)[^\s;]*)/i],
    deltaE:     [/ΔE\s*<?\s*([\d.]+)/i],
    bit:        [/(\d{1,2})\s*bit/i],
    iface:      [/(\d+\s*[×x]\s*HDMI\s*[\d.]+)/i, /(\d+\s*[×x]\s*DP\s*[\d.]+)/i, /HDMI/i],
    usbcPower:  [/Type-?C\s*(\d+)\s*W/i, /USB-?C\s*(\d+)\s*W/i],
    curve:      [/(\d{3,4})\s*R\b/]
  },
  input: {
    connection: [/(三模)/, /2\.4G/i, /蓝牙/, /有线/],
    layout:     [/(\d{2,3})\s*键/, /(\d{2,3})\s*配列/],
    switchType: [/机械/, /薄膜/, /静电容/, /光轴/],
    switchModel:[/(Cherry\s*[^\s;]*轴)/i, /([^\s;]{1,6}轴)/],
    hotswap:    [/全键热插拔/, /热插拔/],
    keycap:     [/PBT/, /ABS/],
    polling:    [/(\d+K)\s*回报率/i, /(\d{3,4})\s*Hz\s*回报率/i, /回报率\s*(\d{3,4}|\d+K)/i, /(\d{3,4})\s*Hz/i],
    dpi:        [/(\d{4,6})\s*DPI/i],
    weight:     [/(\d{2,3})\s*g\b/i],
    battery:    [/(\d{3,5})\s*mAh/i],
    rgb:        [/RGB/i, /白光/]
  },
  network: {
    wifiStd:  [/Wi-?Fi\s*7/i, /\bBE\d{4}\b/i, /Wi-?Fi\s*6/i, /\bAX\d{2,4}\b/i, /Wi-?Fi\s*5/i],
    band:     [/三频/, /双频/],
    speed:    [/(\d{4,5})\s*Mbps/i, /\b(BE|AX)(\d{3,5})\b/i],
    lanSpeed: [/(\d+(?:\.\d+)?)\s*G\s*(?:电口|网口|口)/i, /千兆/],
    lanPorts: [/(\d+\s*[×x]\s*\d+(?:\.\d+)?\s*G[^\s;]*)/i, /(\d+(?:\.\d+)?\s*G[^\s;]*\s*[×x]\s*\d+)/i, /(千兆|万兆)/],
    mesh:     [/Mesh/i, /易展/i, /AiMesh/i],
    antennas: [/(\d+)\s*天线/],
    usb:      [/USB\s*[\d.]*/i],
    mem:      [/(\d+)\s*GB\s*内存/i],
    fanless:  [/无风扇/]
  },
  stand: {
    screenSize: [/(\d+)\s*[-~]\s*(\d+)\s*英寸/, /双\s*(\d+)\s*[-~]\s*(\d+)\s*英寸/],
    load:       [/承重\s*([\d.]+)\s*kg/i, /([\d.]+)\s*kg\s*承重/i],
    heightRange:[/升降\s*([\d-]+\s*mm)/i, /([\d]{2,4}\s*[-~]\s*[\d]{2,4}\s*mm)/i],
    tilt:       [/([+\-±]?\d+°\s*\/\s*[+\-±]?\d+°)/, /倾仰/],
    rotate:     [/旋转\s*([±]?\d+°)/, /([±]?\d+°\s*旋转)/],
    armCount:   [/双屏/, /单臂/, /双臂/],
    clampMax:   [/桌夹\s*≤?\s*(\d+)\s*mm/i, /桌板\s*≤?\s*(\d+)\s*mm/i],
    material:   [/铝合金/, /钢制/, /碳钢/],
    warranty:   [/(\d+)\s*年\s*[保质]/]
  },
  dock: {
    hostIface: [/雷电\s*([345])/i, /Thunderbolt\s*([345])/i, /USB4/i, /Type-?C\s*输入/i],
    usbPorts:  [/(USB-?[0-9.]*\s*[×x]\s*\d+)/i, /(\d+\s*[×x]\s*USB-?[AC])/i, /USB-?[0-9.]*/i],
    hdmi:      [/HDMI\s*\d*K?\d*/i],
    dpPorts:   [/DP\s*([\d.]+)/i],
    lanSpeed:  [/(\d+(?:\.\d+)?)\s*G\s*网口/i, /千兆网口/],
    pdPower:   [/PD\s*(\d+)\s*W/i, /(\d+)\s*W\s*供电/i],
    cardReader:[/SD\/TF/, /读卡/],
    maxRes:    [/(\d+K\d+)/i],
    compat:    [/macOS/i, /Windows/i, /兼容系统/]
  },
  laptop: {
    gpuVram:    [/RTX\s*\d{4}\s*(\d+)\s*G/i, /(\d+)\s*G\s*显存/i],
    ram:        [/(\d+)\s*G(?:B)?\s*内存/i, /(\d+)\s*GB\s*内存/i],
    ramType:    [/LPDDR(\dX?)/i, /统一内存/, /DDR([45])/i],
    storage:    [/(\d+)\s*TB\s*SSD/i, /(\d+)\s*T\s*SSD/i, /(\d+)\s*G(?:B)?\s*SSD/i],
    screenSize: [/(\d{2}(?:\.\d)?)\s*英寸/],
    resolution: [/(\d{3,4}\s*[×x]\s*\d{3,4})/, /(\d\.\dK|\dK)/i],
    refresh:    [/(\d{2,3})\s*Hz/i],
    panel:      [/OLED/i, /MiniLED/i, /XDR/i, /IPS/i],
    weight:     [/约?\s*([\d.]+)\s*kg/i],
    battery:    [/(\d{2,3})\s*Wh/],
    tdpRelease: [/(\d+)\s*W\s*释放/, /双烤\s*(\d+)/]
  },
  phone: {
    ram:        [/(\d+)\s*G(?:B)?\s*内存/i],
    storage:    [/(\d+)\s*G(?:B)?\s*存储/i, /(\d+)\s*TB\s*存储/i],
    screenSize: [/(\d(?:\.\d+)?)\s*英寸/],
    resolution: [/(\d{3,4}\s*[×x]\s*\d{3,4})/, /(\dK)/i],
    refresh:    [/(\d{2,3})\s*Hz/i],
    panel:      [/LTPO/i, /AMOLED/i, /OLED/i, /LCD/i],
    battery:    [/(\d{4})\s*mAh/i],
    chargeWired:[/有?线?\s*(\d+)\s*W/, /(\d+)\s*W\s*快充/],
    chargeWireless:[/(\d+)\s*W\s*无线/i],
    weight:     [/约?\s*(\d{2,3})\s*g\b/i],
    thickness:  [/([\d.]+)\s*mm/i],
    ipRating:   [/IP(\d{2})/i],
    network:    [/\b5G\b/i],
    camera:     [/(\d\.\d+\s*英寸主摄|三摄|长焦|徕卡)/],
    satellite:  [/卫星/],
    nfc:        [/NFC/i]
  },
  charger: {
    power:     [/总功率\s*(\d+)\s*W/i, /(\d+)\s*W/i],
    pdMax:     [/单口\s*(?:最大)?\s*(\d+)\s*W/i, /USB-?C\s*(\d+)\s*W/i],
    capacity:  [/(\d{4,5})\s*mAh/i],
    ports:     [/(\d+\s*[×x]\s*Type-?C[^\s;]*)/i],
    protocol:  [/PD\s*([\d.]+)/i, /PPS/i, /QC\s*([\d]?)/i],
    wireless:  [/无线\s*(\d+)\s*W/i, /磁吸\s*(\d+)\s*W/i],
    gan:       [/氮化镓/, /\bGaN\b/i],
    foldPlug:  [/折叠插脚/],
    weight:    [/约?\s*(\d{2,4})\s*g\b/i]
  },
  mobileacc: {
    material:   [/硅胶/, /碳纤维/, /TPU/i, /铝合金/, /皮革/],
    magsafe:    [/MagSafe/i, /磁吸/],
    wirelessCharge: [/支持无线充电/, /无线充/],
    dropRating: [/(军规[^\s;]*)/, /(\d+\.?\d*\s*米跌落)/],
    angle:      [/(\d+\s*[-~]\s*\d+°)/, /(旋转\s*\d+°)/],
    weight:     [/约?\s*(\d{1,3})\s*g\b/i],
    color:      [/钛灰/, /黑色/, /白色/, /多色可选/]
  },
  tablet: {
    ram:        [/(\d+)\s*G(?:B)?\s*内存/i],
    storage:    [/(\d+)\s*G(?:B)?\s*存储/i, /(\d+)\s*TB/i],
    screenSize: [/(\d{2}(?:\.\d)?)\s*英寸/],
    resolution: [/(\d{3,4}\s*[×x]\s*\d{3,4})/],
    refresh:    [/(\d{2,3})\s*Hz/i],
    panel:      [/柔性\s*OLED/i, /OLED/i, /IPS/i, /LCD/i],
    battery:    [/(\d{4})\s*mAh/i],
    charge:     [/(\d+)\s*W/i],
    weight:     [/约?\s*(\d{3})\s*g\b/i],
    thickness:  [/([\d.]+)\s*mm/i],
    cellular:   [/蜂窝/, /5G/i]
  },
  earphone: {
    anc:        [/主动降噪/, /被动降噪/, /无降噪/],
    ancDepth:   [/(\d{2})\s*dB\s*降噪/i, /降噪\s*(\d{2})\s*dB/i],
    driverUnit: [/(\d{1,2}(?:\.\d)?)\s*mm\s*(?:单元|动圈)/i],
    driverType: [/动圈/, /动铁/, /圈铁/, /平板/],
    codec:      [/LDAC/i, /aptX\s*Adaptive/i, /aptX/i, /AAC/i, /SBC/i, /LC3/i],
    batterySingle: [/(?:单次|单耳)\s*(\d+)\s*(?:小时|h)/i],
    batteryTotal:  [/(?:总|含盒)[^\d]{0,4}(\d+)\s*(?:小时|h)/i],
    weight:     [/约?\s*([\d.]+)\s*g\b/i],
    ipRating:   [/IPX?(\d)/i],
    micCount:   [/(\d+)\s*麦/i]
  },
  audio: {
    channels:   [/(\d\.\d)\s*声道/],
    power:      [/(\d+)\s*W\b/],
    freqResp:   [/(\d{2,3}\s*Hz\s*[-~]\s*\d{1,2}(?:\.\d)?\s*kHz)/i],
    driver:     [/((\d{1,2}\s*英寸[^\s;]*)\s*(?:\+[^\s;]*)?)/],
    connection: [/蓝牙\s*([\d.]+)/i, /光纤/, /同轴/, /USB/i],
    micType:    [/电容/, /动圈/],
    polarPattern:[/心形/, /全指向/, /8\s*字/, /超心形/],
    sampleRate: [/(\d{2})\s*kHz/i],
    bitDepth:   [/(\d{2})\s*bit/i],
    weight:     [/约?\s*([\d.]+)\s*kg/i]
  },
  wearable: {
    screenSize: [/(\d(?:\.\d+)?)\s*英寸/],
    screenType: [/AMOLED/i, /LCD/i],
    batteryLife:[/(\d+)\s*天\s*续航/, /续航\s*(\d+)\s*天/],
    waterproof: [/(5ATM)/i, /IP(6[78])/i, /IPX(\d)/i],
    gps:        [/双频六星/, /双频/, /多频/, /GPS/i],
    health:     [/血氧/, /心率/, /ECG/i, /体温/, /血压/],
    esim:       [/eSIM/i, /独立通话/],
    nfc:        [/NFC/i],
    weight:     [/约?\s*(\d{1,3})\s*g\b/i],
    strap:      [/氟橡胶/, /硅胶/, /皮革/, /钛金属/]
  }
};

/* ── 跑覆盖 ── */
const rows = [];
Object.keys(R).forEach(catId => {
  const arr = M[catId] || [];
  const sch = SCH.cats[catId];
  if (!arr.length || !sch) { rows.push({ catId, missing: true }); return; }
  const fields = sch.fields.filter(f => f.d === 'derive');
  fields.forEach(f => {
    const rules = R[catId] && R[catId][f.k];
    if (!rules) {
      rows.push({ catId, key: f.k, label: f.n, total: arr.length, hit: 0, noRule: true });
      return;
    }
    let hit = 0, softOnly = 0;
    arr.forEach(it => {
      const ss = segs(it);
      const okHard = rules.some(re => ss.some(s => re.test(s)));
      if (okHard) { hit++; return; }
      // 硬字段没抓到，看是否只在软文本 —— 量化「只能靠软文本」的规模
      const hay = ALL(it);
      if (rules.some(re => re.test(hay))) softOnly++;
    });
    rows.push({
      catId, key: f.k, label: f.n, req: f.r,
      total: arr.length, hit, softOnly,
      pct: Math.round(hit / arr.length * 1000) / 10
    });
  });
});

/* ── 出报告 ── */
const L = [];
L.push('# specs 解析覆盖率（dry-run 实测）');
L.push('');
L.push('> `node tools/schema-dryrun.cjs` 生成。只读，未改动任何数据。');
const _sm = SCH.summary();
const _tf = _sm.reduce((a, r) => a + r.fields, 0);
const _tr = _sm.reduce((a, r) => a + r.required, 0);
const _td = _sm.reduce((a, r) => a + r.derive, 0);
L.push('> 定义见 `js/specs-schema.js`（' + _tf + ' 字段 / ' + _tr + ' 必填 / ' + _td + ' 标 derive / ' + (_tf - _td) + ' 标 manual）。');
L.push('');
L.push('**口径**：「硬命中」= 该字段在 `specs` 的某个分号片段里能抓到；「仅软文本」= specs 抓不到但 valueNote/compat/name 里有（说明字段真实存在，只是没写进硬规格）。');
L.push('');

const byCat = {};
rows.forEach(r => { if (r.missing) return; (byCat[r.catId] = byCat[r.catId] || []).push(r); });

let tAll = 0, tHit = 0, tSoft = 0;
L.push('## 总览');
L.push('');
L.push('| 品类 | 字段 | 硬命中总数 | 覆盖 | 仅软文本 | 判定 |');
L.push('|---|---|---|---|---|---|');
Object.keys(byCat).forEach(catId => {
  const rs = byCat[catId];
  const tot = rs.reduce((a, r) => a + r.total, 0);
  const hit = rs.reduce((a, r) => a + r.hit, 0);
  const soft = rs.reduce((a, r) => a + (r.softOnly || 0), 0);
  tAll += tot; tHit += hit; tSoft += soft;
  const pct = Math.round(hit / tot * 1000) / 10;
  const verdict = pct >= 70 ? '可自动生成' : pct >= 40 ? '需人工补一部分' : '须大量补录';
  L.push('| ' + SCH.cats[catId].label + ' | ' + rs.length + ' | ' + hit + '/' + tot + ' | ' + pct + '% | ' + soft + ' | ' + verdict + ' |');
});
L.push('| **合计** | — | **' + tHit + '/' + tAll + '** | **' + Math.round(tHit / tAll * 1000) / 10 + '%** | **' + tSoft + '** | — |');
L.push('');

L.push('## 必填字段里解析不出来的（迁移第 1 优先补录）');
L.push('');
L.push('| 品类 | 字段 | 硬命中 | 覆盖率 | 仅软文本 | 问题 |');
L.push('|---|---|---|---|---|---|');
rows.filter(r => !r.missing && r.req === 1 && (r.noRule || r.pct < 60)).forEach(r => {
  L.push('| ' + SCH.cats[r.catId].label + ' | ' + r.label + '(`' + r.key + '`) | ' + r.hit + '/' + r.total + ' | ' + (r.noRule ? '无规则' : r.pct + '%') + ' | ' + (r.softOnly || 0) + ' | ' + (r.noRule ? 'schema 有字段但 dry-run 未写规则' : r.pct < 30 ? '语料里几乎不存在，必须外部核验' : '写法散，规则要加分支') + ' |');
});
L.push('');

L.push('## 各品类明细');
L.push('');
Object.keys(byCat).forEach(catId => {
  L.push('### ' + SCH.cats[catId].label + '（' + catId + '）');
  L.push('');
  L.push('| 字段 | 必填 | 硬命中 | 覆盖 | 仅软文本 |');
  L.push('|---|---|---|---|---|');
  byCat[catId].forEach(r => {
    L.push('| ' + r.label + '(`' + r.key + '`) | ' + (r.req ? '是' : '') + ' | ' + r.hit + '/' + r.total + ' | ' + (r.noRule ? '—' : r.pct + '%') + ' | ' + (r.softOnly || 0) + ' |');
  });
  L.push('');
});

fs.writeFileSync(path.join(SITE, 'reports/specs-parse-coverage.md'), L.join('\n'), 'utf8');
/* 精确映射给 schema-doc 用：键必须是 catId.key，不能只用 key ——
   capacity/warranty/weight 在多个品类都有，只用 key 会互相覆盖。 */
const jmap = {};
rows.forEach(r => { if (!r.missing) jmap[r.catId + '.' + r.key] = { hit: r.hit, total: r.total, pct: r.noRule ? null : r.pct, req: r.req || 0, softOnly: r.softOnly || 0 }; });
fs.writeFileSync(path.join(SITE, 'reports/specs-parse-coverage.json'), JSON.stringify(jmap, null, 1), 'utf8');
console.log('总覆盖', tHit + '/' + tAll, '=', Math.round(tHit / tAll * 1000) / 10 + '%', '| 仅软文本', tSoft);
console.log('低覆盖必填字段（<60%）：');
rows.filter(r => !r.missing && r.req === 1 && (r.noRule || r.pct < 60))
  .sort((a, b) => (a.pct || 0) - (b.pct || 0))
  .forEach(r => console.log('  ' + r.catId.padEnd(10) + r.key.padEnd(14) + String(r.hit + '/' + r.total).padStart(8) + '  ' + (r.noRule ? 'noRule' : r.pct + '%') + '  软' + (r.softOnly || 0)));
