const { successResponse } = require("../utils/response");
const {
  createReservationService,
  listReservationsService,
  cancelReservationService,
} = require("../services/reservation.service");

const createReservation = async (req, res, next) => {
  try {
    const reservation = await createReservationService(req.user.id, req.body.bookId);
    return successResponse(res, "Reservasi berhasil dibuat", reservation, 201);
  } catch (err) {
    next(err);
  }
};

const listReservations = async (req, res, next) => {
  try {
    const result = await listReservationsService(req.user, req.query);
    return successResponse(res, "Berhasil mengambil data reservasi", result);
  } catch (err) {
    next(err);
  }
};

const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await cancelReservationService(req.params.reservationId, req.user);
    return successResponse(res, "Reservasi dibatalkan", reservation);
  } catch (err) {
    next(err);
  }
};

module.exports = { createReservation, listReservations, cancelReservation };
