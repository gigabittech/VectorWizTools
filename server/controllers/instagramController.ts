import { Request, Response } from "express";

// ─── Deduplicate array ────────────────────────────────────────────────────────
function dedup(arr: string[]): string[] {
    return [...new Set(arr)].filter(Boolean);
}

// ─── Deep search JSON for image URLs ─────────────────────────────────────────
function deepFind(obj: any, urls: string[] = [], depth = 0): string[] {
    if (depth > 40 || !obj || typeof obj !== "object") return urls;

    // Carousel / sidecar
    if (obj.edge_sidecar_to_children?.edges) {
        for (const edge of obj.edge_sidecar_to_children.edges) {
            const node = edge?.node;
            if (!node) continue;
            const res = node.display_resources || [];
            const best = res[res.length - 1];
            if (best?.src) urls.push(best.src);
            else if (node.display_url) urls.push(node.display_url);
        }
        if (urls.length) return urls;
    }

    // Single image node
    if (obj.display_url && !obj.edge_sidecar_to_children) {
        const res = obj.display_resources || [];
        const best = res[res.length - 1];
        if (best?.src) urls.push(best.src);
        else urls.push(obj.display_url);
        return urls;
    }

    if (Array.isArray(obj)) {
        for (const item of obj) deepFind(item, urls, depth + 1);
    } else {
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === "object") deepFind(obj[key], urls, depth + 1);
        }
    }
    return urls;
}

// ─── METHOD 1: Instagram ?__a=1 JSON endpoint ─────────────────────────────────
async function tryJsonEndpoint(shortcode: string): Promise<string[]> {
    const url = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
            "Accept": "application/json, text/plain, */*",
            "X-IG-App-ID": "936619743392459",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": "https://www.instagram.com/",
            "Origin": "https://www.instagram.com",
        },
        signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const item = data?.items?.[0];
    if (!item) throw new Error("No item in response");

    // Carousel
    if (item.carousel_media?.length) {
        return item.carousel_media
            .map((m: any) => (m.image_versions2?.candidates || [])[0]?.url)
            .filter(Boolean);
    }

    // Single image
    const url1 = (item.image_versions2?.candidates || [])[0]?.url;
    if (url1) return [url1];
    throw new Error("No image URLs found in JSON");
}

// ─── METHOD 2: Scrape HTML page ───────────────────────────────────────────────
async function tryHtmlScrape(shortcode: string): Promise<string[]> {
    const url = `https://www.instagram.com/p/${shortcode}/`;
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Upgrade-Insecure-Requests": "1",
            "Referer": "https://www.instagram.com/",
            "DNT": "1",
            "Sec-GPC": "1",
        },
        signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const found: string[] = [];

    // Try multiple JSON extraction patterns
    const jsonPatterns = [
        /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g,
        /<script[^>]*>.*?window\._sharedData\s*=\s*({[\s\S]*?});<\/script>/g,
        /<script[^>]*>.*?window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});<\/script>/g,
        /"display_url"\s*:\s*"([^"]+)"/g,
        /"src"\s*:\s*"([^"]*cdninstagram\.com[^"]*)"/g,
        /"url"\s*:\s*"([^"]*cdninstagram\.com[^"]*)"/g,
    ];

    for (const pattern of jsonPatterns) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(html)) !== null) {
            try {
                let jsonContent = m[1];
                if (jsonContent) {
                    // Clean JSON string
                    jsonContent = jsonContent.replace(/\\\//g, "/");
                    jsonContent = jsonContent.replace(/\\u0026/g, "&");
                    
                    if (jsonContent.startsWith("{") && jsonContent.endsWith("}")) {
                        const json = JSON.parse(jsonContent);
                        const urls = deepFind(json);
                        if (urls.length) {
                            found.push(...urls);
                            break;
                        }
                    } else if (jsonContent.includes("cdninstagram.com")) {
                        // Direct URL found
                        found.push(jsonContent);
                        break;
                    }
                }
            } catch { /* skip */ }
        }
        if (found.length > 0) break;
    }

    // Additional fallback: look for any image URLs
    if (!found.length) {
        const imgRegex = /https:\/\/[^"]*\.(jpg|jpeg|png|webp)[^"]*/g;
        let m: RegExpExecArray | null;
        while ((m = imgRegex.exec(html)) !== null) {
            if (m[0].includes("cdninstagram.com") || m[0].includes("instagram.com")) {
                found.push(m[0]);
            }
        }
    }

    if (!found.length) throw new Error("No image URLs found in HTML");
    return dedup(found);
}

