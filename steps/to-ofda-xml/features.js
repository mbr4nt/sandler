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

    //loop
    for (const file of files) {
        
        ///only read json files
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(featuresFolder, file);
        const data = await fs.readFile(filePath, 'utf8');
        const feature = JSON.parse(data);
        feature.defaultOption = getDefaultOption(feature);
        if(!feature.materialApplicationArea) feature.materialApplicationArea = ''; //avoiding undefined
        xml += await process(template, feature);

        //add a line break
        xml += '\n';
    }
    return xml;
}

function getDefaultOption(feature) {
    //for now just getting the first one
    return feature.options[0].code;
}