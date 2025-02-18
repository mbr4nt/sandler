import { processFolder, processPair } from './scan-data.js';

// Implement your custom `processPair` function
const customProcessPair = async (priceFile, productDataFile) => {
    console.log(`Custom processing for: ${priceFile} and ${productDataFile}`);
    // Add your async logic here
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate async work
};

// Process the folder
const folderPath = './data';
processFolder(folderPath)
    .then(() => console.log('Folder processing complete.'))
    .catch((error) => console.error(`Error: ${error.message}`));