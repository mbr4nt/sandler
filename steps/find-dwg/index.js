const path = require('path');
const fs = require('fs').promises; // Using fs.promises for async file operations
const log = require('../../log.js');

// Initialize and index files
const dwgInputFolder = path.join(__dirname, '../../input/symbols');
const mapPath = path.join(dwgInputFolder, 'map.json');
let map = null;


module.exports = async function findDWG(collection, range, product, readFile, writeFile) {
    if(!map) {
        const mapText = await fs.readFile(mapPath, 'utf8');
        map = JSON.parse(mapText);
    }

    // Find best matches for a product name
    const dwg = map[product];
    if (!dwg) {
        await log(`No DWG found for product: ${product}`);
    }
    else {
        const dwgOutputFolder = path.join(__dirname, '../../output/symbols');

        // Ensure the output folder exists
        try {
            await fs.mkdir(dwgOutputFolder, { recursive: true });
        } catch (err) {
            console.error(`Error creating output folder: ${err}`);
            throw err; // Re-throw the error to stop execution if the folder cannot be created
        }

        // Copy contents of dwg to output folder with ${product}.dwg name
        const outputFilePath = path.join(dwgOutputFolder, `${makeSafeFileName(product)}.dwg`);

        try {
            // Read the contents of the source DWG file
            const data = await fs.readFile(path.join(dwgInputFolder, dwg));

            // Write the contents to the output file
            await fs.writeFile(outputFilePath, data);

        } catch (err) {
            log(`No DWG found for product: ${product}`);
        }
    }
    // Pass files forward
    await writeFile('upcharges.json', await readFile('upcharges.json'));
    await writeFile('features.json', await readFile('features.json'));
    await writeFile('product_data.csv', await readFile('product_data.csv'));
}

function makeSafeFileName(input) {
    // Replace invalid characters with an underscore
    const safeName = input.replace(/[<>:"/\\|?*]+/g, '_');

    // Remove leading and trailing spaces
    const trimmedName = safeName.trim();

    // Ensure the name is not empty
    if (!trimmedName) {
        throw new Error('The resulting file name is empty after sanitization.');
    }

    return trimmedName;
}