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
    chargerStatsGraphiques();
    chargerLogsActivite();
    demarrerPollingNotifications();
    logActivite("PAGE_VIEW", "Dashboard promoteur");
};

// ===== LOGS D'ACTIVITÉ =====
async function logActivite(action, details = '') {
    let id = localStorage.getItem("id_connecte");
    let nom = localStorage.getItem("nom_connecte");
    fetch('api/logs.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: id, nom_user: nom, role_user: 'promoteur', action, details })
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

// ===== STATISTIQUES CHART.JS =====
let myChartUsers = null;
let myChartCours = null;

async function chargerStatsGraphiques() {
    try {
        let res = await fetch('api/stats.php');
        let stats = await res.json();

        // Graphe Utilisateurs
        const ctxUsers = document.getElementById('chartUsers').getContext('2d');
        if (myChartUsers) myChartUsers.destroy();
        myChartUsers = new Chart(ctxUsers, {
            type: 'pie',
            data: {
                labels: ['Étudiants', 'Enseignants', 'Promoteurs'],
                datasets: [{
                    data: [stats.total_etudiants, stats.total_enseignants, stats.total_promoteurs],
                    backgroundColor: ['#007bff', '#28a745', '#ffc107']
                }]
            },
            options: { responsive: true, plugins: { title: { display: true, text: 'Répartition des Utilisateurs' } } }
        });

        // Graphe Cours
        const ctxCours = document.getElementById('chartCours').getContext('2d');
        if (myChartCours) myChartCours.destroy();
        myChartCours = new Chart(ctxCours, {
            type: 'bar',
            data: {
                labels: ['Modules', 'Cours', 'Leçons'],
                datasets: [{
                    label: 'Nombre',
                    data: [stats.total_modules, stats.total_cours, stats.total_lecons],
                    backgroundColor: ['#17a2b8', '#6c757d', '#6610f2']
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { title: { display: true, text: 'Contenus' }, legend:{display:false} } }
        });
    } catch(e) {
        console.error("Erreur chargement stats:", e);
    }
}

// ===== LOGS D'ACTIVITÉ =====
async function chargerLogsActivite() {
    try {
        let res = await fetch('api/logs.php');
        let logs = await res.json();
        let tbody = document.getElementById("logs_body");
        if (logs.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:10px;'>Aucune activité récente.</td></tr>";
            return;
        }
        
        let html = "";
        logs.forEach(l => {
            html += `<tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px;">${new Date(l.date_action).toLocaleString('fr-FR')}</td>
                <td style="padding:10px;"><strong>${l.nom_user}</strong></td>
                <td style="padding:10px;"><span style="background:#e9ecef; padding:2px 5px; border-radius:3px; font-size:0.8rem;">${l.role_user}</span></td>
                <td style="padding:10px; color:#0056b3;">${l.action}</td>
                <td style="padding:10px;">${l.details || '-'}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch(e) {}
}

// ===== IMPORT CSV =====
async function importerCSV() {
    let input = document.getElementById("file_csv");
    let msg = document.getElementById("import_msg");
    
    if (input.files.length === 0) {
        msg.style.color = "red";
        msg.textContent = "Veuillez sélectionner un fichier CSV.";
        return;
    }
    
    let file = input.files[0];
    let formData = new FormData();
    formData.append("fichier_csv", file);
    formData.append("role", "enseignant");
    
    msg.style.color = "#0056b3";
    msg.textContent = "Importation en cours...";
    
    try {
        let res = await fetch('api/import.php', {
            method: 'POST',
            body: formData
        });
        let data = await res.json();
        
        if (data.success) {
            msg.style.color = "green";
            msg.textContent = data.message;
            afficherEnseignants();
            chargerStatsGraphiques();
            chargerLogsActivite();
            logActivite('CSV_IMPORT', 'Import enseignant: ' + file.name);
        } else {
            msg.style.color = "red";
            msg.textContent = "Erreur: " + data.message;
        }
    } catch(e) {
        msg.style.color = "red";
        msg.textContent = "Erreur de connexion.";
    }
}

// ===== GESTION DES AFFICHAGES EXISTANTS =====
async function afficherEnseignants() {
    var conteneur = document.getElementById("liste_enseignants");
    if(!conteneur) return;

    try {
        let res = await fetch('api/enseignants.php');
        let enseignants = await res.json();
        
        conteneur.innerHTML = "";
        
        if (enseignants.length === 0) {
            conteneur.innerHTML = "<p style='grid-column:1/-1; text-align:center;'>Aucun enseignant inscrit.</p>";
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
        conteneur.innerHTML = "<p style='grid-column:1/-1; text-align:center;'>Erreur de chargement.</p>";
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
            conteneur.innerHTML = "<p style='grid-column:1/-1; text-align:center;'>Aucun module disponible.</p>";
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
        conteneur.innerHTML = "<p style='grid-column:1/-1; text-align:center;'>Erreur de chargement des modules.</p>";
    }
}

function voirStats(id) {
    alert("Les statistiques détaillées du module n°" + id + " seront bientôt disponibles.");
    logActivite("STATS_VIEW", "Vue des stats du module " + id);
}

function fermerModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

function ouvrirAjoutModule() {
    document.getElementById("mod_titre").value = "";
    document.getElementById("mod_description").value = "";
    document.getElementById("mod_msg").textContent = "";
    document.getElementById("module_modal").style.display = "block";
}

async function ajouterModule(event) {
    event.preventDefault();
    let titre = document.getElementById("mod_titre").value.trim();
    let desc = document.getElementById("mod_description").value.trim();
    let msg = document.getElementById("mod_msg");
    let promoteur_id = localStorage.getItem("id_connecte");
    
    msg.style.color = "#0056b3";
    msg.textContent = "Création en cours...";
    
    try {
        let res = await fetch('api/modules.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ titre: titre, description: desc, promoteur_id: promoteur_id })
        });
        let data = await res.json();
        
        if (data.success) {
            msg.style.color = "green";
            msg.textContent = "Module créé avec succès !";
            afficherCours();
            chargerStatsGraphiques();
            logActivite('MODULE_CREATE', 'Création du module: ' + titre);
            setTimeout(() => { fermerModal('module_modal'); }, 1500);
        } else {
            msg.style.color = "red";
            msg.textContent = data.message || "Erreur lors de la création.";
        }
    } catch (e) {
        msg.style.color = "red";
        msg.textContent = "Erreur de connexion serveur.";
    }
}
