<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    if (!$user_id) { echo json_encode(["success" => false]); exit; }

    $stmt = $pdo->prepare("SELECT id, nom, email, role, photo_profil, bio FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    echo json_encode($stmt->fetch());

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = $data['user_id'];

    $fields = [];
    $params = [];

    if (!empty($data['nom'])) { $fields[] = "nom = ?"; $params[] = $data['nom']; }
    if (!empty($data['email'])) { $fields[] = "email = ?"; $params[] = $data['email']; }
    if (!empty($data['mot_de_passe'])) { $fields[] = "mot_de_passe = ?"; $params[] = $data['mot_de_passe']; }
    if (isset($data['bio'])) { $fields[] = "bio = ?"; $params[] = $data['bio']; }
    if (!empty($data['photo_profil'])) { $fields[] = "photo_profil = ?"; $params[] = $data['photo_profil']; }

    if (empty($fields)) { echo json_encode(["success" => false, "message" => "Rien à modifier"]); exit; }

    $params[] = $user_id;
    $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(["success" => true, "message" => "Profil mis à jour"]);
}
