// ===== GESTION DU LAYOUT ERP =====
function showSection(sectionId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    let target = document.getElementById('section-' + sectionId);
    if(target) target.classList.add('active');
    
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    let navItem = document.getElementById('nav-' + sectionId);
    if(navItem) navItem.classList.add('active');

    let pageTitle = "Vue globale de la plateforme";
    if(sectionId === 'modules') pageTitle = "Modules de Formation";
    if(sectionId === 'enseignants') pageTitle = "Gestion des Enseignants";
    if(sectionId === 'logs') pageTitle = "Journal d'activité système";
    let headerTitle = document.getElementById("page_title");
    if(headerTitle) headerTitle.textContent = pageTitle;
}

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

// ===== STATISTIQUES CHART.JS ET DASHBOARD =====
let graphiqueStats = null;

async function chargerStatsGraphiques() {
    try {
        let res = await fetch('api/stats.php');
        let stats = await res.json();

        // MAJ des KPI (Cartes)
        let totalUsers = (stats.total_etudiants || 0) + (stats.total_enseignants || 0);
        let statU = document.getElementById("stat_users");
        if(statU) statU.textContent = totalUsers;

        let statM = document.getElementById("stat_modules");
        if(statM) statM.textContent = stats.total_modules || 0;

        let statC = document.getElementById("stat_cours");
        if(statC) statC.textContent = stats.total_cours || 0;

        let statL = document.getElementById("stat_lecons");
        if(statL) statL.textContent = stats.total_lecons || 0;

        // Un seul graphique combiné (Bar Chart)
        const ctx = document.getElementById('graphiqueStats');
        if(!ctx) return;
        
        if (graphiqueStats) graphiqueStats.destroy();
        graphiqueStats = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Modules', 'Cours', 'Leçons', 'Utilisateurs (Total)'],
                datasets: [{
                    label: 'Volume',
                    data: [stats.total_modules || 0, stats.total_cours || 0, stats.total_lecons || 0, totalUsers],
                    backgroundColor: ['#1a56db', '#10b981', '#f59e0b', '#6366f1'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, border: { dash: [4, 4] } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
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
        let tbody = document.getElementById("logs_table");
        if(!tbody) return;

        if (logs.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:24px; color:var(--color-neutral-400);'>Aucune activité récente.</td></tr>";
            return;
        }
        
        let html = "";
        logs.forEach(l => {
            let roleBadge = l.role_user === 'promoteur' ? 'badge-danger' : (l.role_user === 'enseignant' ? 'badge-success' : 'badge-info');
            
            html += `<tr>
                <td><span style="color:var(--color-neutral-500); font-size:0.8rem;">${new Date(l.date_action).toLocaleString('fr-FR')}</span></td>
                <td style="font-weight:500;">${l.nom_user}</td>
                <td><span class="badge ${roleBadge}">${l.role_user}</span></td>
                <td style="color:var(--color-primary); font-weight:500;">${l.action}</td>
                <td style="color:var(--color-neutral-600); font-size:0.8rem;">${l.details || '-'}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch(e) {
        console.error("Erreur chargement logs:", e);
    }
}

// ===== IMPORT CSV ENSEIGNANTS =====
async function importerCSV() {
    let input = document.getElementById("csv_file");
    let msg = document.getElementById("import_result");
    
    if (!input || input.files.length === 0) {
        if(msg) {
            msg.style.color = "red";
            msg.textContent = "Veuillez sélectionner un fichier CSV.";
        }
        return;
    }
    
    let file = input.files[0];
    let formData = new FormData();
    formData.append("fichier_csv", file);
    formData.append("role", "enseignant");
    
    if(msg) {
        msg.style.color = "var(--color-primary)";
        msg.textContent = "Importation en cours...";
    }
    
    try {
        let res = await fetch('api/import.php', {
            method: 'POST',
            body: formData
        });
        let data = await res.json();
        
        if (data.success) {
            if(msg) {
                msg.style.color = "var(--color-success)";
                msg.textContent = data.message;
            }
            afficherEnseignants();
            chargerStatsGraphiques();
            chargerLogsActivite();
            logActivite('CSV_IMPORT', 'Import enseignant: ' + file.name);
        } else {
            if(msg) {
                msg.style.color = "var(--color-danger)";
                msg.textContent = "Erreur: " + data.message;
            }
        }
    } catch(e) {
        if(msg) {
            msg.style.color = "var(--color-danger)";
            msg.textContent = "Erreur de connexion.";
        }
    }
}

// ===== GESTION DES AFFICHAGES EXISTANTS =====
async function afficherEnseignants() {
    var tbody = document.getElementById("liste_enseignants");
    if(!tbody) return;

    try {
        let res = await fetch('api/enseignants.php');
        let enseignants = await res.json();
        
        tbody.innerHTML = "";
        
        if (enseignants.length === 0) {
            tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding:24px; color:var(--color-neutral-400);'>Aucun enseignant inscrit.</td></tr>";
            return;
        }

        let html = "";
        enseignants.forEach(function(ens) {
            html += `<tr>
                <td style="font-weight:500;">${ens.nom}</td>
                <td>${ens.email}</td>
                <td style="color:var(--color-neutral-500); font-size:0.85rem;">${ens.date_creation || '-'}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch(err) {
        tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding:24px; color:var(--color-danger);'>Erreur de chargement.</td></tr>";
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
