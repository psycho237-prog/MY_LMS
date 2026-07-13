<?php
require_once __DIR__ . '/api/config/database.php';

// Ensure the tables are created by fetching a dummy record to trigger the table creation logic
$pdo->query("SELECT * FROM users LIMIT 1");

// Create a module
$stmt = $pdo->prepare("INSERT INTO modules (titre, description, promoteur_id) VALUES (?, ?, ?)");
$stmt->execute(['Module de Test (Seed)', 'Un module généré automatiquement pour tester le LMS', 3]); // promoteur=3
$module_id = $pdo->lastInsertId();

// Create a course
$stmt = $pdo->prepare("INSERT INTO cours (module_id, titre, description, enseignant_id) VALUES (?, ?, ?, ?)");
$stmt->execute([$module_id, 'Apprendre React JS', 'Cours complet sur la librairie React JS pour le frontend.', 2]); // enseignant=2
$cours_id = $pdo->lastInsertId();

// Create a PDF lesson
$stmt = $pdo->prepare("INSERT INTO lecons (cours_id, titre, type, url_contenu) VALUES (?, ?, ?, ?)");
$stmt->execute([$cours_id, 'Introduction à React (PDF)', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']);

// Create a Video lesson
$stmt->execute([$cours_id, 'Les bases des Composants (Vidéo)', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']);
$lecon_id = $pdo->lastInsertId();

// Create a Quiz for the video lesson
$questions = [
    [
        "q" => "Qu'est-ce que React ?",
        "options" => ["Une librairie JS", "Un système d'exploitation", "Une base de données"],
        "reponse" => "Une librairie JS"
    ],
    [
        "q" => "Que sont les Props ?",
        "options" => ["Des propriétés de composants", "Des variables globales", "Des boucles"],
        "reponse" => "Des propriétés de composants"
    ]
];
$stmt = $pdo->prepare("INSERT INTO evaluations (lecon_id, titre, questions) VALUES (?, ?, ?)");
$stmt->execute([$lecon_id, 'Quiz de Validation React', json_encode($questions)]);

echo "Seeding completed successfully.\n";
