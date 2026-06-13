<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if($method == 'GET') {
    $stmt = $pdo->query("SELECT * FROM modules");
    $modules = $stmt->fetchAll();
    echo json_encode($modules);
} elseif($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $stmt = $pdo->prepare("INSERT INTO modules (titre, description, promoteur_id) VALUES (?, ?, ?)");
    $stmt->execute([$data->titre, $data->description, $data->promoteur_id]);
    echo json_encode(["success" => true, "message" => "Module créé"]);
}
?>
