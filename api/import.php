<?php
require_once 'config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Méthode non supportée"]); exit;
}

$enseignant_id = $_POST['enseignant_id'] ?? null;
if (!$enseignant_id || !isset($_FILES['csv_file'])) {
    echo json_encode(["success" => false, "message" => "Paramètres manquants"]); exit;
}

$file = $_FILES['csv_file']['tmp_name'];
$handle = fopen($file, 'r');
if (!$handle) { echo json_encode(["success" => false, "message" => "Fichier invalide"]); exit; }

$inserted = 0;
$errors = [];
$header = fgetcsv($handle); // Ignore la première ligne d'entête

$modules_cache = [];
$cours_cache = [];

while (($row = fgetcsv($handle)) !== false) {
    if (count($row) < 5) { $errors[] = "Ligne ignorée (colonnes insuffisantes)"; continue; }

    [$module_titre, $cours_titre, $lecon_titre, $type, $url] = array_map('trim', $row);
    $promoteur_id = 3; // ID promoteur par défaut

    // Module : trouver ou créer
    $module_key = strtolower($module_titre);
    if (!isset($modules_cache[$module_key])) {
        $stmt = $pdo->prepare("SELECT id FROM modules WHERE LOWER(titre) = ?");
        $stmt->execute([$module_key]);
        $mod = $stmt->fetch();
        if ($mod) {
            $modules_cache[$module_key] = $mod['id'];
        } else {
            $stmt = $pdo->prepare("INSERT INTO modules (titre, description, promoteur_id) VALUES (?, '', ?)");
            $stmt->execute([$module_titre, $promoteur_id]);
            $modules_cache[$module_key] = $pdo->lastInsertId();
        }
    }
    $module_id = $modules_cache[$module_key];

    // Cours : trouver ou créer
    $cours_key = strtolower($module_key . '_' . $cours_titre);
    if (!isset($cours_cache[$cours_key])) {
        $stmt = $pdo->prepare("SELECT id FROM cours WHERE LOWER(titre) = ? AND module_id = ?");
        $stmt->execute([strtolower($cours_titre), $module_id]);
        $cours = $stmt->fetch();
        if ($cours) {
            $cours_cache[$cours_key] = $cours['id'];
        } else {
            $stmt = $pdo->prepare("INSERT INTO cours (module_id, titre, description, enseignant_id) VALUES (?, ?, '', ?)");
            $stmt->execute([$module_id, $cours_titre, $enseignant_id]);
            $cours_cache[$cours_key] = $pdo->lastInsertId();
        }
    }
    $cours_id = $cours_cache[$cours_key];

    // Leçon : toujours créer
    $stmt = $pdo->prepare("INSERT INTO lecons (cours_id, titre, type, url_contenu) VALUES (?, ?, ?, ?)");
    $stmt->execute([$cours_id, $lecon_titre, $type, $url]);
    $inserted++;
}

fclose($handle);
echo json_encode(["success" => true, "inserted" => $inserted, "errors" => $errors]);
