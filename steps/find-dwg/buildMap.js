const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');

const dwgInputFolder = path.join(__dirname, '../../input/symbols');
const mapPath = path.join(dwgInputFolder, 'map.csv');

async function buildMap() {
    const map = {};
    const csvData = [];
    const dwgFiles = [];

    // Read and parse the CSV file (using regular fs for createReadStream)
    await new Promise((resolve, reject) => {
        fs.createReadStream(mapPath)
            .pipe(csv())
            .on('data', (row) => {
                csvData.push({
                    title: row.Title,
                    fileName: row['3D CAD Files_file'].toLowerCase()
                });
            })
            .on('end', resolve)
            .on('error', reject);
    });

    // Recursively find all DWG files using fs.promises
    async function findDwgFiles(dir) {
        const entries = await fsp.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                await findDwgFiles(fullPath);
            } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.dwg')) {
                const relativePath = path.relative(dwgInputFolder, fullPath);
                dwgFiles.push({
                    fileName: entry.name.toLowerCase(),
                    path: relativePath
                });
            }
        }
    }

    await findDwgFiles(dwgInputFolder);

    // Build the map by matching CSV entries with found DWG files
    for (const csvEntry of csvData) {
        const foundFile = dwgFiles.find(file => file.fileName === csvEntry.fileName);
        
        if (foundFile) {
            // Replace backslashes with forward slashes for consistency
            map[csvEntry.title] = foundFile.path.replace(/\\/g, '/');
        } else {
            console.warn(`No matching DWG file found for: ${csvEntry.title}`);
        }
    }

    return map;
}

module.exports = buildMap;