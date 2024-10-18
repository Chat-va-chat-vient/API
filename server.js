const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Initialiser la base de données SQLite
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données : ", err);
  } else {
    console.log("Connecté à la base de données SQLite.");
  }
});

// Créer les tables si elles n'existent pas
db.serialize(() => {
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

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT
    )
  `);

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

  // Nouvelle table pour stocker les messages envoyés par les utilisateurs
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

  db.serialize(() => {
    // Vérification de l'existence des messages avant l'insertion
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
            if (err)
              console.log(
                "Erreur lors de l'insertion du message automatique :",
                err
              );
          });
        });
        console.log("Messages automatiques insérés.");
      } else {
        console.log(
          "Les messages existent déjà. Aucun message supplémentaire n'a été ajouté."
        );
      }
    });
  });

  // Vérification de l'existence des utilisateurs avant l'insertion des profils de chats
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
          description: "string",
        },
        {
          id: "0881fc7c-3f06-4e1f-bf8c-21597eff596e",
          name: "Félix",
          city: "Lyon",
          age: 2,
          gender: "M",
          description: "string",
        },
        {
          id: "49a7e2dd-4513-4ef1-8acb-d1f8967bd5c9",
          name: "Choupette",
          city: "Marseille",
          age: 4,
          gender: "F",
          description: "string",
        },
        {
          id: "befc7995-93eb-46f2-91b3-9fab3743dc98",
          name: "Gribouille",
          city: "Toulouse",
          age: 1,
          gender: "M",
          description: "string",
        },
        {
          id: "6d394c43-9bf9-4f8a-8b0f-6ab8579fbfc3",
          name: "Mimi",
          city: "Nice",
          age: 5,
          gender: "F",
          description: "string",
        },
        {
          id: "0df44c15-448a-44ca-832f-a10e2c3ed6a0",
          name: "Pacha",
          city: "Nantes",
          age: 6,
          gender: "M",
          description: "string",
        },
        {
          id: "fdcf2670-c58b-4427-bb36-a6e0297f3609",
          name: "Luna",
          city: "Bordeaux",
          age: 3,
          gender: "F",
          description: "string",
        },
        {
          id: "9797aae8-7e00-49a7-9221-0e5678add447",
          name: "Caramel",
          city: "Lille",
          age: 4,
          gender: "M",
          description: "string",
        },
        {
          id: "bb254d89-4db1-49be-8cea-320a491cb4f3",
          name: "Nala",
          city: "Strasbourg",
          age: 2,
          gender: "F",
          description: "string",
        },
        {
          id: "4fa73261-1006-4494-9b29-77984e283008",
          name: "Tigrou",
          city: "Montpellier",
          age: 1,
          gender: "M",
          description: "string",
        },
      ];

      profiles.forEach(({ id, name, city, age, gender, description }) => {
        db.run(
          `INSERT INTO users (id, photo, city, age, name, gender, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, `${id}.png`, city, age, name, gender, description],
          (err) => {
            if (err)
              console.log(
                "Erreur lors de l'insertion des profils de chats :",
                err
              );
          }
        );
      });
      console.log("Profils de chats insérés.");
    } else {
      console.log(
        "Les profils de chats existent déjà. Aucun profil supplémentaire n'a été ajouté."
      );
    }
  });
});

// Middleware pour gérer les fichiers images (photos de profil)
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite à 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Format de fichier non supporté. Veuillez télécharger un fichier JPEG ou PNG."
        )
      );
    }
  },
});

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chat va Chat vient API",
      version: "1.0.0",
      description: "API pour l'application de rencontre pour chats",
    },
    servers: [{ url: "http://localhost:3001" }],
  },
  apis: ["./server.js"], // Documents Swagger basés sur ce fichier
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         city:
 *           type: string
 *         age:
 *           type: integer
 *         gender:
 *           type: string
 *         photo:
 *           type: string
 *     Message:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         recipientId:
 *           type: string
 *         message:
 *           type: string
 *     Like:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         likedUserId:
 *           type: string
 *         liked:
 *           type: integer
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Créer un utilisateur
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *               city:
 *                 type: string
 *               age:
 *                 type: integer
 *               name:
 *                 type: string
 *               gender:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 */
