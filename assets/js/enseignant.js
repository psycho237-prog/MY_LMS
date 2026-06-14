window.onload = function() {
    var role = localStorage.getItem("role_connecte");
    var nom = localStorage.getItem("nom_connecte");
    
    if(!nom || role !== 'enseignant') {
        window.location.href = "login.html";
        return;
    }
    
    document.getElementById("nom_utilisateur").textContent = nom;
    afficherCours();
};

async function afficherCours() {
    var conteneur = document.getElementById("mes_cours");
    if(!conteneur) return;
    let id_enseignant = localStorage.getItem("id_connecte");

    try {
        let res = await fetch('api/cours.php?enseignant_id=' + id_enseignant);
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
            html += "<button class='btn-cours' style='background-color:#ff9800; margin-top:5px;' onclick='ouvrirChat(" + cours.id + ", \"" + cours.titre + "\")'>Classe (Chat)</button>";
            html += "<button class='btn-cours' style='background-color:#dc3545; margin-top:5px;' onclick='supprimerCours(" + cours.id + ")'>Supprimer</button>";
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
            html += "<li style='margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;'>";
            html += "<span><strong>" + lecon.titre + "</strong> (" + lecon.type + ") - <a href='" + lecon.url_contenu + "' target='_blank'>Voir le contenu</a></span>";
            html += "<div><button onclick='ouvrirQuiz(" + lecon.id + ", \"" + lecon.titre + "\")' style='margin-right:10px; background:#17a2b8; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px;'>Ajouter un quiz</button>";
            html += "<button onclick='supprimerLecon(" + lecon.id + ", " + id + ")' style='background:#dc3545; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px;'>Supprimer</button></div>";
            html += "</li>";
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
    let fichierInput = document.getElementById("lecon_fichier");
    let msg = document.getElementById("lecon_msg");

    if(fichierInput.files.length === 0) {
        msg.style.color = "red";
        msg.textContent = "Veuillez sélectionner un fichier.";
        return;
    }

    msg.style.color = "#0056b3";
    msg.textContent = "Téléchargement en cours...";

    // === CONFIGURATION CLOUDINARY ===
    const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dinntlvog/upload";
    const CLOUDINARY_UPLOAD_PRESET = "lms_uploads";

    let formData = new FormData();
    formData.append("file", fichierInput.files[0]);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    // Optionnel: vous pouvez spécifier un dossier dans Cloudinary
    // formData.append("folder", "lms_uploads");

    try {
        let uploadRes = await fetch(CLOUDINARY_URL, { 
            method: 'POST', 
            body: formData 
        });
        
        if (!uploadRes.ok) {
            let errorData = await uploadRes.json();
            msg.style.color = "red";
            msg.textContent = "Erreur Cloudinary: " + (errorData.error ? errorData.error.message : "Échec de l'upload");
            return;
        }

        let uploadData = await uploadRes.json();
        let fileUrl = uploadData.secure_url; // Cloudinary renvoie l'URL sécurisée
        let publicId = uploadData.public_id;
        let resourceType = uploadData.resource_type;

        let res = await fetch('api/lecons.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ cours_id: cours_id, titre: titre, type: type, url_contenu: fileUrl, public_id: publicId, resource_type: resourceType })
        });
        let data = await res.json();

        if (data.success) {
            msg.style.color = "green";
            msg.textContent = "Leçon ajoutée !";
            document.getElementById("form_ajout_lecon").reset();
            chargerLeconsList(cours_id);
        } else {
            msg.style.color = "red";
            msg.textContent = "Erreur : " + data.message;
        }
    } catch(err) {
        msg.style.color = "red";
        msg.textContent = "Erreur serveur.";
    }
}

async function supprimerLecon(lecon_id, cours_id) {
    if(!confirm("Voulez-vous vraiment supprimer cette leçon ?")) return;

    try {
        let res = await fetch('api/lecons.php?id=' + lecon_id, {
            method: 'DELETE'
        });
        let data = await res.json();
        if(data.success) {
            chargerLeconsList(cours_id);
        } else {
            alert("Erreur: " + data.message);
        }
    } catch(e) {
        alert("Erreur serveur lors de la suppression.");
    }
}

