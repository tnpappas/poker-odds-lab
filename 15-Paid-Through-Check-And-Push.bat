@echo off
cd /d "%~dp0"
echo === Full check (lint, typecheck, tests, web build)...
call npm run check
if errorlevel 1 (echo CHECK FAILED. Nothing was pushed. Copy the output above. & pause & exit /b 1)
git add apps/api/src apps/api/test apps/api/drizzle apps/web/src docs CHANGELOG.md 15-Paid-Through-Check-And-Push.bat
git commit -m "Billing: keep Pro until the paid-through date after a cancel (users.pro_until, migration 0002); Account page shows renew or end date"
git push origin main
echo.
echo DONE. Copy the last 10 lines above.
pause
