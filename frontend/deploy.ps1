# 前端部署脚本 (PowerShell)
# 使用方法: .\deploy.ps1

Write-Host "开始构建前端..." -ForegroundColor Green

# 设置环境变量（替换为你的实际 API URL）
$env:VITE_API_URL = "https://your-worker-url.workers.dev/api"

# 构建
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "构建成功！开始部署..." -ForegroundColor Green
    
    # 部署到 Cloudflare Pages
    npx wrangler pages deploy dist --project-name=domain-renewal-reminder
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "部署成功！" -ForegroundColor Green
    } else {
        Write-Host "部署失败！" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "构建失败！" -ForegroundColor Red
    exit 1
}
