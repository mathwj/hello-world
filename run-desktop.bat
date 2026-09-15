@echo off
rem KaraokeBox as a desktop app, where the Music page can load youtube.com for
rem real. Starts the local server, then opens the window.
setlocal
cd /d "%~dp0"

if not defined KARAOKE_PORT set "KARAOKE_PORT=8770"
set "URL_FILE=%CD%\.karaokebox-url"

where npm >nul 2>nul
if errorlevel 1 goto nonode

if not exist "desktop\node_modules" (
  echo Setting up the desktop shell ^(first run only - this downloads Electron^)...
  pushd desktop
  call npm install --silent
  popd
)

rem Reuse a server that is already running; otherwise start one.
curl -fsS "http://127.0.0.1:%KARAOKE_PORT%/api/status" >nul 2>nul
if not errorlevel 1 (
  echo Using the KaraokeBox already running on port %KARAOKE_PORT%.
  set "URL=http://127.0.0.1:%KARAOKE_PORT%/"
  goto launch
)

rem The server may not end up on the port we asked for: something can hold a
rem port without serving on it, and refusing to start over that is worse than
rem moving. Where it landed is written down, and that is what the window opens.
del "%URL_FILE%" >nul 2>nul
set "KARAOKE_NO_BROWSER=1"
set "KARAOKE_SCRIPT=run-desktop.bat"
set "KARAOKE_URL_FILE=%URL_FILE%"
rem In a window of its own, so what the server says stays readable: this one
rem goes on to run the app and would bury it.
start "KaraokeBox server" cmd /c run.bat
echo Starting KaraokeBox...
set /a TRIES=0

:wait
if exist "%URL_FILE%" goto ready
set /a TRIES+=1
if %TRIES% GEQ 90 goto nostart
timeout /t 1 /nobreak >nul
goto wait

:ready
set /p URL=<"%URL_FILE%"

:launch
set "KARAOKE_URL=%URL%"
call "desktop\node_modules\.bin\electron.cmd" desktop
rem The server is in a window of its own and would outlive this one.
taskkill /FI "WINDOWTITLE eq KaraokeBox server*" /T /F >nul 2>nul
exit /b 0

:nostart
echo.
echo The server did not start within ninety seconds.
echo The "KaraokeBox server" window says why.
pause
exit /b 1

:nonode
echo Node.js is required for the desktop window.
echo Install it from https://nodejs.org - or use run.bat, which runs
echo KaraokeBox in your browser instead.
pause
exit /b 1
