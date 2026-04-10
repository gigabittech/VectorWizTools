import { Request, Response } from "express";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

function dedup(arr: string[]): string[] {
    return [...new Set(arr)].filter(Boolean);
}

function isMediaUrl(u: any): boolean {
    if (!u || typeof u !== "string") return false;
    const isCDN = u.includes("cdninstagram.com") || u.includes("fbcdn.net");
    if (!isCDN) return false;
    if (u.includes("static.cdninstagram.com") || u.includes("/rsrc.php/") || u.includes(".js") || u.includes(".css")) return false;
    return true;
}

// ─── Direct JSON Extraction From Object ──────────────────────────────────────
function deepFind(obj: any, urls: string[] = [], depth = 0): string[] {
    if (depth > 40 || !obj || typeof obj !== "object") return urls;
    
    // Carousel
    if (obj.edge_sidecar_to_children?.edges) {
        for (const edge of obj.edge_sidecar_to_children.edges) {
            const n = edge?.node;
            if (n) {
                const src = (n.display_resources || []).pop()?.src || n.display_url;
                if (isMediaUrl(src)) urls.push(src);
                if (n.edge_sidecar_to_children) deepFind(n.edge_sidecar_to_children, urls, depth + 1);
            }
        }
    }

    if (obj.display_url && isMediaUrl(obj.display_url)) urls.push(obj.display_url);
    if (obj.video_url && isMediaUrl(obj.video_url)) urls.push(obj.video_url);
    if (obj.image_versions2?.candidates) {
        const best = obj.image_versions2.candidates[0]?.url;
        if (isMediaUrl(best)) urls.push(best);
    }
    if (obj.carousel_media) {
        for (const m of obj.carousel_media) deepFind(m, urls, depth + 1);
    }

    if (Array.isArray(obj)) {
        for (const item of obj) deepFind(item, urls, depth + 1);
    } else {
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === "object") {
                deepFind(obj[key], urls, depth + 1);
            }
        }
    }
    return urls;
}

function extractFromJsonInHtml(html: string): string[] {
    const urls: string[] = [];
    const patterns = [
        /window\._sharedData\s*=\s*({.*?});/s,
        /window\.__additionalDataLoaded\(.*?,({.*?})\);/s,
        /<script type="application\/ld\+json">(.*?)<\/script>/s,
        /{"shortcode":"[A-Za-z0-9_-]+".*?}/g
    ];
    
    for (const p of patterns) {
        try {
            const matches = html.matchAll(p);
            for (const m of matches) {
                try {
                    const json = JSON.parse(m[1] || m[0]);
                    deepFind(json, urls);
                } catch {}
            }
        } catch {}
    }
    return urls;
}

// ─── MAIN CONTROLLER ──────────────────────────────────────────────────────────

