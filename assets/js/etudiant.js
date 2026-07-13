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
    demarrerPollingNotifications();
    logActivite("PAGE_VIEW", "Dashboard étudiant");
};

let mapProgression = {};
let currentVideoId = null;
let currentEval = null;
let timerInterval = null;

// ===== LOGS D'ACTIVITÉ =====
async function logActivite(action, details = '') {
    let id = localStorage.getItem("id_connecte");
    let nom = localStorage.getItem("nom_connecte");
    fetch('api/logs.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: id, nom_user: nom, role_user: 'etudiant', action, details })
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

async function chargerProgressionGlobale() {
    let id_etudiant = localStorage.getItem("id_connecte");
    try {
        let res = await fetch('api/progression.php?etudiant_id=' + id_etudiant);
        let progressions = await res.json();
        progressions.forEach(p => {
            mapProgression[p.lecon_id] = p;
        });
        
        let nbCompleted = progressions.filter(p => (p.score !== null && p.score >= 50) || p.progression_pourcentage >= 80).length;
        
        // Récupérer le nombre total de leçons dans la DB (ajout du endpoint ?all=1)
        let resLecons = await fetch('api/lecons.php?all=1'); 
        let dataLecons = await resLecons.json();
        let total = dataLecons.total || 1; 
        
        let pourcentageGlobal = Math.round((nbCompleted / total) * 100);
        if (pourcentageGlobal > 100) pourcentageGlobal = 100;
        
        // MAJ de la nouvelle UI (dashboard ERP)
        let barre = document.getElementById("barre_progression_globale");
        if(barre) barre.style.width = pourcentageGlobal + "%";
        
        let txtPct = document.getElementById("stat_pct");
        if(txtPct) txtPct.textContent = pourcentageGlobal + "%";

        let txtLecons = document.getElementById("stat_lecons_count");
        if(txtLecons) txtLecons.textContent = nbCompleted + " / " + total;

    } catch(e) {
        console.log("Erreur progression globale");
    }
}

// ===== GESTION DU LAYOUT ERP =====
function showSection(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    // Afficher la cible
    let target = document.getElementById('section-' + sectionId);
    if(target) target.classList.add('active');
    
    // Mettre à jour la sidebar
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    let navItem = document.getElementById('nav-' + sectionId);
    if(navItem) navItem.classList.add('active');

    // Mettre à jour le titre du header
    let pageTitle = "Tableau de bord";
    if(sectionId === 'cours') pageTitle = "Mes Cours";
    if(sectionId === 'notes') pageTitle = "Mes Notes";
    if(sectionId === 'certificats') pageTitle = "Mes Certificats";
    let headerTitle = document.getElementById("page_title");
    if(headerTitle) headerTitle.textContent = pageTitle;

    // Charger les données dynamiques selon l'onglet
    if(sectionId === 'notes') afficherNotes();
    if(sectionId === 'certificats') afficherCertificats();
}

// Fonction pour afficher les notes dans l'onglet dédié
async function afficherNotes() {
    let tbody = document.getElementById("notes_body");
    if(!tbody) return;
    
    let id_etudiant = localStorage.getItem("id_connecte");
    try {
        let res = await fetch('api/progression.php?etudiant_id=' + id_etudiant);
        let progressions = await res.json();
        
        if (progressions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--color-neutral-400);">Aucune donnée de progression.</td></tr>';
            return;
        }

        let html = '';
        progressions.forEach(p => {
            let scoreStr = p.score !== null ? `<span class="badge ${p.score >= 50 ? 'badge-success' : 'badge-danger'}">${p.score}%</span>` : `<span class="badge badge-neutral">—</span>`;
            let statusBadge = '';
            if ((p.score !== null && p.score >= 50) || p.progression_pourcentage >= 80) {
                statusBadge = '<span class="badge badge-success">Validée</span>';
            } else {
                statusBadge = '<span class="badge badge-warning">En cours</span>';
            }

            html += `<tr>
                <td style="font-weight:500;">${p.lecon_titre || ('Leçon #' + p.lecon_id)}</td>
                <td>${scoreStr}</td>
                <td><div class="progress-bar-wrap" style="width:100px; margin:0;"><div class="progress-bar-fill" style="width:${p.progression_pourcentage}%"></div></div><div style="font-size:0.7rem; color:var(--color-neutral-400); margin-top:2px;">${Math.round(p.progression_pourcentage)}%</div></td>
                <td style="color:var(--color-neutral-400); font-size:0.8rem;">${p.date_completion || '-'}</td>
                <td>${statusBadge}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="5">Erreur de chargement</td></tr>';
    }
}

// Fonction pour afficher les certificats dans l'onglet dédié
async function afficherCertificats() {
    let container = document.getElementById("certifs_container");
    if(!container) return;
    let id_etudiant = localStorage.getItem("id_connecte");

    try {
        let res = await fetch('api/certificats.php?etudiant_id=' + id_etudiant);
        let certifs = await res.json();
        
        let statCount = document.getElementById("stat_certifs_count");
        if(statCount) statCount.textContent = certifs.length;

        if(certifs.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--color-neutral-400);">Vous n\'avez pas encore obtenu de certificats.</div>';
            return;
        }

        container.innerHTML = certifs.map(c => `
            <div class="carte-cours">
                <h3>Certificat de Module</h3>
                <p><strong>Code :</strong> ${c.code_unique}<br><strong>Délivré le :</strong> ${new Date(c.date_emission).toLocaleDateString()}</p>
                <button class="btn-cours" onclick="window.open('certificat.html?code=${c.code_unique}', '_blank')">Voir / Imprimer</button>
            </div>
        `).join('');

    } catch(e) {
        container.innerHTML = '<p>Erreur</p>';
    }
}

async function afficherCours() {
    var conteneur = document.getElementById("mes_cours");
    if(!conteneur) return;

    await chargerProgressionGlobale();

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
            html += "<button class='btn-cours' onclick='ouvrirCours(" + cours.id + ", \"" + cours.titre.replace(/"/g, '&quot;') + "\")'>Ouvrir le cours</button>";
            html += "<button class='btn-cours' style='background-color:#ff9800; margin-top:5px;' onclick='ouvrirChat(" + cours.id + ", \"" + cours.titre.replace(/"/g, '&quot;') + "\")'>Classe (Chat)</button>";
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
    
    await chargerProgressionGlobale();

    try {
        let res = await fetch('api/lecons.php?cours_id=' + id);
        let lecons = await res.json();

        if (lecons.length === 0) {
            modalContenu.innerHTML = "<p>Aucune leçon disponible pour ce cours.</p>";
            return;
        }

        let html = "<ul>";
        for (let lecon of lecons) {
            let prog = mapProgression[lecon.id] ? parseFloat(mapProgression[lecon.id].progression_pourcentage) : 0;
            let score = mapProgression[lecon.id] && mapProgression[lecon.id].score !== null ? mapProgression[lecon.id].score : null;
            
            html += "<li style='margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background: #fafafa;'>";
            html += "<strong>" + lecon.titre + "</strong> (" + lecon.type + ")<br>";
            
            if (lecon.type === 'video') {
                html += "<button onclick='ouvrirVideo(\"" + lecon.url_contenu + "\", \"" + lecon.titre.replace(/"/g, '&quot;') + "\", " + lecon.id + ")' style='color:white; margin-right: 10px; padding: 5px 10px; background: #007bff; border:none; cursor:pointer; border-radius: 3px;'>Regarder la vidéo</button>";
                html += "<span style='font-size: 0.9em; color: #666;'>Vu : " + Math.round(prog) + "%</span><br>";
            } else {
                html += "<a href='" + lecon.url_contenu + "' target='_blank' style='color:white; margin-right: 10px; padding: 5px 10px; background: #17a2b8; text-decoration: none; border-radius: 3px; display:inline-block; margin-top:5px;' onclick='marquerLu(" + lecon.id + ")'>Lire le Document</a><br>";
            }

            // Vérifier s'il y a un quiz pour cette leçon
            let resQuiz = await fetch('api/evaluations.php?lecon_id=' + lecon.id);
            let evals = await resQuiz.json();
            if (evals.length > 0) {
                let evalId = evals[0].id;
                let locked = (lecon.type === 'video' && prog < 80);
                
                if (score !== null) {
                    html += `<span style="color: green; font-weight: bold; margin-top: 5px; display:inline-block;">Quiz terminé ! Score : ${score}%</span>`;
                } else if (locked) {
                    html += `<button disabled style="margin-top:5px; background:#ccc; color:#666; border:none; padding:5px 10px; border-radius:3px; cursor:not-allowed;">Passer le Quiz (Bloqué)</button>`;
                    html += `<small style="color:red; margin-left: 10px;">Vidéo à 80% requise</small>`;
                } else {
                    html += `<button onclick='ouvrirQuizEtudiant(${lecon.id})' style="margin-top:5px; background:#28a745; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">Passer le Quiz</button>`;
                }
            }
            // Bouton Q&A Commentaires
            html += `<button onclick='ouvrirCommentaires(${lecon.id})' style="margin-top:5px; margin-left:8px; background:#6c757d; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">Q&amp;A</button>`;
            html += "</li>";
        }
        html += "</ul>";

        modalContenu.innerHTML = html;
    } catch(err) {
        modalContenu.innerHTML = "<p>Erreur lors du chargement des leçons.</p>";
    }
}

// Fonction pour marquer un PDF comme lu à 100%
async function marquerLu(lecon_id) {
    let id_etudiant = localStorage.getItem("id_connecte");
    await fetch('api/progression.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ etudiant_id: id_etudiant, lecon_id: lecon_id, progression_pourcentage: 100 })
    });
    // On pourrait rafraîchir la modale ici mais ce n'est pas strict pour les PDF
}

function ouvrirVideo(url, titre, lecon_id) {
    currentVideoId = lecon_id;
    document.getElementById("video_titre").textContent = titre;
    document.getElementById("video_lecon_id").value = lecon_id;
    
    let lecteur = document.getElementById("lecteur_video");
    lecteur.src = url;
    lecteur.load();
    
    // Reprendre là où on s'est arrêté
    let savedPos = mapProgression[lecon_id] ? parseFloat(mapProgression[lecon_id].video_position || 0) : 0;
    if (savedPos > 0) {
        lecteur.addEventListener('loadedmetadata', function onLoaded() {
            lecteur.currentTime = savedPos;
            lecteur.removeEventListener('loadedmetadata', onLoaded);
        });
    }
    
    let pct = mapProgression[lecon_id] ? Math.round(mapProgression[lecon_id].progression_pourcentage) : 0;
    document.getElementById("video_progression_text").textContent = "Visionné : " + pct + "%";
    
    document.getElementById("video_modal").style.display = "block";
    logActivite('VIDEO_OPEN', titre);
}

let lastProgressUpdate = 0;
async function majProgressionVideo() {
    let lecteur = document.getElementById("lecteur_video");
    if (lecteur.duration) {
        let pourcentage = (lecteur.currentTime / lecteur.duration) * 100;
        document.getElementById("video_progression_text").textContent = "Visionné : " + Math.round(pourcentage) + "%";
        
        // Mettre à jour l'API toutes les 5 secondes
        let now = Date.now();
        if (now - lastProgressUpdate > 5000) {
            lastProgressUpdate = now;
            let id_etudiant = localStorage.getItem("id_connecte");
            let lecon_id = document.getElementById("video_lecon_id").value;
            
            // On s'assure de ne pas écraser un pourcentage plus grand (le backend gère ça)
            fetch('api/progression.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ etudiant_id: id_etudiant, lecon_id: lecon_id, progression_pourcentage: pourcentage })
            });
        }
    }
}

function fermerModalVideo() {
    let lecteur = document.getElementById("lecteur_video");
    lecteur.pause();
    document.getElementById("video_modal").style.display = "none";
    // Forcer une mise à jour de la liste des leçons si on était dedans
    let cours_modal = document.getElementById("lecon_modal");
    if (cours_modal.style.display === 'block') {
        // Optionnel: Recharger la modale de cours pour mettre à jour les boutons quiz
    }
}

async function ouvrirQuizEtudiant(lecon_id) {
    document.getElementById("passer_quiz_lecon_id").value = lecon_id;
    let container = document.getElementById("contenu_quiz_etudiant");
    container.innerHTML = "Chargement...";
    document.getElementById("btn_valider_quiz").style.display = "none";
    document.getElementById("quiz_resultat_msg").textContent = "";
    document.getElementById("passer_quiz_modal").style.display = "block";
    let timerDiv = document.getElementById("timer_quiz");
    let timerVal = document.getElementById("timer_val");
    timerDiv.style.display = "none";
    if (timerInterval) clearInterval(timerInterval);
    
    try {
        let res = await fetch('api/evaluations.php?lecon_id=' + lecon_id);
        let evals = await res.json();
        if(evals.length > 0) {
            currentEval = evals[0];
            let questions = typeof currentEval.questions === 'string' ? JSON.parse(currentEval.questions) : currentEval.questions;
            
            let html = "";
            questions.forEach((q, index) => {
                html += `<div class="quiz-question-etudiant" style="margin-bottom:15px; padding:10px; background:#f9f9f9; border:1px solid #ddd; border-radius:5px;">`;
                html += `<strong>Q${index+1} : ${q.q}</strong><br>`;
                q.options.forEach(opt => {
                    html += `<label style="display:block; margin-top:5px; cursor:pointer;">
                                <input type="radio" name="q_${index}" value="${opt.replace(/"/g, '&quot;')}"> ${opt}
                             </label>`;
                });
                html += `</div>`;
            });
            container.innerHTML = html;
            document.getElementById("btn_valider_quiz").style.display = "block";
            
            // Gestion du chronomètre
            if (currentEval.duree_minutes && currentEval.duree_minutes > 0) {
                timerDiv.style.display = "block";
                let tempsRestant = currentEval.duree_minutes * 60;
                let updateTimer = () => {
                    let m = Math.floor(tempsRestant / 60).toString().padStart(2, '0');
                    let s = (tempsRestant % 60).toString().padStart(2, '0');
                    timerVal.textContent = `${m}:${s}`;
                    if (tempsRestant <= 0) {
                        clearInterval(timerInterval);
                        soumettreQuiz();
                    }
                    tempsRestant--;
                };
                updateTimer();
                timerInterval = setInterval(updateTimer, 1000);
            }
            logActivite('QUIZ_START', 'Quiz: ' + currentEval.titre);
        } else {
            container.innerHTML = "Aucun quiz trouvé.";
        }
    } catch(e) {
        container.innerHTML = "Erreur de chargement du quiz.";
    }
}

async function soumettreQuiz() {
    if (!currentEval) return;
    if (timerInterval) clearInterval(timerInterval);
    
    let questions = typeof currentEval.questions === 'string' ? JSON.parse(currentEval.questions) : currentEval.questions;
    let score = 0;
    
    for (let i = 0; i < questions.length; i++) {
        let selected = document.querySelector(`input[name="q_${i}"]:checked`);
        if (selected && selected.value === questions[i].reponse) {
            score++;
        }
    }
    
    let pourcentageScore = Math.round((score / questions.length) * 100);
    let seuil = currentEval.score_minimum || 50;
    
    let msg = document.getElementById("quiz_resultat_msg");
    msg.style.color = pourcentageScore >= seuil ? "green" : "red";
    msg.textContent = `Votre score : ${pourcentageScore}% (${score}/${questions.length}) — ${pourcentageScore >= seuil ? 'Validé' : 'Échoué, le minimum requis est '+seuil+'%'}`;
    document.getElementById("btn_valider_quiz").style.display = "none";
    
    // Sauvegarder
    let id_etudiant = localStorage.getItem("id_connecte");
    let lecon_id = document.getElementById("passer_quiz_lecon_id").value;
    
    try {
        await fetch('api/progression.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ etudiant_id: id_etudiant, lecon_id: lecon_id, score: pourcentageScore })
        });
        
        // Notifier la réussite
        if (pourcentageScore >= seuil) {
            fetch('api/notifications.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ user_id: id_etudiant, message: 'Bravo ! Vous avez validé le quiz avec ' + pourcentageScore + '%', lien: null })
            });
        }
        
        chargerProgressionGlobale(); // refresh global
        logActivite('QUIZ_SUBMIT', 'Quiz: ' + currentEval.titre + ' Score: ' + pourcentageScore + '%');
    } catch(e) {
        console.error("Erreur save quiz");
    }
}

async function genererCertificats() {
    window.open('certificat.html', '_blank');
}

async function ouvrirChat(id, titre) {
    document.getElementById("chat_cours_id").value = id;
    let titreEl = document.getElementById("chat_titre");
    if(titreEl) titreEl.textContent = titre;
    let avatarEl = document.getElementById("chat_avatar_letter");
    if(avatarEl) avatarEl.textContent = titre.charAt(0).toUpperCase();
    let overlay = document.getElementById("chat_modal");
    if(overlay) overlay.classList.add('open');
    await chargerMessages(id);
    if(window.chatInterval) clearInterval(window.chatInterval);
    window.chatInterval = setInterval(() => chargerMessages(id), 4000);
}

function fermerChatModal() {
    let overlay = document.getElementById("chat_modal");
    if(overlay) overlay.classList.remove('open');
    if(window.chatInterval) clearInterval(window.chatInterval);
}

async function chargerMessages(cours_id) {
    var container = document.getElementById("chat_messages");
    if(!container) return;
    let moi_id = localStorage.getItem("id_connecte");
    try {
        let res = await fetch('api/chat.php?cours_id=' + cours_id);
        let messages = await res.json();
        if(!messages || messages.length === 0) {
            container.innerHTML = '<div class="chat-empty">Aucun message pour l\'instant.<br>Soyez le premier a ecrire !</div>';
            return;
        }
        let html = '';
        let lastDate = '';
        messages.forEach(m => {
            let isMe = String(m.user_id) === String(moi_id);
            let side = isMe ? 'me' : 'other';
            let d = new Date(m.date_envoi);
            let dateStr = d.toLocaleDateString('fr-FR', {day:'2-digit',month:'short',year:'numeric'});
            if(dateStr !== lastDate) {
                html += `<div class="chat-date-sep"><span>${dateStr}</span></div>`;
                lastDate = dateStr;
            }
            let heure = d.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});
            html += `<div class="chat-bubble-wrap ${side}">`;
            if(!isMe) html += `<div class="chat-sender-name">${m.nom_user}</div>`;
            html += `<div class="chat-bubble">${m.message}<div class="chat-bubble-time">${heure}</div></div>`;
            html += '</div>';
        });
        let wasAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 40;
        container.innerHTML = html;
        if(wasAtBottom) container.scrollTop = container.scrollHeight;
    } catch(e) {}
}

async function envoyerMessage() {
    let cours_id = document.getElementById("chat_cours_id").value;
    let input = document.getElementById("chat_input");
    let msg = input.value.trim();
    if(!msg) return;
    let user_id = localStorage.getItem("id_connecte");
    let nom_user = localStorage.getItem("nom_connecte");
    input.value = "";
    input.style.height = 'auto';
    try {
        let res = await fetch('api/chat.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ cours_id: cours_id, user_id: user_id, nom_user: nom_user, message: msg })
        });
        let data = await res.json();
        if(data.success) chargerMessages(cours_id);
    } catch(e) {}
}

function fermerModal(modalId) {
    document.getElementById(modalId).style.display = "none";
    if(window.chatInterval) clearInterval(window.chatInterval);
    if(modalId === 'passer_quiz_modal' && timerInterval) clearInterval(timerInterval);
}

// ===== COMMENTAIRES =====
async function ouvrirCommentaires(lecon_id) {
    document.getElementById("comm_lecon_id").value = lecon_id;
    document.getElementById("commentaires_modal").style.display = "block";
    chargerCommentaires();
}

async function chargerCommentaires() {
    let lecon_id = document.getElementById("comm_lecon_id").value;
    let container = document.getElementById("liste_commentaires");
    try {
        let res = await fetch('api/commentaires.php?lecon_id=' + lecon_id);
        let comments = await res.json();
        
        if (comments.length === 0) { container.innerHTML = "<p style='color:#888;'>Soyez le premier à poser une question !</p>"; return; }
        
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
            </div>
        `).join('');
    } catch(e) {}
}

