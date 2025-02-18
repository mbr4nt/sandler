import { processFolder, processPair } from './scan-data.js';
import exportToSif from './export-sif.js';

// Process the folder
const folderPath = './data';
const products = await processFolder(folderPath);
console.log("oi", products);

const catalog = {
    key: 'SDL',
    name: 'Sandler',
    products
};

await exportToSif(catalog);
