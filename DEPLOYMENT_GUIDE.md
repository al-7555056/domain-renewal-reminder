# 完整部署指南

本指南帮助你从零开始部署爱自由域名管理服务到 Cloudflare。

---

## 部署架构

- **后端**: Cloudflare Workers（API 服务）
- **前端**: Cloudflare Pages（静态网站）
- **数据库**: Cloudflare D1（SQLite）
- **存储**: Cloudflare KV（键值对）

---

## 前置要求

- Node.js v18+
- Cloudflare 账号（免费）
- GitHub 账号

---

## 一、后端部署

### 1. 安装 Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2. 创建 D1 数据库

```bash
wrangler d1 create domain_renewal_db
```

复制输出的 `database_id`，更新 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "domain_renewal_db"
database_id = "你的database_id"
```

初始化数据库：

```bash
wrangler d1 execute domain_renewal_db --file=schema.sql
```

### 3. 创建 KV 命名空间

```bash
wrangler kv:namespace create "KV"
```

复制输出的 `id`，更新 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "KV"
id = "你的KV_id"
```

### 4. 设置环境变量

生成加密密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

设置 Secrets：

```bash
# 1. 设置管理员密码
wrangler secret put ADMIN_PASSWORD
# 输入管理员密码（至少16字符）

# 2. 设置加密密钥
wrangler secret put ENCRYPTION_KEY
# 粘贴上面生成的密钥

# 3. 设置前端 URL（用于邮件验证链接）
wrangler secret put FRONTEND_URL
# 输入前端 URL，例如: https://yourdomain.com
# 或 https://xxx.pages.dev
# 或者先跳过，部署前端后再设置
```

> **注意**: `FRONTEND_URL` 用于生成邮件中的验证链接。如果不设置，系统会使用请求的 origin，但建议设置为你的实际前端域名。

### 5. 部署后端

```bash
npm install
npm run deploy
```

记录输出的 Worker URL，例如：`https://domain-renewal-reminder.xxx.workers.dev`

---

## 二、前端部署（Git 集成）

### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "准备部署"
git push
```

### 2. 在 Cloudflare Pages 中设置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
3. 选择你的 GitHub 仓库
4. 配置构建设置：
   - **Framework preset**: None
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `/` (留空或填 `/`)
5. 添加环境变量（Production）：
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://你的worker地址.workers.dev/api`
   - 例如: `https://domain-renewal-reminder.xxx.workers.dev/api`
6. 点击 **Save and Deploy**

> **重要**: 确保 `VITE_API_URL` 以 `/api` 结尾，且不要有尾部斜杠。

### 3. 等待构建完成

构建完成后会得到前端 URL，例如：`https://xxx.pages.dev`

### 4. 更新后端 FRONTEND_URL（如果之前跳过）

如果在步骤一中跳过了 `FRONTEND_URL` 设置，现在可以设置：

```bash
wrangler secret put FRONTEND_URL
# 输入前端 URL，例如: https://xxx.pages.dev
# 或你的自定义域名: https://yourdomain.com
```

设置后需要重新部署后端：

```bash
npm run deploy
```

> **重要**: 设置 `FRONTEND_URL` 后，建议重新部署前端以清除 CDN 缓存:
> 
> **方法 1: 使用命令行**
> ```bash
> cd frontend
> npm run build
> npx wrangler pages deploy dist --project-name=domain-renewal-reminder
> ```
> 
> **方法 2: 在 Cloudflare Dashboard 中**
> 1. 进入 Workers & Pages > 你的 Pages 项目
> 2. 点击 "View build" 或 "Deployments"
> 3. 点击 "Retry deployment" 重新部署最新版本

---

## 三、配置邮件服务

部署完成后，需要配置邮件服务才能发送验证邮件和续期提醒。

### 1. 访问管理员面板

访问 `https://你的前端地址/admin`，使用管理员密码登录。

### 2. 配置 SMTP

