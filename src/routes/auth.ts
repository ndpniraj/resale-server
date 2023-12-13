import { Router } from "express";
import { createNewUser } from "controllers/auth";
import validate from "src/middleware/validator";
import { newUserSchema } from "src/utils/validationSchema";

const authRouter = Router();

authRouter.post("/sign-up", validate(newUserSchema), createNewUser);

export default authRouter;
