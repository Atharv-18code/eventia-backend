import { Preferences, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "../config/prisma.config";
import { generateToken } from "../utils/jwt.util";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "../config/nodemailer.config";

export const AuthService = {
    /**
     * Checking an existing user.
     * @param email - User's email
     * @returns Object with error (if any)
     */
    checkExistingUser: async (
        email: string,
    ) => {
        try {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return { error: "Email already in use" };
            }

            return { error: null };
        } catch (err) {
            console.error("Error while registering user:", err);
            throw new Error("Error while registering user");
        }
    },

    /**
     * Registers a new user.
     * @param name - User's name
     * @param email - User's email
     * @param password - User's password
     * @param role - User's role
     * @returns Object with error (if any)
     */
    register: async (
        name: string,
        email: string,
        password: string,
        role: UserRole,
        preferences: Preferences
    ) => {
        try {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return { error: "Email already in use" };
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role,
                    preferences: {
                        create: preferences,
                    },
                },
            });

            return { error: null };
        } catch (err) {
            console.error("Error while registering user:", err);
            throw new Error("Error while registering user");
        }
    },

    /**
     * Authenticates a user and returns a JWT token.
     * @param email - User's email
     * @param password - User's password
     * @returns Object containing token or error
     */
    login: async (email: string, password: string) => {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
                include: { preferences: true },
            });
            if (!user) {
                return { error: "Invalid email or password", token: null };
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return { error: "Invalid email or password", token: null };
            }

            const payload = { id: user.id, role: user.role };

            const token = generateToken(payload);

            const loggedInUser = {
                name: user.name,
                email: user.email,
                role: user.role,
                preferencs: user.preferences,
            }

            return { error: null, loggedInUser, token };
        } catch (err) {
            throw new Error("Error while logging in user");
        }
    },

    /**
     * Logs out a user by deleting the refresh token.
     * @param userId - User's ID
     * @returns Object with success or error
     */
    async logout(userId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const user = await prisma.user.findFirst({
                where: { id: userId }
            });

            if (!user) {
                return { success: false, error: "User not found" };
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: "Failed to log out" };
        }
    },

    /**
     * Sends a password reset email to the user.
     * @param email - User's email
     * @returns Object with success or error
     */
    forgotPassword: async (email: string) => {
        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return { error: "User not found" };
            }

            // Generate a unique token for password reset
            const resetToken = uuidv4();
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

            // Save the token and expiry in the database
            await prisma.user.update({
                where: { id: user.id },
                data: { resetToken, resetTokenExpiry },
            });

            // Send the password reset email
            const resetLink = `${process.env.CLIENT_ORIGIN}/reset-password?token=${resetToken}`;
            const emailSubject = "Password Reset Request";
            const emailText = `Click the link to reset your password: ${resetLink}`;
            const emailHtml = `<p>Click the link to reset your password: <a href="${resetLink}">Reset Password</a></p>`;

            await sendEmail(user.email, emailSubject, emailText, emailHtml);

            return { success: true };
        } catch (err) {
            throw new Error("Error while processing forgot password request");
        }
    },

    /**
     * Resets the user's password using the reset token.
     * @param token - Password reset token
     * @param newPassword - New password
     * @returns Object with success or error
     */
    resetPassword: async (token: string, newPassword: string) => {
        try {
            const user = await prisma.user.findFirst({
                where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
            });

            if (!user) {
                return { error: "Invalid or expired token" };
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update the user's password and clear the reset token
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    resetToken: null,
                    resetTokenExpiry: null,
                },
            });

            return { success: true };
        } catch (err) {
            throw new Error("Error while resetting password");
        }
    },
};
