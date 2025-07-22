import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export type ApiResponse<T> = {
    timestamp: number;
    success: boolean;
    data: T;
    message: string;
    error: string;
};

export const validate = (schema: ZodSchema<any>) => {
    return (req: Request, res: Response, next: NextFunction): any => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessage = error.errors[0]
                    ? `${error.errors[0].message}`
                    : "Validation failed";

                const apiResponse: ApiResponse<null> = {
                    timestamp: Date.now(),
                    success: false,
                    data: null,
                    message: "Validation failed",
                    error: errorMessage,
                };
                return res.status(400).json(apiResponse);
            }

            const apiResponse: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "Invalid request data",
                error: "An unexpected error occurred",
            };
            return res.status(400).json(apiResponse);
        }
    };
};
