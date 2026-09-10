@echo off
TITLE Sayri Live TTS Server
:input
cls
echo ==========================================
echo    SAYRI LIVE TTS SYSTEM
echo ==========================================
echo.
echo Please enter the YouTube Live URL.
echo (Example: https://www.youtube.com/live/xxxxxx)
echo.
set /p LIVE_URL="URL: "

if "%LIVE_URL%"=="" (
    echo.
    echo [ERROR] URL is required to start the system.
    echo Please paste a valid YouTube Live link.
    pause
    goto input
)

cls
echo ==========================================
echo    SAYRI LIVE TTS SYSTEM - STARTED
echo ==========================================
echo.
echo 🟢 Server has started successfully!
echo.
echo 💻 OBS BROWSER SOURCE LINK:
echo    http://localhost:3000
echo.
echo 💡 INSTRUCTIONS:
echo    1. Open OBS Studio.
echo    2. Add a 'Browser Source'.
echo    3. Put URL as: http://localhost:3000
echo    4. Right-click source -^> Interact and click once on the notebook.
echo.
echo ==========================================
echo LOGS / CHAT MESSAGES WILL APPEAR BELOW:
echo ==========================================
echo.

node server.js "%LIVE_URL%"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Server stopped.
    pause
    goto input
)
pause
