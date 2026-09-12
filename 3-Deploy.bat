@echo off
cd /d "%~dp0"
if exist .git\HEAD.lock del /q .git\HEAD.lock
if exist .git\index.lock del /q .git\index.lock
echo Step 1 of 3: run every gate (lint, typecheck, engine tests, API tests, web build)...
call npm run check
if errorlevel 1 (
  echo.
  echo CHECKS FAILED. Nothing was pushed. Paste this window to Claude.
  pause
  exit /b 1
)
echo.
echo Step 2 of 3: commit everything that changed...
git add -A
set /p MSG=Commit message (what changed and why): 
if "%MSG%"=="" set MSG=Update
git commit -m "%MSG%"
echo.
echo Step 3 of 3: push to GitHub (Vercel and Railway deploy automatically, about 2 minutes)...
git push origin main
echo.
git log --oneline -1
echo.
echo Done. Check https://www.pokerlogiclab.com and https://polapi-production.up.railway.app/api/health in 2 minutes.
pause