async function posterCommentaire() {
    let input = document.getElementById("input_commentaire");
    let msg = input.value.trim();
    if (!msg) return;
    
    let user_id = localStorage.getItem("id_connecte");
    let nom_user = localStorage.getItem("nom_connecte");
    let role_user = localStorage.getItem("role_connecte");
    let lecon_id = document.getElementById("comm_lecon_id").value;
    
    try {
        await fetch('api/commentaires.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ lecon_id, user_id, nom_user, role_user, message: msg })
        });
        input.value = "";
        chargerCommentaires();
        logActivite('COMMENT_ADD', 'Question posée');
    } catch(e) {}
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
        html += "<tr style='background:#f4f4f4;'><th>Leçon ID</th><th>Score Quiz</th><th>Visionné</th><th>Date</th></tr>";
        progressions.forEach(p => {
            let scoreStr = p.score !== null ? p.score + "%" : "-";
            let progStr = p.progression_pourcentage !== null ? Math.round(p.progression_pourcentage) + "%" : "0%";
            html += "<tr>";
            html += "<td style='border:1px solid #ddd; padding:8px; text-align:center;'>" + p.lecon_id + "</td>";
            html += "<td style='border:1px solid #ddd; padding:8px; text-align:center;'>" + scoreStr + "</td>";
            html += "<td style='border:1px solid #ddd; padding:8px; text-align:center;'>" + progStr + "</td>";
            html += "<td style='border:1px solid #ddd; padding:8px; text-align:center;'>" + new Date(p.date_completion).toLocaleDateString() + "</td>";
            html += "</tr>";
        });
        html += "</table>";
        contenu.innerHTML = html;
    } catch(err) {
        contenu.innerHTML = "<p>Erreur lors du chargement de la progression.</p>";
    }
}
