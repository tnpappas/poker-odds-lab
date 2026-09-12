@echo off
cd /d "%~dp0"
echo Starting the web app (http://localhost:5173) and the API (http://localhost:3001)...
echo The API runs with the in-memory store and dev auth unless apps\api\.env sets DATABASE_URL and CLERK_SECRET_KEY.
echo Close this window to stop both.
start "Poker Logic Lab API" cmd /k npm run dev:api
call npm run dev
