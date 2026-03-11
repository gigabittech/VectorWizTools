import { Request, Response } from "express";
import CloudConvert from "cloudconvert";
import fs from "fs";
import path from "path";
import axios from "axios";
import { promisify } from "util";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const libre = require("libreoffice-convert");
const libreConvertAsync = promisify(libre.convert);

console.log("CloudConvertController V3 Loaded with LibreOffice Fallback");

export class CloudConvertController {
    private getClient = () => {
        if (!process.env.CLOUDCONVERT_API_KEY) {
            throw new Error("CloudConvert API Key is missing in .env");
        }
        return new CloudConvert(process.env.CLOUDCONVERT_API_KEY);
    }

    convertVsdxToJpg = async (req: Request, res: Response) => {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const originalName = req.file.originalname;
            const outputFormat = req.body.format || "jpg";
            const inputFormat = originalName.split('.').pop()?.toLowerCase() || 'vsdx';

            console.log(`Starting conversion: ${originalName} (${inputFormat}) to ${outputFormat}`);

            // Option 1: Try CloudConvert if API key is present
            if (process.env.CLOUDCONVERT_API_KEY) {
                try {
                    console.log("Attempting CloudConvert...");
                    const cc = this.getClient();

                    // 1. Create a CloudConvert job
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
                                engine: "office", // Prefer office engine for VSDX
                            },
                            "export-my-file": {
                                operation: "export/url",
                                input: "convert-my-file"
                            }
                        }
                    });

                    // 2. Upload the file
                    const uploadTask = job.tasks.find(task => task.name === "import-my-file");
                    if (!uploadTask) throw new Error("Import task not found");

                    const uploadStream = fs.createReadStream(filePath);
                    await cc.tasks.upload(uploadTask, uploadStream, originalName);

                    // 3. Wait for the job to complete
                    console.log("Waiting for CloudConvert job...");
                    const finishedJob = await cc.jobs.wait(job.id);

                    // Log task results
                    finishedJob.tasks.forEach(task => {
                        if (task.status === 'error') {
                            console.error(`CloudConvert Task ${task.name} Error: ${task.message}`);
                        }
                    });

                    if (finishedJob.status === 'error') {
                        const errorTask = finishedJob.tasks.find(t => t.status === 'error');
                        throw new Error(errorTask?.message || "CloudConvert Job Failed");
                    }

                    // 4. Get the output file URL
                    const exportTask = finishedJob.tasks.find(task => task.name === "export-my-file");
                    const fileUrl = exportTask?.result?.files?.[0]?.url;

                    if (fileUrl) {
                        console.log("CloudConvert Successful, downloading result...");
                        const downloadResponse = await axios.get(fileUrl, { responseType: 'stream' });

                        const mimeType = outputFormat === 'pdf' ? 'application/pdf' : `image/${outputFormat === 'jpg' ? 'jpeg' : outputFormat}`;
                        res.setHeader("Content-Type", mimeType);
                        res.setHeader(
                            "Content-Disposition",
                            `attachment; filename=${originalName.replace(/\.[^/.]+$/, '')}.${outputFormat}`
                        );

                        return downloadResponse.data.pipe(res);
                    }
                } catch (ccError: any) {
                    console.warn("CloudConvert failed, falling back to local conversion:", ccError.message);
                }
            }

            // Option 2: Fallback to LibreOffice (Local)
            console.log("Attempting local LibreOffice conversion...");
            const dataBuffer = fs.readFileSync(filePath);

            // Format mapping for LibreOffice
            let targetExt = `.${outputFormat}`;
            if (outputFormat === 'jpg') targetExt = '.jpg';

            const convertedBuffer = await libreConvertAsync(dataBuffer, targetExt, undefined);

            const mimeType = outputFormat === 'pdf' ? 'application/pdf' : `image/${outputFormat === 'jpg' ? 'jpeg' : outputFormat}`;
            res.setHeader("Content-Type", mimeType);
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${originalName.replace(/\.[^/.]+$/, '')}.${outputFormat}`
            );

            res.send(convertedBuffer);

        } catch (error: any) {
            console.error("VSDX conversion error:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Conversion failed",
                    message: error.message || "An unexpected error occurred during conversion",
                });
            }
        } finally {
            if (filePath && fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { console.error("Failed to delete temp file:", e); }
            }
        }
    }

    convertEbook = async (req: Request, res: Response, inputFormat: string, outputFormat: string) => {
        let filePath: string | undefined;
        try {
            if (!req.file || !req.file.path) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            filePath = req.file.path;
            const originalName = req.file.originalname;

            console.log(`Starting conversion: ${originalName} (${inputFormat}) to ${outputFormat} via CloudConvert`);

            if (!process.env.CLOUDCONVERT_API_KEY) {
                throw new Error("CloudConvert API Key is missing. Cannot perform conversion.");
            }

            const cc = this.getClient();

            // 1. Create a CloudConvert job
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

            // 2. Upload the file
            const uploadTask = job.tasks.find(task => task.name === "import-my-file");
            if (!uploadTask) throw new Error("Import task not found");

            const uploadStream = fs.createReadStream(filePath);
            await cc.tasks.upload(uploadTask, uploadStream, originalName);

            // 3. Wait for the job to complete
            console.log(`Waiting for CloudConvert ${inputFormat.toUpperCase()} to ${outputFormat.toUpperCase()} job...`);
            const finishedJob = await cc.jobs.wait(job.id);

            // Log task results
            finishedJob.tasks.forEach(task => {
                if (task.status === 'error') {
                    console.error(`CloudConvert Task ${task.name} Error: ${task.message}`);
                }
            });

            if (finishedJob.status === 'error') {
                const errorTask = finishedJob.tasks.find(t => t.status === 'error');
                throw new Error(errorTask?.message || "CloudConvert Job Failed");
            }

            // 4. Get the output file URL
            const exportTask = finishedJob.tasks.find(task => task.name === "export-my-file");
            const fileUrl = exportTask?.result?.files?.[0]?.url;

            if (fileUrl) {
                console.log(`CloudConvert ${inputFormat.toUpperCase()} to ${outputFormat.toUpperCase()} Successful, downloading result...`);
                const downloadResponse = await axios.get(fileUrl, { responseType: 'stream' });

                const mimeTypes: Record<string, string> = {
                    'pdf': 'application/pdf',
                    'epub': 'application/epub+zip',
                    'mobi': 'application/x-mobipocket-ebook',
                    'azw3': 'application/vnd.amazon.ebook'
                };

                res.setHeader("Content-Type", mimeTypes[outputFormat] || "application/octet-stream");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename=${originalName.replace(/\.[^/.]+$/, '')}.${outputFormat}`
                );

                return downloadResponse.data.pipe(res);
            } else {
                throw new Error("No output file URL found in CloudConvert response");
            }

        } catch (error: any) {
            console.error(`${inputFormat.toUpperCase()} to ${outputFormat.toUpperCase()} conversion error:`, error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Conversion failed",
                    message: error.message || "An unexpected error occurred during conversion",
                });
            }
        } finally {
            if (filePath && fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { console.error("Failed to delete temp file:", e); }
            }
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
}

export const cloudConvertController = new CloudConvertController();
