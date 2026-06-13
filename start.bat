@echo off
echo Lancement du serveur local FONDA WORKPLACE...
echo Si vous voyez un message demandant l'autorisation du pare-feu, acceptez.
echo Le LMS sera disponible sur votre reseau local ou sur http://localhost:8000
start http://localhost:8000
php -S 0.0.0.0:8000
pause
