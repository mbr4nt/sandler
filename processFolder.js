const fs = require('fs');
const path = require('path');

/**
 * Traverses the folder structure and processes each product folder.
 * @param {string} rootFolderPath - The root folder path (e.g., 'collection').
 * @param {function} processProduct - The function to process each product folder.
 */
async function processProductFolders(rootFolderPath, processProduct) {
    // Read the collections in the root folder
    const collections = fs.readdirSync(rootFolderPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const collection of collections) {
        const collectionPath = path.join(rootFolderPath, collection);

        // Read the ranges in the collection folder
        const ranges = fs.readdirSync(collectionPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const range of ranges) {
            const rangePath = path.join(collectionPath, range);

            // Read the products in the range folder
            const products = fs.readdirSync(rangePath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            for (const product of products) {
                const productFolderPath = path.join(rangePath, product);

                // Read the files in the product folder
                const files = fs.readdirSync(productFolderPath, { withFileTypes: true })
                    .filter(dirent => dirent.isFile())
                    .map(dirent => dirent.name);

                // Calculate the relative path of the product folder
                const relativeProductFolderPath = path.relative(rootFolderPath, productFolderPath);

                // Process the product folder
                await processProduct(collection, range, product, files, relativeProductFolderPath);
            }
        }
    }
}

module.exports = processProductFolders;