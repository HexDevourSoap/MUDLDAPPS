const express = require("express");
const {
    getReservations,
    getReservationById,
    getReservationsByRequestId,
    createReservation,
    updateReservation,
    deleteReservation,
    getApprovedReservations } = require("../services/reservationService");

const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware");

router.get("/reservations", authenticateUser, async (req, res) => {
    try {
        const reservations = await getReservations();
        res.json(reservations);
    } catch (error) {
        console.error("Error fetching reservations:", error);
        res.status(500).json({ message: "Error fetching reservations" });
    }
});

router.get("/reservations/:id", authenticateUser, async (req, res) => {
    try {
        const reservation = await getReservationById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        res.json(reservation);
    } catch (error) {
        console.error("Error fetching reservation:", error);
        res.status(500).json({ message: "Error fetching reservation" });
    }
});

router.get("/reservations/request/:id", authenticateUser, async (req, res) => {
    try {
        const reservations = await getReservationsByRequestId(req.params.id);
        if (!reservations) {
            return res.status(404).json({ message: "Reservations not found" });
        }
        res.json(reservations);
    } catch (error) {
        console.error("Error fetching reservations:", error);
        res.status(500).json({ message: "Error fetching reservations" });
    }
});

router.post("/reservations", authenticateUser, authorizeRole(["lietotājs"]), async (req, res) => {
    try {
        const { computer_id, request_id, from_time, to_time } = req.body;
        const newReservation = await createReservation({ computer_id, request_id, from_time, to_time });
        res.status(201).json(newReservation);
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).json({ message: "Error creating reservation" });
    }
});

router.put("/reservations/:id", authenticateUser, authorizeRole(["pārvaldnieks","laborants"]), async (req, res) => {
    try {
        const { from_time, to_time } = req.body;
        await updateReservation(req.params.id, { from_time, to_time });
        res.json({ message: "Reservation updated successfully" });
    } catch (error) {
        console.error("Error updating reservation:", error);
        res.status(500).json({ message: "Error updating reservation" });
    }
});

router.delete("/reservations/:id", authenticateUser, authorizeRole(["pārvaldnieks","laborants"]), async (req, res) => {
    try {
        await deleteReservation(req.params.id);
        res.json({ message: "Reservation deleted successfully" });
    } catch (error) {
        console.error("Error deleting reservation:", error);
        res.status(500).json({ message: "Error deleting reservation" });
    }
});

router.get('/report-reservations', /* authenticateUser, authorizeRole(["pārvaldnieks"]), */ async (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ message: 'Missing start or end date' });
    }
    try {
        const rows = await getApprovedReservations(start, end);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching report reservations:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;