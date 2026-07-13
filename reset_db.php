<?php
$db_file = __DIR__ . '/api/config/lms_db.sqlite';

if (file_exists($db_file)) {
    unlink($db_file);
    echo "Ancienne base de donnees supprimee.\n";
}

// Initialise la BD (crée les tables et les 3 utilisateurs par défaut)
require_once __DIR__ . '/api/config/database.php';

// Création d'un module
$stmt = $pdo->prepare("INSERT INTO modules (titre, description, promoteur_id) VALUES (?, ?, ?)");
$stmt->execute(['Sécurité et Cloud Computing', 'Module pratique sur la sécurité cloud et vault.', 3]); // promoteur=3
$module_id = $pdo->lastInsertId();

// Création d'un cours
$stmt = $pdo->prepare("INSERT INTO cours (module_id, titre, description, enseignant_id) VALUES (?, ?, ?, ?)");
$stmt->execute([$module_id, 'Travaux Pratiques INF3421', 'Cours contenant le TP et la vidéo de démonstration CVAULT.', 2]); // enseignant=2
$cours_id = $pdo->lastInsertId();

// Leçon 1 : PDF
$stmt = $pdo->prepare("INSERT INTO lecons (cours_id, titre, type, url_contenu) VALUES (?, ?, ?, ?)");
$stmt->execute([$cours_id, 'Document du TP INF3421 (PDF)', 'pdf', 'uploads/TP_INF3421_2024_2025.pdf']);

// Leçon 2 : Vidéo
$stmt->execute([$cours_id, 'Démonstration CVAULT (Vidéo)', 'video', 'uploads/CVAULT.mp4']);
$lecon_id = $pdo->lastInsertId();

// Création d'un quiz pour la vidéo
$questions = [
    [
        "q" => "De quoi parle principalement la vidéo CVAULT ?",
        "options" => ["D'une base de données SQL", "De la gestion des secrets", "De la programmation web"],
        "reponse" => "De la gestion des secrets"
    ],
    [
        "q" => "Quel est l'objectif du TP INF3421 ?",
        "options" => ["Apprendre la sécurité", "Faire du design CSS", "Gérer des serveurs de jeu"],
        "reponse" => "Apprendre la sécurité"
    ]
];
$stmt = $pdo->prepare("INSERT INTO evaluations (lecon_id, titre, questions, duree_minutes, score_minimum) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$lecon_id, 'Quiz de Validation CVAULT', json_encode($questions), 15, 50]);

echo "Base de donnees nettoyee et peuplee avec succes.\n";
?>
