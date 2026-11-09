@echo off
:: Ensure working directory is always this folder regardless of how it was launched
cd /d "%~dp0"

echo =======================================================
echo CASE - BBS: GitHub Push Utility (Creative Associate LLP)
echo Working Directory: %CD%
echo =======================================================
echo.

if not exist ".git" (
    echo [ERROR] .git folder not found in %CD%!
    echo Please make sure this file is placed in c:\TakeOff\Antigravity\BBS_2.o
    pause
    exit /b 1
)

echo Checking Git Remote...
git remote -v
echo.
echo Pushing code to GitHub (branch: main)...
echo If prompted, please sign in with your GitHub account in the browser window.
echo.
git push -u origin main

echo.
echo =======================================================
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Code successfully pushed to GitHub!
) else (
    echo [NOTE] If you saw an authentication error:
    echo 1. Generate a Personal Access Token on GitHub (Settings - Developer Settings - Personal Access Tokens)
    echo 2. Run: git push https://YOUR_TOKEN@github.com/creativeassociates17/CASE-BBS.git main
)
echo =======================================================
pause
