@echo off
cd /d "%~dp0"
echo === Full check (lint, typecheck, tests, web build)...
call npm run check
if errorlevel 1 (echo CHECK FAILED. Nothing was pushed. Copy the output above. & pause & exit /b 1)
git add apps/api/src/db/schema.ts apps/api/test/schema.test.ts 14-Fix-Webhook-Column-And-Push.bat
git commit -m "Fix webhook_events column name (received_at) so every webhook stops failing; add schema column guard test"
git push origin main
echo.
echo DONE. Copy the last 10 lines above.
pause
