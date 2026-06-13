# 菩提苑 GitHub + VPS 自动部署

这套流程适合当前项目：本地改完代码推送到 GitHub，VPS 每分钟自动检测 GitHub 是否有新提交；有更新就拉取、编译检查、重启服务。

## 1. 本地初始化 Git 并推到 GitHub

在 `C:\Users\1\Desktop\菩提苑` 执行：

```powershell
git init
git add .
git commit -m "Initial putiyuan deployment"
git branch -M main
git remote add origin https://github.com/你的账号/你的仓库.git
git push -u origin main
```

注意：`.gitignore` 已忽略 `data.db`、日志、`.env` 等运行数据和密钥，不会把本地数据库推到 GitHub。

## 2. VPS 一键安装

建议 Ubuntu 22.04/24.04。登录 VPS 后执行：

```bash
sudo apt-get update
sudo apt-get install -y git
git clone https://github.com/你的账号/你的仓库.git /tmp/putiyuan-install
sudo bash /tmp/putiyuan-install/scripts/deploy/install-vps.sh https://github.com/你的账号/你的仓库.git main
```

安装完成后：

```bash
systemctl status putiyuan.service
systemctl list-timers putiyuan-update.timer
curl http://127.0.0.1:3000/
```

## 3. 自动更新机制

VPS 会启用：

- `putiyuan.service`：运行网站
- `putiyuan-update.timer`：每分钟触发一次更新检查
- `putiyuan-update.service`：执行更新脚本

更新脚本位置：

```bash
/opt/putiyuan/current/scripts/deploy/putiyuan-update.sh
```

手动立刻更新：

```bash
sudo /opt/putiyuan/current/scripts/deploy/putiyuan-update.sh --force
```

查看更新日志：

```bash
journalctl -u putiyuan-update.service -n 100 --no-pager
journalctl -u putiyuan.service -n 100 --no-pager
```

## 4. Nginx 反向代理

安装 Nginx：

```bash
sudo apt-get install -y nginx
sudo cp /opt/putiyuan/current/scripts/deploy/nginx-putiyuan.conf /etc/nginx/sites-available/putiyuan
sudo ln -s /etc/nginx/sites-available/putiyuan /etc/nginx/sites-enabled/putiyuan
sudo nano /etc/nginx/sites-available/putiyuan
sudo nginx -t
sudo systemctl reload nginx
```

把 `server_name example.com www.example.com;` 改成你的域名。

如果要 HTTPS：

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
```

## 5. 生产配置

配置文件：

```bash
sudo nano /etc/putiyuan.env
sudo systemctl restart putiyuan.service
```

关键项：

```env
PUTIYUAN_HOST=127.0.0.1
PUTIYUAN_PORT=3000
PUTIYUAN_DB_PATH=/var/lib/putiyuan/data.db
PUTIYUAN_SECRET_KEY=请使用很长的随机字符串
```

数据库在 `/var/lib/putiyuan/data.db`，不会被 GitHub 更新覆盖。

## 6. GitHub Actions

已添加：

- `.github/workflows/ci.yml`：push/PR 时检查 Python 语法和部署脚本语法。
- `.github/workflows/ssh-deploy.yml`：可选手动 SSH 部署。如果以后想在 GitHub 页面点按钮部署，需要配置仓库 Secrets：
  - `VPS_HOST`
  - `VPS_USER`
  - `VPS_SSH_KEY`
  - `VPS_PORT`

当前推荐使用 VPS 自动检测更新，不强依赖 GitHub Secrets。

## 7. 日常发布

本地修 bug 后：

```powershell
git add .
git commit -m "Fix bug"
git push
```

VPS 最多约 1 分钟自动拉取并重启。
