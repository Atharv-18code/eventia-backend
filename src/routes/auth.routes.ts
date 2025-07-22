import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { checkUserSchema, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "../validations/auth.validation";

const authRouter = Router();

authRouter.post("/check-user", validate(checkUserSchema), AuthController.checkExistingUser);
authRouter.post("/register", validate(registerSchema), AuthController.register);
authRouter.post("/login", validate(loginSchema), AuthController.login);
authRouter.post("/logout", authenticate, AuthController.logout);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), AuthController.forgotPassword);
authRouter.post("/reset-password", validate(resetPasswordSchema), AuthController.resetPassword);

export default authRouter;
