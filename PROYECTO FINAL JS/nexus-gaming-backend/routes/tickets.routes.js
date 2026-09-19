/* ==========================================================================
   /api/tickets — Tickets del centro de soporte
   ========================================================================== */

const express = require("express");
const router = express.Router();
const { leerDB, guardarDB } = require("../data/db");

// GET /api/tickets -> todos los tickets (usado por el panel de administrador)
router.get("/", (req, res) => {
    const db = leerDB();
    res.json(db.tickets);
});

// POST /api/tickets -> crear un ticket nuevo (formulario de Soporte)
router.post("/", (req, res) => {
    const { asunto, mensaje } = req.body;

    if (!asunto || !mensaje) {
        return res.status(400).json({ mensaje: "Asunto y mensaje son obligatorios." });
    }

    const db = leerDB();
    const nuevoTicket = {
        id: Date.now(),
        asunto,
        mensaje,
        fecha: new Date().toLocaleDateString("es-PE"),
        resuelto: false
    };

    db.tickets.unshift(nuevoTicket);
    guardarDB(db);

    res.status(201).json(nuevoTicket);
});

// PATCH /api/tickets/:id/resolver -> marcar un ticket como resuelto
router.patch("/:id/resolver", (req, res) => {
    const db = leerDB();
    const ticket = db.tickets.find(t => t.id === Number(req.params.id));

    if (!ticket) {
        return res.status(404).json({ mensaje: "Ticket no encontrado" });
    }

    ticket.resuelto = true;
    guardarDB(db);

    res.json(ticket);
});

// DELETE /api/tickets/:id -> eliminar un ticket
router.delete("/:id", (req, res) => {
    const db = leerDB();
    db.tickets = db.tickets.filter(t => t.id !== Number(req.params.id));
    guardarDB(db);

    res.status(204).send();
});

module.exports = router;
