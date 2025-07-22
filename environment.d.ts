declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SERVER_PORT?: string;
      NODE_ENV: 'development' | 'production';
      JWT_SECRET?: string;
      COOKIE_EXPIRATION: string;
      DATABASE_URL: string;
      EMAIL_USER: string;
      EMAIL_PASSWORD: string;
      BASE_URL: string;
      CLIENT_ORIGIN: string;
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;
      GEOCODING_API_KEY: string;
      GEOCODING_API_URL: string;
    }
  }

  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export { }