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

function afficherCours() {
    var conteneur = document.getElementById("mes_cours");
    if(!conteneur) return;

    // Simulation de la réponse JSON de api/cours.php via AJAX
    var reponseAPI = [
        { id: 1, titre: "Algorithmique Avancée", description: "Structures de données complexes.", type: "pdf" },
        { id: 2, titre: "Développement Web PHP/MySQL", description: "Création d'un LMS dynamique.", type: "video" }
    ];

    conteneur.innerHTML = ""; // Vider le loading
    
    reponseAPI.forEach(function(cours) {
        var html = "<div class='carte-cours'>";
        html += "<h3>" + cours.titre + "</h3>";
        html += "<p>" + cours.description + "</p>";
        html += "<button class='btn-cours' onclick='editerCours(" + cours.id + ")'>Gérer les leçons</button>";
        html += "</div>";
        conteneur.innerHTML += html;
    });
}

function editerCours(id) {
    alert("Ouverture de l'éditeur de cours n°" + id);
}
