const express = require("express");
const router = express.Router();
const db = require("../models/database");

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
router.post("/send", (req, res) => {
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

module.exports = router;
