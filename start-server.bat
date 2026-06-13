@echo off
cd /d "%~dp0"
echo ========================================
echo  菩提苑 本地服务
echo  地址: http://localhost:3000
echo  按 Ctrl+C 停止
echo ========================================
python server.py
pause
