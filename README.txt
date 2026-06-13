# 菩提苑 网站镜像

这是 https://putiyuan.pages.dev/ 的完整离线镜像。

## 如何浏览

### 方法1：双击 start-server.bat
然后打开浏览器访问 http://localhost:3000

### 方法2：用 Python 启动
python -m http.server 3000 -d "C:\Users\1\Desktop\putiyuan-mirror"

### 方法3：用 Node.js 启动
npx http-server "C:\Users\1\Desktop\putiyuan-mirror" -p 3000

### 方法4：用 PowerShell 启动
powershell -NoExit -Command "Add-Type -AssemblyName System.Net.Http; $r=New-Object System.Net.HttpListener; $r.Prefixes.Add('http://localhost:3000/'); $r.Start(); Write-Host 'http://localhost:3000'; while($r.IsListening){$c=$r.GetContext();$p=$c.Request.Url.AbsolutePath.TrimStart('/');if(!$p){$p='index.html'};$f=Join-Path 'C:\Users\1\Desktop\putiyuan-mirror' $p;if(!(Test-Path $f)){$d=Join-Path 'C:\Users\1\Desktop\putiyuan-mirror' ($p+'/index.html');if(Test-Path $d){$f=$d}};if(Test-Path $f){$c.Response.ContentType='text/html; charset=utf-8';$b=[System.IO.File]::ReadAllBytes($f);$c.Response.OutputStream.Write($b,0,$b.Length)}else{$c.Response.StatusCode=404};$c.Response.Close()}"

## 页面列表
- 首页 - /
- 今日黄历 - /almanac/
- 周公解梦 - /dream/
- 关帝灵签 - /lottery/
- 八字精批 - /bazi/
- 六爻占卜 - /divination/
- 手相图解 - /palmistry/
- 宝宝起名 - /naming/
- 静心禅坐 - /meditation/
- 在线上香 - /temple/
- 为家人祈福 - /qifu/
- 全部功能 - /more/

## 说明
注意：部分功能（如AI解签、八字批命等）需要联网调用 API，离线状态下这些功能可能不可用。
但页面本身可以正常浏览和查看。
