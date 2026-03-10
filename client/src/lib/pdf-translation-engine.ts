import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import fontkit from '@pdf-lib/fontkit';
import { translateBatch } from './translation';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version || '4.10.38'}/build/pdf.worker.min.mjs`;

export interface TranslationProgress {
    status: 'loading' | 'extracting' | 'translating' | 'generating' | 'success' | 'error';
    currentPage?: number;
    totalPages?: number;
    message?: string;
}

const fontMapping: Record<string, string> = {
    'zh': 'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/SubsetOTF/SC/NotoSansCJKsc-Regular.otf',
    'ja': 'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/SubsetOTF/JP/NotoSansCJKjp-Regular.otf',
    'ko': 'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/SubsetOTF/KR/NotoSansCJKkr-Regular.otf',
    'ar': 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@master/hinted/ttf/NotoSansArabic/NotoSansArabic-Regular.ttf',
    'hi': 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@master/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf',
    'bn': 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@master/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf',
    'ru': 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@master/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
};

async function loadFontForLanguage(pdfDoc: PDFDocument, lang: string) {
    const fontUrl = fontMapping[lang] || 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@master/hinted/ttf/NotoSans/NotoSans-Regular.ttf';
    try {
        const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
        return await pdfDoc.embedFont(fontBytes);
    } catch (e) {
        return await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
}

interface TextGroup {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
}

export async function translatePDF(
    file: File,
    targetLang: string,
    onProgress: (progress: TranslationProgress) => void
): Promise<Uint8Array> {
    try {
        onProgress({ status: 'loading', message: 'Loading PDF...' });
        const arrayBuffer = await file.arrayBuffer();
        const bufferForJs = arrayBuffer.slice(0);
        const bufferForLib = arrayBuffer.slice(0);

        const pdfDocJs = await pdfjs.getDocument({ data: bufferForJs }).promise;
        const totalPages = pdfDocJs.numPages;
        const pdfDocLib = await PDFDocument.load(bufferForLib);
        pdfDocLib.registerFontkit(fontkit);

        const font = await loadFontForLanguage(pdfDocLib, targetLang);

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            onProgress({ status: 'extracting', currentPage: pageNum, totalPages, message: `Grouping text on page ${pageNum}...` });

            const pageJs = await pdfDocJs.getPage(pageNum);
            const textContent = await pageJs.getTextContent();
            const pageLib = pdfDocLib.getPages()[pageNum - 1];

            // 1. Group items into lines/words
            const items = textContent.items as any[];
            if (items.length === 0) continue;

            // Sort items by Y descending (top to bottom) and then X ascending (left to right)
            const sortedItems = [...items].sort((a, b) => {
                const yDiff = b.transform[5] - a.transform[5];
                if (Math.abs(yDiff) > 5) return yDiff;
                return a.transform[4] - b.transform[4];
            });

            const groups: TextGroup[] = [];
            let currentGroup: TextGroup | null = null;

            for (const item of sortedItems) {
                if (!item.str.trim()) continue;

                const x = item.transform[4];
                const y = item.transform[5];
                const fontSize = Math.sqrt(item.transform[0] ** 2 + item.transform[1] ** 2);
                const itemWidth = item.width || (fontSize * item.str.length * 0.5);

                if (currentGroup &&
                    Math.abs(currentGroup.y - y) < 5 &&
                    (x - (currentGroup.x + currentGroup.width)) < fontSize * 1.5) {
                    // Add to existing group
                    currentGroup.text += (x - (currentGroup.x + currentGroup.width) > fontSize * 0.2 ? " " : "") + item.str;
                    currentGroup.width = (x + itemWidth) - currentGroup.x;
                    currentGroup.fontSize = Math.max(currentGroup.fontSize, fontSize);
                } else {
                    // Start new group
                    if (currentGroup) groups.push(currentGroup);
                    currentGroup = {
                        text: item.str,
                        x: x,
                        y: y,
                        width: itemWidth,
                        height: fontSize,
                        fontSize: fontSize
                    };
                }
            }
            if (currentGroup) groups.push(currentGroup);

            // 2. Translate groups
            onProgress({ status: 'translating', currentPage: pageNum, totalPages, message: `Translating ${groups.length} blocks on page ${pageNum}...` });
            const textsToTranslate = groups.map(g => g.text);
            const translatedTexts = await translateBatch(textsToTranslate, targetLang);

            // 3. Render
            onProgress({ status: 'generating', currentPage: pageNum, totalPages, message: `Rendering translation on page ${pageNum}...` });
            for (let i = 0; i < groups.length; i++) {
                const group = groups[i];
                const translatedStr = translatedTexts[i];

                try {
                    // Cover original
                    pageLib.drawRectangle({
                        x: group.x - 1,
                        y: group.y - (group.fontSize * 0.2),
                        width: group.width + 2,
                        height: group.height * 1.3,
                        color: rgb(1, 1, 1),
                    });

                    // Text Fitting
                    let currentFontSize = group.fontSize;
                    const textWidth = font.widthOfTextAtSize(translatedStr, group.fontSize);
                    if (group.width > 0 && textWidth > group.width) {
                        currentFontSize = group.fontSize * (group.width / textWidth);
                    }

                    pageLib.drawText(translatedStr, {
                        x: group.x,
                        y: group.y,
                        size: currentFontSize,
                        font: font,
                        color: rgb(0, 0, 0),
                    });
                } catch (e) {
                    console.warn('Failed to render group:', group.text, e);
                }
            }
        }

        onProgress({ status: 'generating', message: 'Finalizing PDF...' });
        const pdfBytes = await pdfDocLib.save();
        onProgress({ status: 'success', message: 'Translation complete!' });
        return pdfBytes;
    } catch (error) {
        onProgress({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
    }
}
