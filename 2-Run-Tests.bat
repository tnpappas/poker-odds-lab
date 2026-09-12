@echo off
cd /d "%~dp0"
echo Running the full check: lint, typecheck, engine tests, API tests, web build...
call npm run check
if errorlevel 1 (
  echo.
  echo CHECK FAILED. Paste this window to Claude.
) else (
  echo.
  echo ALL CHECKS PASSED.
)
pause
