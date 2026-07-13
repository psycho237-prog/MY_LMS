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

let mapProgression = {};
let currentVideoId = null;
let currentEval = null;

async function chargerProgressionGlobale() {
    let id_etudiant = localStorage.getItem("id_connecte");
    try {
        let res = await fetch('api/progression.php?etudiant_id=' + id_etudiant);
        let progressions = await res.json();
        progressions.forEach(p => {
            mapProgression[p.lecon_id] = p;
        });
        
        // Calcul très simple pour la barre globale : % de leçons commencées ou terminées
        // En vrai, on devrait compter le nombre total de leçons dans tous les cours de l'étudiant.
        // Ici on se basera sur les leçons avec progression > 0
        let totalLeconsAvecProgression = progressions.length;
        let nbCompleted = progressions.filter(p => (p.score !== null && p.score >= 50) || p.progression_pourcentage >= 80).length;
        
        // Récupérer le nombre total de leçons dans la DB pour un calcul exact (Simplifié ici)
        let resLecons = await fetch('api/lecons.php'); // API needs to return all lessons, but let's just do a dummy if not
        let leconsTotal = await resLecons.json();
        let total = leconsTotal.length || 1; // Fallback
        
        let pourcentageGlobal = Math.round((nbCompleted / total) * 100);
        if (pourcentageGlobal > 100) pourcentageGlobal = 100;
        
        let barre = document.getElementById("barre_progression_globale");
        if(barre) {
            barre.style.width = pourcentageGlobal + "%";
            barre.textContent = pourcentageGlobal + "%";
        }
    } catch(e) {
        console.log("Erreur progression globale");
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
                    html += `<button disabled style="margin-top:5px; background:#ccc; color:#666; border:none; padding:5px 10px; border-radius:3px; cursor:not-allowed;" title="Visionnez au moins 80% de la vidéo pour débloquer le quiz.">Passer le Quiz (Bloqué)</button>`;
                    html += `<small style="color:red; margin-left: 10px;">Vidéo à 80% requise</small>`;
                } else {
                    html += `<button onclick='ouvrirQuizEtudiant(${lecon.id})' style="margin-top:5px; background:#28a745; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">Passer le Quiz</button>`;
                }
            }
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
    
    document.getElementById("video_progression_text").textContent = "Visionné : " + (mapProgression[lecon_id] ? Math.round(mapProgression[lecon_id].progression_pourcentage) : 0) + "%";
    
    document.getElementById("video_modal").style.display = "block";
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
        } else {
            container.innerHTML = "Aucun quiz trouvé.";
        }
    } catch(e) {
        container.innerHTML = "Erreur de chargement du quiz.";
    }
}

async function soumettreQuiz() {
    if (!currentEval) return;
    
    let questions = typeof currentEval.questions === 'string' ? JSON.parse(currentEval.questions) : currentEval.questions;
    let score = 0;
    
    for (let i = 0; i < questions.length; i++) {
        let selected = document.querySelector(`input[name="q_${i}"]:checked`);
        if (selected && selected.value === questions[i].reponse) {
            score++;
        }
    }
    
    let pourcentageScore = Math.round((score / questions.length) * 100);
    
    let msg = document.getElementById("quiz_resultat_msg");
    msg.style.color = pourcentageScore >= 50 ? "green" : "red";
    msg.textContent = `Votre score : ${pourcentageScore}% (${score}/${questions.length})`;
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
        chargerProgressionGlobale(); // refresh global
    } catch(e) {
        console.error("Erreur save quiz");
    }
}

async function genererCertificats() {
    window.open('certificat.html', '_blank');
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
