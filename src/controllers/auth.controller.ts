import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import logger from "../config/logger.config";
import { ApiResponse } from "../../types";

const AuthController = {
    /**
     * Registers a new user.
     * @param req - Request containing the user's name, email, password, and role
     * @param res - Response to send the result
     * @returns Response with success or error
     */
    checkExistingUser: async (req: Request, res: Response): Promise<any> => {
        try {
            const { email } = req.body;
            const result = await AuthService.checkExistingUser(email);

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: !result.error,
                data: null,
                message: result.error ? "" : "User does not exist",
                error: result.error || "",
            };

            if (result.error) {
                logger.error(result.error);
                return res.status(400).json(response);
            }

            logger.info("Existing user check successful.");
            res.status(200).json(response);
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };

            res.status(500).json(response);
        }
    },

    /**
     * Registers a new user.
     * @param req - Request containing the user's name, email, password, and role
     * @param res - Response to send the result
     * @returns Response with success or error
     */
    register: async (req: Request, res: Response): Promise<any> => {
        try {
            const { name, email, password, role, preferences } = req.body;
            const result = await AuthService.register(name, email, password, role, preferences);

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: !result.error,
                data: null,
                message: result.error ? "" : "User registered successfully",
                error: result.error || "",
            };

            if (result.error) {
                logger.error(result.error);
                return res.status(400).json(response);
            }

            logger.info("User registered successfully");
            res.status(201).json(response);
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };

            res.status(500).json(response);
        }
    },

    /**
     * Authenticates a user and returns a JWT token.
     * @param req - Request containing the user's email and password
     * @param res - Response to send the token or error
     * @returns Response with token or error
     */
    login: async (req: Request, res: Response): Promise<any> => {
        try {
            const { email, password } = req.body;
            const { loggedInUser, token, error } = await AuthService.login(email, password);

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: !error,
                data: null,
                message: error ? "" : "Login successful",
                error: error || "",
            };

            if (error) {
                logger.error(error);
                return res.status(401).json(response);
            }

            logger.info("Login successful");
            res
                .status(200)
                .json({ ...response, data: { user: loggedInUser, token } });
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };

            res.status(500).json(response);
        }
    },

    /**
     * Logs out a user by deleting the refresh token.
     * @param req - Request containing the user's ID
     * @param res - Response to send the result
     * @returns Response with success or error
     */
    logout: async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                const response: ApiResponse<null> = {
                    timestamp: Date.now(),
                    success: false,
                    data: null,
                    message: "",
                    error: "User ID not found in request",
                };
                return res.status(400).json(response);
            }

            const { success, error } = await AuthService.logout(userId);

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success,
                data: null,
                message: success ? "Logged out successfully" : "",
                error: error || "",
            };

            if (!success) {
                logger.error(error || "Failed to log out");
                return res.status(500).json(response);
            }

            logger.info("Logged out successfully");
            res
                .status(200)
                .json(response);
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };

            res.status(500).json(response);
        }
    },

    /**
 * Handles forgot password requests.
 * @param req - Request containing the user's email
 * @param res - Response to send the result
 * @returns Response with success or error
 */
    forgotPassword: async (req: Request, res: Response): Promise<any> => {
        try {
            const { email } = req.body;
            const { success, error } = await AuthService.forgotPassword(email);

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: !!success,
                data: null,
                message: success ? "Password reset email sent" : "",
                error: error || "",
            };

            if (error) {
                logger.error(error);
                return res.status(400).json(response);
            }

            logger.info("Password reset email sent. Please check your email.");
            res.status(200).json(response);
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };

            res.status(500).json(response);
        }
    },

    /**
     * Handles password reset requests.
     * @param req - Request containing the reset token and new password
     * @param res - Response to send the result
     * @returns Response with success or error
     */
    resetPassword: async (req: Request, res: Response): Promise<any> => {
        try {
            const { token, newPassword } = req.body;
            const { success, error } = await AuthService.resetPassword(token, newPassword);

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: !!success,
                data: null,
                message: success ? "Password reset successfully" : "",
                error: error || "",
            };

            if (error) {
                logger.error(error);
                return res.status(400).json(response);
            }

            logger.info("Password reset successfully");
            res.status(200).json(response);
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };

            res.status(500).json(response);
        }
    },
};

export default AuthController;
