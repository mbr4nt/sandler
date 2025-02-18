import fs from 'fs/promises'; // Use fs/promises for async file operations
import path from 'path';
import { processProduct } from './process-product.js';

/**
 * Scans the folder for pairs of CSV files and returns a promise resolving to an array of pairs.
 * @param {string} folderPath - Path to the folder containing the CSV files.
 * @returns {Promise<Array<{fileKey: string, priceFile: string, productDataFile: string}>>} - A promise resolving to an array of objects containing the file key and paths to the matching files.
 */
export async function findMatchingFiles(folderPath) {
    try {
        const files = await fs.readdir(folderPath);
        const pairs = [];

        // Create a map to store files by their prefix
        const fileMap = new Map();

        files.forEach((file) => {
            if (file.endsWith('_prices.csv')) {
                const prefix = file.slice(0, -'_prices.csv'.length);
                fileMap.set(prefix, { ...fileMap.get(prefix), priceFile: path.join(folderPath, file) });
            } else if (file.endsWith('_product_data.csv')) {
                const prefix = file.slice(0, -'_product_data.csv'.length);
                fileMap.set(prefix, { ...fileMap.get(prefix), productDataFile: path.join(folderPath, file) });
            }
        });

        // Iterate through the map and find complete pairs
        fileMap.forEach((value, fileKey) => {
            if (value.priceFile && value.productDataFile) {
                pairs.push({
                    fileKey, // Include the file key (e.g., "apple", "banana")
                    priceFile: value.priceFile,
                    productDataFile: value.productDataFile,
                });
            }
        });

        return pairs;
    } catch (error) {
        throw new Error(`Error finding matching files: ${error.message}`);
    }
}



/**
 * Placeholder function for processing a pair of CSV files.
 * @param {string} fileKey - The key (prefix) for the file pair (e.g., "apple").
 * @param {string} priceFile - Path to the prices CSV file.
 * @param {string} productDataFile - Path to the product data CSV file.
 * @returns {Promise<void>} - A promise that resolves when processing is complete.
 */
export async function processPair(fileKey, priceFile, productDataFile) {
    const result = await processProduct(fileKey, priceFile, productDataFile);
    console.log("result", result);
    return result;
}

/**
 * Scans the folder for pairs of CSV files and processes each pair using the `processPair` function.
 * @param {string} folderPath - Path to the folder containing the CSV files.
 * @returns {Promise<void>} - A promise that resolves when all pairs have been processed.
 */
export async function processFolder(folderPath) {
    let models = [];
    try {
        const pairs = await findMatchingFiles(folderPath);

        // Process each pair sequentially
        for (const pair of pairs) {
            const result = await processPair(pair.fileKey, pair.priceFile, pair.productDataFile);
            console.log("resultxx", result);
            models = models.concat(result);
        }

        console.log('All pairs processed successfully.', models);
        return models;
    } catch (error) {
        console.error(`Error processing folder: ${error.message}`);
    }
}