# Cloudflare Pages 部署指南（pc-guide-site）

> 目标项目：`E:\AI\pc-guide-site`（电脑使用指南与配套硬件总结 · 纯静态站）
> 结构：`index.html` + `css/styles.css` + `js/*.js`，**无需构建**，任何部署方式都适用。
> 更新日期：2026-08-16

---

## 0. 前置准备

| 项目 | 说明 |
|---|---|
| Cloudflare 账号 | 免费注册：https://dash.cloudflare.com/sign-up |
| 本机 Node.js | 方式 2（CLI）需要：本机已装 `C:\Users\Lenovo\nodejs`（v22.22.2，已加入用户 PATH） |
| 网络 | 国内访问 cloudflare.com 正常；npm 可配国内镜像加速（见文末） |

三种方式任选其一，推荐顺序：**方式 1（最快）→ 方式 2（可自动化）→ 方式 3（Git 联动）**。

---

## 方式 1：Dashboard 拖拽上传（最快，推荐）

1. 登录 https://dash.cloudflare.com
2. 左侧菜单 **Workers & Pages** → **创建** → **Pages** 页签 → **上传资产（Upload assets）**
3. 填写**项目名称**：`pc-guide-site`（将自动获得域名 `pc-guide-site.pages.dev`）
4. **拖拽上传**：把 `E:\AI\pc-guide-site` 文件夹内的内容拖入上传区
   - 拖入的内容需包含根目录下的 `index.html`、`css/`、`js/` 文件夹
   - 不要包含 `.git/`、`wr-*.md` 等非站点文件（不影响，但保持干净）
5. 点击 **保存并部署**，等待数秒即完成
6. 部署成功后可访问：`https://pc-guide-site.pages.dev`

**更新站点**：进入该项目 → **创建新部署（Create new deployment）** → 重新拖入最新文件。

---

## 方式 2：Wrangler CLI（命令行，适合后续自动化）

```bash
# 1) 全局安装 Wrangler（使用刚装好的 Node）
npm install -g wrangler

# 2) 登录 Cloudflare（会在系统浏览器中打开授权页，扫码/登录即可）
wrangler login

# 3) 部署（在项目目录下执行）
cd E:\AI\pc-guide-site
wrangler pages deploy . --project-name pc-guide-site
```

- 首次执行会提示**创建项目**（选择生产分支 `production`），部署完成后输出：
  `https://pc-guide-site.pages.dev`
- **更新部署**：再次执行同一条 `wrangler pages deploy` 命令即可
- **常用命令**：
  - 查看项目：`wrangler pages project list`
  - 指定分支：`wrangler pages deploy . --project-name pc-guide-site --branch main`
  - 预览本地构建（可选）：`npx wrangler pages dev .`

> 提示：如果 `npm install -g wrangler` 网络慢，先执行
> `npm config set registry https://registry.npmmirror.com`（本机建议直接加）。

---

## 方式 3：连接 Git 仓库（自动 CI/CD）

1. **推送本项目到 GitHub**（本机已是 git 仓库，含 4 个提交）：
   ```bash
   cd E:\AI\pc-guide-site
   git remote add origin https://github.com/<你的用户名>/pc-guide-site.git
   git push -u origin master
   ```
2. Cloudflare Pages → **创建项目** → **连接 Git** → 选择刚推送的仓库
3. **构建配置**（静态站无构建步骤）：
   - 框架预设：None
   - 构建命令：**留空**
   - 构建输出目录：**`/`**（根目录，即含 index.html 的目录）
4. 保存后**自动完成首次部署**；此后每次 `git push` 都会自动更新线上站点

---

## 4.（可选）绑定自定义域名

1. 进入 Pages 项目 → **自定义域（Custom domains）** → **添加域**
2. 输入你的域名（如 `guide.example.com`）
3. 按提示完成 DNS 托管（将域名 NS 转到 Cloudflare，或添加 CNAME 指向 `pc-guide-site.pages.dev`）
4. 等待 SSL 证书签发（自动，约 1-5 分钟）

---

## 5. 注意事项

- **免费额度**：Cloudflare Pages 免费计划不限带宽与请求数，本项目完全适用
- **上线 ≠ 本地更新**：每次修改 `index.html` / `css` / `js` 后需重新部署（方式 1 重传 / 方式 2 重跑命令 / 方式 3 自动）
- **行情数据**：`js/models.js` 内价格为 2026-08 参考行情，更新数据后记得重新部署
- **本地预览不受影响**：本地仍可 `python -m http.server 8124` 预览
- **国内访问建议**：Cloudflare 默认节点在国内速度一般，如需更快可考虑自定义域 + 中国区网络优化（进阶，非必需）

---

## 附：本机环境现状（方便直接操作）

- Node.js：`C:\Users\Lenovo\nodejs\node.exe`（v22.22.2，npm 10.9.7，已加入用户 PATH）
- 全局包目录：`C:\Users\Lenovo\nodejs`（`npm install -g` 装到此处）
- 如需我代为执行方式 2：装好 wrangler 后，由你完成 `wrangler login` 的浏览器授权，其余（部署命令、验证、返回链接）我来执行即可。
