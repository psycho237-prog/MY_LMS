<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if($method == 'GET') {
    if(isset($_GET['lecon_id'])) {
        $stmt = $pdo->prepare("SELECT * FROM evaluations WHERE lecon_id = ?");
        $stmt->execute([$_GET['lecon_id']]);
        echo json_encode($stmt->fetchAll());
    }
} elseif($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    // Vérifier si une évaluation existe déjà pour cette leçon
    $stmt_check = $pdo->prepare("SELECT id FROM evaluations WHERE lecon_id = ?");
    $stmt_check->execute([$data->lecon_id]);
    $existing = $stmt_check->fetch();

    if ($existing) {
        $stmt = $pdo->prepare("UPDATE evaluations SET titre = ?, questions = ? WHERE id = ?");
        $stmt->execute([$data->titre, json_encode($data->questions), $existing['id']]);
        echo json_encode(["success" => true, "message" => "Évaluation mise à jour"]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO evaluations (lecon_id, titre, questions) VALUES (?, ?, ?)");
        $stmt->execute([$data->lecon_id, $data->titre, json_encode($data->questions)]);
        echo json_encode(["success" => true, "message" => "Évaluation créée"]);
    }
}
?>
