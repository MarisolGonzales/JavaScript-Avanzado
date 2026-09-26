/* ==========================================================================
   /api/historial — Boletas de compra
   ========================================================================== */

const express = require("express");
const router = express.Router();
const { leerDB, guardarDB } = require("../data/db");

// GET /api/historial -> todas las boletas registradas
router.get("/", (req, res) => {
    const db = leerDB();
    res.json(db.historial);
});

// POST /api/historial -> registrar una nueva boleta (al finalizar una compra)
router.post("/", (req, res) => {
    const { items, subtotal, total, metodoPago } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ mensaje: "La boleta debe incluir al menos un juego." });
    }

    const db = leerDB();
    const ahora = new Date();

    const nuevaBoleta = {
        id: Date.now(),
        boleta: `NX-${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(db.historial.length + 1).padStart(4, "0")}`,
        fecha: ahora.toLocaleDateString("es-PE"),
        hora: ahora.toLocaleTimeString("es-PE"),
        metodoPago: metodoPago || "Tarjeta de crédito/débito",
        items,
        subtotal: subtotal ?? total,
        total
    };

    db.historial.unshift(nuevaBoleta);
    guardarDB(db);

    res.status(201).json(nuevaBoleta);
});

module.exports = router;
