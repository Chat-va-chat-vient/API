const swaggerJsdoc = require("swagger-jsdoc");
const swaggerSchemas = require("../schemas/swaggerSchema.js"); // Importer les schémas

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chat va Chat vient API",
      version: "1.0.0",
      description: "API pour l'application de rencontre pour chats",
    },
    servers: [
      {
        url: "http://localhost:3001",
      },
    ],
    components: swaggerSchemas.components, // Inclure les schémas
  },
  apis: ["./routes/*.js"], // Chemin vers les fichiers de routes contenant les annotations
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
module.exports = swaggerDocs;
