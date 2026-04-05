import { Request, Response } from "express";
import CloudConvert from "cloudconvert";
import fs from "fs";
import path from "path";
import axios from "axios";
import { promisify } from "util";
import { createRequire } from "module";
import sharp from "sharp";
import libre from "libreoffice-convert";

const convertAsync = promisify(libre.convert);

const require = createRequire(import.meta.url);

// Async file cleanup helper — never blocks the event loop
async function cleanupFile(filePath?: string) {
    if (filePath) {
        try { await fs.promises.unlink(filePath); } catch (_) { /* already deleted or inaccessible */ }
    }
}

// MIME type lookup for common output formats
const MIME_TYPES: Record<string, string> = {
    'pdf': 'application/pdf',
    'epub': 'application/epub+zip',
    'mobi': 'application/x-mobipocket-ebook',
    'azw3': 'application/vnd.amazon.ebook',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'tiff': 'image/tiff',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
};

function getMimeType(format: string): string {
    return MIME_TYPES[format] || 'application/octet-stream';
}

export class CloudConvertController {
    private getClient = () => {
        if (!process.env.CLOUDCONVERT_API_KEY) {
            throw new Error("CloudConvert API Key is missing in .env");
        }
        return new CloudConvert(process.env.CLOUDCONVERT_API_KEY);
    }

