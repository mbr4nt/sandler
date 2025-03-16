const DWGIndexer = require('../../dwg-indexer');
const path = require('path');
const fs = require('fs').promises; // Using fs.promises for async file operations

// Initialize and index files
const indexer = new DWGIndexer();
const rootPath = path.join(__dirname, '../../symbols');
indexer.indexFiles(rootPath);

module.exports = async function findDWG(collection, range, product, readFile, writeFile) {
    // Find best matches for a product name
    const results = indexer.findBestMatch(product);
    const dwg = results[0].filePath;

    const dwgOutputFolder = path.join(__dirname, '../../output/symbols');

    // Ensure the output folder exists
    try {
        await fs.mkdir(dwgOutputFolder, { recursive: true });
        console.log(`Output folder created or already exists: ${dwgOutputFolder}`);
    } catch (err) {
        console.error(`Error creating output folder: ${err}`);
        throw err; // Re-throw the error to stop execution if the folder cannot be created
    }

    // Copy contents of dwg to output folder with ${product}.dwg name
    const outputFilePath = path.join(dwgOutputFolder, `${makeSafeFileName(product)}.dwg`);
    
    try {
        // Read the contents of the source DWG file
        const data = await fs.readFile(dwg);
        
        // Write the contents to the output file
        await fs.writeFile(outputFilePath, data);
        
        console.log(`DWG file copied to ${outputFilePath}`);
    } catch (err) {
        console.error(`Error copying DWG file: ${err}`);
        throw err; // Re-throw the error to stop execution if the file cannot be copied
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