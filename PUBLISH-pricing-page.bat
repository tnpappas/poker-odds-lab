@echo off
cd /d "%~dp0"
echo.
echo Publishing the Poker Logic Lab pricing page...
echo.
git push origin main
echo.
if %errorlevel%==0 (
  echo Done. Vercel and Railway redeploy automatically, usually in 1 to 2 minutes.
  echo Then open https://www.pokerlogiclab.com/pricing to check it.
) else (
  echo Push failed. Copy the message above and send it to Claude.
)
echo.
pause
