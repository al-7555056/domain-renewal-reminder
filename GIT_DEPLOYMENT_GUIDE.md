# Git 集成自动部署指南

本指南只负责前端 Cloudflare Pages 的 Git 自动部署。

如果你还没有部署后端 Worker、D1、KV 和 secrets，先看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)。

---

## 前提条件

- 后端 Worker 已部署完成
- `VITE_API_URL` 对应的后端地址已经可访问
- 代码仓库已经推送到 GitHub

---

## 一、连接 GitHub 到 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 打开 `Workers & Pages`
3. 点击 `Create application`
4. 选择 `Pages`
5. 选择 `Connect to Git`
6. 连接并授权你的 GitHub 账号
7. 选择这个项目仓库

---

## 二、推荐构建配置

这个仓库的前端源码位于 `frontend/`，但根目录已经定义了构建脚本，所以推荐直接使用：

- Project name：`domain-renewal-reminder`
- Production branch：你的主分支，例如 `main`
- Framework preset：`None` 或 `Vite`
- Build command：`npm run build`
- Build output directory：`frontend/dist`
- Root directory：留空

如果你希望使用显式构建命令，也可以配置为：

- Build command：`cd frontend && npm install && npm run build`
- Build output directory：`frontend/dist`

---

## 三、必须配置的 Pages 环境变量

在 `Production` 环境添加：

```text
VITE_API_URL=https://你的-worker.workers.dev/api
```

要求：

- 必须以 `/api` 结尾
- 不要有尾部斜杠

如果你使用自定义后端域名，例如 `https://api.example.com`，则配置为：

```text
VITE_API_URL=https://api.example.com/api
```

---

## 四、首次部署

点击 `Save and Deploy` 后，Pages 会自动拉取仓库并构建。

部署成功后，你会获得一个 Pages 地址，例如：

```text
https://domain-renewal-reminder.pages.dev
```

建议立即验证：

- 登录页能打开
- 注册页能打开
- `/verify` 页面能打开
- 仪表盘能正常请求后端

---

## 五、后续日常发布

只要把代码推送到 GitHub，Pages 会自动重新部署：

```bash
git add .
git commit -m "update frontend"
git push
```

---

## 六、修改环境变量后的注意事项

如果你改了 `VITE_API_URL`，需要重新触发 Pages 部署。否则浏览器拿到的仍然是旧构建产物。

可选做法：

- 在 Dashboard 中点击重新部署
- 或再次推送一次代码

---

## 七、预览分支

如果 Pages 开启了分支预览，推送其他分支会自动生成预览地址：

```bash
git checkout -b feature/ai-import
git push origin feature/ai-import
```

你会得到类似：

```text
https://feature-ai-import.<project>.pages.dev
```

注意：

- 预览环境也需要正确的 `VITE_API_URL`
- 如果预览需要单独指向测试 Worker，请在 Preview 环境单独设置变量

---

## 八、常见问题

### 1. Pages 构建失败

先看构建日志，重点检查：

- Node 版本
- `npm run build` 是否成功
- `frontend/dist` 是否生成

### 2. 页面打开了，但 API 报错

通常是 `VITE_API_URL` 配置错误，检查：

- 域名是否正确
- 是否以 `/api` 结尾
- Worker 是否已部署

### 3. 修改前端后页面没更新

检查：

- 是否真的触发了新部署
- 浏览器缓存
- Pages 是否回滚到了旧版本

### 4. 管理员入口打不开

前端地址本身没问题时，通常是后端接口异常。先确认：

- Worker 可访问
- `ADMIN_PASSWORD` 已设置
- 浏览器请求的是正确的 API 地址
