@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   LANCEMENT DU SERVEUR LOCAL FONDA WORKPLACE
echo ===================================================
echo.

:: Recherche automatique de l'adresse IP locale
for /f "tokens=2 delims=:" %%F in ('ipconfig ^| findstr /c:"IPv4"') do set IP=%%F
if defined IP (
    set IP=%IP: =%
) else (
    set IP=localhost
)

echo --- POUR VOUS (Sur ce PC) ---
echo Lien : http://localhost:8000
echo.
echo --- POUR LES ETUDIANTS (Sur le reseau Wi-Fi) ---
echo Demandez-leur d'ouvrir le lien : http://%IP%:8000
echo.
echo (Si une fenetre du Pare-feu apparait, cliquez sur "Autoriser")
echo.
echo Ne fermez pas cette fenetre noire pendant le cours !
echo ===================================================

start http://localhost:8000

if exist "php\php.exe" (
    echo Utilisation de la version portable de PHP...
    php\php.exe -S 0.0.0.0:8000
) else (
    php -S 0.0.0.0:8000
)
pause
