<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if($method == 'GET') {
    if(isset($_GET['etudiant_id'])) {
        $stmt = $pdo->prepare("SELECT * FROM progression_etudiant WHERE etudiant_id = ?");
        $stmt->execute([$_GET['etudiant_id']]);
        echo json_encode($stmt->fetchAll());
    }
} elseif($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $stmt = $pdo->prepare("INSERT INTO progression_etudiant (etudiant_id, lecon_id, score, progression_pourcentage, date_completion) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)");
    $stmt->execute([$data->etudiant_id, $data->lecon_id, $data->score, $data->progression_pourcentage]);
    echo json_encode(["success" => true, "message" => "Progression mise à jour"]);
}
?>
