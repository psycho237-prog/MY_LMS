<?php
require_once 'config/database.php';

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
if (strlen($q) < 2) { echo json_encode([]); exit; }

$like = "%$q%";
$resultats = [];

// Recherche dans les cours
$stmt = $pdo->prepare("SELECT 'cours' as type, id, titre, description FROM cours WHERE titre LIKE ? OR description LIKE ? LIMIT 5");
$stmt->execute([$like, $like]);
$resultats = array_merge($resultats, $stmt->fetchAll());

// Recherche dans les modules
$stmt = $pdo->prepare("SELECT 'module' as type, id, titre, description FROM modules WHERE titre LIKE ? OR description LIKE ? LIMIT 5");
$stmt->execute([$like, $like]);
$resultats = array_merge($resultats, $stmt->fetchAll());

// Recherche dans les leçons
$stmt = $pdo->prepare("SELECT 'lecon' as type, l.id, l.titre, c.titre as description FROM lecons l LEFT JOIN cours c ON c.id = l.cours_id WHERE l.titre LIKE ? LIMIT 5");
$stmt->execute([$like]);
$resultats = array_merge($resultats, $stmt->fetchAll());

echo json_encode($resultats);
