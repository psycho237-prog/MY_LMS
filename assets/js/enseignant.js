/**
 * S'exécute au chargement de la page.
 * Vérifie l'authentification et le rôle de l'utilisateur.
 */
window.onload = function() {
    var role = localStorage.getItem("role_connecte");
    var nom = localStorage.getItem("nom_connecte");
    
    // Redirection si l'utilisateur n'est pas un enseignant
    if(!nom || role !== 'enseignant') {
        window.location.href = "login.html";
        return;
    }
    
    document.getElementById("nom_utilisateur").textContent = nom;
    afficherCours();
    demarrerPollingNotifications();
    logActivite("PAGE_VIEW", "Dashboard enseignant");
};

// ===== LOGS D'ACTIVITÉ =====
async function logActivite(action, details = '') {
    let id = localStorage.getItem("id_connecte");
    let nom = localStorage.getItem("nom_connecte");
    fetch('api/logs.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: id, nom_user: nom, role_user: 'enseignant', action, details })
    }).catch(() => {});
}

// ===== NOTIFICATIONS =====
let notifOpen = false;
async function demarrerPollingNotifications() {
    await chargerNotifications();
    setInterval(chargerNotifications, 15000);
}

async function chargerNotifications() {
    let id = localStorage.getItem("id_connecte");
    try {
        let res = await fetch('api/notifications.php?user_id=' + id);
        let notifs = await res.json();
        let nonLues = notifs.filter(n => !n.lue);
        let badge = document.getElementById("badge_notif");
        if (badge) {
            badge.textContent = nonLues.length;
            badge.style.display = nonLues.length > 0 ? 'block' : 'none';
        }
        let liste = document.getElementById("liste_notif");
        if (liste) {
            if (notifs.length === 0) { liste.innerHTML = '<p style="color:#888;font-size:0.85rem;">Aucune notification</p>'; return; }
            liste.innerHTML = notifs.map(n => `
                <div style="padding:8px; border-bottom:1px solid #eee; background:${n.lue ? '#fff' : '#e8f0fe'}; border-radius:4px; margin-bottom:4px; font-size:0.85rem;">
                    ${n.message}<br><small style="color:#888;">${new Date(n.date_creation).toLocaleString('fr-FR')}</small>
                </div>
            `).join('');
        }
    } catch(e) {}
}

function toggleNotifications() {
    let d = document.getElementById("dropdown_notif");
    notifOpen = !notifOpen;
    d.style.display = notifOpen ? 'block' : 'none';
    if (notifOpen) chargerNotifications();
}

async function marquerToutLu() {
    let id = localStorage.getItem("id_connecte");
    await fetch('api/notifications.php?user_id=' + id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({all: true}) });
    chargerNotifications();
}

// ===== RECHERCHE GLOBALE =====
let rechercheTimeout = null;
function rechercheGlobale(q) {
    clearTimeout(rechercheTimeout);
    let dd = document.getElementById("dropdown_recherche");
    if (q.length < 2) { dd.style.display = 'none'; return; }
    rechercheTimeout = setTimeout(async () => {
        try {
            let res = await fetch('api/recherche.php?q=' + encodeURIComponent(q));
            let results = await res.json();
            if (results.length === 0) { dd.innerHTML = '<p style="padding:10px;color:#888;">Aucun résultat</p>'; dd.style.display = 'block'; return; }
            dd.innerHTML = results.map(r => {
                let icon = '';
                return `<div onclick="dd.style.display='none'" style="padding:10px; border-bottom:1px solid #eee; cursor:pointer;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background=''"><strong>${icon} ${r.titre}</strong><br><small style="color:#888;">${r.type} — ${r.description || ''}</small></div>`;
            }).join('');
            dd.style.display = 'block';
        } catch(e) {}
    }, 300);
}
document.addEventListener('click', e => {
    if (!e.target.closest('#input_recherche') && !e.target.closest('#dropdown_recherche')) {
        let dd = document.getElementById("dropdown_recherche");
        if(dd) dd.style.display = 'none';
    }
    if (!e.target.closest('#dropdown_notif') && !e.target.closest('button[onclick="toggleNotifications()"]')) {
        let d = document.getElementById("dropdown_notif");
        if(d && notifOpen) { d.style.display = 'none'; notifOpen = false; }
    }
});

