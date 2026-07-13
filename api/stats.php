<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $type = $_GET['type'] ?? 'all';

    // Total étudiants, enseignants, cours, leçons
    $totaux = [];
    $totaux['etudiants'] = $pdo->query("SELECT COUNT(*) FROM users WHERE role='etudiant'")->fetchColumn();
    $totaux['enseignants'] = $pdo->query("SELECT COUNT(*) FROM users WHERE role='enseignant'")->fetchColumn();
    $totaux['cours'] = $pdo->query("SELECT COUNT(*) FROM cours")->fetchColumn();
    $totaux['lecons'] = $pdo->query("SELECT COUNT(*) FROM lecons")->fetchColumn();
    $totaux['modules'] = $pdo->query("SELECT COUNT(*) FROM modules")->fetchColumn();

    // Taux de complétion par module
    $stmt = $pdo->query("
        SELECT m.titre, 
               COUNT(DISTINCT pe.etudiant_id) as etudiants_actifs,
               AVG(pe.progression_pourcentage) as progression_moy
        FROM modules m
        LEFT JOIN cours c ON c.module_id = m.id
        LEFT JOIN lecons l ON l.cours_id = c.id
        LEFT JOIN progression_etudiant pe ON pe.lecon_id = l.id
        GROUP BY m.id, m.titre
    ");
    $completions = $stmt->fetchAll();

    // Scores moyens par cours
    $stmt2 = $pdo->query("
        SELECT c.titre,
               AVG(pe.score) as score_moyen,
               COUNT(pe.id) as nb_soumissions
        FROM cours c
        LEFT JOIN lecons l ON l.cours_id = c.id
        LEFT JOIN progression_etudiant pe ON pe.lecon_id = l.id
        WHERE pe.score IS NOT NULL
        GROUP BY c.id, c.titre
    ");
    $scores = $stmt2->fetchAll();

    // Activité par jour (7 derniers jours)
    $stmt3 = $pdo->query("
        SELECT DATE(date_action) as jour, COUNT(*) as nb_actions
        FROM logs_activite
        WHERE date_action >= datetime('now', '-7 days')
        GROUP BY DATE(date_action)
        ORDER BY jour ASC
    ");
    $activite = $stmt3->fetchAll();

    echo json_encode([
        "totaux" => $totaux,
        "completions" => $completions,
        "scores" => $scores,
        "activite" => $activite
    ]);
}
