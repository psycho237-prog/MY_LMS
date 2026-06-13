<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if($method == 'GET') {
    $stmt = $pdo->query("SELECT * FROM cours");
    $cours = $stmt->fetchAll();
    echo json_encode($cours);
} elseif($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $stmt = $pdo->prepare("INSERT INTO cours (module_id, titre, description, enseignant_id) VALUES (?, ?, ?, ?)");
    $stmt->execute([$data->module_id, $data->titre, $data->description, $data->enseignant_id]);
    echo json_encode(["success" => true, "message" => "Cours créé"]);
}
?>
