# API Chat va Chat vient 🐱💬

API de l'application **Chat va Chat vient**, un site de rencontres pour les chats. ❤️🐈  

Note : Le swagger n'est pas totalement à jour.

## Prérequis ✅

- Node.js (version minimale : 20) 🌐
- npm 📦  
  **     **OU**      **  
- Docker et Docker Compose 🐳

## Installation ⚙️

1. Clonez le dépôt :  
   **Via SSH :**

   ```bash
   git clone git@github.com:Chat-va-chat-vient/API.git chat-va-chat-vient-api
   cd chat-va-chat-vient-api
   ```

   **Via HTTPS :**

   ```bash
   git clone https://github.com/Chat-va-chat-vient/API.git
   cd chat-va-chat-vient-api
   ```

2. Installez les dépendances :

   ```bash
   npm install
   ```

## Lancer l'API 🚀

### Avec Docker avec NPM 🐋

```bash
# 🛠️ The first time only
npm run docker:init

# 🚀 To start the API
npm run docker:start

# 📜 To show API logs
npm run docker:log

# 🛑 To stop the API
npm run docker:stop
```

### Avec npm directement 💻

1. **Assurez-vous d'avoir installé Node.js (version 20) et npm.**

2. **Démarrez l'application :**

   ```bash
   npm install
   npm start
   ```

3. **Accédez à l'API :**

   URL de base de l'API est `http://localhost:3001`.  
   La documentation Swagger est accessible à `http://localhost:3001/api-docs`. 📖

## Schéma de la Base de Données 🗄️

```mermaid
erDiagram
    users {
        string id PK
        string photo
        string city
        integer age
        string name
        string gender
    }

    messages {
        integer id PK
        string content
    }

    likes {
        integer id PK
        string user_id FK
        string liked_user_id FK
        integer liked
    }

    user_messages {
        integer id PK
        string sender_id FK
        string recipient_id FK
        string message
        datetime created_at
    }

    users ||--o{ likes : ""
    users ||--o{ user_messages : ""
    users ||--o{ messages : ""
    messages ||--o{ user_messages : ""
```
