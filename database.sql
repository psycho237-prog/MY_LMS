CREATE DATABASE IF NOT EXISTS lms_db;
USE lms_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('promoteur', 'enseignant', 'etudiant') NOT NULL
);

CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    promoteur_id INT,
    FOREIGN KEY (promoteur_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    enseignant_id INT,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (enseignant_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS lecons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cours_id INT,
    titre VARCHAR(255) NOT NULL,
    type ENUM('pdf', 'video') NOT NULL,
    url_contenu VARCHAR(255) NOT NULL,
    FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lecon_id INT,
    titre VARCHAR(255) NOT NULL,
    questions JSON NOT NULL,
    FOREIGN KEY (lecon_id) REFERENCES lecons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progression_etudiant (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etudiant_id INT,
    lecon_id INT,
    score DECIMAL(5,2),
    progression_pourcentage DECIMAL(5,2) DEFAULT 0,
    date_completion DATETIME,
    FOREIGN KEY (etudiant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lecon_id) REFERENCES lecons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS certificats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etudiant_id INT,
    module_id INT,
    date_obtention DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (etudiant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);
