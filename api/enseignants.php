<?php
require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if($method == 'GET') {
    $stmt = $pdo->prepare("SELECT id, nom, email FROM users WHERE role = 'enseignant'");
    $stmt->execute();
    echo json_encode($stmt->fetchAll());
}
?>
