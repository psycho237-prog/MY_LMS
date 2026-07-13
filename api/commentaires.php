<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $lecon_id = isset($_GET['lecon_id']) ? intval($_GET['lecon_id']) : null;
    if (!$lecon_id) { echo json_encode([]); exit; }

    $stmt = $pdo->prepare("
        SELECT c.*, u.photo_profil 
        FROM commentaires c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.lecon_id = ? AND c.parent_id IS NULL 
        ORDER BY c.date_creation ASC
    ");
    $stmt->execute([$lecon_id]);
    $commentaires = $stmt->fetchAll();

    // Récupérer les réponses pour chaque commentaire
    foreach ($commentaires as &$comment) {
        $stmt2 = $pdo->prepare("
            SELECT c.*, u.photo_profil 
            FROM commentaires c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.parent_id = ? 
            ORDER BY c.date_creation ASC
        ");
        $stmt2->execute([$comment['id']]);
        $comment['reponses'] = $stmt2->fetchAll();
    }

    echo json_encode($commentaires);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("INSERT INTO commentaires (lecon_id, user_id, nom_user, role_user, message, parent_id) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['lecon_id'],
        $data['user_id'],
        $data['nom_user'],
        $data['role_user'],
        $data['message'],
        $data['parent_id'] ?? null
    ]);
    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);

} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("DELETE FROM commentaires WHERE id = ? AND user_id = ?");
    $stmt->execute([$data['id'], $data['user_id']]);
    echo json_encode(["success" => true]);
}
