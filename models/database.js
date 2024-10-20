const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Initialiser la base de données SQLite
const db = new sqlite3.Database(
  path.join(__dirname, "../database.db"),
  (err) => {
    if (err) {
      console.error("Erreur de connexion à la base de données : ", err);
    } else {
      console.log("Connecté à la base de données SQLite.");
    }
  }
);

// Créer les tables si elles n'existent pas déjà
db.serialize(() => {
  // Table des utilisateurs
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      photo TEXT,
      city TEXT,
      age INTEGER,
      name TEXT,
      gender TEXT,
      description TEXT
    )
  `);

  // Table des messages automatiques
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT
    )
  `);

  // Table des likes/dislikes
  db.run(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      liked_user_id TEXT,
      liked INTEGER, -- 1 pour like, 0 pour dislike
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (liked_user_id) REFERENCES users(id)
    )
  `);

  // Table des messages envoyés par les utilisateurs
  db.run(`
    CREATE TABLE IF NOT EXISTS user_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id TEXT,
      recipient_id TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id)
    )
  `);

  // Insérer des messages automatiques si la table des messages est vide
  db.get(`SELECT COUNT(*) AS count FROM messages`, (err, row) => {
    if (err) {
      console.error("Erreur lors de la vérification des messages : ", err);
    } else if (row.count === 0) {
      const messages = [
        "Bonjour, je suis content que vous soyez intéressé par mon chat !",
        "Salut, mon chat est le plus mignon, voulez-vous en savoir plus ?",
        "Hello, avez-vous aussi un chat ? Le mien adore les câlins !",
        "Coucou, j'espère que vous aimez les chats joueurs !",
        "Mon chat et moi vous saluons !",
      ];

      messages.forEach((msg) => {
        db.run(`INSERT INTO messages (content) VALUES (?)`, [msg], (err) => {
          if (err) {
            console.log(
              "Erreur lors de l'insertion du message automatique :",
              err
            );
          }
        });
      });
      console.log("Messages automatiques insérés.");
    }
  });

  // Insérer des profils de chats si la table des utilisateurs est vide
  db.get(`SELECT COUNT(*) AS count FROM users`, (err, row) => {
    if (err) {
      console.error("Erreur lors de la vérification des utilisateurs : ", err);
    } else if (row.count === 0) {
      const profiles = [
        {
          id: "b40ec084-925c-44a6-a5a6-d533e7397014",
          name: "Minou",
          city: "Paris",
          age: 3,
          gender: "M",
          description:
            "Je suis un vrai parisien, élégant et toujours à la recherche de câlins. J'adore observer les passants depuis la fenêtre et chasser les ombres. À la recherche d'une compagne pour des siestes partagées et des aventures dans les ruelles de Paris.",
        },
        {
          id: "0881fc7c-3f06-4e1f-bf8c-21597eff596e",
          name: "Félix",
          city: "Lyon",
          age: 2,
          gender: "M",
          description:
            "Petit aventurier à quatre pattes, je suis un explorateur des pentes de Lyon. Joueur et curieux, j'aime grimper et découvrir de nouveaux horizons. J'aimerais rencontrer une chatte aussi curieuse que moi pour des escapades félines.",
        },
        {
          id: "49a7e2dd-4513-4ef1-8acb-d1f8967bd5c9",
          name: "Choupette",
          city: "Marseille",
          age: 4,
          gender: "F",
          description:
            "Sous le soleil de Marseille, je suis une beauté raffinée au pelage doux comme la soie. J'aime me prélasser au soleil et savourer la tranquillité. Si tu aimes la dolce vita, rejoins-moi pour une vie de siestes au bord de la fenêtre.",
        },
        {
          id: "befc7995-93eb-46f2-91b3-9fab3743dc98",
          name: "Gribouille",
          city: "Toulouse",
          age: 1,
          gender: "M",
          description:
            "Je suis un petit chaton plein d'énergie, toujours prêt pour une partie de chasse (de jouets) et une course-poursuite autour de la maison. J'adore les câlins mais seulement après une bonne séance de jeu. À la recherche d'une compagne tout aussi active !",
        },
        {
          id: "6d394c43-9bf9-4f8a-8b0f-6ab8579fbfc3",
          name: "Mimi",
          city: "Nice",
          age: 5,
          gender: "F",
          description:
            "Doyenne de mon quartier à Nice, je suis une chatte élégante et un peu gourmande. J'adore les caresses et les moments de détente sur un coussin moelleux. Je cherche un compagnon calme et affectueux pour des moments de tendresse sous le soleil niçois.",
        },
        {
          id: "0df44c15-448a-44ca-832f-a10e2c3ed6a0",
          name: "Pacha",
          city: "Nantes",
          age: 6,
          gender: "M",
          description:
            "Véritable roi de la maison, je suis un chat majestueux avec une grande personnalité. J'aime être le centre de l'attention et je sais me faire entendre quand j'ai envie de câlins ou de friandises. À la recherche d'une princesse féline pour régner à deux.",
        },
        {
          id: "fdcf2670-c58b-4427-bb36-a6e0297f3609",
          name: "Luna",
          city: "Bordeaux",
          age: 3,
          gender: "F",
          description:
            "Mystérieuse et élégante, je suis la chatte parfaite pour ceux qui aiment le charme et la grâce. Je suis une grande fan des fenêtres ouvertes et des couchers de soleil. Si tu veux partager des moments calmes et doux, fais-moi signe.",
        },
        {
          id: "9797aae8-7e00-49a7-9221-0e5678add447",
          name: "Caramel",
          city: "Lille",
          age: 4,
          gender: "M",
          description:
            "Je suis un chat à la personnalité chaleureuse, comme mon nom l'indique. J'aime les longues siestes et je suis toujours partant pour un bon repas. Je cherche une compagne affectueuse pour partager des moments doux et tranquilles.",
        },
        {
          id: "bb254d89-4db1-49be-8cea-320a491cb4f3",
          name: "Nala",
          city: "Strasbourg",
          age: 2,
          gender: "F",
          description:
            "Curieuse et pleine de vie, j'adore explorer les coins de la maison et jouer avec tout ce qui bouge. Si tu es un chat actif à la recherche d'une partenaire pour des aventures félines, alors je suis la chatte qu'il te faut !",
        },
        {
          id: "4fa73261-1006-4494-9b29-77984e283008",
          name: "Tigrou",
          city: "Montpellier",
          age: 1,
          gender: "M",
          description:
            "Petit tigre de Montpellier, je suis un chaton joueur avec un grand cœur. Je suis toujours en mouvement, prêt à courir, sauter et explorer. Si tu es aussi joueur que moi, on va bien s'entendre !",
        },
      ];

      profiles.forEach(({ id, name, city, age, gender, description }) => {
        db.run(
          `INSERT INTO users (id, photo, city, age, name, gender, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, `${id}.png`, city, age, name, gender, description],
          (err) => {
            if (err) {
              console.log(
                "Erreur lors de l'insertion des profils de chats :",
                err
              );
            }
          }
        );
      });
      console.log("Profils de chats insérés.");
    }
  });
});

module.exports = db;
