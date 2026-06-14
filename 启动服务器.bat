@echo off
chcp 65001 >nul
title 菩提苑 - AI算命
echo.
echo   菩提苑 AI算命服务器
echo   http://localhost:3000
echo.
echo   按 Ctrl+C 停止服务器
echo.
cd /d "%~dp0"
python server.py
pause
