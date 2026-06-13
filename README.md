# MY LMS - Plateforme d'Apprentissage Portable

Ce projet est un Système de Gestion de l'Apprentissage (LMS - Learning Management System) léger et ultra-portable développé en HTML, CSS, Vanilla JavaScript pour le frontend, et PHP/SQLite pour le backend.

Il a été conçu par **ONANA GREGOIRE LEGRAND (Matricule: 24G2060)**.

## 🎯 Fonctionnalités Principales

Le système gère trois rôles distincts, chacun avec son propre espace et ses propres fonctionnalités :

1. **Promoteur (Administrateur)**
   - Crée des modules de formation.
   - Suit les statistiques globales de complétion des étudiants.
   - Délivre les certificats d'achèvement.

2. **Enseignant**
   - Crée des cours et les associe aux modules.
   - Ajoute des leçons (sous forme de PDF ou de Vidéos).
   - Prépare des évaluations (QCM) à la fin de chaque leçon.

3. **Étudiant**
   - S'inscrit et accède à un catalogue de cours.
   - Suit les leçons (lecture PDF, vidéos).
   - Passe des évaluations pour valider ses acquis.
   - Obtient un certificat lorsque le module est terminé à 100%.

## 🚀 Pourquoi ce projet est-il ultra-portable ?

Ce LMS a été spécifiquement codé pour être **100% portable**. 

- **Pas d'installation MySQL lourde** : La base de données utilise **SQLite**. Les données sont stockées dans un simple fichier local (`lms_db.sqlite`). PHP crée ce fichier et génère les tables automatiquement au premier lancement si elles n'existent pas.
- **Exécution Windows sans logiciel tiers** : Pas besoin d'installer WAMP ou XAMPP. Si vous avez le binaire PHP sur votre machine, il suffit de double-cliquer sur `start.bat`.
- **Prêt pour le Cloud (Vercel / Render)** : 
  - Contient un `vercel.json` pour un déploiement direct et gratuit en Serverless sur Vercel via le runtime `vercel-php`.
  - Contient un `composer.json` pour être automatiquement reconnu et déployé par Render.com.

## 🛠️ Comment lancer le projet en local ?

### Sur Windows (Zéro config lourde)
1. Assurez-vous d'avoir téléchargé PHP et que `php` est dans vos variables d'environnement (PATH).
2. Double-cliquez simplement sur le fichier **`start.bat`**.
3. Le site s'ouvrira automatiquement à l'adresse : `http://localhost:8000`

### Sur Linux / Mac
1. Ouvrez un terminal dans le dossier du projet.
2. Exécutez la commande : `./start.sh`
3. Ouvrez votre navigateur sur `http://localhost:8000`

## 📂 Structure du Projet

```text
MY_LMS/
├── index.html                   # Page de connexion et d'inscription
├── dashboard_etudiant.html      # Tableau de bord : Vue Étudiant
├── dashboard_enseignant.html    # Tableau de bord : Vue Enseignant
├── dashboard_promoteur.html     # Tableau de bord : Vue Promoteur
├── start.bat / start.sh         # Scripts de lancement rapide local
├── vercel.json / composer.json  # Configuration de déploiement cloud
├── assets/
│   ├── css/style.css            # Styles premium et animations
│   ├── js/                      # Logique asynchrone (AJAX / Fetch)
│   │   ├── auth.js              # Gestion connexion/inscription
│   │   ├── etudiant.js          # Logique de la vue Étudiant
│   │   ├── enseignant.js        # Logique de la vue Enseignant
│   │   └── promoteur.js         # Logique de la vue Promoteur
│   └── uploads/                 # Stockage des PDF et Vidéos (Leçons)
└── api/                         # Backend PHP (Architecture RESTful)
    ├── config/database.php      # Connexion SQLite et Auto-setup
    ├── auth.php                 # Endpoints pour Login / Register
    ├── modules.php              # Gestion des Modules (Promoteur)
    ├── cours.php                # Gestion des Cours et leçons (Enseignant)
    ├── evaluations.php          # Gestion des QCM
    └── progression.php          # Suivi et statistiques de l'étudiant
```

## 🔐 Identifiants de Test (Générés par défaut)

Si la base de données est vide au démarrage, le système crée automatiquement ces 3 comptes pour vous permettre de tester immédiatement :

- **Étudiant :** `etudiant@lms.com` / Mot de passe : `1234`
- **Enseignant :** `enseignant@lms.com` / Mot de passe : `1234`
- **Promoteur :** `promoteur@lms.com` / Mot de passe : `1234`

Vous pouvez également créer de nouveaux comptes de n'importe quel rôle directement depuis l'interface d'inscription sur la page d'accueil !
