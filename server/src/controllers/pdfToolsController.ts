import { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { Document, Packer, Paragraph, TextRun } from "docx";
// @ts-ignore
import docxPdf from "docx-pdf";
import { promisify } from "util";
import { createRequire } from "module";
import { PDFDocument, PDFName, PDFDict, PDFStream, PDFArray } from "pdf-lib";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const docxToPdfAsync = promisify(docxPdf);

const libre = require("libreoffice-convert");
const libreConvertAsync = promisify(libre.convert);

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

export const upload = multer({ dest: "uploads/" });

export class PdfToolsController {
    async convertPdfToPptx(req: any, res: any) {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const dataBuffer = fs.readFileSync(filePath as string);

            // Convert PDF to PPTX using LibreOffice for superior structure and clear text
            const pptxBuffer = await libreConvertAsync(dataBuffer, ".pptx", undefined);

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=converted_from_pdf.pptx`
            );

            res.send(pptxBuffer);
        } catch (error: any) {
            console.error("PDF to PPTX conversion error:", error);
            res.status(500).json({
                error: "Conversion failed",
                message: error.message,
            });
        } finally {
            if (filePath && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error("Failed to delete temp file:", e);
                }
            }
        }
    }

    async convertPdfToWord(req: any, res: any) {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const dataBuffer = fs.readFileSync(filePath as string);

            // Convert PDF to DOCX using LibreOffice for better results
            const wordBuffer = await libreConvertAsync(dataBuffer, ".docx", undefined);

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=converted_from_pdf.docx`
            );

            res.send(wordBuffer);
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
                } catch (e) {
                    console.error("Failed to delete temp file:", e);
                }
            }
        }
    }

    async convertWordToPdf(req: any, res: any) {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const dataBuffer = fs.readFileSync(filePath as string);

            // Convert using libreoffice-convert for much better results
            const pdfBuffer = await libreConvertAsync(dataBuffer, ".pdf", undefined);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=converted_from_word.pdf`
            );

            res.send(pdfBuffer);
        } catch (error: any) {
            console.error("Word to PDF conversion error:", error);
            res.status(500).json({
                error: "Conversion failed",
                message: error.message,
            });
        } finally {
            if (filePath && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error("Failed to delete temp file:", e);
                }
            }
        }
    }

    async convertPptxToPdf(req: any, res: any) {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const dataBuffer = fs.readFileSync(filePath as string);

            // Convert PPTX to PDF using LibreOffice
            const pdfBuffer = await libreConvertAsync(dataBuffer, ".pdf", undefined);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=converted_from_pptx.pdf`
            );

            res.send(pdfBuffer);
        } catch (error: any) {
            console.error("PPTX to PDF conversion error:", error);
            res.status(500).json({
                error: "Conversion failed",
                message: error.message,
            });
        } finally {
            if (filePath && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error("Failed to delete temp file:", e);
                }
            }
        }
    }

    async removeWatermark(req: any, res: any) {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const dataBuffer = fs.readFileSync(filePath as string);

            // Load the PDF
            const pdfDoc = await PDFDocument.load(dataBuffer);
            const catalog = pdfDoc.catalog;

            // 1. Remove Optional Content (Layers)
            if (catalog.has(PDFName.of("OCProperties"))) {
                catalog.delete(PDFName.of("OCProperties"));
            }

            const pages = pdfDoc.getPages();
            for (const page of pages) {
                // 2. Remove Watermark Annotations
                const { node } = page as any;
                const annots = node.get(PDFName.of("Annots"));
                if (annots instanceof PDFArray) {
                    const filteredAnnots = annots.asArray().filter((annot: any) => {
                        if (!(annot instanceof PDFDict)) return true;
                        const subtype = annot.get(PDFName.of("Subtype"));
                        const subtypeStr = subtype?.toString();
                        return subtypeStr !== "/Watermark" && subtypeStr !== "/Stamp";
                    });
                    node.set(PDFName.of("Annots"), pdfDoc.context.obj(filteredAnnots));
                }

                // 3. Scan Resources for XObjects & GStates
                const resources = node.get(PDFName.of("Resources"));
                if (resources instanceof PDFDict) {
                    // Remove highly transparent GStates
                    const gStates = resources.get(PDFName.of("ExtGState"));
                    if (gStates instanceof PDFDict) {
                        for (const name of gStates.keys()) {
                            const gState = gStates.get(name);
                            if (gState instanceof PDFDict) {
                                const ca = gState.get(PDFName.of("ca"));
                                const CA = gState.get(PDFName.of("CA"));
                                // If opacity is low (common for watermarks)
                                if (
                                    (ca && (ca as any).numberValue < 0.5) ||
                                    (CA && (CA as any).numberValue < 0.5)
                                ) {
                                    gStates.delete(name);
                                }
                            }
                        }
                    }

                    const xObjects = resources.get(PDFName.of("XObject"));
                    if (xObjects instanceof PDFDict) {
                        const xObjectNames = xObjects.keys();
                        for (const name of xObjectNames) {
                            const xObject = xObjects.get(name);
                            if (xObject instanceof PDFStream) {
                                const dict = xObject.dict;
                                const subtype = dict.get(PDFName.of("Subtype"));
                                const nameStr = name.asString().toLowerCase();

                                // Heuristics for watermark detection:
                                // 1. Name contains common watermark keywords
                                const hasWatermarkName = nameStr.includes("watermark") ||
                                    nameStr.includes("stamp") ||
                                    nameStr.includes("header") ||
                                    nameStr.includes("footer") ||
                                    nameStr.includes("logo");

                                // 2. If it's a Form XObject and has a watermark-y name, remove it
                                const isForm = subtype?.toString() === "/Form";
                                if (isForm && hasWatermarkName) {
                                    xObjects.delete(name);
                                    continue;
                                }

                                // 3. Check for specific watermark Metadata or PieceInfo (common in Acrobat)
                                const pieceInfo = dict.get(PDFName.of("PieceInfo"));
                                if (pieceInfo instanceof PDFDict && pieceInfo.has(PDFName.of("ADBE_CompoundType"))) {
                                    xObjects.delete(name);
                                    continue;
                                }

                                // 4. Check for transparency in Image XObjects if they have "watermark" in name
                                const isImage = subtype?.toString() === "/Image";
                                if (isImage && hasWatermarkName) {
                                    xObjects.delete(name);
                                }
                            }
                        }
                    }
                }
            }

            const pdfBytes = await pdfDoc.save();

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=cleaned_${req.file.originalname || 'document.pdf'}`
            );

            res.send(Buffer.from(pdfBytes));
        } catch (error: any) {
            console.error("PDF watermark removal error:", error);
            res.status(500).json({
                error: "Failed to remove watermark",
                message: error.message,
            });
        } finally {
            if (filePath && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error("Failed to delete temp file:", e);
                }
            }
        }
    }
}

export const pdfToolsController = new PdfToolsController();
