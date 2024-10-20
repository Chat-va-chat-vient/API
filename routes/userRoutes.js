const express = require("express");
const router = express.Router();
const upload = require("../middlewares/fileUpload");
const db = require("../models/database");

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
router.post("/", upload.single("photo"), async (req, res) => {
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
router.post("/:id/photo", upload.single("photo"), async (req, res) => {
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
router.get("/:id/photo", (req, res) => {
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
router.get("/:id", (req, res) => {
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

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Modifier les informations d'un utilisateur (sauf la photo)
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               city:
 *                 type: string
 *               age:
 *                 type: integer
 *               name:
 *                 type: string
 *               gender:
 *                 type: string
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur lors de la mise à jour de l'utilisateur
 */
router.put("/:id", (req, res) => {
  const userId = req.params.id;
  const { city, age, name, gender } = req.body;

  // Vérification des paramètres manquants
  if (!city || !age || !name || !gender) {
    return res.status(400).json({
      message: "Paramètres manquants : city, age, name et gender sont requis.",
    });
  }

  // Mettre à jour les informations de l'utilisateur sans toucher à la photo
  db.run(
    `UPDATE users SET city = ?, age = ?, name = ?, gender = ? WHERE id = ?`,
    [city, age, name, gender, userId],
    function (err) {
      if (err) {
        return res.status(500).json({
          message: "Erreur lors de la mise à jour de l'utilisateur.",
          error: err,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      res.json({ message: "Utilisateur mis à jour avec succès." });
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
 *         routerlication/json:
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
 *           routerlication/json:
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
 *           routerlication/json:
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
 *           routerlication/json:
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
router.post("/:userId/like", (req, res) => {
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
router.get("/:userId/likes", (req, res) => {
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
router.get("/:userId/smashorpass", (req, res) => {
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

module.exports = router;
