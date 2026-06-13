<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if($method == 'GET') {
    if(isset($_GET['cours_id'])) {
        $stmt = $pdo->prepare("SELECT * FROM messages WHERE cours_id = ? ORDER BY date_envoi ASC");
        $stmt->execute([$_GET['cours_id']]);
        echo json_encode($stmt->fetchAll());
    } else {
        echo json_encode([]);
    }
} elseif($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if(isset($data->cours_id) && isset($data->user_id) && isset($data->nom_user) && isset($data->message)) {
        $stmt = $pdo->prepare("INSERT INTO messages (cours_id, user_id, nom_user, message) VALUES (?, ?, ?, ?)");
        if($stmt->execute([$data->cours_id, $data->user_id, $data->nom_user, $data->message])) {
            echo json_encode(["success" => true, "message" => "Message envoyé"]);
        } else {
            echo json_encode(["success" => false, "message" => "Erreur d'envoi"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Données incomplètes"]);
    }
}
?>
