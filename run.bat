@echo off
rem KaraokeBox launcher for Windows.
rem Creates a virtualenv on first run, keeps yt-dlp current, then opens the app.
setlocal
cd /d "%~dp0"

rem The py launcher first: it knows where Python is even when PATH does not.
if not defined PYTHON (
  py -3 --version >nul 2>nul && set "PYTHON=py -3"
)
if not defined PYTHON (
  python --version >nul 2>nul && set "PYTHON=python"
)
if not defined PYTHON goto nopython

set "VENV_PY=.venv\Scripts\python.exe"

if not exist "%VENV_PY%" (
  echo Setting up KaraokeBox ^(first run only^)...
  %PYTHON% -m venv .venv || goto failed
  "%VENV_PY%" -m pip install --quiet --upgrade pip
)

rem Run every time, not just on first launch, so pulling an update that adds a
rem dependency actually installs it. This is a no-op once requirements are met.
"%VENV_PY%" -m pip install --quiet -r requirements.txt || goto failed

rem YouTube changes often; a stale yt-dlp is the usual cause of failed downloads.
if not "%KARAOKE_SKIP_UPDATE%"=="1" (
  "%VENV_PY%" -m pip install --quiet --upgrade yt-dlp || echo Could not update yt-dlp - continuing with the installed version.
)

"%VENV_PY%" -m karaoke %*
exit /b %errorlevel%

:nopython
echo Python 3 is required.
echo Install it from https://www.python.org/downloads/ and tick
echo "Add python.exe to PATH" in the installer.
pause
exit /b 1

:failed
echo.
echo Setting up KaraokeBox failed - the error is above.
pause
exit /b 1
