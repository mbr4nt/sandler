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

module.exports = async function applicationAreas(inputDir, outputDir) {
    //first copy everything
    copyFilesRecursively(inputDir, outputDir);

    const featuresInputPath = path.join(outputDir, 'features');
    const productsInputPath = path.join(inputDir, 'products');

    //find high level features
    let highLevelFeatures = [];

    //loop products
    const productFiles = fs.readdirSync(productsInputPath).filter(file => file.endsWith('.json'));

    for (const file of productFiles) {
        const productPath = path.join(productsInputPath, file);
        const product = JSON.parse(fs.readFileSync(productPath, 'utf8'));

        //get high level features
        highLevelFeatures = highLevelFeatures.concat(product.features);
    }

    //loop features
    const featureFiles = fs.readdirSync(featuresInputPath).filter(file => file.endsWith('.json'));
    for(const file of featureFiles) {
        const featurePath = path.join(featuresInputPath, file);
        const feature = JSON.parse(fs.readFileSync(featurePath, 'utf8'));

        //is it high level feature?
        if(highLevelFeatures.includes(feature.code)) {
            feature.materialApplicationArea = feature.code; //use code as application area name

            //save updated feature
            fs.writeFileSync(featurePath, JSON.stringify(feature, null, 2));
        }
    }

    let applicationAreas = highLevelFeatures.map(f => {
        //use the last bit lower case, like "ALTEA 2.0-Shell" -> "shell"
        const surfaceIdentifier = f.split('-').pop().toLowerCase();

        return {
            "code": f,
            surfaceIdentifier,
            "material": "undecided"
        }
    });

    //save file output/application-areas.json
    fs.writeFileSync(path.join(outputDir, 'application-areas.json'), JSON.stringify(applicationAreas, null, 2));

}