app.post("/users", upload.single("photo"), async (req, res) => {
  const { city, age, name, gender, description } = req.body;
  const userId = uuidv4();

  if (req.file) {
    const inputPath = req.file.path;
    const outputFilename = `${userId}.png`;
    const outputPath = `uploads/${outputFilename}`;

    try {
      // Convertir l'image en PNG et l'enregistrer
      await sharp(inputPath).png().toFile(outputPath);

      // Supprimer le fichier original après conversion
      fs.unlinkSync(inputPath);

      db.run(
        `
        INSERT INTO users (id, photo, city, age, name, gender, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, outputFilename, city, age, name, gender, description],
        (err) => {
          if (err) {
            res.status(500).json({
              message: "Erreur lors de la création de l'utilisateur.",
            });
          } else {
            res
              .status(201)
              .json({ message: "Utilisateur créé avec succès", userId });
          }
        }
      );
    } catch (err) {
      res
        .status(500)
        .json({ message: "Erreur lors de la conversion de l'image." });
    }
  } else {
    db.run(
      `
      INSERT INTO users (id, photo, city, age, name, gender, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, null, city, age, name, gender, description],
      (err) => {
        if (err) {
          res
            .status(500)
            .json({ message: "Erreur lors de la création de l'utilisateur." });
        } else {
          res
            .status(201)
            .json({ message: "Utilisateur créé avec succès", userId });
        }
      }
    );
  }
});

/**
 * @swagger
 * /users/{id}/photo:
 *   post:
 *     summary: Uploader une photo de profil pour un utilisateur
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo mise à jour avec succès
 */
app.post("/users/:id/photo", upload.single("photo"), async (req, res) => {
  const userId = req.params.id;

  if (req.file) {
    const inputPath = req.file.path;
    const outputFilename = `${userId}.png`;
    const outputPath = `uploads/${outputFilename}`;

    try {
      await sharp(inputPath).png().toFile(outputPath);
      fs.unlinkSync(inputPath);

      db.run(
        `
        UPDATE users SET photo = ? WHERE id = ?`,
        [outputFilename, userId],
        (err) => {
          if (err) {
            res
              .status(500)
              .json({ message: "Erreur lors de la mise à jour de la photo." });
          } else {
            res.json({ message: "Photo mise à jour avec succès." });
          }
        }
      );
    } catch (err) {
      res
        .status(500)
        .json({ message: "Erreur lors de la conversion de l'image." });
    }
  } else {
    res.status(400).json({ message: "Aucune photo uploadée." });
  }
});

/**
 * @swagger
 * /users/{id}/photo:
 *   get:
 *     summary: Récupérer la photo de profil d'un utilisateur
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: URL de la photo de profil
 *       404:
 *         description: Photo non trouvée
 */
app.get("/users/:id/photo", (req, res) => {
  const userId = req.params.id;

  db.get(`SELECT photo FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) {
      res
        .status(500)
        .json({ message: "Erreur lors de la récupération de la photo." });
    } else if (!row || !row.photo) {
      res.status(404).json({ message: "Photo non trouvée." });
    } else {
      res.json({
        photoUrl: `${req.protocol}://${req.get("host")}/uploads/${row.photo}`,
      });
    }
  });
});

/**
 * @swagger
 * /messages/send:
 *   post:
 *     summary: Envoyer un message et recevoir une réponse automatique
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Message'
 *     responses:
 *       200:
 *         description: Message envoyé avec succès et réponse automatique reçue
 */
app.post("/messages/send", (req, res) => {
  const { userId, recipientId, message } = req.body;

  if (!userId || !recipientId || !message) {
    return res.status(400).json({
      message:
        "Paramètres manquants : userId, recipientId et message sont requis.",
    });
  }

  // Insérer le message dans la base de données
  db.run(
    `INSERT INTO user_messages (sender_id, recipient_id, message) VALUES (?, ?, ?)`,
    [userId, recipientId, message],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: "Erreur lors de l'enregistrement du message.",
          error: err,
        });
      }

      // Sélectionner un message automatique pour répondre
      db.get(
        `SELECT content FROM messages ORDER BY RANDOM() LIMIT 1`,
        (err, row) => {
          if (err) {
            return res.status(500).json({
              message: "Erreur lors de la récupération du message automatique.",
            });
          } else {
            return res.json({
              message: "Message envoyé avec succès.",
              autoReply: row.content,
            });
          }
        }
      );
    }
  );
});

/**
 * @swagger
 * /users/{userId}/like:
 *   post:
 *     summary: Liker ou disliker un utilisateur
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur qui fait l'action (like ou dislike)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIdLiked:
 *                 type: string
 *                 description: ID de l'utilisateur qui reçoit l'action (like/dislike)
 *                 example: "12345"
 *               liked:
 *                 type: integer
 *                 description: 1 pour like (Smash), 0 pour dislike (Pass)
 *                 example: 1
 *     responses:
 *       200:
 *         description: Action enregistrée avec succès (like ou dislike)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Message de confirmation du succès de l'action
 *                   example: "Utilisateur liké avec succès."
 *       400:
 *         description: Paramètres manquants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Message d'erreur pour paramètres manquants
 *                   example: "Paramètres manquants : userIdLiked et liked sont requis."
 *       500:
 *         description: Erreur serveur lors du traitement de la demande
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Message d'erreur en cas d'erreur serveur
 *                   example: "Erreur lors de l'enregistrement du like/dislike."
 *                 error:
 *                   type: string
 *                   description: Détails techniques de l'erreur
 */
