<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if($method == 'GET') {
    if(isset($_GET['cours_id'])) {
        $stmt = $pdo->prepare("SELECT * FROM lecons WHERE cours_id = ?");
        $stmt->execute([$_GET['cours_id']]);
        echo json_encode($stmt->fetchAll());
    } else {
        echo json_encode([]);
    }
} elseif($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if(isset($data->cours_id) && isset($data->titre) && isset($data->type) && isset($data->url_contenu)) {
        $stmt = $pdo->prepare("INSERT INTO lecons (cours_id, titre, type, url_contenu) VALUES (?, ?, ?, ?)");
        if($stmt->execute([$data->cours_id, $data->titre, $data->type, $data->url_contenu])) {
            echo json_encode(["success" => true, "message" => "Leçon ajoutée"]);
        } else {
            echo json_encode(["success" => false, "message" => "Erreur d'ajout"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Données incomplètes"]);
    }
}
?>
