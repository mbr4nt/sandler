const path = require('path');
const fs = require('fs').promises;
const log = require('../../log.js');
const csv = require('csv-parser'); // You'll need to install this package

// Initialize and index files
const imageInputFolder = path.join(__dirname, '../../input/images');
const mapPath = path.join(imageInputFolder, 'map.csv');
let map = null;

module.exports = async function findDWG(collection, range, product, readFile, writeFile) {
    if(!map) {
        // Read and parse the CSV file
        const csvData = await fs.readFile(mapPath, 'utf8');
        const lines = csvData.split('\n');
        
        // Initialize map
        map = {};
        
        // Skip header row and process each line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines
            
            const columns = line.split(',');
            if (columns.length >= 3) {
                const itemNumber = columns[1].trim();
                const imageFilename = columns[2].trim();
                map[itemNumber] = imageFilename;
            }
        }
    }

    // Find best matches for a product name
    const image = map[product];
    if (!image) {
        await log(`No image found for product: ${product}`);
    }
    else {
        const imageOutputFolder = path.join(__dirname, '../../output/images');

        // Ensure the output folder exists
        try {
            await fs.mkdir(imageOutputFolder, { recursive: true });
        } catch (err) {
            console.error(`Error creating output folder: ${err}`);
            throw err;
        }

        // Copy contents of image to output folder with ${product}.png name
        const outputFilePath = path.join(imageOutputFolder, `${makeSafeFileName(product)}.png`);

        try {
            // Read the contents of the source image file
            const data = await fs.readFile(path.join(imageInputFolder, image));

            // Write the contents to the output file
            await fs.writeFile(outputFilePath, data);

        } catch (err) {
            log(`No image found for product: ${product}`);
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