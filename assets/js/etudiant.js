/**
 * Logique Frontend pour l'Espace Étudiant
 * Auteur: ONANA GREGOIRE LEGRAND (24G2060)
 */

// S'exécute automatiquement au chargement de la page (dashboard_etudiant.html)
window.onload = function() {
    // Récupération des informations de session stockées localement
    var role = localStorage.getItem("role_connecte");
    var nom = localStorage.getItem("nom_connecte");
    
    // Vérification de sécurité : si l'utilisateur n'est pas connecté ou n'est pas étudiant
    if(!nom || role !== 'etudiant') {
        // Redirection forcée vers la page de connexion
        window.location.href = "index.html";
        return;
    }
    
    // Affichage du nom de l'utilisateur dans la barre de navigation
    document.getElementById("nom_utilisateur").textContent = nom;
    
    // Chargement dynamique des cours depuis le serveur
    afficherCours();
};

/**
 * Fonction asynchrone pour récupérer et afficher la liste des cours disponibles
 * Actuellement simulée, elle devra être reliée à 'api/cours.php' avec un fetch()
 */
function afficherCours() {
    var conteneur = document.getElementById("mes_cours");
    if(!conteneur) return; // Sécurité si l'élément HTML n'existe pas

    // Simulation d'une réponse JSON venant de l'API (Backend)
    var reponseAPI = [
        { id: 1, titre: "Algorithmique Avancée", description: "Structures de données complexes.", type: "pdf" },
        { id: 2, titre: "Développement Web PHP/MySQL", description: "Création d'un LMS dynamique.", type: "video" }
    ];

    conteneur.innerHTML = ""; // Vide le message de "Chargement en cours..."
    
    // Parcours de chaque cours reçu pour générer le code HTML correspondant
    reponseAPI.forEach(function(cours) {
        var html = "<div class='carte-cours'>";
        html += "<h3>" + cours.titre + "</h3>";
        html += "<p>" + cours.description + "</p>";
        // Bouton d'action spécifique à l'étudiant : "Suivre la leçon"
        html += "<button class='btn-cours' onclick='ouvrirCours(" + cours.id + ")'>Suivre la leçon (" + cours.type + ")</button>";
        html += "</div>";
        conteneur.innerHTML += html; // Injection du HTML généré dans la page
    });
}

/**
 * Fonction déclenchée lors du clic sur un cours
 * Elle ouvrira la visionneuse (PDF ou Vidéo) pour consulter la leçon
 * @param {number} id - L'identifiant unique du cours à ouvrir
 */
function ouvrirCours(id) {
    alert("Ouverture du module d'apprentissage n°" + id + ".\n(Fonctionnalité à intégrer avec PDF.js/Video.js)");
}
