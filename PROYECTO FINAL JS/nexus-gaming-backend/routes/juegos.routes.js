/* ==========================================================================
   /api/juegos — Catálogo de videojuegos (solo lectura desde el frontend)
   ========================================================================== */

const express = require("express");
const router = express.Router();
const { leerDB } = require("../data/db");

// GET /api/juegos  -> lista completa del catálogo
router.get("/", (req, res) => {
    const db = leerDB();
    res.json(db.juegos);
});

// GET /api/juegos/:id -> un juego puntual
router.get("/:id", (req, res) => {
    const db = leerDB();
    const juego = db.juegos.find(j => j.id === Number(req.params.id));

    if (!juego) {
        return res.status(404).json({ mensaje: "Juego no encontrado" });
    }

    res.json(juego);
});

module.exports = router;
