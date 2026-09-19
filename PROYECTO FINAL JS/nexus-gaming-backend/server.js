/* ==========================================================================
   server.js — API REST de NEXUS GAMING (Node.js + Express)
   --------------------------------------------------------------------------
   Reemplaza al backend anterior en Spring Boot. Expone los endpoints que
   consume la aplicación Angular mediante HttpClient:

     GET    /api/juegos
     GET    /api/juegos/:id
     GET    /api/tickets
     POST   /api/tickets
     PATCH  /api/tickets/:id/resolver
     DELETE /api/tickets/:id
     GET    /api/historial
     POST   /api/historial

   Ejecutar con:  npm install  &&  npm run dev
   Por defecto corre en http://localhost:3000
   ========================================================================== */

const express = require("express");
const cors = require("cors");

const juegosRoutes = require("./routes/juegos.routes");
const ticketsRoutes = require("./routes/tickets.routes");
const historialRoutes = require("./routes/historial.routes");

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Log simple de cada petición (útil para sustentar el proyecto)
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleTimeString()} — ${req.method} ${req.url}`);
    next();
});

app.use("/api/juegos", juegosRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/historial", historialRoutes);

app.get("/", (req, res) => {
    res.json({ mensaje: "API de NEXUS GAMING activa", version: "1.0.0" });
});

app.use((req, res) => {
    res.status(404).json({ mensaje: "Ruta no encontrada" });
});

app.listen(PUERTO, () => {
    console.log(`🚀 NEXUS GAMING API escuchando en http://localhost:${PUERTO}`);
});
