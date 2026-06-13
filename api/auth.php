<?php
require_once 'config/database.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->action)) {
    if ($data->action === 'login' && isset($data->email) && isset($data->password)) {
        $email = $data->email;
        $password = $data->password;
        
        $stmt = $pdo->prepare("SELECT id, nom, role FROM users WHERE email = ? AND mot_de_passe = ?");
        $stmt->execute([$email, $password]);
        $user = $stmt->fetch();

        if($user) {
            echo json_encode([
                "success" => true,
                "user" => [
                    "id" => $user['id'],
                    "nom" => $user['nom'],
                    "role" => $user['role']
                ]
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Identifiants incorrects"]);
        }
    } 
    elseif ($data->action === 'register' && isset($data->nom) && isset($data->email) && isset($data->password) && isset($data->role)) {
        $nom = $data->nom;
        $email = $data->email;
        $password = $data->password;
        $role = $data->role;

        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if($stmt->fetch()) {
            echo json_encode(["success" => false, "message" => "Cet email est déjà utilisé"]);
            exit;
        }

        // Insert new user
        $stmt = $pdo->prepare("INSERT INTO users (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)");
        if ($stmt->execute([$nom, $email, $password, $role])) {
            echo json_encode(["success" => true, "message" => "Compte créé avec succès"]);
        } else {
            echo json_encode(["success" => false, "message" => "Erreur lors de l'inscription"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Données manquantes ou action invalide"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Aucune action spécifiée"]);
}
?>
