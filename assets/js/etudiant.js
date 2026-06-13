/**
 * Logique Frontend pour l'Espace Étudiant
 * Auteur: ONANA GREGOIRE LEGRAND (24G2060)
 */

window.onload = function() {
    var role = localStorage.getItem("role_connecte");
    var nom = localStorage.getItem("nom_connecte");
    
    if(!nom || role !== 'etudiant') {
        window.location.href = "index.html";
        return;
    }
    
    document.getElementById("nom_utilisateur").textContent = nom;
    afficherCours();
};

async function afficherCours() {
    var conteneur = document.getElementById("mes_cours");
    if(!conteneur) return;

    try {
        let res = await fetch('api/cours.php');
        let reponseAPI = await res.json();

        conteneur.innerHTML = ""; 
        
        if (reponseAPI.length === 0) {
            conteneur.innerHTML = "<p>Aucun cours disponible pour le moment.</p>";
            return;
        }

        reponseAPI.forEach(function(cours) {
            var html = "<div class='carte-cours'>";
            html += "<h3>" + cours.titre + "</h3>";
            html += "<p>" + cours.description + "</p>";
            html += "<button class='btn-cours' onclick='ouvrirCours(" + cours.id + ", \"" + cours.titre + "\")'>Ouvrir le cours</button>";
            html += "</div>";
            conteneur.innerHTML += html; 
        });
    } catch(err) {
        conteneur.innerHTML = "<p>Erreur lors du chargement des cours.</p>";
    }
}

async function ouvrirCours(id, titre) {
    var modal = document.getElementById("lecon_modal");
    var modalTitre = document.getElementById("modal_titre");
    var modalContenu = document.getElementById("modal_contenu");

    modalTitre.textContent = titre;
    modalContenu.innerHTML = "Chargement des leçons...";
    modal.style.display = "block";

    try {
        let res = await fetch('api/lecons.php?cours_id=' + id);
        let lecons = await res.json();

        if (lecons.length === 0) {
            modalContenu.innerHTML = "<p>Aucune leçon disponible pour ce cours.</p>";
            return;
        }

        let html = "<ul>";
        lecons.forEach(lecon => {
            html += "<li style='margin-bottom: 15px;'>";
            html += "<strong>" + lecon.titre + "</strong> (" + lecon.type + ")<br>";
            if (lecon.type === 'video') {
                html += "<a href='" + lecon.url_contenu + "' target='_blank' style='color:blue;'>Regarder la vidéo</a>";
            } else {
                html += "<a href='" + lecon.url_contenu + "' target='_blank' style='color:blue;'>Lire le PDF</a>";
            }
            html += "</li>";
        });
        html += "</ul>";

        modalContenu.innerHTML = html;
    } catch(err) {
        modalContenu.innerHTML = "<p>Erreur lors du chargement des leçons.</p>";
    }
}

function fermerModal() {
    document.getElementById("lecon_modal").style.display = "none";
}
