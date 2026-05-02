import Booking from "../models/Booking.model.js";
import Service from "../models/Service.model.js";

export const createBooking = async (req, res) => {
  const service = await Service.findById(req.body.serviceId);
  const booking = await Booking.create({
    userId: req.user._id,
    service: {
      serviceId: service._id,
      name: service.name,
      price: service.price
    },
    ...req.body
  });
  res.json(booking);
};

export const myBookings = async (req, res) =>
  res.json(await Booking.find({ userId: req.user._id }));

export const allBookings = async (_, res) =>
  res.json(await Booking.find().populate("userId"));