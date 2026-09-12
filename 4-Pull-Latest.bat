@echo off
cd /d "%~dp0"
if exist .git\HEAD.lock del /q .git\HEAD.lock
if exist .git\index.lock del /q .git\index.lock
echo Pulling the latest main from GitHub (run this before editing if another session pushed)...
git pull --ff-only origin main
call npm install
echo.
git log --oneline -1
pause
