<?php
// api/config/database.php - Projet LMS ONANA GREGOIRE LEGRAND (24G2060)

// Configuration des entêtes HTTP pour autoriser les requêtes Cross-Origin (CORS)
// Cela permet au frontend (ex: localhost:3000) de communiquer avec l'API PHP
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// --- CONFIGURATION DE LA BASE DE DONNÉES ---
// Pour garantir la portabilité (fonctionne sur Windows sans serveur SQL externe et sur Vercel),
// nous utilisons SQLite. La base est un simple fichier local.
$db_file = __DIR__ . '/lms_db.sqlite';

// Adaptation spéciale pour Vercel : le système de fichiers est en lecture seule sauf dans /tmp
if (isset($_ENV['VERCEL'])) {
    $db_file = '/tmp/lms_db.sqlite';
}

try {
    // Connexion à SQLite via PDO
    $pdo = new PDO("sqlite:" . $db_file);
    // Configuration pour générer des exceptions en cas d'erreur SQL
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Retourne les résultats sous forme de tableaux associatifs par défaut
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Auto-Setup : Création automatique des tables si le fichier vient d'être créé
    // Utilisation de ON DELETE CASCADE pour la cohérence des données (ex: si on supprime un cours, ses leçons sont supprimées)

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            mot_de_passe TEXT NOT NULL,
            role TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS modules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titre TEXT NOT NULL,
            description TEXT,
            promoteur_id INTEGER,
            FOREIGN KEY (promoteur_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS cours (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER,
            titre TEXT NOT NULL,
            description TEXT,
            enseignant_id INTEGER,
            FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
            FOREIGN KEY (enseignant_id) REFERENCES users(id) ON DELETE SET NULL
        );
        
        CREATE TABLE IF NOT EXISTS lecons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cours_id INTEGER,
            titre TEXT NOT NULL,
            type TEXT NOT NULL,
            url_contenu TEXT NOT NULL,
            FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS evaluations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lecon_id INTEGER,
            titre TEXT NOT NULL,
            questions TEXT NOT NULL,
            FOREIGN KEY (lecon_id) REFERENCES lecons(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS progression_etudiant (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            etudiant_id INTEGER,
            lecon_id INTEGER,
            score REAL,
            progression_pourcentage REAL DEFAULT 0,
            date_completion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (etudiant_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (lecon_id) REFERENCES lecons(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS certificats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            etudiant_id INTEGER,
            module_id INTEGER,
            date_obtention DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (etudiant_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cours_id INTEGER,
            user_id INTEGER,
            nom_user TEXT,
            message TEXT,
            date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    ");

    // --- SEEDING DES DONNÉES ---
    // Ajout d'utilisateurs par défaut si la table users est vide 
    // Cela permet aux testeurs ou professeurs d'utiliser l'application immédiatement sans configuration.
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $row = $stmt->fetch();
    if($row['count'] == 0) {
        $pdo->exec("
            INSERT INTO users (nom, email, mot_de_passe, role) VALUES 
            ('Paul Etudiant', 'etudiant@lms.com', '1234', 'etudiant'),
            ('Marie Enseignante', 'enseignant@lms.com', '1234', 'enseignant'),
            ('Jean Promoteur', 'promoteur@lms.com', '1234', 'promoteur')
        ");
    }

    try {
        $pdo->exec("ALTER TABLE lecons ADD COLUMN cloudinary_public_id TEXT");
        $pdo->exec("ALTER TABLE lecons ADD COLUMN cloudinary_resource_type TEXT");
    } catch(PDOException $e) {
        // Les colonnes existent probablement déjà
    }

} catch(PDOException $e) {
    die(json_encode([
        "success" => false, 
        "message" => "Erreur de connexion BDD SQLite: " . $e->getMessage()
    ]));
}
?>
