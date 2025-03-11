const processFolder = require('./processFolder.js');
const path = require('path');
const fs = require('fs').promises; // Use fs.promises for promise-based methods

module.exports = function forEachProduct(processor) {
    const productStep = async function (inputDir, outputDir) {
        await processEachProduct(inputDir, outputDir, processor);
    };
    productStep.getName = function() {
        return processor.name;
    }
    return productStep
}

async function processEachProduct(inputDir, outputDir, processor) {

    async function processOneProduct(collection, range, product, files, productFolderPath) {

        async function readFile(fileName) {
            try {
                const filePath = path.join(inputDir, productFolderPath, fileName);
                const data = await fs.readFile(filePath, 'utf8');
                return data;
            } catch (error) {
                console.error(`Error reading file ${fileName}:`, error);
                throw error; // Re-throw the error if you want calling code to handle it
            }
        }
        
        async function writeFile(fileName, data) {
            try {
                const filePath = path.join(outputDir, productFolderPath, fileName);
                const dirPath = path.dirname(filePath); // Get the directory path
        
                // Create the directory if it doesn't exist
                await fs.mkdir(dirPath, { recursive: true });
        
                // Write the file
                await fs.writeFile(filePath, data, 'utf8');
                console.log(`File ${fileName} written successfully.`);
            } catch (error) {
                console.error(`Error writing file ${fileName}:`, error);
                throw error; // Re-throw the error if you want calling code to handle it
            }
        }
        
        await processor(collection, range, product, readFile, writeFile);
    }

    await processFolder(inputDir, processOneProduct);
};