function ouvrirQuiz(lecon_id, lecon_titre) {
    document.getElementById("quiz_lecon_id").value = lecon_id;
    document.getElementById("quiz_titre_modal").textContent = "Ajouter un quiz : " + lecon_titre;
    document.getElementById("quiz_msg").textContent = "";
    document.getElementById("form_ajout_quiz").reset();
    document.getElementById("quiz_modal").style.display = "block";
}

async function ajouterQuiz(event) {
    event.preventDefault();
    let lecon_id = document.getElementById("quiz_lecon_id").value;
    let titre = document.getElementById("quiz_titre").value;
    let questionsStr = document.getElementById("quiz_questions").value;
    let msg = document.getElementById("quiz_msg");
    
    let questionsObj;
    try {
        questionsObj = JSON.parse(questionsStr);
    } catch(e) {
        msg.style.color = "red";
        msg.textContent = "Erreur: Le format JSON des questions est invalide.";
        return;
    }

    try {
        let res = await fetch('api/evaluations.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ lecon_id: lecon_id, titre: titre, questions: questionsObj })
        });
        let data = await res.json();

        if (data.success) {
            msg.style.color = "green";
            msg.textContent = "Quiz ajouté avec succès !";
            setTimeout(() => { fermerModal('quiz_modal'); }, 1500);
        } else {
            msg.style.color = "red";
            msg.textContent = "Erreur : " + data.message;
        }
    } catch(err) {
        msg.style.color = "red";
        msg.textContent = "Erreur serveur.";
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

async function supprimerCours(id) {
    if(!confirm("Voulez-vous vraiment supprimer ce cours ? Toutes les leçons associées seront perdues.")) return;

    try {
        let res = await fetch('api/cours.php?id=' + id, {
            method: 'DELETE'
        });
        let data = await res.json();
        if(data.success) {
            afficherCours();
        } else {
            alert("Erreur: " + data.message);
        }
    } catch(e) {
        alert("Erreur serveur lors de la suppression.");
    }
}

async function ouvrirAjoutCours() {
    let select = document.getElementById('cours_module_id');
    try {
        let res = await fetch('api/modules.php');
        let modules = await res.json();
        select.innerHTML = '<option value="">Sélectionnez un module...</option>';
        modules.forEach(m => {
            select.innerHTML += '<option value="'+m.id+'">'+m.titre+'</option>';
        });
    } catch(e) {
        select.innerHTML = '<option value="">Erreur de chargement des modules</option>';
    }
    document.getElementById('cours_modal').style.display = "block";
}

async function ajouterCours(event) {
    event.preventDefault();
    let module_id = document.getElementById('cours_module_id').value;
    let titre = document.getElementById('cours_titre').value.trim();
    let description = document.getElementById('cours_description').value.trim();
    let msg = document.getElementById('cours_msg');
    msg.textContent = "";
    if (!titre || !description || !module_id) {
        msg.style.color = "red";
        msg.textContent = "Tous les champs sont requis.";
        return;
    }
    try {
        let res = await fetch('api/cours.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ module_id: module_id, titre: titre, description: description, enseignant_id: localStorage.getItem('id_connecte') })
        });
        let data = await res.json();
        if (data.success) {
            msg.style.color = "green";
            msg.textContent = "Cours ajouté !";
            document.getElementById('form_ajout_cours').reset();
            afficherCours();
        } else {
            msg.style.color = "red";
            msg.textContent = data.message || "Erreur lors de l'ajout.";
        }
    } catch (e) {
        msg.style.color = "red";
        msg.textContent = "Erreur serveur.";
    }
}

function fermerModal(modalId) {
    document.getElementById(modalId).style.display = "none";
    if(window.chatInterval) clearInterval(window.chatInterval);
}
