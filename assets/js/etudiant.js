/**
 * Logique Frontend pour l'Espace Étudiant
 * Auteur: ONANA GREGOIRE LEGRAND (24G2060)
 */

window.onload = function() {
    var role = localStorage.getItem("role_connecte");
    var nom = localStorage.getItem("nom_connecte");
    
    if(!nom || role !== 'etudiant') {
        window.location.href = "login.html";
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
            html += "<button class='btn-cours' style='background-color:#ff9800; margin-top:5px;' onclick='ouvrirChat(" + cours.id + ", \"" + cours.titre + "\")'>Classe (Chat)</button>";
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
                html += "<a href='" + lecon.url_contenu + "' target='_blank' style='color:blue; margin-right: 10px; padding: 5px; background: #e9ecef; text-decoration: none; border-radius: 3px;'>Regarder la vidéo</a>";
                html += "<a href='" + lecon.url_contenu + "' download target='_blank' style='color:white; padding: 5px; background: #28a745; text-decoration: none; border-radius: 3px;'>Télécharger</a>";
            } else {
                html += "<a href='" + lecon.url_contenu + "' target='_blank' style='color:blue; margin-right: 10px; padding: 5px; background: #e9ecef; text-decoration: none; border-radius: 3px;'>Lire le Document</a>";
                html += "<a href='" + lecon.url_contenu + "' download target='_blank' style='color:white; padding: 5px; background: #28a745; text-decoration: none; border-radius: 3px;'>Télécharger</a>";
            }
            html += "</li>";
        });
        html += "</ul>";

        modalContenu.innerHTML = html;
    } catch(err) {
        modalContenu.innerHTML = "<p>Erreur lors du chargement des leçons.</p>";
    }
}

async function ouvrirChat(id, titre) {
    document.getElementById("chat_cours_id").value = id;
    document.getElementById("chat_titre").textContent = "Classe : " + titre;
    document.getElementById("chat_modal").style.display = "block";
    chargerMessages(id);
    window.chatInterval = setInterval(() => chargerMessages(id), 5000);
}

async function chargerMessages(cours_id) {
    var container = document.getElementById("chat_messages");
    try {
        let res = await fetch('api/chat.php?cours_id=' + cours_id);
        let messages = await res.json();
        let html = "";
        messages.forEach(m => {
            html += "<div style='margin-bottom: 8px;'>";
            html += "<strong style='color:#0056b3;'>" + m.nom_user + "</strong> ";
            html += "<span style='font-size:0.8em; color:#999;'>(" + m.date_envoi + ")</span><br>";
            html += m.message;
            html += "</div>";
        });
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    } catch(e) {}
}

async function envoyerMessage(event, roleStr) {
    event.preventDefault();
    let cours_id = document.getElementById("chat_cours_id").value;
    let input = document.getElementById("chat_input");
    let msg = input.value;
    
    let user_id = localStorage.getItem("id_connecte");
    let nom_user = localStorage.getItem("nom_connecte");

    try {
        let res = await fetch('api/chat.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ cours_id: cours_id, user_id: user_id, nom_user: nom_user, message: msg })
        });
        let data = await res.json();
        if(data.success) {
            input.value = "";
            chargerMessages(cours_id);
        }
    } catch(e) {}
}

function fermerModal(modalId) {
    document.getElementById(modalId).style.display = "none";
    if(window.chatInterval) clearInterval(window.chatInterval);
}

async function afficherProgression() {
    let id_etudiant = localStorage.getItem("id_connecte");
    var modal = document.getElementById("progression_modal");
    var contenu = document.getElementById("progression_contenu");
    modal.style.display = "block";
    contenu.innerHTML = "Chargement...";
    
    try {
        let res = await fetch('api/progression.php?etudiant_id=' + id_etudiant);
        let progressions = await res.json();
        
        if (progressions.length === 0) {
            contenu.innerHTML = "<p>Aucune progression enregistrée pour le moment.</p>";
            return;
        }
        
        let html = "<table style='width:100%; border-collapse: collapse;'>";
        html += "<tr style='background:#f4f4f4;'><th>Leçon ID</th><th>Score</th><th>Date</th></tr>";
        progressions.forEach(p => {
            html += "<tr>";
            html += "<td style='border:1px solid #ddd; padding:8px; text-align:center;'>" + p.lecon_id + "</td>";
            html += "<td style='border:1px solid #ddd; padding:8px; text-align:center;'>" + p.score + "%</td>";
            html += "<td style='border:1px solid #ddd; padding:8px; text-align:center;'>" + new Date(p.date_completion).toLocaleDateString() + "</td>";
            html += "</tr>";
        });
        html += "</table>";
        contenu.innerHTML = html;
    } catch(err) {
        contenu.innerHTML = "<p>Erreur lors du chargement de la progression.</p>";
    }
}
