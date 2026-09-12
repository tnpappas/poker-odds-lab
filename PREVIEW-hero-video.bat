@echo off
cd /d "%~dp0"
echo Pushing the hero-video PREVIEW branch to GitHub (this does NOT change the live site)...
git push -u origin hero-video
echo.
echo Done. Vercel builds a preview link in about 2 minutes. Tell Claude "pushed".
pause