app.post("/users/:userId/like", (req, res) => {
  const userId = req.params.userId; // L'utilisateur qui fait l'action (like ou dislike)
  const { userIdLiked, liked } = req.body; // L'utilisateur qui est liké/disliké et l'action (1 pour like, 0 pour dislike)

  // Vérification des paramètres manquants
  if (!userIdLiked || liked === undefined) {
    return res.status(400).json({
      message: "Paramètres manquants : userIdLiked et liked sont requis.",
    });
  }

  // Vérifier si l'utilisateur a déjà liké/disliké cet utilisateur
  db.get(
    `SELECT * FROM likes WHERE user_id = ? AND liked_user_id = ?`,
    [userId, userIdLiked],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          message: "Erreur lors de la vérification du like/dislike.",
          error: err,
        });
      }

      if (row) {
        // Si l'action existe déjà, on met à jour l'entrée
        db.run(
          `UPDATE likes SET liked = ? WHERE user_id = ? AND liked_user_id = ?`,
          [liked, userId, userIdLiked],
          (err) => {
            if (err) {
              return res.status(500).json({
                message: "Erreur lors de la mise à jour du like/dislike.",
                error: err,
              });
            }
            return res.json({
              message: liked
                ? "Utilisateur liké avec succès."
                : "Utilisateur disliké avec succès.",
            });
          }
        );
      } else {
        // Si aucune action précédente n'existe, on insère une nouvelle entrée
        db.run(
          `INSERT INTO likes (user_id, liked_user_id, liked) VALUES (?, ?, ?)`,
          [userId, userIdLiked, liked],
          (err) => {
            if (err) {
              return res.status(500).json({
                message: "Erreur lors de l'enregistrement du like/dislike.",
                error: err,
              });
            }
            return res.json({
              message: liked
                ? "Utilisateur liké avec succès."
                : "Utilisateur disliké avec succès.",
            });
          }
        );
      }
    }
  );
});

/**
 * @swagger
 * /users/{userId}/likes:
 *   get:
 *     summary: Récupérer les utilisateurs likés (Smash) ou dislikés (Pass)
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *       - in: query
 *         name: liked
 *         schema:
 *           type: integer
 *         description: 1 pour récupérer les utilisateurs aimés, 0 pour les utilisateurs non aimés
 *     responses:
 *       200:
 *         description: Liste des utilisateurs aimés ou non aimés récupérée avec succès
 */
app.get("/users/:userId/likes", (req, res) => {
  const userId = req.params.userId;
  const liked = req.query.liked; // 1 pour les likes (smash), 0 pour les dislikes (pass)

  // Récupérer les utilisateurs aimés ou non aimés en fonction de la valeur de 'liked'
  db.all(
    `
    SELECT u.id, u.name, u.city, u.age, u.gender, u.photo 
    FROM likes l
    JOIN users u ON l.liked_user_id = u.id
    WHERE l.user_id = ? AND l.liked = ?
  `,
    [userId, liked],
    (err, rows) => {
      if (err) {
        res.status(500).json({
          message: "Erreur lors de la récupération des likes/dislikes.",
        });
      } else {
        res.json(rows);
      }
    }
  );
});

/**
 * @swagger
 * /users/{userId}/smashorpass:
 *   get:
 *     summary: Récupérer des profils pour "Smash or Pass"
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur qui effectue le Smash or Pass
 *     responses:
 *       200:
 *         description: Liste de profils récupérée avec succès
 */
app.get("/users/:userId/smashorpass", (req, res) => {
  const userId = req.params.userId;

  db.all(
    `
    SELECT * FROM users 
    WHERE id != ? 
    AND id NOT IN (SELECT liked_user_id FROM likes WHERE user_id = ?) 
    LIMIT 10`,
    [userId, userId],
    (err, rows) => {
      if (err) {
        res
          .status(500)
          .json({ message: "Erreur lors de la récupération des profils." });
      } else {
        rows.forEach((row) => {
          if (row.photo) {
            row.photo = `${req.protocol}://${req.get("host")}/uploads/${
              row.photo
            }`;
          }
        });
        res.json(rows);
      }
    }
  );
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Récupérer les informations d'un utilisateur par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Informations de l'utilisateur récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur non trouvé
 */
app.get("/users/:id", (req, res) => {
  const userId = req.params.id;

  db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) {
      res.status(500).json({
        message: "Erreur lors de la récupération de l'utilisateur.",
        error: err,
      });
    } else if (!row) {
      res.status(404).json({
        message: "Utilisateur non trouvé.",
      });
    } else {
      if (row.photo) {
        row.photo = `${req.protocol}://${req.get("host")}/uploads/${row.photo}`;
      }
      res.json(row);
    }
  });
});

const port = 3001;

// Serveur démarré
app.listen(port, () => {
  console.log(
    `Le serveur fonctionne sur le port ${port}. Accédez à la documentation Swagger sur http://localhost:${port}/api-docs`
  );
});
