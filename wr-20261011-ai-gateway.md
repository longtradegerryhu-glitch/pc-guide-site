# wr-20261011 — AI 问答接入 EdgeOne AI Gateway（链路打通，待有效 Key）

## 一、本轮目标
1. 在现有基础上简化页面
2. 增加 AI 问答，且要有跳转功能

## 二、已完成

### 1. 首页精简
`index.html` 268 → 204 行：
- 6 张大入口卡改为紧凑列表（保留全部入口，去掉重复铺陈）
- 删除泛泛的「使用场景」区（与顶部导航重复）
- 新增 AI 入口区，含 3 个页内直问入口
- 顺手修掉过期口径：首页统计仍写「138 真实型号」，已改为 541 款型号 / 203 款上榜 / 7 套配置单

### 2. AI 问答（全站 8 个页面）
新增 `js/ai.js`：
- 入口两处：顶部导航「AI 问答」项 + 右下角常驻悬浮按钮（回到顶部按钮已让位）
- 聊天面板：SSE 流式输出、4 条快捷问题、停止生成、Esc 关闭、移动端全屏
- **跳转功能**：① 任意页面随时唤起；② 回答里的站内链接可点击直达（如 `[搭配计划](/plans.html)`）；③ 欢迎区 4 个站内跳转入口
- 服务未就绪时给可读提示与站内替代入口，不吐生硬报错
- 站内链接统一绝对路径（404 页原本用绝对路径，一并统一）；AI 元素排除打印

新增 `cloud-functions/api/chat.js`：代理网关，前端零凭据；`GET` 返回 405，`POST` 流式转发；具备消息裁剪（12 轮 / 1500 字）与状态映射（401→凭据无效、429→限频、其余→网关异常）。
新增 `.env.example` / `package.json` / `edgeone.json` 的 `cloudFunctions` 白名单。

### 3. 安全修补
`.env` 之前既不在 `.gitignore` 也不在 `.assetsignore` —— 后者意味着密钥会被当作静态资源**公开上传**。两处均已补 `.env` / `.env.*`。

## 三、EdgeOne AI Gateway 机制（逆向 CLI 得到）
- 网关：`https://ai-gateway.edgeone.link/v1`，`POST /v1/chat/completions`，`Authorization: Bearer sk-...`，模型 `@makers/deepseek-v4-flash`
- 无认证头 → `auth_missing`；头存在但 Key 未注册 → `auth_failed: API key not found`（据此可判定 Key 真伪）
- 函数读环境变量用 `context.env`（不是 `process.env`）
- CLI 自动申请凭据的机制：读 `.env.example` 里是否声明 `AI_GATEWAY_API_KEY` / `AI_GATEWAY_BASE_URL`，再对 `.env` 中**还没有值**的键去申请；**自己在 `.env` 写死值即可跳过申请**
- **本账号该接口恒报 `InvalidParameter: ZoneId is required`**（`zone-3vy0cyvu4bcc` / `edgeone-3vy0cvhr363s` / `ZoneID` / `ZoneIds` / 加 `ApiToken`、`AppId` 全试过），CLI 自动申请路径对本账号不可用
- **`makers env set/ls/pull` 在本机完全静默**（0 字节输出、退出码 0，实际不生效）→ 绕行：直接调 `POST https://pages-api.cloud.tencent.com/v1`，`{"Action":"ModifyPagesProjectEnvs","ProjectId":"makers-xtsrzn0uqidk","EnvVars":[...]}`；读用 `DescribePagesProjectEnvs`。**改完必须重新部署**才会绑到函数运行时
- 账号 region = china，只能用 china 端点；global 端点报 `Token usage region is incorrect`

## 四、当前状态
- 部署 `dp7hvocswn3v` 已上线；首页精简、全站 AI 入口、聊天面板、跳转功能均可用
- `test_ai.js` 端到端 **16/16 PASS**（导航注入、悬浮按钮、面板展开、快捷问题、站内跳转、首页入口、用户消息上屏、流式渲染、回复内链接可跳）
- 环境变量已写入项目（Production + Preview）并回读确认
- 线上 `/api/chat` 表现由 `ai_unavailable`（环境变量未注入）→ **`ai_credential_invalid`**（凭据无效）——**证明整条链路已打通，只差一把有效 Key**

## 五、待办
- 用户重新在 Makers 控制台 Models → API Key 创建一把（确认为同一账号 hu / 100051919601 / APPID 1469491162），拿到后跑 `E:/AI/_test/apply_key.py sk-xxx`（先验真、再写环境变量），重新部署后线上实测
- 备选方案（用户可随时改选）：平台内置 `CompletePagesAiLlm` 兜底（已实测可用，非流式 + 服务端持有账号级 token）；或站内本地检索问答（零凭据）

## 六、控制台入口（官方文档口径，补充）
官方文档（腾讯云 EO 文档 / Pages 文档「Makers Models 集成」）给出的创建路径：
1. 打开控制台直达页：`https://console.cloud.tencent.com/edgeone/makers?tab=models&subTab=apikey`
2. 页面会定位在 **Makers → Models → API Key**，点「创建 API Key」，命名 + 选过期时间
3. 复制 `sk-` 开头的值（界面上不会二次显示，丢失需重建）
- 模型用量总览：同 URL 的 `subTab=overview`（看每月免费额度消耗）
- 网关地址官方口径：`https://ai-gateway.edgeone.link/v1`；文档中该 Key 的环境变量名也写作 `MAKERS_MODELS_KEY`（与 `AI_GATEWAY_API_KEY` 是同一把）
- 文档明确：**Agent 项目**（`edgeone.json` 配 `agents.framework`）由平台自动注入模型网关环境变量；本项目是 `IsAgent: 0` 的 Upload 静态项目，不在此列 → 只能人工配 Key

## 七、Key 判定结论（本轮收口）
按官方 curl 原样复验（流式 / 非流式 / `/v1/messages`）→ 三条路径全部
`401 {"error":{"message":"API key not found. Please check your key or register one at the console.","type":"auth_failed"}}`
对照：**空 Key → `auth_missing`**、乱造 Key → `auth_failed`，说明网关正常读到了认证头，问题在 Key 未注册。
`/v1/models` 在该网关不存在（404 `Invalid request path`），不能用它验证 Key。

→ 下一步：用户在该直达页确认 Key 是否真的存在（或重建一把），把值发来或写入 `E:/AI/_ai_key.txt`，跑 `apply_key.py` 一键验真 + 配置 + 部署 + 线上实测。
