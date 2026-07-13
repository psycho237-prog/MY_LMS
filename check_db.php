<?php
require_once 'api/config/database.php';
echo "--- USERS ---\n";
print_r($pdo->query("SELECT * FROM users")->fetchAll());
echo "--- MODULES ---\n";
print_r($pdo->query("SELECT * FROM modules")->fetchAll());
echo "--- COURS ---\n";
print_r($pdo->query("SELECT * FROM cours")->fetchAll());
?>
