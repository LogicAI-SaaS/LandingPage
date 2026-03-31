@echo off
echo ============================================
echo Migration MySQL vers PostgreSQL + Prisma
echo ============================================
echo.

REM Vérifier si Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Node.js n'est pas installé ou pas dans le PATH
    echo Installe Node.js depuis: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js est installe
echo.

REM Vérifier si on est dans le bon dossier
if not exist "package.json" (
    echo [ERREUR] Ce script doit etre lance depuis le dossier server
    cd /d "%~dp0"
    echo [INFO] Deplacement vers le dossier server...
)

REM Lancer le script interactif
echo [INFO] Lancement du script de migration interactif...
echo.
node scripts/migrate-interactive.js

pause
