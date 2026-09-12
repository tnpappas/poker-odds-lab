@echo off
cd /d "%~dp0"
rem Clear stale lock files left by the Claude bridge (safe when no other git process is running)
if exist .git\HEAD.lock del /q .git\HEAD.lock
if exist .git\index.lock del /q .git\index.lock
echo Pushing main to GitHub (Vercel and Railway deploy automatically)...
git push origin main
echo.
echo Done. Check https://www.pokerlogiclab.com/blog in about 2 minutes.
pause
