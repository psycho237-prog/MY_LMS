<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $etudiant_id = isset($_GET['etudiant_id']) ? intval($_GET['etudiant_id']) : null;
    if (!$etudiant_id) { echo json_encode([]); exit; }

    // Récupérer tous les modules avec leurs certificats
    $stmt = $pdo->prepare("
        SELECT m.id, m.titre, m.description,
               cert.id as certificat_id, cert.date_obtention
        FROM modules m
        LEFT JOIN certificats cert ON cert.module_id = m.id AND cert.etudiant_id = ?
        ORDER BY m.id
    ");
    $stmt->execute([$etudiant_id]);
    $modules = $stmt->fetchAll();

    foreach ($modules as &$module) {
        // Calculer le % de complétion du module
        $stmt2 = $pdo->prepare("
            SELECT COUNT(DISTINCT l.id) as total_lecons,
                   COUNT(DISTINCT CASE WHEN pe.score IS NOT NULL THEN l.id END) as lecons_validees
            FROM cours c
            JOIN lecons l ON l.cours_id = c.id
            LEFT JOIN progression_etudiant pe ON pe.lecon_id = l.id AND pe.etudiant_id = ?
            WHERE c.module_id = ?
        ");
        $stmt2->execute([$etudiant_id, $module['id']]);
        $stats = $stmt2->fetch();
        $module['total_lecons'] = $stats['total_lecons'] ?? 0;
        $module['lecons_validees'] = $stats['lecons_validees'] ?? 0;
        $module['pourcentage'] = $module['total_lecons'] > 0
            ? round(($module['lecons_validees'] / $module['total_lecons']) * 100)
            : 0;

        // Décerner automatiquement le certificat si 100% complété
        if ($module['pourcentage'] >= 100 && !$module['certificat_id'] && $module['total_lecons'] > 0) {
            $stmt3 = $pdo->prepare("INSERT INTO certificats (etudiant_id, module_id) VALUES (?, ?)");
            $stmt3->execute([$etudiant_id, $module['id']]);
            $module['certificat_id'] = $pdo->lastInsertId();
            $module['date_obtention'] = date('Y-m-d H:i:s');
        }
    }

    echo json_encode($modules);
}
