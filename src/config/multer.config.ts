import multer from "multer";
import path from "path";
import fs from "fs";

// Define the directory for storing uploaded files
const uploadDir = path.join(__dirname, "../public/uploads");

// Check if the directory exists; if not, create it
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save files in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        // Use a unique file name (e.g., timestamp and original file name)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// Define the upload middleware using the storage configuration
export const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB file size limit
    fileFilter: (req, file, cb) => {
        // Allow only specific file types
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);

        if (extname && mimeType) {
            return cb(null, true);
        } else {
            return cb(new Error("Only image files are allowed"));
        }
    },
});
