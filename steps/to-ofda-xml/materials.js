const process = require('./process.js');
const fs = require('fs').promises;
const path = require('path');

const template = path.join(__dirname, 'material.xml');

module.exports = async function(context) {
    let xml = "";
    const dataRoot = context.dataRoot;
    const materialsFolder = path.join(dataRoot, 'materials');

    // Check if the materials folder exists
    try {
        await fs.access(materialsFolder); // Check if the folder is accessible
    } catch (error) {
        // If the folder doesn't exist, log a warning and return an empty string
        console.warn(`The materials folder does not exist at: ${materialsFolder}`);
        return xml; // Return empty string since there's nothing to process
    }

    // Read every JSON file in the folder
    try {
        const files = await fs.readdir(materialsFolder);

        // Loop through each file
        for (const file of files) {
            // Only process JSON files
            if (!file.endsWith('.json')) continue;

            const filePath = path.join(materialsFolder, file);
            const data = await fs.readFile(filePath, 'utf8');
            xml += await process(template, JSON.parse(data)); // Assuming `process` and `template` are defined elsewhere

            // Add a line break
            xml += '\n';
        }
    } catch (error) {
        console.error(`Error reading files from the materials folder: ${error.message}`);
        throw error; // Re-throw the error to handle it at a higher level
    }

    return xml;
};