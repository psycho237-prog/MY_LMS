<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) { echo json_encode(["success" => false]); exit; }

    $stmt = $pdo->prepare("INSERT INTO logs_activite (user_id, nom_user, role_user, action, details) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['user_id'] ?? null,
        $data['nom_user'] ?? 'Anonyme',
        $data['role_user'] ?? '',
        $data['action'],
        $data['details'] ?? null
    ]);
    echo json_encode(["success" => true]);

} elseif ($method === 'GET') {
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
    $role = $_GET['role'] ?? null;

    if ($role) {
        $stmt = $pdo->prepare("SELECT * FROM logs_activite WHERE role_user = ? ORDER BY date_action DESC LIMIT ?");
        $stmt->execute([$role, $limit]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM logs_activite ORDER BY date_action DESC LIMIT ?");
        $stmt->execute([$limit]);
    }
    echo json_encode($stmt->fetchAll());
}
