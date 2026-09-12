@echo off
cd /d "%~dp0"
echo === Moving one-off helper files out of the project root...
if not exist _to_delete mkdir _to_delete
for %%F in ("0-Unlock-Storage-Files.bat" "1-Pull-Latest.bat" "2-Typecheck-And-Migrate.bat" "3-Commit-And-Push-Cancel-Fix.bat" "4-Build-And-Push-Legal-Fix.bat" "5-Install-Build-Push-Legal-Fix.bat" "6-Typecheck-Push-Suspended-Fix.bat" "7-Install-Build-Push-Sentry.bat" "8-Batch1-Check-And-Push.bat" "9-Commit-Docs-And-Bat-Files.bat" "10-Secret-Scan.bat" ".github\workflows\ci.yml.new" "secret-scan-report.txt" "scan-raw.txt") do (
  if exist %%F move /y %%F _to_delete\ >nul
)
echo === Full check (lint, typecheck, tests, web build)...
call npm run check
if errorlevel 1 (
  echo.
  echo CHECK FAILED. Nothing was pushed. Copy the output above.
  pause
  exit /b 1
)
echo === Committing and pushing...
git add -A
git commit -m "Web: gate Meta Pixel behind consent banner, fix privacy cookie text, ignore scan output, retire one-off bat files"
git push origin main
echo.
echo DONE. Copy the output above.
pause
