@echo off
echo Lancement du serveur local MY LMS...
echo Si vous voyez un message demandant l'autorisation du pare-feu, acceptez.
echo Le LMS sera disponible sur http://localhost:8000
start http://localhost:8000
php -S localhost:8000
pause