在"SMTP 配置"标签页中，选择邮件发送方式：

**推荐: HTTP API (Resend)**
- 注册 [Resend](https://resend.com) 账号（免费 100 封/天）
- 获取 API Key
- 在管理员面板配置:
  - 邮件发送方式: HTTP API
  - API 服务商: Resend
  - API Key: 你的 Resend API Key
  - 发件人邮箱: 在 Resend 验证的邮箱
  - 发件人名称: 爱自由域名管理

**或使用 SMTP (高级)**
- 配置你的 SMTP 服务器信息
- 仅支持端口 465 (SSL) 或 587 (TLS)
- 详见 [EMAIL_SETUP.md](./EMAIL_SETUP.md)

### 3. 测试邮件功能

注册一个新账号，检查是否收到验证邮件。

---

## 四、验证部署

### 测试后端

```bash
curl https://你的worker地址.workers.dev/api/health
```

### 测试前端

访问前端 URL，尝试注册和登录。

### 测试管理员

访问 `https://你的前端地址.pages.dev/admin`，使用管理员密码登录。

---

## 常见问题

### Q: 前端构建失败

**错误**: `Missing script: "build"`

**解决**: 确保根目录 `package.json` 中有：
```json
"scripts": {
  "build": "cd frontend && npm install && npm run build"
}
```

### Q: 前端无法连接后端

**解决**: 
1. 检查 Cloudflare Pages 环境变量 `VITE_API_URL` 是否正确
2. 确保 URL 以 `/api` 结尾，例如: `https://xxx.workers.dev/api`
3. 不要有尾部斜杠
4. 在 Pages 设置中重新部署

### Q: 收不到验证邮件

**解决**:
1. 检查管理员面板是否配置了邮件服务
2. 检查后端是否设置了 `FRONTEND_URL` 环境变量
3. 查看 Worker 日志: `wrangler tail`
4. 检查垃圾邮件文件夹
5. 尝试使用 Resend HTTP API 而不是 SMTP

### Q: 验证链接 404

**解决**:
1. 确保前端已部署最新版本（包含 `/verify` 路由）
2. 检查后端 `FRONTEND_URL` 是否指向正确的前端地址
3. 清除浏览器缓存后重试

### Q: 管理员密码错误

**解决**:
```bash
wrangler secret put ADMIN_PASSWORD
# 重新输入密码
```

---

## 更新部署

### 更新后端

```bash
# 修改代码后
npm run deploy
```

### 更新前端

```bash
# 修改代码后
git add .
git commit -m "更新"
git push
# Cloudflare Pages 会自动构建和部署
```

---

## 自定义域名（可选）

### 后端自定义域名

1. Workers & Pages > 你的 Worker > Triggers > Custom Domains
2. 添加域名，如 `api.yourdomain.com`

### 前端自定义域名

1. Workers & Pages > 你的 Pages 项目 > Custom domains
2. 添加域名，如 `app.yourdomain.com`
3. 按照提示配置 DNS (CNAME 记录)
4. 等待 SSL 证书生成
5. 更新后端 `FRONTEND_URL` 环境变量:
   ```bash
   wrangler secret put FRONTEND_URL
   # 输入: https://yourdomain.com
   ```
6. 重新部署后端: `npm run deploy`
7. **重要**: 重新部署前端以清除 CDN 缓存:
   ```bash
   cd frontend
   npm run build
   npx wrangler pages deploy dist --project-name=domain-renewal-reminder
   ```
   或在 Cloudflare Dashboard 中点击 "Retry deployment"

---

## 数据管理

### 备份数据库

```bash
wrangler d1 export domain_renewal_db --output=backup.sql
```

### 查询数据

```bash
wrangler d1 execute domain_renewal_db --command="SELECT COUNT(*) FROM users;"
```

### 查看日志

```bash
wrangler tail
```

---

完成！你的服务已成功部署。🎉
