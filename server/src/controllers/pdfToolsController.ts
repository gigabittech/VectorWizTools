import { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { Document, Packer, Paragraph, TextRun } from "docx";
// @ts-ignore
import docxPdf from "docx-pdf";
import { promisify } from "util";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const docxToPdfAsync = promisify(docxPdf);

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

export const upload = multer({ dest: "uploads/" });

export class PdfToolsController {
    async convertPdfToWord(req: any, res: any) {
        let filePath: string | undefined;
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const dataBuffer = fs.readFileSync(filePath as string);

            // Extract text from PDF using pdf-parse
            const pdfData = await pdf(dataBuffer);
            const text = pdfData.text;

            // Create a New DOCX Document
            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: text.split('\n').map((line: string) =>
                            new Paragraph({
                                children: [new TextRun(line)],
                            })
                        ),
                    },
                ],
            });

            // Generate buffer
            const b64string = await Packer.toBase64String(doc);
            const buffer = Buffer.from(b64string, 'base64');

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=converted.docx`
            );

            res.send(buffer);
        } catch (error: any) {
            console.error("PDF to Word conversion error:", error);
            res.status(500).json({
                error: "Conversion failed",
                message: error.message,
            });
        } finally {
            if (filePath && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (unlinkError) {
                    console.error("Failed to delete temp file:", unlinkError);
                }
            }
        }
    }

    async convertWordToPdf(req: any, res: any) {
        let filePath: string | undefined;
        let outputFilePath: string | undefined;
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            outputFilePath = path.join(uploadDir, `${Date.now()}_converted.pdf`);

            // Convert Word to PDF using docx-pdf
            await docxToPdfAsync(filePath, outputFilePath);

            const pdfBuffer = fs.readFileSync(outputFilePath);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=converted.pdf`
            );

            res.send(pdfBuffer);
        } catch (error: any) {
            console.error("Word to PDF conversion error:", error);
            res.status(500).json({
                error: "Conversion failed",
                message: error.message,
            });
        } finally {
            // Clean up files
            [filePath, outputFilePath].forEach(p => {
                if (p && fs.existsSync(p)) {
                    try {
                        fs.unlinkSync(p);
                    } catch (e) {
                        console.error("Failed to delete temp file:", e);
                    }
                }
            });
        }
    }
}

export const pdfToolsController = new PdfToolsController();
