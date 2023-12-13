import { Response } from "express";

export const sendErrorRes = (
  res: Response,
  message: string,
  statusCode: number
) => {
  res.status(statusCode).json({ message });
};