/**
 * Récupère et affiche la liste des cours créés par l'enseignant connecté.
 */
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
            html += "<div>";
            html += "<button onclick='ouvrirReponses(" + lecon.id + ")' style='margin-right:10px; background:#6c757d; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px;'>Q&A</button>";
            html += "<button onclick='ouvrirQuiz(" + lecon.id + ", \"" + lecon.titre + "\")' style='margin-right:10px; background:#17a2b8; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px;'>Ajouter un quiz</button>";
            html += "<button onclick='supprimerLecon(" + lecon.id + ", " + id + ")' style='background:#dc3545; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px;'>Supprimer</button></div>";
            html += "</li>";
        });
        html += "</ul>";
        modalContenu.innerHTML = html;
    } catch(err) {
        modalContenu.innerHTML = "<p>Erreur.</p>";
    }
}

function changerSourceLecon() {
    let source = document.getElementById("lecon_source").value;
    if (source === 'fichier') {
        document.getElementById("champ_fichier").style.display = 'block';
        document.getElementById("champ_url").style.display = 'none';
    } else {
        document.getElementById("champ_fichier").style.display = 'none';
        document.getElementById("champ_url").style.display = 'block';
    }
}

/**
 * Envoie un fichier sur Cloudinary et sauvegarde la leçon dans la base de données, ou sauvegarde simplement l'URL.
 */
