<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if($method == 'GET') {
    if(isset($_GET['etudiant_id'])) {
        $stmt = $pdo->prepare("SELECT p.*, l.titre as lecon_titre, l.type as lecon_type FROM progression_etudiant p JOIN lecons l ON p.lecon_id = l.id WHERE p.etudiant_id = ?");
        $stmt->execute([$_GET['etudiant_id']]);
        echo json_encode($stmt->fetchAll());
    }
} elseif($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    $stmt_check = $pdo->prepare("SELECT id FROM progression_etudiant WHERE etudiant_id = ? AND lecon_id = ?");
    $stmt_check->execute([$data->etudiant_id, $data->lecon_id]);
    $existing = $stmt_check->fetch();

    $score = isset($data->score) ? $data->score : null;
    $progression_pourcentage = isset($data->progression_pourcentage) ? $data->progression_pourcentage : 0;

    if ($existing) {
        if ($score !== null) {
            $stmt = $pdo->prepare("UPDATE progression_etudiant SET score = ?, date_completion = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$score, $existing['id']]);
        } else {
            // Ne met à jour le pourcentage que s'il est supérieur (pour ne pas régresser)
            $stmt = $pdo->prepare("UPDATE progression_etudiant SET progression_pourcentage = ? WHERE id = ? AND (progression_pourcentage IS NULL OR progression_pourcentage < ?)");
            $stmt->execute([$progression_pourcentage, $existing['id'], $progression_pourcentage]);
        }
    } else {
        $stmt = $pdo->prepare("INSERT INTO progression_etudiant (etudiant_id, lecon_id, score, progression_pourcentage, date_completion) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)");
        $stmt->execute([$data->etudiant_id, $data->lecon_id, $score, $progression_pourcentage]);
    }
    echo json_encode(["success" => true, "message" => "Progression mise à jour"]);
}
?>
