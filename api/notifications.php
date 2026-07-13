<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

if ($method === 'GET' && $user_id) {
    // Récupérer les notifications d'un utilisateur
    $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY date_creation DESC LIMIT 30");
    $stmt->execute([$user_id]);
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    // Créer une notification (appelé par les autres APIs)
    $stmt = $pdo->prepare("INSERT INTO notifications (user_id, message, lien) VALUES (?, ?, ?)");
    $stmt->execute([$data['user_id'], $data['message'], $data['lien'] ?? null]);
    echo json_encode(["success" => true]);

} elseif ($method === 'PATCH') {
    $data = json_decode(file_get_contents("php://input"), true);
    // Marquer comme lue(s)
    if (isset($data['all']) && $data['all'] && $user_id) {
        $stmt = $pdo->prepare("UPDATE notifications SET lue = 1 WHERE user_id = ?");
        $stmt->execute([$user_id]);
    } elseif (isset($data['id'])) {
        $stmt = $pdo->prepare("UPDATE notifications SET lue = 1 WHERE id = ?");
        $stmt->execute([$data['id']]);
    }
    echo json_encode(["success" => true]);
}
