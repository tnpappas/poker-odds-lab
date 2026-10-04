@echo off
setlocal
cd /d "%~dp0"
rem One reusable publish file. Claude writes .publish-files.txt (one path per line)
rem and .publish-message.txt (the commit message) before each publish.
if exist ".git\index.lock" del /f /q ".git\index.lock"
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock"
if not exist ".publish-files.txt" (echo Nothing to publish: .publish-files.txt is missing. Tell Claude. & pause & exit /b 1)
if not exist ".publish-message.txt" (echo Nothing to publish: .publish-message.txt is missing. Tell Claude. & pause & exit /b 1)
echo ============================================================
echo   Publishing Poker Logic Lab
echo   Runs every check first. Nothing is pushed if a check fails.
echo ============================================================
for /f "delims=" %%B in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%B
echo Branch: %BRANCH%
echo Files:
type ".publish-files.txt"
echo.
echo Step 1 of 3: checks...
call npm run check
if errorlevel 1 (echo CHECKS FAILED. Nothing was pushed. Copy this window to Claude. & pause & exit /b 1)
echo Step 2 of 3: commit...
for /f "usebackq delims=" %%F in (".publish-files.txt") do git add -A -- "%%F"
git commit -F ".publish-message.txt"
if errorlevel 1 (echo NOTHING TO COMMIT or COMMIT FAILED. Nothing was pushed. Copy this window to Claude. & pause & exit /b 1)
echo Step 3 of 3: push...
git push origin %BRANCH%
if errorlevel 1 (echo PUSH FAILED. The commit is saved locally but not live. Copy this window to Claude. & pause & exit /b 1)
del /q ".publish-files.txt" ".publish-message.txt"
echo.
git log --oneline -1
echo.
echo SUCCESS. Live in about 2 minutes: https://www.pokerlogiclab.com
echo Copy the last 10 lines to Claude.
pause
exit /b 0
