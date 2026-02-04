const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {
  createReservation,
  listReservations,
  cancelReservation,
} = require("../controllers/reservation.controller");

const router = express.Router();

router.post("/", auth, role("STUDENT"), createReservation);
router.get("/", auth, listReservations);
router.patch("/:reservationId/cancel", auth, cancelReservation);

module.exports = router;
