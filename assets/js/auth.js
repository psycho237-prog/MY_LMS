// Fichier Javascript pour le fonctionnement du LMS
// Auteur: ONANA GREGOIRE LEGRAND (Matricule: 24G2060)

function toggleForm() {
    var loginForm = document.getElementById("form_login");
    var registerForm = document.getElementById("form_register");
    var title = document.getElementById("form_title");

    if (loginForm.style.display === "none") {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
        title.innerText = "Connectez-vous à votre espace d'apprentissage.";
    } else {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
        title.innerText = "Créez votre compte pour commencer.";
    }
}

// Fonction qui verifie si le login est bon
async function verifierConnexion(event) {
    event.preventDefault();

    var email = document.getElementById("email").value;
    var pass = document.getElementById("mdp").value;
    var msg = document.getElementById("erreur_msg");
    var btn = document.getElementById("btn_submit");
    
    var originalText = btn.innerHTML;
    btn.innerHTML = "Connexion...";
    btn.style.opacity = "0.7";
    msg.style.display = "none";

    try {
        let response = await fetch('api/auth.php', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'login', email: email, password: pass }) 
        });
        let data = await response.json();

        if (data.success) {
            localStorage.setItem("id_connecte", data.user.id);
            localStorage.setItem("nom_connecte", data.user.nom);
            localStorage.setItem("role_connecte", data.user.role);
            
            if (data.user.role === 'etudiant') window.location.href = "dashboard_etudiant.html";
            else if (data.user.role === 'enseignant') window.location.href = "dashboard_enseignant.html";
            else if (data.user.role === 'promoteur') window.location.href = "dashboard_promoteur.html";
        } else {
            msg.innerText = data.message || "Identifiants incorrects !";
            msg.style.display = "block";
            btn.innerHTML = originalText;
            btn.style.opacity = "1";
        }
    } catch(err) {
        msg.innerText = "Erreur de connexion au serveur.";
        msg.style.display = "block";
        btn.innerHTML = originalText;
        btn.style.opacity = "1";
    }
}

// Fonction d'inscription
async function inscrireUtilisateur(event) {
    event.preventDefault();

    var nom = document.getElementById("reg_nom").value;
    var email = document.getElementById("reg_email").value;
    var pass = document.getElementById("reg_mdp").value;
    var role = document.getElementById("reg_role").value;
    var msg = document.getElementById("reg_msg");
    var btn = document.getElementById("btn_register");

    var originalText = btn.innerHTML;
    btn.innerHTML = "Création...";
    btn.style.opacity = "0.7";
    msg.style.display = "none";
    msg.style.color = "var(--danger)";

    try {
        let response = await fetch('api/auth.php', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'register', nom: nom, email: email, password: pass, role: role }) 
        });
        let data = await response.json();

        if (data.success) {
            msg.style.color = "var(--success)";
            msg.innerText = "Compte créé avec succès ! Redirection...";
            msg.style.display = "block";
            
            // Auto login after 1 second
            setTimeout(() => {
                document.getElementById("email").value = email;
                document.getElementById("mdp").value = pass;
                toggleForm();
                document.getElementById("btn_submit").click();
            }, 1500);
        } else {
            msg.innerText = data.message || "Erreur lors de la création.";
            msg.style.display = "block";
            btn.innerHTML = originalText;
            btn.style.opacity = "1";
        }
    } catch(err) {
        msg.innerText = "Erreur de connexion au serveur.";
        msg.style.display = "block";
        btn.innerHTML = originalText;
        btn.style.opacity = "1";
    }
}

// Fonction pour se deconnecter
function deconnexion() {
    localStorage.removeItem("id_connecte");
    localStorage.removeItem("nom_connecte");
    localStorage.removeItem("role_connecte");
    window.location.href = "index.html";
}
