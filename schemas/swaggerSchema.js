module.exports = {
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "L'ID unique de l'utilisateur",
          },
          name: {
            type: "string",
            description: "Le nom de l'utilisateur",
          },
          city: {
            type: "string",
            description: "La ville de l'utilisateur",
          },
          age: {
            type: "integer",
            description: "L'âge de l'utilisateur",
          },
          gender: {
            type: "string",
            description: "Le genre de l'utilisateur",
          },
          photo: {
            type: "string",
            description: "URL de la photo de l'utilisateur",
          },
          description: {
            type: "string",
            description: "Description de l'utilisateur",
          },
        },
        required: ["name", "city", "age", "gender"],
      },
      Message: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "L'ID de l'utilisateur qui envoie le message",
          },
          recipientId: {
            type: "string",
            description: "L'ID de l'utilisateur qui reçoit le message",
          },
          message: {
            type: "string",
            description: "Le contenu du message",
          },
        },
        required: ["userId", "recipientId", "message"],
      },
      Like: {
        type: "object",
        properties: {
          userIdLiked: {
            type: "string",
            description: "L'ID de l'utilisateur qui est liké ou disliké",
          },
          liked: {
            type: "integer",
            description: "1 pour like, 0 pour dislike",
          },
        },
        required: ["userIdLiked", "liked"],
      },
    },
  },
};
