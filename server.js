const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./utils/swagger"); // Import de la configuration Swagger

const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/users", userRoutes);
app.use("/messages", messageRoutes);

// Documentation Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs)); // Utilisation de Swagger

// Lancer le serveur
const port = 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(
    `Serveur en cours d'exécution sur le port ${port}. Accédez à la documentation Swagger sur http://localhost:${port}/api-docs`
  );
});
