import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const quoteUploadDir = path.join(process.cwd(), "uploads", "quote-requests");

if (!fs.existsSync(quoteUploadDir)) {
  fs.mkdirSync(quoteUploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, quoteUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const upload_quote = multer({
  storage: storage_multer,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});
