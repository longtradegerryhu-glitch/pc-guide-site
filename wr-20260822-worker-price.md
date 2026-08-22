# 工作记录 wr-20260822-worker-price.md

> 版本：pc-guide-site · Worker 化改造 + 真实域名确认 + /price 上线 + SEO 域名修正
> 日期：2026-08-22
> 角色：审计（Auditor）

## 一、背景

用户提供真实部署地址：**https://pc-guide.longtrade-gerryhu.workers.dev/**（Cloudflare **Worker** 部署，项目名 `pc-guide`，账号子域 `longtrade-gerryhu`）。

此前排查发现：`pc-guide.pages.dev` 是他人同名 SPA 项目，`pc-guide-site.pages.dev` 无响应——**真实域名此前从未被记录**，导致 #6 SEO 的绝对地址误指向错误域名。

## 二、核心修复：Worker 化改造使 /price 生效

**问题根因**：当前部署是 **Worker（Workers Builds）**，Pages 专用的 `functions/` 目录在此模式下**不加载**——实测 `/price` 返回 404、`functions/price.js` 从未生效。

**修复**（依据官方文档 Workers 静态资源 + 路由语义）：
1. 新增 `wrangler.toml`：`main = "src/index.js"` + `[assets] directory = "./" binding = "ASSETS"`
2. 新增 `src/index.js`：Worker 入口
   - `/price` → 处理京东联盟实时价（MD5 签名 + `param_json` + 健壮解析 + KV 缓存 + 缺密钥优雅降级，逻辑原样迁移自 functions/price.js）
   - 其余请求 → `env.ASSETS.fetch(request)` 兜底（静态文件命中直接服务，未命中 404）
3. 新增 `.assetsignore`：排除 `.git`、`functions/`、`src/`、`wrangler.toml`、`wr-*.md` 等，避免内部文件被公开为静态资源
4. 删除 `functions/price.js`（git 识别为 rename → src/index.js）

## 三、SEO 域名修正

- 之前 #6 写死的 `https://pc-guide.pages.dev` 全部为错 → 已先防御性移除 `og:url`/JSON-LD `url`（提交 5db9cc1）
- 本批恢复 7 页真实绝对地址：`https://pc-guide.longtrade-gerryhu.workers.dev/<page>.html`（首页为根路径），JSON-LD `url` 指向站点根

## 四、验证（全部通过，提交 d080bdc / bcd4be2 → Workers Builds: pc-guide success）

| 项 | 结果 |
|---|---|
| 根路径静态站 | ✅ 标题「电脑使用指南与配套硬件总结」 |
| `/price?q=RTX 5060` | ✅ 返回 JSON `{ok:false, error:京东联盟密钥未配置…}` |
| `/price` 无参 | ✅ HTTP 400 |
| guide/accessories.html | ✅ 307→无扩展名，页面可达 |
| js/recommend.js 等静态资源 | ✅ HTTP 200 |
| `wr-*.md` 静态暴露 | ✅ 404（.assetsignore 生效） |
| 线上 og:url / JSON-LD url | ✅ 均为真实域名 |

## 五、待办（用户侧，激活真实价）

Worker 的密钥配置位置是 **Settings → Variables and Secrets**（注意：不是 Pages 的 Environment variables）：
1. 京东联盟申请推客，拿 `JD_APP_KEY` / `JD_APP_SECRET` / `JD_UNION_ID`
2. Cloudflare → Worker `pc-guide` → Settings → Variables and Secrets → 添加三个变量（secret 用加密）
3. 保存后自动生效；验证 `https://pc-guide.longtrade-gerryhu.workers.dev/price?q=RTX%205060` 返回 `{"ok":true,"items":[...]}`
4. （可选）绑定 KV 命名空间作 `PRICE_CACHE`，1 小时缓存