    /**
     * Generic CloudConvert job orchestration — eliminates 200+ lines of duplication.
     * Handles: create job → upload → wait → download → stream response.
     */
    private async executeCloudConvertJob(
        filePath: string,
        originalName: string,
        inputFormat: string,
        outputFormat: string,
        res: Response,
        extraTaskOptions: Record<string, any> = {}
    ): Promise<boolean> {
        const cc = this.getClient();

        const job = await cc.jobs.create({
            tasks: {
                "import-my-file": { operation: "import/upload" },
                "convert-my-file": {
                    operation: "convert",
                    input: "import-my-file",
                    input_format: inputFormat as any,
                    output_format: outputFormat,
                    ...extraTaskOptions,
                },
                "export-my-file": { operation: "export/url", input: "convert-my-file" }
            }
        });

        const uploadTask = job.tasks.find(task => task.name === "import-my-file");
        if (!uploadTask) throw new Error("Import task not found");

        const uploadStream = fs.createReadStream(filePath);
        await cc.tasks.upload(uploadTask, uploadStream, originalName);

        console.log(`Waiting for CloudConvert ${inputFormat.toUpperCase()} → ${outputFormat.toUpperCase()} job...`);
        const finishedJob = await cc.jobs.wait(job.id);

        // Log errors for debugging
        finishedJob.tasks.forEach(task => {
            if (task.status === 'error') {
                console.error(`CloudConvert Task ${task.name} Error: ${task.message}`);
            }
        });

        if (finishedJob.status === 'error') {
            const errorTask = finishedJob.tasks.find(t => t.status === 'error');
            throw new Error(errorTask?.message || "CloudConvert Job Failed");
        }

        const exportTask = finishedJob.tasks.find(task => task.name === "export-my-file");
        const fileUrl = exportTask?.result?.files?.[0]?.url;

        if (!fileUrl) {
            throw new Error("No output file URL found in CloudConvert response");
        }

        console.log(`CloudConvert successful, streaming result...`);
        const downloadResponse = await axios.get(fileUrl, { responseType: 'stream' });

        res.setHeader("Content-Type", getMimeType(outputFormat));
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${originalName.replace(/\.[^/.]+$/, '')}.${outputFormat}`
        );
        downloadResponse.data.pipe(res);
        return true;
    }

    /**
     * Attempt LibreOffice local fallback conversion.
     */
    private async libreOfficeFallback(
        filePath: string,
        originalName: string,
        outputFormat: string,
        res: Response
    ): Promise<void> {
        const fileBuffer = await fs.promises.readFile(filePath);
        const resultBuffer = await convertAsync(fileBuffer, `.${outputFormat}`, undefined);

        res.setHeader("Content-Type", getMimeType(outputFormat));
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${originalName.replace(/\.[^/.]+$/, '')}.${outputFormat}`
        );
        res.send(resultBuffer);
    }

    // --- Public route handlers ---

    convertVsdxToJpg = async (req: Request, res: Response) => {
        let filePath: string | undefined;
        let originalName = "document.vsdx";
        let outputFormat = "jpg";

        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            originalName = req.file.originalname;
            outputFormat = req.body.format || "jpg";
            const inputFormat = originalName.split('.').pop()?.toLowerCase() || 'vsdx';

            console.log(`Starting conversion: ${originalName} (${inputFormat}) to ${outputFormat}`);

            try {
                await this.executeCloudConvertJob(filePath, originalName, inputFormat, outputFormat, res, {
                    engine: "office"
                });
            } catch (ccError: any) {
                console.warn(`CloudConvert failed (${ccError.message}), attempting local LibreOffice fallback...`);
                await this.libreOfficeFallback(filePath, originalName, outputFormat, res);
            }
        } catch (error: any) {
            console.error("VSDX conversion error:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Conversion failed",
                    message: error.message || "An unexpected error occurred during conversion",
                });
            }
        } finally {
            await cleanupFile(filePath);
        }
    }

    convertEbook = async (req: Request, res: Response, inputFormat: string, outputFormat: string) => {
        let filePath: string | undefined;
        let originalName = `document.${inputFormat}`;

        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            originalName = req.file.originalname;

            console.log(`Starting conversion: ${originalName} (${inputFormat}) to ${outputFormat} via CloudConvert`);

            try {
                await this.executeCloudConvertJob(filePath, originalName, inputFormat, outputFormat, res);
            } catch (ccError: any) {
                console.warn(`CloudConvert failed (${ccError.message}), attempting local LibreOffice fallback...`);
                await this.libreOfficeFallback(filePath, originalName, outputFormat, res);
            }
        } catch (error: any) {
            console.error(`Ebook conversion error (${inputFormat} → ${outputFormat}):`, error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Conversion failed",
                    message: error.message || "An unexpected error occurred during conversion",
                });
            }
        } finally {
            await cleanupFile(filePath);
        }
    }

    convertEpubToPdf = async (req: Request, res: Response) => {
        return this.convertEbook(req, res, "epub", "pdf");
    }

    convertPdfToEpub = async (req: Request, res: Response) => {
        return this.convertEbook(req, res, "pdf", "epub");
    }

    convertMobiToPdf = async (req: Request, res: Response) => {
        return this.convertEbook(req, res, "mobi", "pdf");
    }

    convertPdfToMobi = async (req: Request, res: Response) => {
        return this.convertEbook(req, res, "pdf", "mobi");
    }

    convertAzw3ToPdf = async (req: Request, res: Response) => {
        return this.convertEbook(req, res, "azw3", "pdf");
    }

    convertPdfToAzw3 = async (req: Request, res: Response) => {
        return this.convertEbook(req, res, "pdf", "azw3");
    }

    convertJpgToVsdx = async (req: Request, res: Response) => {
        return res.status(400).json({
            error: "Not supported",
            message: "Converting images to VSDX is not supported. Visio files can be converted to images, but not the other way around."
        });
    }

    convertOutlookToPdf = async (req: Request, res: Response) => {
        let filePath: string | undefined;
        let originalName = "document.msg";

        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            originalName = req.file.originalname;
            const inputFormat = originalName.split('.').pop()?.toLowerCase() || 'msg';

            console.log(`Starting Outlook conversion: ${originalName} to PDF`);

            try {
                await this.executeCloudConvertJob(filePath, originalName, inputFormat, "pdf", res);
            } catch (ccError: any) {
                console.warn(`CloudConvert failed (${ccError.message}), attempting local LibreOffice fallback...`);
                await this.libreOfficeFallback(filePath, originalName, "pdf", res);
            }
        } catch (error: any) {
            console.error("Outlook conversion error:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Conversion failed",
                    message: error.message || "An unexpected error occurred during conversion",
                });
            }
        } finally {
            await cleanupFile(filePath);
        }
    }

    convertImage = async (req: Request, res: Response) => {
        let filePath: string | undefined;
        let originalName = "image.tiff";
        let outputFormat = "jpg";
        let quality: string | undefined;

        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            originalName = req.file.originalname;
            outputFormat = req.body.format || "jpg";
            quality = req.body.quality;
            const inputFormat = originalName.split('.').pop()?.toLowerCase() || 'tiff';

            console.log(`Starting Image conversion: ${originalName} (${inputFormat}) to ${outputFormat} with quality ${quality || 'default'}`);

            try {
                await this.executeCloudConvertJob(filePath, originalName, inputFormat, outputFormat, res, {
                    ...(quality ? { quality: parseInt(quality) } : {})
                });
            } catch (ccError: any) {
                console.warn(`CloudConvert failed (${ccError.message}), attempting local Sharp fallback...`);
                // Sharp-based local fallback for images
                const fileBuffer = await fs.promises.readFile(filePath);
                let sharpInstance = sharp(fileBuffer);
                const outFormat = outputFormat === 'jpg' ? 'jpeg' : outputFormat;
                if (outFormat === 'jpeg') {
                    sharpInstance = sharpInstance.jpeg({ quality: quality ? parseInt(quality) : 100 });
                } else if (outFormat === 'png') {
                    sharpInstance = sharpInstance.png();
                } else if (outFormat === 'webp') {
                    sharpInstance = sharpInstance.webp({ quality: quality ? parseInt(quality) : 100 });
                }
                const resultBuffer = await sharpInstance.toBuffer();
                res.setHeader("Content-Type", getMimeType(outputFormat));
                res.setHeader("Content-Disposition", `attachment; filename=${originalName.replace(/\.[^/.]+$/, '')}.${outputFormat}`);
                res.send(resultBuffer);
            }
        } catch (error: any) {
            console.error("Image conversion error:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Conversion failed",
                    message: error.message || "An unexpected error occurred during conversion",
                });
            }
        } finally {
            await cleanupFile(filePath);
        }
    }
}

export const cloudConvertController = new CloudConvertController();
