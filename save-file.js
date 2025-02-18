import fs from 'fs/promises';
import path from 'path';

async function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    try {
        await fs.access(dirname);
    } catch (err) {
        await ensureDirectoryExistence(dirname);
        await fs.mkdir(dirname);
    }
}

export default async function saveFile(text, fileName) {
    try {
        await ensureDirectoryExistence(fileName);
        await fs.writeFile(fileName, text);
    } catch (err) {
        console.error(err);
    }
}