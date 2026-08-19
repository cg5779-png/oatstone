@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  OATSTONE 프로젝트 시작...
echo.
npm run dev
if errorlevel 1 pause
