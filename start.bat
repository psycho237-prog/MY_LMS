@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   LANCEMENT DU SERVEUR LOCAL FONDA WORKPLACE
echo ===================================================
echo.

:: Recherche automatique de l'adresse IP locale via PowerShell (plus robuste)
for /f "delims=" %%I in ('powershell -command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback|Pseudo' -and ($_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' -or $_.IPAddress -like '172.*') }).IPAddress | Select-Object -First 1"') do set "IP=%%I"

if not defined IP (
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
