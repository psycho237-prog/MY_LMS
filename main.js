// Fichier Javascript pour le fonctionnement du LMS
// Auteur: ONANA GREGOIRE LEGRAND (Matricule: 24G2060)

// Fonction qui verifie si le login est bon
function verifierConnexion(event) {
    // empeche la page de se recharger avec le formulaire
    event.preventDefault();

    var user = document.getElementById("utilisateur").value;
    var pass = document.getElementById("mdp").value;
    var msg = document.getElementById("erreur_msg");

    // Pour le projet on met un mot de passe simple "1234"
    if (user != "" && pass == "1234") {
        // on sauvegarde le nom dans le navigateur pour dire bonjour sur l'autre page
        localStorage.setItem("nom_connecte", user);
        
        // on redirige sur le dashboard
        window.location.href = "dashboard.html";
    } else {
        // on affiche le message d'erreur
        msg.style.display = "block";
    }
}

// Fonction pour se deconnecter
function deconnexion() {
    // on vide le nom sauvegarde
    localStorage.removeItem("nom_connecte");
    // retour au login
    window.location.href = "index.html";
}

// Base de donnees simulee avec un tableau pour les cours
var base_de_cours = [
    { titre: "Algorithmique Avancée", prof: "Dr. Kamga", description: "Apprendre les structures de données complexes." },
    { titre: "Développement Web", prof: "M. Talla", description: "Base du HTML, CSS et un peu de Javascript." },
    { titre: "Réseaux Informatiques", prof: "Pr. Ndongo", description: "Le modèle OSI et le protocole TCP/IP." }
];

// Fonction pour afficher les cours sur la page dashboard
function afficherCours() {
    var conteneur = document.getElementById("mes_cours");
    
    // on recupere le nom de l'etudiant
    var nom = localStorage.getItem("nom_connecte");
    if(nom) {
        document.getElementById("nom_etudiant").innerHTML = nom;
    }

    if(conteneur) {
        conteneur.innerHTML = ""; // on vide au cas ou
        
        // on boucle sur les cours avec un "for" classique
        for(var i = 0; i < base_de_cours.length; i++) {
            var cours = base_de_cours[i];
            
            // on cree le html du cours en concatenant
            var html = "<div class='carte-cours'>";
            html += "<h3>" + cours.titre + "</h3>";
            html += "<p><strong>Professeur:</strong> " + cours.prof + "</p>";
            html += "<p>" + cours.description + "</p>";
            html += "<button class='btn-cours' onclick='ouvrirCours()'>Accéder au cours</button>";
            html += "</div>";
            
            // on l'ajoute dans la page
            conteneur.innerHTML += html;
        }
    }
}

// Fonction simple pour montrer l'acces
function ouvrirCours() {
    alert("Ouverture du cours en préparation... (Module en developpement par ONANA)");
}