// ─── METHOD 3: Use a free public Instagram scraper proxy ──────────────────────
async function tryPublicProxy(shortcode: string): Promise<string[]> {
    // Try multiple proxy services
    const proxies = [
        {
            name: "picuki",
            url: `https://www.picuki.com/media/${shortcode}`,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://www.picuki.com/",
            }
        },
        {
            name: "imginn",
            url: `https://imginn.com/p/${shortcode}/`,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://imginn.com/",
            }
        },
        {
            name: "saveig",
            url: `https://www.saveig.com/download-photo-instagram-${shortcode}`,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://www.saveig.com/",
            }
        }
    ];

    for (const proxy of proxies) {
        try {
            console.log(`[Instagram] Trying proxy: ${proxy.name}`);
            const res = await fetch(proxy.url, {
                headers: proxy.headers,
                signal: AbortSignal.timeout(15000),
            });

            if (!res.ok) {
                console.log(`[Instagram] Proxy ${proxy.name} failed: HTTP ${res.status}`);
                continue;
            }

            const html = await res.text();
            const found: string[] = [];

            // Extract images based on proxy type
            if (proxy.name === "picuki") {
                // Picuki shows carousel images in <img> tags with cdninstagram.com src
                const imgRegex = /<img[^>]+src="(https:\/\/[^"]*cdninstagram\.com[^"]*)"[^>]*>/g;
                let m: RegExpExecArray | null;
                while ((m = imgRegex.exec(html)) !== null) {
                    const src = m[1];
                    // Filter out small thumbnails — keep full size
                    if (!src.includes("s150x150") && !src.includes("s320x320") && !src.includes("p50x50")) {
                        found.push(src);
                    }
                }

                // Also try data-src attributes
                const dataSrcRegex = /<img[^>]+data-src="(https:\/\/[^"]*cdninstagram\.com[^"]*)"[^>]*>/g;
                while ((m = dataSrcRegex.exec(html)) !== null) {
                    found.push(m[1]);
                }
            } else if (proxy.name === "imginn") {
                // imginn shows download links and images from CDN
                const srcRegex = /src="(https:\/\/[^"]*cdninstagram\.com[^"]*)"/g;
                let m: RegExpExecArray | null;
                while ((m = srcRegex.exec(html)) !== null) {
                    const src = m[1];
                    if (!src.includes("s150x150") && !src.includes("s320x320")) {
                        found.push(src);
                    }
                }

                // Also look for data-download or download links
                const dlRegex = /href="(https:\/\/[^"]*cdninstagram\.com[^"]*\.jpg[^"]*)"/g;
                while ((m = dlRegex.exec(html)) !== null) {
                    found.push(m[1]);
                }
            } else if (proxy.name === "saveig") {
                // Saveig has different structure
                const imgRegex = /<img[^>]+src="(https:\/\/[^"]*\.(jpg|jpeg|png)[^"]*)"[^>]*>/g;
                let m: RegExpExecArray | null;
                while ((m = imgRegex.exec(html)) !== null) {
                    if (m[1].includes("instagram") || m[1].includes("cdninstagram")) {
                        found.push(m[1]);
                    }
                }
            }

            if (found.length > 0) {
                console.log(`[Instagram] Proxy ${proxy.name} success: ${found.length} images`);
                return dedup(found);
            }
        } catch (err) {
            console.log(`[Instagram] Proxy ${proxy.name} error:`, err);
            continue;
        }
    }

    throw new Error("All proxies failed");
}

