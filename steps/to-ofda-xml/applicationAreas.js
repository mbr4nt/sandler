const process = require('./process.js');
const fs = require('fs').promises;
const path = require('path');

const template = path.join(__dirname, 'applicationArea.xml');

module.exports = async function(context) {
    let xml = "";
    const dataRoot = context.dataRoot;

    // read array from application-areas.json

    try {
        const areasContent = await fs.readFile(path.join(dataRoot, 'application-areas.json'), 'utf8');
        const areas = JSON.parse(areasContent);

        // Loop through each file
        for (const area of areas) {
            xml += await process(template, area); 

            // Add a line break
            xml += '\n';
        }
    } catch (error) {
        console.error(`Error reading application area file: ${error.message}`);
        throw error; // Re-throw the error to handle it at a higher level
    }

    return xml;
};