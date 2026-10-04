@echo off
cd /d "%~dp0"
if exist .git\index.lock del /f .git\index.lock
echo === Full check (lint, typecheck, tests, web build)...
call npm run check
if errorlevel 1 (echo CHECK FAILED. Nothing was pushed. Copy the output above. & pause & exit /b 1)
git add apps/web/index.html apps/web/src/pages/Guide.tsx 15-Fix-Share-Pricing-Copy.bat
git commit -m "Replace dead lifetime pricing in share preview and Guide CTA with current subscription pricing"
git push origin main
echo.
echo DONE. Copy the last 10 lines above.
pause
