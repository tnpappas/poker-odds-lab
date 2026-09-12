@echo off
cd /d "%~dp0"
echo === Installing upgraded packages (drizzle-orm 0.45, drizzle-kit 0.31, react-router-dom 7.18)...
call npm install
if errorlevel 1 (echo INSTALL FAILED. Copy the output above. & pause & exit /b 1)
echo === Applying remaining non-breaking audit fixes...
call npm audit fix
echo === Production dependency audit (must show 0 high/critical)...
call npm audit --omit=dev --audit-level=high
if errorlevel 1 (echo AUDIT STILL FAILING. Nothing was pushed. Copy the output above. & pause & exit /b 1)
echo === Full check (lint, typecheck, tests, web build)...
call npm run check
if errorlevel 1 (echo CHECK FAILED. Nothing was pushed. Copy the output above. & pause & exit /b 1)
git add -A
git commit -m "Deps: upgrade drizzle-orm and react-router to patch high-severity advisories; CI audit now passes"
git push origin main
echo.
echo DONE. Copy the last 15 lines above.
pause
