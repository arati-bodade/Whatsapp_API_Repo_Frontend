@echo off
REM ---------------------------------------------------------------
REM  Next.js Clean Start - BAT Wrapper
REM  Double-click from Explorer or run from cmd.exe / npm scripts
REM
REM  Usage:
REM    clean-start.bat               Normal clean start
REM    clean-start.bat --clean       Wipe .next cache too
REM    clean-start.bat --dry         Dry run
REM    clean-start.bat --kill-port-only  Just free port 3000
REM ---------------------------------------------------------------

set SCRIPT_DIR=%~dp0

REM Parse arguments
set PS_ARGS=
set KILL_PORT_ONLY=0

:parse_args
if "%~1"=="" goto find_powershell
if /I "%~1"=="--clean" set PS_ARGS=%PS_ARGS% -Clean
if /I "%~1"=="--dry"   set PS_ARGS=%PS_ARGS% -DryRun
if /I "%~1"=="--kill-port-only" set KILL_PORT_ONLY=1
shift
goto parse_args

:find_powershell
REM Try pwsh first (PowerShell 7+), then fall back to Windows PowerShell
where pwsh >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set PS_EXE=pwsh
    goto run_script
)

REM Try powershell
where powershell >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set PS_EXE=powershell
    goto run_script
)

REM Try full path to Windows PowerShell
if exist "%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" (
    set PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe
    goto run_script
)

echo ERROR: Could not find PowerShell. Please install PowerShell 7+ or ensure Windows PowerShell is available.
pause
exit /b 1

:run_script
if %KILL_PORT_ONLY%==1 (
    echo Freeing port 3000...
    %PS_EXE% -NoProfile -ExecutionPolicy Bypass -Command "Get-Process -Name 'node' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Write-Host 'Done.' -ForegroundColor Green"
    goto end
)

%PS_EXE% -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%clean-start.ps1" %PS_ARGS%

:end
REM Keep window open if double-clicked from Explorer
if "%TERM_PROGRAM%"=="" if "%WT_SESSION%"=="" if "%npm_lifecycle_event%"=="" pause
