const fs = require('fs');
const path = require('path');



function copyFilesRecursively(srcDir, destDir) {
    // Ensure destination directory exists
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // Read all files and directories from source directory
    fs.readdirSync(srcDir).forEach(item => {
        const srcItem = path.join(srcDir, item);
        const destItem = path.join(destDir, item);
        
        if (fs.statSync(srcItem).isDirectory()) {
            // Recursively copy subdirectory
            copyFilesRecursively(srcItem, destItem);
        } else {
            // Copy file
            fs.copyFileSync(srcItem, destItem);
        }
    });
}

module.exports = async function addUndecided(inputDir, outputDir) {
    //first copy everything
    copyFilesRecursively(inputDir, outputDir);

    const featuresInputPath = path.join(inputDir, 'features');
    const featuresOutputPath = path.join(outputDir, 'features');
    const materialsOutputPath = path.join(outputDir, 'materials');

    let undecidedOption = {
        "code": "~",
        "description": "Undecided",
        "material": "~"
    }

    //save undecided.json in materials folder
    fs.writeFileSync(path.join(materialsOutputPath, 'undecided.json'), JSON.stringify({
        "code": undecidedOption.code,
        "uri": "undecided.gm",
        "description": undecidedOption.description
    }, null, 2));


    //loop features
    const files = fs.readdirSync(featuresInputPath).filter(file => file.endsWith('.json'));

    for (const file of files) {
        const featurePath = path.join(featuresInputPath, file);
        const feature = JSON.parse(fs.readFileSync(featurePath, 'utf8'));

        //add undecided option to subfeatures at first place if it has more than one option
        if(feature.options.length > 1)
            feature.options.unshift(undecidedOption);

        //save updated feature
        const outputFilePath = path.join(featuresOutputPath, file);
        fs.writeFileSync(outputFilePath, JSON.stringify(feature, null, 2));
    }
}
