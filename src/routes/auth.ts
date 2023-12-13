import { Router } from "express";
import { createNewUser } from "controllers/auth";

const authRouter = Router();

authRouter.post("/sign-up", createNewUser);

export default authRouter;
