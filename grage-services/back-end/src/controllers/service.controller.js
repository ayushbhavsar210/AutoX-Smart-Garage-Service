import Service from "../models/Service.model.js";

export const createService = async (req, res) =>
  res.json(await Service.create(req.body));

export const getServices = async (_, res) =>
  res.json(await Service.find());