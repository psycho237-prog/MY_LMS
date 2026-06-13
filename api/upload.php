<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$upload_dir = __DIR__ . '/../assets/uploads/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['file'])) {
    $file = $_FILES['file'];
    $filename = time() . '_' . basename($file['name']);
    $target_path = $upload_dir . $filename;
    
    // Check if on Vercel
    if (isset($_ENV['VERCEL'])) {
        $upload_dir = '/tmp/';
        $target_path = $upload_dir . $filename;
    }

    if (move_uploaded_file($file['tmp_name'], $target_path)) {
        // Return relative path for client
        $url_path = isset($_ENV['VERCEL']) ? '#' : 'assets/uploads/' . $filename;
        echo json_encode(["success" => true, "url" => $url_path]);
    } else {
        echo json_encode(["success" => false, "message" => "Échec du téléchargement"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Aucun fichier"]);
}
?>
