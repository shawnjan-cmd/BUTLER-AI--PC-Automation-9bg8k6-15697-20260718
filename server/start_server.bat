@echo off
setlocal
cd /d "%~dp0.."
if "%BUTLER_BIND%"=="" set BUTLER_BIND=127.0.0.1
set BUTLER_UI_MODE=desktop
set BUTLER_NO_BROWSER=1
py -3 server\run_server_safe.py %*
if errorlevel 1 pause