async function ajouterLecon(event) {
    event.preventDefault();
    
    let cours_id = document.getElementById("cours_id_actif").value;
    let titre = document.getElementById("lecon_titre").value;
    let type = document.getElementById("lecon_type").value;
    let source = document.getElementById("lecon_source").value;
    let fichierInput = document.getElementById("lecon_fichier");
    let msg = document.getElementById("lecon_msg");

    if (source === 'url') {
        let url_contenu = document.getElementById("lecon_url").value;
        if (!url_contenu) {
            msg.style.color = "red";
            msg.textContent = "Veuillez entrer une URL valide.";
            return;
        }
        msg.style.color = "#0056b3";
        msg.textContent = "Ajout de la leçon...";
        try {
            let res = await fetch('api/lecons.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ cours_id: cours_id, titre: titre, type: type, url_contenu: url_contenu, public_id: null, resource_type: type })
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
        return;
    }

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

    try {
        let fileUrl = "";
        let publicId = "";
        let resourceType = "";
        
        try {
            let uploadRes = await fetch(CLOUDINARY_URL, { 
                method: 'POST', 
                body: formData 
            });
            
            if (!uploadRes.ok) {
                throw new Error("Erreur Cloudinary");
            }
            
            let uploadData = await uploadRes.json();
            fileUrl = uploadData.secure_url;
            publicId = uploadData.public_id;
            resourceType = uploadData.resource_type;
        } catch(cloudErr) {
            console.log("Cloudinary indisponible, tentative de sauvegarde locale...");
            msg.textContent = "Sauvegarde locale (Mode hors ligne)...";
            let localRes = await fetch('api/upload.php', {
                method: 'POST',
                body: formData
            });
            let localData = await localRes.json();
            if(localData.success) {
                fileUrl = localData.url;
                resourceType = type;
            } else {
                msg.style.color = "red";
                msg.textContent = "Erreur: Impossible de sauvegarder le fichier.";
                return;
            }
        }

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

/**
 * Demande la suppression d'une leçon (qui supprimera aussi le fichier physique de Cloudinary via l'API PHP).
 * @param {number} lecon_id - L'ID de la leçon à supprimer
 * @param {number} cours_id - L'ID du cours parent pour rafraîchir la liste
 */
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

let quizQuestionCount = 0;

async function ouvrirQuiz(lecon_id, lecon_titre) {
    document.getElementById("quiz_lecon_id").value = lecon_id;
    document.getElementById("quiz_titre_modal").textContent = "Gérer le quiz : " + lecon_titre;
    document.getElementById("quiz_msg").textContent = "Chargement...";
    document.getElementById("quiz_builder").innerHTML = "";
    quizQuestionCount = 0;
    document.getElementById("form_ajout_quiz").reset();
    document.getElementById("quiz_modal").style.display = "block";

    try {
        let res = await fetch('api/evaluations.php?lecon_id=' + lecon_id);
        let evals = await res.json();
        
        document.getElementById("quiz_msg").textContent = "";

        if (evals.length > 0) {
            let quiz = evals[0];
            document.getElementById("quiz_titre").value = quiz.titre;
            document.getElementById("quiz_duree").value = quiz.duree_minutes || 0;
            document.getElementById("quiz_seuil").value = quiz.score_minimum || 50;
            let questions = typeof quiz.questions === 'string' ? JSON.parse(quiz.questions) : quiz.questions;
            questions.forEach(q => ajouterQuestionBuilder(q));
            document.getElementById("btn_submit_quiz").textContent = "Modifier le quiz";
        } else {
            document.getElementById("quiz_duree").value = 0;
            document.getElementById("quiz_seuil").value = 50;
            document.getElementById("btn_submit_quiz").textContent = "Ajouter le quiz";
            ajouterQuestionBuilder(); // Add one empty question by default
        }
    } catch (e) {
        document.getElementById("quiz_msg").textContent = "Erreur de chargement du quiz.";
    }
}

function ajouterQuestionBuilder(qData = null) {
    quizQuestionCount++;
    let index = quizQuestionCount;
    let div = document.createElement("div");
    div.className = "question-item";
    div.id = "question_item_" + index;
    div.style.marginBottom = "15px";
    div.style.padding = "10px";
    div.style.border = "1px solid #ddd";
    div.style.background = "#fff";
    
    let qText = qData ? qData.q : "";
    let opt1 = qData && qData.options[0] ? qData.options[0] : "";
    let opt2 = qData && qData.options[1] ? qData.options[1] : "";
    let opt3 = qData && qData.options[2] ? qData.options[2] : "";
    let rep = qData ? qData.reponse : "";

    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <strong>Question ${index}</strong>
            <button type="button" onclick="this.parentElement.parentElement.remove()" style="color:red; border:none; background:none; cursor:pointer;">&times; Supprimer</button>
        </div>
        <input type="text" class="q-text" placeholder="Entrez la question..." value="${qText.replace(/"/g, '&quot;')}" style="width:100%; margin-bottom:5px;" required>
        <div style="margin-left: 10px;">
            <input type="text" class="q-opt" placeholder="Option 1" value="${opt1.replace(/"/g, '&quot;')}" style="width:100%; margin-bottom:3px;" required>
            <input type="text" class="q-opt" placeholder="Option 2" value="${opt2.replace(/"/g, '&quot;')}" style="width:100%; margin-bottom:3px;" required>
            <input type="text" class="q-opt" placeholder="Option 3 (Optionnel)" value="${opt3.replace(/"/g, '&quot;')}" style="width:100%; margin-bottom:3px;">
            <input type="text" class="q-rep" placeholder="Bonne réponse (exactement comme l'option)" value="${rep.replace(/"/g, '&quot;')}" style="width:100%; margin-bottom:3px; border-color: #28a745;" required>
        </div>
    `;
    document.getElementById("quiz_builder").appendChild(div);
}

async function ajouterQuiz(event) {
    event.preventDefault();
    let lecon_id = document.getElementById("quiz_lecon_id").value;
    let titre = document.getElementById("quiz_titre").value;
    let duree = document.getElementById("quiz_duree").value;
    let seuil = document.getElementById("quiz_seuil").value;
    let msg = document.getElementById("quiz_msg");
    
    let questionsItems = document.querySelectorAll(".question-item");
    if (questionsItems.length === 0) {
        msg.style.color = "red";
        msg.textContent = "Veuillez ajouter au moins une question.";
        return;
    }

    let questionsObj = [];
    let valid = true;
    questionsItems.forEach(item => {
        let text = item.querySelector(".q-text").value;
        let opts = Array.from(item.querySelectorAll(".q-opt")).map(i => i.value).filter(v => v.trim() !== "");
        let rep = item.querySelector(".q-rep").value;
        
        if (!opts.includes(rep)) {
            valid = false;
        }
        
        questionsObj.push({
            q: text,
            options: opts,
            reponse: rep
        });
    });

    if (!valid) {
        msg.style.color = "red";
        msg.textContent = "Erreur: La bonne réponse doit correspondre exactement à l'une des options proposées pour chaque question.";
        return;
    }

    try {
        let res = await fetch('api/evaluations.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ lecon_id: lecon_id, titre: titre, questions: questionsObj, duree_minutes: duree, score_minimum: seuil })
        });
        let data = await res.json();

        if (data.success) {
            msg.style.color = "green";
            msg.textContent = "Quiz sauvegardé avec succès !";
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

/**
 * Fonction de suppression intégrale d'un cours.
 * En raison des contraintes ON DELETE CASCADE de la base de données, cela supprimera
 * automatiquement toutes les leçons, les quiz, et les messages du chat associés.
 */
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

// ===== COMMENTAIRES / Q&A =====
async function ouvrirReponses(lecon_id) {
    document.getElementById("rep_lecon_id").value = lecon_id;
    document.getElementById("reponses_modal").style.display = "block";
    chargerReponses();
}

async function chargerReponses() {
    let lecon_id = document.getElementById("rep_lecon_id").value;
    let container = document.getElementById("liste_reponses");
    try {
        let res = await fetch('api/commentaires.php?lecon_id=' + lecon_id);
        let comments = await res.json();
        
        if (comments.length === 0) { container.innerHTML = "<p style='color:#888;'>Aucune question pour cette leçon.</p>"; return; }
        
        container.innerHTML = comments.map(c => `
            <div style="margin-bottom:15px; padding:10px; background:#f8f9fa; border-radius:8px; border:1px solid #e9ecef;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
                    ${c.photo_profil ? `<img src="${c.photo_profil}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">` : `<div style="width:30px;height:30px;border-radius:50%;background:#ccc;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${c.nom_user[0]}</div>`}
                    <strong style="color:#0056b3;">${c.nom_user}</strong> <span style="font-size:0.75rem; color:#888;">— ${new Date(c.date_creation).toLocaleString('fr-FR')}</span>
                </div>
                <div style="margin-left:40px;">${c.message}</div>
                ${c.reponses.length > 0 ? c.reponses.map(r => `
                    <div style="margin-top:10px; margin-left:40px; padding:10px; background:#e8f4fd; border-radius:8px; border:1px solid #b8daff;">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
                            ${r.photo_profil ? `<img src="${r.photo_profil}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">` : `<div style="width:24px;height:24px;border-radius:50%;background:#0056b3;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:0.8rem;">${r.nom_user[0]}</div>`}
                            <strong style="color:#004085;">${r.nom_user}</strong> <span style="font-size:0.75rem; background:#28a745; color:white; padding:2px 5px; border-radius:4px;">Enseignant</span>
                        </div>
                        <div style="margin-left:34px;">${r.message}</div>
                    </div>
                `).join('') : ''}
                <div style="margin-top:10px; margin-left:40px; display:flex; gap:10px;">
                    <input type="text" id="rep_input_${c.id}" placeholder="Répondre..." style="flex:1; padding:8px; border:1px solid #ccc; border-radius:5px;">
                    <button onclick="repondreCommentaire(${c.id})" style="background:#28a745; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">Envoyer</button>
                </div>
            </div>
        `).join('');
    } catch(e) {}
}

async function repondreCommentaire(parent_id) {
    let input = document.getElementById("rep_input_" + parent_id);
    let msg = input.value.trim();
    if (!msg) return;
    
    let user_id = localStorage.getItem("id_connecte");
    let nom_user = localStorage.getItem("nom_connecte");
    let role_user = localStorage.getItem("role_connecte");
    let lecon_id = document.getElementById("rep_lecon_id").value;
    
    try {
        await fetch('api/commentaires.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ lecon_id, user_id, nom_user, role_user, parent_id, message: msg })
        });
        
        // Notifier l'étudiant
        fetch('api/notifications.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: 'auto', message: 'L\'enseignant a répondu à votre question.', lien: null })
        }); // Remarque: idéalement l'API devrait gérer l'ID exact de l'étudiant à notifier, géré dans un update du backend si besoin, mais on simule.
        
        input.value = "";
        chargerReponses();
        logActivite('COMMENT_REPLY', 'Réponse au commentaire ' + parent_id);
    } catch(e) {}
}
