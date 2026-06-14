<?php
/**
 * API pour la gestion des leçons (Vidéos et PDF).
 * Permet aux enseignants de lister, ajouter et supprimer des leçons attachées à un cours.
 */
require_once 'config/database.php';

// Récupère la méthode HTTP (GET pour lire, POST pour ajouter, DELETE pour supprimer)
$method = $_SERVER['REQUEST_METHOD'];

if($method == 'GET') {
    // Si un ID de cours est fourni, on récupère toutes ses leçons
    if(isset($_GET['cours_id'])) {
        $stmt = $pdo->prepare("SELECT * FROM lecons WHERE cours_id = ?");
        $stmt->execute([$_GET['cours_id']]);
        echo json_encode($stmt->fetchAll());
    } else {
        echo json_encode([]);
    }
} elseif($method == 'POST') {
    // --- AJOUT D'UNE NOUVELLE LEÇON ---
    // Les données sont envoyées en JSON depuis l'interface (fetch)
    $data = json_decode(file_get_contents("php://input"));
    if(isset($data->cours_id) && isset($data->titre) && isset($data->type) && isset($data->url_contenu)) {
        $public_id = isset($data->public_id) ? $data->public_id : null;
        $resource_type = isset($data->resource_type) ? $data->resource_type : null;
        // Enregistrement en base de données, incluant les identifiants Cloudinary pour future suppression
        $stmt = $pdo->prepare("INSERT INTO lecons (cours_id, titre, type, url_contenu, cloudinary_public_id, cloudinary_resource_type) VALUES (?, ?, ?, ?, ?, ?)");
        if($stmt->execute([$data->cours_id, $data->titre, $data->type, $data->url_contenu, $public_id, $resource_type])) {
            echo json_encode(["success" => true, "message" => "Leçon ajoutée"]);
        } else {
            echo json_encode(["success" => false, "message" => "Erreur d'ajout"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Données incomplètes"]);
    }
} elseif($method == 'DELETE') {
    // --- SUPPRESSION D'UNE LEÇON ET DESTRUCTION SUR CLOUDINARY ---
    $data = json_decode(file_get_contents("php://input"));
    $id = isset($data->id) ? $data->id : (isset($_GET['id']) ? $_GET['id'] : null);
    
    if($id) {
        // 1. On récupère d'abord les identifiants Cloudinary avant de supprimer la ligne
        $stmt = $pdo->prepare("SELECT cloudinary_public_id, cloudinary_resource_type FROM lecons WHERE id = ?");
        $stmt->execute([$id]);
        $lecon = $stmt->fetch();
        // 2. S'il s'agit d'un fichier stocké sur Cloudinary, on demande sa destruction physique
        if($lecon && !empty($lecon['cloudinary_public_id'])) {
            // Clés d'API secrètes (stockées côté backend uniquement pour des raisons de sécurité)
            $cloud_name = "dinntlvog";
            $api_key = "845519836612259";
            $api_secret = "Fp1yn5yCulzR71Blu4T3dK3d4n0";
            
            $public_id = $lecon['cloudinary_public_id'];
            $resource_type = !empty($lecon['cloudinary_resource_type']) ? $lecon['cloudinary_resource_type'] : 'image';
            
            // Calcul de la signature cryptographique SHA-1 requise par l'API Cloudinary
            $timestamp = time();
            $string_to_sign = "public_id=" . $public_id . "&timestamp=" . $timestamp . $api_secret;
            $signature = sha1($string_to_sign);
            
            // Appel API via cURL vers l'endpoint "destroy"
            $ch = curl_init("https://api.cloudinary.com/v1_1/" . $cloud_name . "/" . $resource_type . "/destroy");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
                'public_id' => $public_id,
                'timestamp' => $timestamp,
                'api_key' => $api_key,
                'signature' => $signature
            ]));
            curl_exec($ch);
            curl_close($ch);
        }

        // 3. Suppression de l'enregistrement dans la base de données locale
        $stmt = $pdo->prepare("DELETE FROM lecons WHERE id = ?");
        if($stmt->execute([$id])) {
            echo json_encode(["success" => true, "message" => "Leçon supprimée"]);
        } else {
            echo json_encode(["success" => false, "message" => "Erreur de suppression"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "ID manquant"]);
    }
}
?>
