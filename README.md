# mail_resend

一个**无需编程**就能发送邮件的网页，通过 [Resend](https://resend.com) 的 API 发信，部署在 Cloudflare Pages 上。

填个表单点发送即可。API key 存在 Cloudflare 服务端，浏览器永远看不到，不会泄露。

## 工作原理

```
浏览器填表  →  你的页面 /api/send（Cloudflare 服务端）  →  带着 key 请求 Resend
                        ↑ API key 只存在这一层，前端拿不到
```

- `public/`          — 静态页面（表单）
- `functions/api/send.js`   — 发信接口，服务端调用 Resend
- `functions/api/config.js` — 告诉前端是否需要密码框

## 前置准备

1. 注册 [Resend](https://resend.com)，在 [API Keys](https://resend.com/api-keys) 创建一个 key（以 `re_` 开头）。
2. 在 Resend 里**验证一个域名**（Domains 页面）。发件人邮箱必须用这个已验证域名，比如 `you@yourdomain.com`。
   - 只是想快速测试、还没有域名？Resend 提供了测试发件地址 `onboarding@resend.dev`，但只能发到你注册 Resend 用的那个邮箱。

## 方式一：本地验证（最快，不用部署）

需要 Node.js 18+。

```bash
# 1. 装依赖（只装 wrangler，Cloudflare 官方本地工具）
npm install

# 2. 配置本地 key
cp .dev.vars.example .dev.vars
# 然后编辑 .dev.vars，把 RESEND_API_KEY 换成你自己的 re_... key

# 3. 启动本地服务
npm run dev
```

打开终端里显示的地址（一般是 http://localhost:8788），填表发送即可。

`.dev.vars` 已被 `.gitignore` 忽略，不会提交，放心填。

## 方式二：部署到 Cloudflare

### A. 命令行部署

```bash
npm install
npx wrangler login          # 首次需要登录授权
npm run deploy
```

部署后，去 Cloudflare 控制台设置 key（见下方「设置环境变量」）。

### B. 网页控制台部署（连 Git 仓库）

1. 把代码推到 GitHub / GitLab。
2. Cloudflare 控制台 → **Workers & Pages** → **Create** → **Pages** → 连接你的仓库。
3. 构建设置：
   - **Build command**：留空
   - **Build output directory**：`public`
4. 部署完成。

### 设置环境变量（关键一步）

Cloudflare 项目 → **Settings** → **Environment variables** → 添加：

| 变量名 | 值 | 类型 |
|---|---|---|
| `RESEND_API_KEY` | 你的 `re_...` key | **Secret**（加密） |
| `ACCESS_PASSWORD` | 自定义访问密码（可选） | Secret |

`RESEND_API_KEY` **必填**。加完变量后重新部署一次（或触发一次 retry）让它生效。

## 访问密码（可选，建议开启）

页面部署后是公开的，任何拿到网址的人都能用你的额度发信。

设置了 `ACCESS_PASSWORD` 后，页面会自动出现「访问密码」输入框，填对才能发送。本地测试就在 `.dev.vars` 里填 `ACCESS_PASSWORD=你的密码`。

## 页面支持的字段

发件人、收件人、抄送(CC)、密送(BCC)、回复至(Reply-To)、主题、正文（纯文本或 HTML 切换）。收件人 / CC / BCC 支持多个地址，用逗号分隔。

## 常见报错

- **「服务端未配置 RESEND_API_KEY」** — 没设环境变量，或设了之后没重新部署。
- **Resend 返回 403 / domain 相关错误** — 发件人域名没在 Resend 验证，或发件地址和已验证域名不一致。
- **只能发到自己邮箱** — 用的是 `onboarding@resend.dev` 测试地址，验证自己的域名后即可发给任何人。
