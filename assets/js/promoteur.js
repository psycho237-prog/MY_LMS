window.onload = function() {
    var role = localStorage.getItem("role_connecte");
    var nom = localStorage.getItem("nom_connecte");
    
    if(!nom || role !== 'promoteur') {
        window.location.href = "login.html";
        return;
    }
    
    document.getElementById("nom_utilisateur").textContent = nom;
    afficherEnseignants();
    afficherCours();
};

async function afficherEnseignants() {
    var conteneur = document.getElementById("liste_enseignants");
    if(!conteneur) return;

    try {
        let res = await fetch('api/enseignants.php');
        let enseignants = await res.json();
        
        conteneur.innerHTML = "";
        
        if (enseignants.length === 0) {
            conteneur.innerHTML = "<p>Aucun enseignant inscrit.</p>";
            return;
        }

        enseignants.forEach(function(ens) {
            var html = "<div class='carte-cours'>";
            html += "<h3>" + ens.nom + "</h3>";
            html += "<p><strong>Email :</strong> " + ens.email + "</p>";
            html += "<p style='color: #0056b3; font-weight: bold;'>Enseignant</p>";
            html += "</div>";
            conteneur.innerHTML += html;
        });
    } catch(err) {
        conteneur.innerHTML = "<p>Erreur de chargement.</p>";
    }
}

async function afficherCours() {
    var conteneur = document.getElementById("mes_cours");
    if(!conteneur) return;

    try {
        let res = await fetch('api/modules.php');
        let reponseAPI = await res.json();

        conteneur.innerHTML = ""; 
        
        if (reponseAPI.length === 0) {
            conteneur.innerHTML = "<p>Aucun module disponible.</p>";
            return;
        }

        reponseAPI.forEach(function(cours) {
            var html = "<div class='carte-cours'>";
            html += "<h3>" + cours.titre + "</h3>";
            html += "<p>" + cours.description + "</p>";
            html += "<button class='btn-cours' onclick='voirStats(" + cours.id + ")'>Statistiques</button>";
            html += "</div>";
            conteneur.innerHTML += html;
        });
    } catch(err) {
        conteneur.innerHTML = "<p>Erreur de chargement des modules.</p>";
    }
}

function voirStats(id) {
    alert("Statistiques du cours n°" + id);
}
