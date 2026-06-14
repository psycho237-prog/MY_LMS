<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if($method == 'GET') {
    if (isset($_GET['enseignant_id'])) {
        $stmt = $pdo->prepare("SELECT * FROM cours WHERE enseignant_id = ?");
        $stmt->execute([$_GET['enseignant_id']]);
        $cours = $stmt->fetchAll();
    } else {
        $stmt = $pdo->query("SELECT * FROM cours");
        $cours = $stmt->fetchAll();
    }
    echo json_encode($cours);
} elseif($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $stmt = $pdo->prepare("INSERT INTO cours (module_id, titre, description, enseignant_id) VALUES (?, ?, ?, ?)");
    if ($stmt->execute([$data->module_id, $data->titre, $data->description, $data->enseignant_id])) {
        echo json_encode(["success" => true, "message" => "Cours créé"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erreur lors de la création du cours"]);
    }
} elseif($method == 'DELETE') {
    $data = json_decode(file_get_contents("php://input"));
    $id = isset($data->id) ? $data->id : (isset($_GET['id']) ? $_GET['id'] : null);
    if($id) {
        $stmt = $pdo->prepare("DELETE FROM cours WHERE id = ?");
        if($stmt->execute([$id])) {
            echo json_encode(["success" => true, "message" => "Cours supprimé"]);
        } else {
            echo json_encode(["success" => false, "message" => "Erreur de suppression"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "ID manquant"]);
    }
}
?>
