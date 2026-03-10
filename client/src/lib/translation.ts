
export async function translateText(text: string, targetLang: string): Promise<string> {
    if (!text || text.trim() === '') return text;

    try {
        const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
        );

        if (!response.ok) {
            throw new Error('Translation API failed');
        }

        const data = await response.json();
        return data[0].map((item: any) => item[0]).join('');
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    }
}

/**
 * Enhanced batch translation with a very safe separator
 */
export async function translateBatch(texts: string[], targetLang: string): Promise<string[]> {
    const results: string[] = [];
    const chunkSize = 15; // smaller chunks for better reliability
    const separator = " [X_SEP_X] ";

    for (let i = 0; i < texts.length; i += chunkSize) {
        const chunk = texts.slice(i, i + chunkSize);
        const combined = chunk.join(separator);
        const translated = await translateText(combined, targetLang);

        // Use a regex that handles potential whitespace changes by the translator
        const split = translated.split(/\[\s*X_SEP_X\s*\]/i);

        for (let j = 0; j < chunk.length; j++) {
            let val = split[j] ? split[j].trim() : chunk[j];
            results.push(val);
        }
    }

    return results;
}
