import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version || '4.10.38'}/build/pdf.worker.min.mjs`;

interface TextGroup {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
}

export async function convertPdfToEpub(file: File, onProgress?: (percent: number) => void): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    const zip = new JSZip();

    // 1. mimetype (no compression)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // 2. META-INF/container.xml
    zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`);

    let xhtmlContent = '';
    const manifestItems: string[] = [];
    const spineItems: string[] = [];

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        // Sort items by Y descending (top of page to bottom)
        // Groups that are on the same line should have similar Y coordinates
        const sortedItems = [...items].sort((a, b) => {
            const y1 = a.transform[5];
            const y2 = b.transform[5];
            if (Math.abs(y1 - y2) > 5) {
                return y2 - y1; // Higher Y first (top of page)
            }
            return a.transform[4] - b.transform[4]; // Left to right
        });

        const groups: TextGroup[] = [];
        let currentGroup: TextGroup | null = null;

        for (const item of sortedItems) {
            const str = item.str || "";
            if (!str.trim()) continue;

            const x = item.transform[4];
            const y = item.transform[5];
            const fontSize = Math.sqrt(item.transform[0] ** 2 + item.transform[1] ** 2);
            const itemWidth = item.width || (fontSize * str.length * 0.5);

            if (currentGroup &&
                Math.abs(currentGroup.y - y) < fontSize * 0.8 &&
                (x - (currentGroup.x + currentGroup.width)) < fontSize * 3.0) {

                const gap = x - (currentGroup.x + currentGroup.width);
                currentGroup.text += (gap > fontSize * 0.2 ? " " : "") + str;
                currentGroup.width = (x + itemWidth) - currentGroup.x;
                currentGroup.fontSize = Math.max(currentGroup.fontSize, fontSize);
            } else {
                if (currentGroup) groups.push(currentGroup);
                currentGroup = {
                    text: str,
                    x: x,
                    y: y,
                    width: itemWidth,
                    height: fontSize,
                    fontSize: fontSize
                };
            }
        }
        if (currentGroup) groups.push(currentGroup);

        let pageHtml = '';
        groups.forEach((g) => {
            const text = g.text.trim()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            if (g.fontSize > 16) {
                pageHtml += `<h2>${text}</h2>\n`;
            } else if (g.fontSize > 13) {
                pageHtml += `<h3>${text}</h3>\n`;
            } else {
                pageHtml += `<p>${text}</p>\n`;
            }
        });

        const sectionFileName = `text/section${i}.xhtml`;
        zip.file(`OEBPS/${sectionFileName}`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Page ${i}</title>
    <link rel="stylesheet" type="text/css" href="../styles/style.css"/>
</head>
<body>
    <section id="page-${i}">
        ${pageHtml || `<p>[Empty Page]</p>`}
    </section>
</body>
</html>`);

        manifestItems.push(`<item id="section${i}" href="${sectionFileName}" media-type="application/xhtml+xml"/>`);
        spineItems.push(`<itemref idref="section${i}"/>`);

        if (onProgress) onProgress((i / numPages) * 100);
    }

    // 3. OEBPS/styles/style.css
    zip.file('OEBPS/styles/style.css', `
body { font-family: "Helvetica", "Arial", sans-serif; margin: 5%; line-height: 1.5; color: #333; }
h1, h2, h3 { color: #000; text-align: center; margin-top: 1.5em; }
p { margin-bottom: 1em; text-align: justify; }
section { page-break-after: always; }
`);

    // 4. OEBPS/content.opf
    const title = file.name.replace(/\.[^/.]+$/, "");
    zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="pub-id">uuid-${Math.random().toString(36).substring(2)}</dc:identifier>
        <dc:title>${title}</dc:title>
        <dc:language>en</dc:language>
        <meta property="dcterms:modified">${new Date().toISOString().replace(/\.[0-9]+Z$/, 'Z')}</meta>
    </metadata>
    <manifest>
        <item id="style" href="styles/style.css" media-type="text/css"/>
        ${manifestItems.join('\n        ')}
    </manifest>
    <spine>
        ${spineItems.join('\n        ')}
    </spine>
</package>`);

    // 5. OEBPS/toc.ncx (for older readers)
    const ncxItems = spineItems.map((_, i) => `<navPoint id="navPoint-${i + 1}" playOrder="${i + 1}"><navLabel><text>Page ${i + 1}</text></navLabel><content src="text/section${i + 1}.xhtml"/></navPoint>`);
    zip.file('OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="uuid-12345"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle><text>${title}</text></docTitle>
    <navMap>
        ${ncxItems.join('\n        ')}
    </navMap>
</ncx>`);

    return await zip.generateAsync({ type: 'blob' });
}