export async function getInstagramImages(req: Request, res: Response) {
    const { shortcode } = req.query;
    if (!shortcode || typeof shortcode !== "string") return res.status(400).json({ error: "Shortcode required" });
    
    // Support full URLs as well
    let sc = shortcode.trim();
    const scMatch = sc.match(/(?:\/p\/|\/reel\/|\/reels\/|\/tv\/)([A-Za-z0-9_-]+)/);
    if (scMatch) sc = scMatch[1];
    sc = sc.replace(/[^A-Za-z0-9_\-]/g, "");

    const fullUrl = `https://www.instagram.com/p/${sc}/`;
    let imageUrls: string[] = [];
    const errors: Record<string, string> = {};

    // Strategy 1: Parallel API Fetching for Speed and Reliability
    const apiEndpoints = [
        `https://backend1.tioo.eu.org/api/downloader/igdl?url=${encodeURIComponent(fullUrl)}`,
        `https://api.vkrfork.com/api/insta?url=${encodeURIComponent(fullUrl)}`,
        `https://api.kiryuu.id/api/instagram?url=${encodeURIComponent(fullUrl)}`
    ];

    for (const apiUrl of apiEndpoints) {
        try {
            console.log(`[Instagram] Trying API: ${apiUrl.split('?')[0]}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const apiRes = await fetch(apiUrl, {
                headers: { "User-Agent": USER_AGENT },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (apiRes.ok) {
                const data = await apiRes.json();
                
                // Handle different API response formats
                let found: string[] = [];
                if (Array.isArray(data)) {
                    found = data.map((item: any) => item.url || item.thumbnail).filter(Boolean);
                } else if (data.data && Array.isArray(data.data)) {
                    found = data.data.map((item: any) => item.url || item.thumbnail).filter(Boolean);
                } else if (data.result && Array.isArray(data.result)) {
                    found = data.result.map((item: any) => item.url || item.thumbnail).filter(Boolean);
                } else if (typeof data === 'object') {
                    // Try to find any array of URLs
                    deepFind(data, found);
                }

                if (found.length > 0) {
                    imageUrls = dedup(found);
                    console.log(`[Instagram] API Success: found ${imageUrls.length} images`);
                    return res.status(200).json({
                        images: imageUrls,
                        count: imageUrls.length,
                        type: imageUrls.length > 1 ? "carousel" : "single"
                    });
                }
            }
        } catch (err: any) {
            console.warn(`[Instagram] API failed (${apiUrl.split('.')[1]}): ${err.message}`);
            errors[apiUrl.split('/')[2]] = err.message;
        }
    }

    // Strategy 2: Direct Scrape Fallback (Existing logic)
    const variables = JSON.stringify({ shortcode: sc, child_comment_count: 3, fetch_comment_count: 40, parent_comment_count: 24, has_threaded_comments: false });
    const queryHashes = [
        "9f888502544706f13e3dbac063c20050",
        "b022383842323e164c244c0106606fb2",
        "2c938c232c748c105ab1cce4b47a988d",
        "003056d32c2554def8f548d085966453"
    ];

    const targets: any[] = [];
    queryHashes.forEach(h => {
        targets.push({
            name: `graphql_${h.slice(0, 5)}`,
            url: `https://www.instagram.com/graphql/query/?query_hash=${h}&variables=${encodeURIComponent(variables)}`,
            headers: { "X-IG-App-ID": "936619743392459" }
        });
    });

    targets.push(
        {
            name: "direct_json",
            url: `https://www.instagram.com/p/${sc}/?__a=1&__d=dis`,
            headers: { "X-IG-App-ID": "936619743392459" }
        },
        { 
            name: "embed_page", 
            url: `https://www.instagram.com/p/${sc}/embed/captioned/` 
        },
        {
            name: "main_page",
            url: `https://www.instagram.com/p/${sc}/`
        }
    );

    for (const t of targets) {
        try {
            console.log(`[Instagram] Trying fallback ${t.name}...`);
            const hString = t.headers ? Object.entries(t.headers).map(([k,v]) => `-H "${k}: ${v}"`).join(" ") : "";
            const cmd = `curl -k -L -m 15 -A "${USER_AGENT}" ${hString} "${t.url}"`;
            const { stdout } = await execAsync(cmd);
            const content = stdout.toString();
            
            let found: string[] = [];
            if (content.trim().startsWith("{")) {
                try {
                    const json = JSON.parse(content);
                    found = deepFind(json);
                } catch {}
            }
            
            if (found.length === 0) {
                found = extractFromJsonInHtml(content);
            }
            
            if (found.length === 0) {
                const imgRegex = /https:\/\/([^"'\s\\>]*cdninstagram\.com[^"'\s\\>]*)/g;
                let m: RegExpExecArray | null;
                const matches: string[] = [];
                while ((m = imgRegex.exec(content)) !== null) {
                    let u = m[0].replace(/\\u0026/g, "&").replace(/&amp;/g, "&").replace(/\\\//g, "/");
                    u = u.split('"')[0].split("'")[0].split("\\")[0];
                    if (isMediaUrl(u)) matches.push(u);
                }
                const highRes = matches.filter(u => 
                    u.includes("_n.jpg") || 
                    u.includes("1080x1080") || 
                    u.includes("750x750") || 
                    u.includes("640x640") ||
                    u.includes("s1080x1080") ||
                    u.includes("/v/") ||
                    /_[nb]\.jpg/.test(u)
                );
                found = highRes.length > 0 ? highRes : matches;
            }

            if (found.length > 0) {
                imageUrls = dedup(found);
                console.log(`[Instagram] ${t.name} Success: found ${imageUrls.length} images`);
                break;
            }
        } catch (err: any) {
            errors[t.name] = err.message;
        }
    }

    if (!imageUrls.length) {
        return res.status(404).json({
            error: "Private Post or Temporary Block. We tried multiple sources but couldn't find media. Please try again after 1 minute.",
            debug: errors
        });
    }

    return res.status(200).json({
        images: imageUrls,
        count: imageUrls.length,
        type: imageUrls.length > 1 ? "carousel" : "single"
    });
}

export async function proxyInstagramImage(req: Request, res: Response) {
    const { url } = req.query;
    if (!url || typeof url !== "string") return res.status(400).send("URL required");
    try {
        // Use a 10s timeout for image proxying
        const { stdout } = await execAsync(`curl -k -L -m 10 -A "${USER_AGENT}" "${url}"`, { encoding: 'buffer' as any });
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=86400");
        return res.send(stdout);
    } catch {
        return res.status(500).send("Proxy error");
    }
}