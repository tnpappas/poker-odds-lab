@echo off
cd /d "%~dp0"
git add docs CHANGELOG.md 13-Commit-Docs-And-Gate-Report.bat
git commit -m "Docs: gate report (ready with conditions), 2FA audit, retention, breach and data inventory sections"
git push origin main
echo.
echo DONE. Copy the last 10 lines above.
pause