// ─── METHOD 4: Downloadgram API ─────────────────────────────────────────────
async function tryDownloadgram(shortcode: string): Promise<string[]> {
    const url = `https://api.downloadgram.net/api/media/${shortcode}`;
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://downloadgram.net/",
        },
        signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`Downloadgram HTTP ${res.status}`);
    const data = await res.json();

    if (data.media && Array.isArray(data.media)) {
        return data.media.map((item: any) => item.url).filter(Boolean);
    }

    if (data.url) {
        return [data.url];
    }

    throw new Error("No media found in Downloadgram response");
}

// ─── METHOD 5: InstaSave API ─────────────────────────────────────────────────
async function tryInstaSave(shortcode: string): Promise<string[]> {
    const url = `https://www.instasave.io/download-instagram/${shortcode}`;
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.instasave.io/",
        },
        signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`InstaSave HTTP ${res.status}`);
    const html = await res.text();

    const found: string[] = [];
    
    // Look for download links
    const downloadRegex = /download_url\s*:\s*["']([^"']+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = downloadRegex.exec(html)) !== null) {
        found.push(m[1]);
    }

    // Also look for image URLs
    const imgRegex = /https:\/\/[^"]*\.(jpg|jpeg|png)[^"]*/g;
    while ((m = imgRegex.exec(html)) !== null) {
        if (m[0].includes("instagram") || m[0].includes("cdninstagram")) {
            found.push(m[0]);
        }
    }

    if (!found.length) throw new Error("No images found on InstaSave");
    return dedup(found);
}

// ─── MAIN CONTROLLER ──────────────────────────────────────────────────────────
export async function getInstagramImages(req: Request, res: Response) {
    const { shortcode } = req.query;

    if (!shortcode || typeof shortcode !== "string") {
        return res.status(400).json({ error: "shortcode is required" });
    }

    const sc = shortcode.trim().replace(/[^A-Za-z0-9_\-]/g, "");
    if (!sc) {
        return res.status(400).json({ error: "Invalid shortcode" });
    }

    const errors: Record<string, string> = {};
    let imageUrls: string[] = [];

    // Try all methods in order, stop at first success
    const methods: Array<{ name: string; fn: (sc: string) => Promise<string[]> }> = [
        { name: "json_endpoint", fn: tryJsonEndpoint },
        { name: "html_scrape", fn: tryHtmlScrape },
        { name: "picuki", fn: tryPublicProxy },
        { name: "downloadgram", fn: tryDownloadgram },
        { name: "instasave", fn: tryInstaSave },
    ];

    for (const method of methods) {
        try {
            console.log(`[Instagram] Trying method: ${method.name} for ${sc}`);
            const urls = await method.fn(sc);
            if (urls.length > 0) {
                imageUrls = urls;
                console.log(`[Instagram] Success with ${method.name}: ${urls.length} image(s)`);
                break;
            }
        } catch (err: any) {
            const msg = err?.message || String(err);
            errors[method.name] = msg;
            console.log(`[Instagram] Method ${method.name} failed: ${msg}`);
        }
    }

    if (imageUrls.length === 0) {
        console.error("[Instagram] All methods failed:", errors);
        return res.status(404).json({
            error: "Could not fetch images. The post may be private or Instagram is currently blocking requests.",
            debug: errors,
        });
    }

    return res.status(200).json({
        images: imageUrls,
        count: imageUrls.length,
        type: imageUrls.length > 1 ? "carousel" : "single",
    });
}

export async function proxyInstagramImage(req: Request, res: Response) {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
        return res.status(400).send("URL is required");
    }

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Referer": "https://www.instagram.com/",
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentType = response.headers.get("content-type") || "image/jpeg";
        const buffer = await response.arrayBuffer();

        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=86400");
        return res.send(Buffer.from(buffer));
    } catch (err: any) {
        console.error("[Instagram Proxy Error]", err.message);
        return res.status(500).send("Error fetching image");
    }
}