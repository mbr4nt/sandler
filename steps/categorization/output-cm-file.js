const fs = require('fs');
const path = require('path');

module.exports = async function outputCMFile(filePath, contents) {

    //append ./cm-header.txt then contents, save to filePath
    const headerPath = path.join(__dirname, 'cm-header.txt');
    const headerContents = fs.readFileSync(headerPath, 'utf8');
    
    //cm package is "custom.sandler." plus the filePath dir but replacing / with .
    const cmPackage = 'custom.sandler.' + path.dirname(filePath).replace(/\\/g, '.').replace(/\//g, '.');
    
    const outputContents = `${headerContents}\npackage ${cmPackage};\n${contents}`;
    
    
    // Write the file
    const cmRoot = path.join(__dirname, '..', '..', 'output', 'cm');
    const cmFilePath = path.join(cmRoot, filePath);

    //ensure folder exists
    const dirPath = path.dirname(cmFilePath); // Get the directory path
    // Create the directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    console.log(`Writing CM file to ${cmFilePath}`);
    fs.writeFileSync(cmFilePath, outputContents, 'utf8');
}