const process = require('./process.js');
const path = require('path');
const fs = require('fs').promises;

module.exports = async function toOfdaJson(inputDir, outputDir) {

    const templatePath = path.join(__dirname, 'root.xml');
    const dataRoot = inputDir;
    const contextPath = path.join(dataRoot, 'index.json');
    const contextData = await fs.readFile(contextPath, 'utf8');
    const context = JSON.parse(contextData);
    context.dataRoot = dataRoot;
    const result = await process(templatePath, context);
    //save to ./output/GLS.xml
    const outputPath = path.join(outputDir, 'SIC.xml');
    await fs.writeFile(outputPath, result);

    console.log(result);

}