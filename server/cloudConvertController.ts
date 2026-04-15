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
    'vsdx': 'application/vnd.ms-visio.drawing',
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
        let filePath: string | undefined;

        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const originalName = req.file.originalname;
            const inputFormat = originalName.split('.').pop()?.toLowerCase() || 'jpg';

            const apiKey = process.env.CLOUDCONVERT_API_KEY;
            if (!apiKey) throw new Error("CloudConvert API key missing");

            const cloudConvert = new CloudConvert(apiKey);

            console.log(`Starting conversion for: ${originalName}`);

            // CloudConvert Job তৈরি (সরাসরি বা ভেক্টর হয়ে)
            // নোট: যদি সরাসরি VSDX কাজ না করে, তবে SVG ট্রাই করতে পারেন।
            const job = await cloudConvert.jobs.create({
                tasks: {
                    'upload-file': {
                        operation: 'import/upload',
                    },
                    'convert-file': {
                        operation: 'convert',
                        input: 'upload-file',
                        input_format: inputFormat,
                        output_format: 'vsdx',
                    },
                    'export-file': {
                        operation: 'export/url',
                        input: 'convert-file',
                    },
                },
            });

            // ফাইল আপলোড
            const uploadTask = job.tasks.find(t => t.name === 'upload-file');
            if (!uploadTask) throw new Error("Upload task not found");
            await cloudConvert.tasks.upload(uploadTask, fs.createReadStream(filePath), originalName);

            // জব শেষ হওয়া পর্যন্ত অপেক্ষা (SDK নিজেই পোলিং করবে)
            const finishedJob = await cloudConvert.jobs.wait(job.id);

            const exportTask = finishedJob.tasks.find(t => t.name === 'export-file' && t.status === 'finished') as any;

            if (!exportTask || !exportTask.result || !exportTask.result.files) {
                throw new Error("Conversion failed or VSDX format not supported by current engine.");
            }

            const fileInfo = exportTask.result.files[0];

            // ফাইলটি ডাউনলোড করে ক্লায়েন্টকে পাঠানো
            const downloadResponse = await axios.get(fileInfo.url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(downloadResponse.data);


            res.setHeader("Content-Type", "application/vnd.ms-visio.drawing");
            res.setHeader("Content-Disposition", `attachment; filename="${fileInfo.filename}"`);
            res.send(buffer);

            console.log("Conversion successful!");

        } catch (error: any) {
            console.error("Conversion Error:", error.message);
            res.status(500).json({ error: "Conversion failed", details: error.message });
        } finally {
            // ফাইল ডিলিট করার লজিক (cleanupFile) এখানে কল করুন
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    };

    private executeJpgToVsdxCloudConvert = async (
        filePath: string,
        originalName: string,
        inputFormat: string,
        res: Response
    ): Promise<void> => {
        const apiKey = process.env.CLOUDCONVERT_API_KEY;
        if (!apiKey) {
            throw new Error("CloudConvert API key not configured");
        }

        const fs = await import('fs');
        const path = await import('path');

        console.log("Creating CloudConvert job: JPG → PDF → VSDX");

        // Step 1: Create job with 3 tasks
        // upload → convert(jpg→pdf) → convert(pdf→vsdx) → export
        const jobPayload = {
            tasks: {
                "upload-file": {
                    operation: "import/upload"
                },
                "convert-to-pdf": {
                    operation: "convert",
                    input: "upload-file",
                    input_format: inputFormat,
                    output_format: "pdf",
                    engine: "office"
                },
                "convert-to-vsdx": {
                    operation: "convert",
                    input: "convert-to-pdf",
                    input_format: "pdf",
                    output_format: "vsdx",
                    engine: "office"
                },
                "export-file": {
                    operation: "export/url",
                    input: "convert-to-vsdx"
                }
            }
        };

        // Create job
        const jobResponse = await fetch("https://api.cloudconvert.com/v2/jobs", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(jobPayload)
        });

        if (!jobResponse.ok) {
            const errData = await jobResponse.json();
            throw new Error(`CloudConvert job creation failed: ${JSON.stringify(errData)}`);
        }

        const jobData = await jobResponse.json();
        const jobId = jobData.data.id;
        const uploadTask = jobData.data.tasks.find((t: any) => t.name === "upload-file");

        if (!uploadTask) {
            throw new Error("Upload task not found in job response");
        }

        console.log(`Job created: ${jobId}, uploading file...`);

        // Step 2: Upload the file
        const uploadUrl = uploadTask.result?.form?.url || uploadTask.result?.url;
        const uploadParams = uploadTask.result?.form?.parameters || {};

        const formData = new FormData();
        Object.entries(uploadParams).forEach(([key, value]) => {
            formData.append(key, value as string);
        });

        const fileBuffer = fs.readFileSync(filePath);
        const blob = new Blob([fileBuffer]);
        formData.append("file", blob, originalName);

        const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            body: formData
        });

        if (!uploadResponse.ok) {
            throw new Error(`File upload to CloudConvert failed: ${uploadResponse.statusText}`);
        }

        console.log("File uploaded, waiting for conversion...");

        // Step 3: Poll job status
        let exportTask: any = null;
        let attempts = 0;
        const maxAttempts = 30; // 30 * 3s = 90 seconds timeout

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3s
            attempts++;

            const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
                headers: {
                    "Authorization": `Bearer ${apiKey}`
                }
            });

            if (!statusResponse.ok) {
                throw new Error("Failed to check job status");
            }

            const statusData = await statusResponse.json();
            const job = statusData.data;

            console.log(`Job status (attempt ${attempts}): ${job.status}`);

            if (job.status === "error") {
                const failedTask = job.tasks.find((t: any) => t.status === "error");
                throw new Error(`Conversion failed: ${failedTask?.message || "Unknown error"}`);
            }

            if (job.status === "finished") {
                exportTask = job.tasks.find((t: any) => t.name === "export-file");
                break;
            }
        }

        if (!exportTask) {
            throw new Error("Conversion timed out after 90 seconds");
        }

        // Step 4: Download the converted file
        const downloadUrl = exportTask.result?.files?.[0]?.url;
        const outputFilename = exportTask.result?.files?.[0]?.filename || "converted.vsdx";

        if (!downloadUrl) {
            throw new Error("No download URL in export task result");
        }

        console.log(`Conversion complete, downloading from: ${downloadUrl}`);

        const downloadResponse = await fetch(downloadUrl);
        if (!downloadResponse.ok) {
            throw new Error(`Failed to download converted file: ${downloadResponse.statusText}`);
        }

        const fileArrayBuffer = await downloadResponse.arrayBuffer();
        const fileBufferOut = Buffer.from(fileArrayBuffer);

        // Step 5: Send file to client
        res.setHeader("Content-Type", "application/vnd.ms-visio.drawing");
        res.setHeader("Content-Disposition", `attachment; filename="${outputFilename}"`);
        res.setHeader("Content-Length", fileBufferOut.length);
        res.send(fileBufferOut);

        console.log(`Successfully sent VSDX file: ${outputFilename}`);
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
