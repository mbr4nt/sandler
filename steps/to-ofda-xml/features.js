const process = require('./process.js');
const fs = require('fs').promises;
const path = require('path');

const template = path.join(__dirname, 'feature.xml');


module.exports = async function(context) {
    let xml = "";
    const dataRoot = context.dataRoot;
    const featuresFolder = path.join(dataRoot, 'features');
    //read every json file
    const files = await fs.readdir(featuresFolder);

    for (const file of files) {
        try {
            if (!file.endsWith('.json')) continue;
    
            const filePath = path.join(featuresFolder, file);
            const data = await fs.readFile(filePath, 'utf8');
            const feature = JSON.parse(data);
            feature.defaultOption = await getDefaultOption(feature);
            if (!feature.materialApplicationArea) feature.materialApplicationArea = '';
            console.log('feature:', feature.code);
            xml += await process(template, feature);
            xml += '\n';
        } catch (error) {
            console.error(`Error processing file ${file}:`, error);
        }
    }
    return xml;
}

function getDefaultOption(feature) {
    //for now just getting the first one
    return feature.options[0].code;
}