window.onload = function() {
    var role = localStorage.getItem("role_connecte");
    var nom = localStorage.getItem("nom_connecte");
    
    if(!nom || role !== 'enseignant') {
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
            conteneur.innerHTML = "<p>Aucun cours disponible.</p>";
            return;
        }

        reponseAPI.forEach(function(cours) {
            var html = "<div class='carte-cours'>";
            html += "<h3>" + cours.titre + "</h3>";
            html += "<p>" + cours.description + "</p>";
            html += "<button class='btn-cours' onclick='editerCours(" + cours.id + ", \"" + cours.titre + "\")'>Gérer les leçons</button>";
            html += "</div>";
            conteneur.innerHTML += html;
        });
    } catch(err) {
        conteneur.innerHTML = "<p>Erreur de chargement.</p>";
    }
}

async function editerCours(id, titre) {
    var modal = document.getElementById("lecon_modal");
    var modalTitre = document.getElementById("modal_titre");
    var modalContenu = document.getElementById("modal_contenu");
    document.getElementById("cours_id_actif").value = id;

    modalTitre.textContent = "Gérer les leçons : " + titre;
    modalContenu.innerHTML = "Chargement...";
    modal.style.display = "block";

    chargerLeconsList(id);
}

async function chargerLeconsList(id) {
    var modalContenu = document.getElementById("modal_contenu");
    try {
        let res = await fetch('api/lecons.php?cours_id=' + id);
        let lecons = await res.json();

        if (lecons.length === 0) {
            modalContenu.innerHTML = "<p>Aucune leçon pour le moment.</p>";
            return;
        }

        let html = "<ul>";
        lecons.forEach(lecon => {
            html += "<li style='margin-bottom:10px;'><strong>" + lecon.titre + "</strong> (" + lecon.type + ") - <a href='" + lecon.url_contenu + "' target='_blank'>Lien</a></li>";
        });
        html += "</ul>";
        modalContenu.innerHTML = html;
    } catch(err) {
        modalContenu.innerHTML = "<p>Erreur.</p>";
    }
}

async function ajouterLecon(event) {
    event.preventDefault();
    
    let cours_id = document.getElementById("cours_id_actif").value;
    let titre = document.getElementById("lecon_titre").value;
    let type = document.getElementById("lecon_type").value;
    let url = document.getElementById("lecon_url").value;
    let msg = document.getElementById("lecon_msg");

    try {
        let res = await fetch('api/lecons.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ cours_id: cours_id, titre: titre, type: type, url_contenu: url })
        });
        let data = await res.json();

        if (data.success) {
            msg.style.color = "green";
            msg.textContent = "Leçon ajoutée !";
            document.getElementById("form_ajout_lecon").reset();
            chargerLeconsList(cours_id); // Rafraichir la liste
        } else {
            msg.style.color = "red";
            msg.textContent = "Erreur : " + data.message;
        }
    } catch(err) {
        msg.style.color = "red";
        msg.textContent = "Erreur serveur.";
    }
}

function fermerModal() {
    document.getElementById("lecon_modal").style.display = "none";
}
