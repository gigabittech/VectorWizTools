import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('g:/From Disk E/Gigabit/Projects/VectorWizTools/client/src/pages/ToolsLandingPage.tsx', 'utf8');

const extractTools = (type: string) => {
    const startRegex = new RegExp(`const ${type}: Tool\\[\\] = \\[`, 'g');
    const startMatch = startRegex.exec(content);
    if (!startMatch) return [];

    let startIndex = startMatch.index + startMatch[0].length;
    let bracketCount = 1;
    let endIndex = startIndex;

    while (bracketCount > 0 && endIndex < content.length) {
        if (content[endIndex] === '[') bracketCount++;
        else if (content[endIndex] === ']') bracketCount--;
        endIndex++;
    }

    const arrayContent = content.substring(startIndex - 1, endIndex);
    // Convert the JS array literal string to a JSON-like structure
    // This is tricky because it's JS, not JSON.
    // I'll use a simpler approach: extract matches using regex.
    const toolRegex = /\{ name: "(.*?)", description: "(.*?)", category: "(.*?)", route: "(.*?)", icon: "(.*?)"(.*?)\}/g;
    const tools = [];
    let match;
    while ((match = toolRegex.exec(arrayContent)) !== null) {
        tools.push({
            name: match[1],
            description: match[2],
            category: match[3],
            route: match[4],
            icon: match[5],
            comingSoon: match[6].includes('comingSoon: true')
        });
    }
    return tools;
};

const imageTools = extractTools('imageTools');
const pdfTools = extractTools('pdfTools');

const allTools = [...imageTools, ...pdfTools];

console.log(JSON.stringify(allTools, null, 2));
