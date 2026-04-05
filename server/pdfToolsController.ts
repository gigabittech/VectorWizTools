import { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import axios from "axios";
import CloudConvert from "cloudconvert";
import { PDFDocument, PDFName, PDFDict, PDFStream, PDFArray } from "pdf-lib";
import libre from "libreoffice-convert";
import { promisify } from "util";

const convertAsync = promisify(libre.convert);

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

export const upload = multer({ 
    dest: "uploads/",
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

export class PdfToolsController {
    
    private async convertWithCloudConvert(filePath: string, originalName: string, inputFormat: string, outputFormat: string, res: any) {
        const mimeTypes: Record<string, string> = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'epub': 'application/epub+zip',
            'mobi': 'application/x-mobipocket-ebook',
            'azw3': 'application/vnd.amazon.ebook'
        };

        const convertedFileName = `converted_${originalName.replace(/\.[^/.]+$/, '')}.${outputFormat}`;

        try {
            if (!process.env.CLOUDCONVERT_API_KEY) {
                throw new Error("CloudConvert API Key is missing in .env");
            }
            const cc = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

            const job = await cc.jobs.create({
                tasks: {
                    "import-my-file": {
                        operation: "import/upload"
                    },
                    "convert-my-file": {
                        operation: "convert",
                        input: "import-my-file",
                        input_format: inputFormat as any,
                        output_format: outputFormat,
                    },
                    "export-my-file": {
                        operation: "export/url",
                        input: "convert-my-file"
                    }
                }
            });

            const uploadTask = job.tasks.find((task: any) => task.name === "import-my-file");
            if (!uploadTask) throw new Error("Import task not found");

            const uploadStream = fs.createReadStream(filePath);
            await cc.tasks.upload(uploadTask, uploadStream, originalName);

            const finishedJob = await cc.jobs.wait(job.id);

            if (finishedJob.status === 'error') {
                const errorTask = finishedJob.tasks.find((t: any) => t.status === 'error');
                throw new Error(errorTask?.message || "CloudConvert Job Failed");
            }

            const exportTask = finishedJob.tasks.find((task: any) => task.name === "export-my-file");
            const fileUrl = exportTask?.result?.files?.[0]?.url;

            if (!fileUrl) {
                throw new Error("No output file URL found in CloudConvert response");
            }

            const downloadResponse = await axios.get(fileUrl, { responseType: 'stream' });

            res.setHeader("Content-Type", mimeTypes[outputFormat] || "application/octet-stream");
            res.setHeader("Content-Disposition", `attachment; filename=${convertedFileName}`);

            return downloadResponse.data.pipe(res);
        } catch (ccError: any) {
            console.warn(`CloudConvert failed (${ccError.message}), attempting local LibreOffice fallback...`);
            
            try {
                const fileBuffer = await fs.promises.readFile(filePath);
                // The third argument is a filter, which is undefined for most simple cases
                const resultBuffer = await convertAsync(fileBuffer, `.${outputFormat}`, undefined);
                
                res.setHeader("Content-Type", mimeTypes[outputFormat] || "application/octet-stream");
                res.setHeader("Content-Disposition", `attachment; filename=${convertedFileName}`);
                return res.send(resultBuffer);
            } catch (fallbackError: any) {
                console.error("Local fallback also failed:", fallbackError);
                throw new Error(`Conversion failed. CloudConvert error: ${ccError.message}. Local fallback error: ${fallbackError.message}`);
            }
        }
    }

    convertPdfToPptx = async (req: any, res: any) => {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const originalName = req.file.originalname || "document.pdf";

            await this.convertWithCloudConvert(filePath as string, originalName, 'pdf', 'pptx', res);
        } catch (error: any) {
            console.error("PDF to PPTX conversion error:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Conversion failed",
                    message: error.message,
                });
            }
        } finally {
            if (filePath) {
                try { await fs.promises.unlink(filePath); } catch (e) { console.error("Failed to delete temp file:", e); }
            }
        }
    }

    convertPdfToWord = async (req: any, res: any) => {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const originalName = req.file.originalname || "document.pdf";

            await this.convertWithCloudConvert(filePath as string, originalName, 'pdf', 'docx', res);
        } catch (error: any) {
            console.error("PDF to Word conversion error:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Conversion failed",
                    message: error.message,
                });
            }
        } finally {
            if (filePath) {
                try { await fs.promises.unlink(filePath); } catch (e) { console.error("Failed to delete temp file:", e); }
            }
        }
    }

    convertWordToPdf = async (req: any, res: any) => {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const originalName = req.file.originalname || "document.docx";

            await this.convertWithCloudConvert(filePath as string, originalName, 'docx', 'pdf', res);
        } catch (error: any) {
            console.error("Word to PDF conversion error:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Conversion failed",
                    message: error.message,
                });
            }
        } finally {
            if (filePath) {
                try { await fs.promises.unlink(filePath); } catch (e) { console.error("Failed to delete temp file:", e); }
            }
        }
    }

    convertPptxToPdf = async (req: any, res: any) => {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const originalName = req.file.originalname || "document.pptx";

            await this.convertWithCloudConvert(filePath as string, originalName, 'pptx', 'pdf', res);
        } catch (error: any) {
            console.error("PPTX to PDF conversion error:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Conversion failed",
                    message: error.message,
                });
            }
        } finally {
            if (filePath) {
                try { await fs.promises.unlink(filePath); } catch (e) { console.error("Failed to delete temp file:", e); }
            }
        }
    }

    removeWatermark = async (req: any, res: any) => {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const dataBuffer = await fs.promises.readFile(filePath as string);

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
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Failed to remove watermark",
                    message: error.message,
                });
            }
        } finally {
            if (filePath) {
                try {
                    await fs.promises.unlink(filePath);
                } catch (e) {
                    console.error("Failed to delete temp file:", e);
                }
            }
        }
    }

    convertMobiToPdf = async (req: any, res: any) => {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const originalName = req.file.originalname || "document.mobi";

            await this.convertWithCloudConvert(filePath as string, originalName, 'mobi', 'pdf', res);
        } catch (error: any) {
            console.error("MOBI to PDF conversion error:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Conversion failed",
                    message: error.message,
                });
            }
        } finally {
            if (filePath) {
                try { await fs.promises.unlink(filePath); } catch (e) { console.error("Failed to delete temp file:", e); }
            }
        }
    }

    convertPdfToMobi = async (req: any, res: any) => {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const originalName = req.file.originalname || "document.pdf";

            await this.convertWithCloudConvert(filePath as string, originalName, 'pdf', 'mobi', res);
        } catch (error: any) {
            console.error("PDF to MOBI conversion error:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Conversion failed",
                    message: error.message,
                });
            }
        } finally {
            if (filePath) {
                try { await fs.promises.unlink(filePath); } catch (e) { console.error("Failed to delete temp file:", e); }
            }
        }
    }
}

export const pdfToolsController = new PdfToolsController();
