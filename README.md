# FONDA WORKPLACE — LMS Portable

Système de Gestion de l'Apprentissage (Learning Management System) léger, sans dépendances lourdes, développé par **ONANA GREGOIRE LEGRAND (Matricule : 24G2060)**.

**Stack technique :** HTML · CSS Vanilla · JavaScript (Fetch API) · PHP 8 · SQLite

---

## Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du projet](#architecture-du-projet)
3. [Modèle de données](#modèle-de-données)
4. [Flux de fonctionnement par rôle](#flux-de-fonctionnement-par-rôle)
5. [API Backend — Référence](#api-backend--référence)
6. [Lancer le projet en local](#lancer-le-projet-en-local)
7. [Déploiement cloud](#déploiement-cloud)
8. [Comptes de test](#comptes-de-test)

---

## Vue d'ensemble

FONDA WORKPLACE est conçu autour de trois principes :

- **Portabilité** : aucune installation de serveur de base de données (SQLite, fichier local). Un seul binaire PHP suffit.
- **Séparation des rôles** : trois espaces distincts — Promoteur, Enseignant, Étudiant — avec des droits et des vues entièrement séparés.
- **Architecture RESTful légère** : le frontend communique avec le backend uniquement via des requêtes `fetch()` vers des endpoints PHP. Aucun rechargement de page n'est nécessaire après la connexion.

---

## Architecture du projet

```
FONDA_WORKPLACE/
│
├── index.html                    # Page d'accueil publique (présentation + lien login)
├── login.html                    # Connexion et inscription (tous rôles)
├── dashboard_etudiant.html       # Interface Étudiant (SPA)
├── dashboard_enseignant.html     # Interface Enseignant (SPA)
├── dashboard_promoteur.html      # Interface Promoteur / Admin (SPA)
├── profil.html                   # Gestion du profil utilisateur (photo, mot de passe)
├── certificat.html               # Page de certificat imprimable / exportable en PDF
│
├── start.bat                     # Lancement local Windows (PHP built-in server)
├── start.sh                      # Lancement local Linux/macOS
├── vercel.json                   # Config déploiement Vercel (serverless PHP)
├── composer.json                 # Config Render.com / Composer
├── database.sql                  # Schéma SQL de référence (documentation)
├── seed.php                      # Peuplement initial de la base (comptes de test)
│
├── assets/
│   ├── css/
│   │   └── style.css             # Design system complet (variables CSS, composants)
│   ├── js/
│   │   ├── auth.js               # Vérification de session et déconnexion
│   │   ├── etudiant.js           # Logique complète vue Étudiant
│   │   ├── enseignant.js         # Logique complète vue Enseignant
│   │   └── promoteur.js          # Logique complète vue Promoteur
│   └── uploads/                  # Fichiers téléversés (PDF, vidéos des leçons)
│
└── api/                          # Backend PHP — Endpoints RESTful
    ├── config/
    │   └── database.php          # Connexion PDO SQLite + auto-création des tables
    ├── auth.php                  # Login / Register / Logout
    ├── modules.php               # CRUD Modules (GET, POST)
    ├── cours.php                 # CRUD Cours (GET, POST, DELETE)
    ├── lecons.php                # CRUD Leçons + gestion position vidéo
    ├── evaluations.php           # CRUD Quiz (GET, POST, PUT)
    ├── progression.php           # Suivi de progression étudiant (GET, POST)
    ├── notifications.php         # Notifications in-app (GET, POST, PATCH)
    ├── commentaires.php          # Commentaires Q&A par leçon (GET, POST)
    ├── logs.php                  # Journal d'activité global (GET, POST)
    ├── recherche.php             # Recherche full-text modules/cours/leçons (GET)
    ├── stats.php                 # Statistiques agrégées pour le promoteur (GET)
    ├── import.php                # Import CSV d'utilisateurs (POST multipart)
    ├── certificats.php           # Génération et validation de certificats (GET, POST)
    ├── profil.php                # Mise à jour profil et photo (GET, POST)
    ├── enseignants.php           # Liste des enseignants (GET)
    └── upload.php                # Téléversement de fichiers leçons (POST multipart)
```

---

## Modèle de données

La base SQLite est créée automatiquement dans `api/config/database.php` au premier lancement. Voici les tables principales et leurs relations :

```
utilisateurs          modules               cours
─────────────         ─────────────         ─────────────────
id (PK)               id (PK)               id (PK)
nom                   titre                 titre
email (unique)        description           description
mot_de_passe (hash)   promoteur_id (FK)     module_id (FK)
role                  date_creation         enseignant_id (FK)
photo_profil                                date_creation
date_creation
                      lecons                evaluations
                      ──────────            ─────────────────
                      id (PK)               id (PK)
                      cours_id (FK)         lecon_id (FK)
                      titre                 questions (JSON)
                      type (pdf/video)      score_minimum
                      url_contenu           duree_minutes
                      ordre                 date_creation

progression           notifications         commentaires
───────────           ─────────────         ────────────────
id (PK)               id (PK)               id (PK)
etudiant_id (FK)      user_id (FK)          lecon_id (FK)
lecon_id (FK)         message               user_id (FK)
terminee (0/1)        lue (0/1)             nom_user
video_position        lien                  role_user
date_completion       date_creation         message
                                            parent_id (FK, nullable)
                                            date_creation

certificats           logs_activite
────────────          ─────────────────
id (PK)               id (PK)
etudiant_id (FK)      user_id (FK)
module_id (FK)        nom_user
code_unique           role_user
date_emission         action
                      details
                      date_action
```

**Relations clés :**
- Un **module** contient plusieurs **cours**, chaque cours contient plusieurs **leçons**.
- Une **leçon** peut avoir une **évaluation** (quiz JSON) et plusieurs **commentaires**.
- La **progression** relie un étudiant à une leçon et stocke le statut + la position vidéo.
- Un **certificat** est émis quand toutes les leçons d'un module sont `terminee = 1`.

---

## Flux de fonctionnement par rôle

### Promoteur
```
Connexion → dashboard_promoteur.html
  |
  ├── Voir statistiques (Chart.js : utilisateurs, modules, cours)
  ├── Créer un module → POST api/modules.php
  ├── Lister les enseignants → GET api/enseignants.php
  ├── Importer des enseignants (CSV) → POST api/import.php
  ├── Consulter les logs d'activité → GET api/logs.php
  ├── Recherche globale → GET api/recherche.php?q=...
  └── Notifications → GET api/notifications.php (polling 15s)
```

### Enseignant
```
Connexion → dashboard_enseignant.html
  |
  ├── Créer un cours dans un module → POST api/cours.php
  ├── Ajouter des leçons (PDF ou URL vidéo) → POST api/lecons.php
  │     └── Téléverser un fichier → POST api/upload.php
  ├── Créer un quiz sur une leçon → POST api/evaluations.php
  │     └── Configurer : durée (min), score minimum de validation
  ├── Répondre aux questions étudiants (Q&A) → POST api/commentaires.php
  ├── Recherche → GET api/recherche.php?q=...
  └── Notifications → polling automatique 15s
```

### Étudiant
```
Connexion → dashboard_etudiant.html
  |
  ├── Parcourir le catalogue de cours → GET api/modules.php + api/cours.php
  ├── Ouvrir une leçon
  │     ├── PDF → affiché directement
  │     └── Vidéo → reprise à la position sauvegardée (video_position)
  │           └── Sauvegarde auto position → PATCH api/lecons.php
  ├── Marquer une leçon comme terminée → POST api/progression.php
  ├── Passer un quiz
  │     ├── Chronomètre décompte (duree_minutes × 60 secondes)
  │     ├── Score calculé côté client
  │     └── Si score >= score_minimum → progression validée + notification envoyée
  ├── Poser une question (Q&A) → POST api/commentaires.php
  ├── Voir son certificat (si module 100%) → GET api/certificats.php
  │     └── Impression / export PDF (window.print)
  ├── Modifier son profil → GET / POST api/profil.php
  ├── Recherche → GET api/recherche.php?q=...
  └── Notifications → polling automatique 15s
```

---

## API Backend — Référence

Tous les endpoints sont dans `api/`. Ils retournent du JSON. Ils lisent les données JSON via `php://input` (POST/PUT) ou les paramètres GET.

| Endpoint | Méthodes | Description |
|---|---|---|
| `auth.php` | POST | Login (`action=login`) / Register (`action=register`) |
| `modules.php` | GET, POST | Liste / Création de modules |
| `cours.php` | GET, POST, DELETE | Cours par module. `?module_id=X` |
| `lecons.php` | GET, POST, DELETE, PATCH | Leçons d'un cours. PATCH pour position vidéo |
| `evaluations.php` | GET, POST, PUT | Quiz. Questions stockées en JSON |
| `progression.php` | GET, POST | Suivi étudiant. `?etudiant_id=X` |
| `notifications.php` | GET, POST, PATCH | Notifications. PATCH marque comme lues |
| `commentaires.php` | GET, POST | Q&A par leçon. `parent_id` pour les réponses |
| `logs.php` | GET, POST | Journal d'activité (accessible promoteur) |
| `recherche.php` | GET | Full-text sur modules, cours, leçons. `?q=terme` |
| `stats.php` | GET | Totaux utilisateurs, modules, cours, leçons |
| `import.php` | POST (multipart) | Import CSV. Champs : `nom,email,mot_de_passe` |
| `certificats.php` | GET, POST | Vérifie / crée un certificat |
| `profil.php` | GET, POST | Données profil + upload photo |
| `upload.php` | POST (multipart) | Téléversement fichiers leçons vers `assets/uploads/` |
| `enseignants.php` | GET | Liste des utilisateurs avec `role = 'enseignant'` |

**Authentification :** gérée côté client via `localStorage` (`id_connecte`, `nom_connecte`, `role_connecte`). `auth.js` vérifie la présence de ces clés au chargement de chaque dashboard et redirige vers `login.html` si absent.

---

## Lancer le projet en local

### Prérequis
- PHP 8.0 ou supérieur (le binaire `php` doit être accessible)
- Aucune base de données externe requise

### Windows
```bat
double-cliquer sur start.bat
```
ou dans PowerShell :
```powershell
./php/php.exe -S localhost:8000
```

### Linux / macOS
```bash
chmod +x start.sh
./start.sh
```

Le serveur démarre sur **http://localhost:8000**.

### Peupler la base de test
```
http://localhost:8000/seed.php
```
Ce script crée les 3 comptes de test et insère quelques données de démonstration.

---

## Déploiement cloud

### Vercel (recommandé)
```bash
npm install -g vercel
vercel --prod
```
Le fichier `vercel.json` configure le routing PHP via le runtime `vercel-php@0.7.2`.

### Render.com
Connecter le dépôt GitHub. Render détecte le `composer.json` et démarre automatiquement un environnement PHP. Définir la variable d'environnement `APP_ENV=production`.

> **Note :** Sur Vercel/Render, la base SQLite est éphémère (réinitialisée à chaque déploiement). Pour un usage en production, il faudrait migrer vers un service de base de données externe (PlanetScale, Supabase, etc.).

---

## Comptes de test

Après avoir exécuté `seed.php`, les comptes suivants sont disponibles :

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Étudiant | `etudiant@lms.com` | `1234` |
| Enseignant | `enseignant@lms.com` | `1234` |
| Promoteur | `promoteur@lms.com` | `1234` |

De nouveaux comptes peuvent être créés directement depuis l'interface d'inscription sur `login.html`.

---

*Projet académique — ONANA GREGOIRE LEGRAND (24G2060)*



