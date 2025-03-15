const fs = require('fs').promises;
const path = require('path');
const processFolder = require('../../processFolder.js');
const forEachProduct = require('../../forEachProduct.js');
const outputProduct = require('./outputProduct.js');



module.exports = async function toOfdaJson(inputDir, outputDir) {
    const catalogCode = "SIC";

    async function processProduct(collection, range, product, readFile, writeFile) {

        async function processFeature(feature) {

            const safeName = makeSafeFileName(feature.key);

            for (option of feature.options) {
                for (subFeature of option.features) {
                    processFeature(subFeature);
                }

                //if option has material, create a file ${option.material}.json with { "code": option.material }
                if(option.material) {
                    await writeOutputFile(`materials/${makeSafeFileName(option.material)}.json`, JSON.stringify({ "code": option.material }, null, 2));
                }
            }

            let featureOutput = {
                "code": feature.key,
                "description": feature.name,
                "groupCode": feature.groupCode,
                "options": formatOptions(feature)
            };
            if(feature.upchage) {
                featureOutput.upcharges = [
                    {
                        "priceList": "P1",
                        "value": feature.upcharge
                    }
                ];
            }

            await writeOutputFile(`features/${safeName}.json`, JSON.stringify(featureOutput, null, 2));
        }

        const encoreData = JSON.parse(await readFile('encore.json'));
        await outputProduct(encoreData, outputDir);
        for (feature of encoreData.features) {
            await processFeature(feature);
        }
    }

    async function writeOutputFile(fileName, data) {
        try {
            const filePath = path.join(outputDir, fileName);
            const dirPath = path.dirname(filePath); // Get the directory path

            // Create the directory if it doesn't exist
            await fs.mkdir(dirPath, { recursive: true });

            // Write the file
            await fs.writeFile(filePath, data, 'utf8');
        } catch (error) {
            console.error(`Error writing file ${fileName}:`, error);
            throw error; // Re-throw the error if you want calling code to handle it
        }
    }

    ///write the index file
    
    const indexData = {
        "enterprise": {
            "code": "SDL",
            "name": "Sandler Seating",
            "description": "Sandler Seating",
            "vendor": {
                "code": "SDL",
                "name": "Sandler",
                "description": "Sandler!!!"
            }
        },
        "catalog": {
            "code": catalogCode,
            "version": "1",
            "name": "Sandler Inclass",
            "description": "Sandler Inclass"
        },
        "priceLists": [
            {
                "code": "P1",
                "currency": "USD",
                "description": "Price List 1"
            }
        ],
        "resourcesPath": "c:\\temp"
    };
    writeOutputFile(`index.json`, JSON.stringify(indexData, null, 2));

    const productStep = forEachProduct(processProduct);
    await productStep(inputDir, outputDir);
}

function makeSafeFileName(input) {
    // Replace invalid characters with an underscore
    const safeName = input.replace(/[<>:"/\\|?*]+/g, '_');

    // Remove leading and trailing spaces
    const trimmedName = safeName.trim();

    // Ensure the name is not empty
    if (!trimmedName) {
        throw new Error('The resulting file name is empty after sanitization.');
    }

    return trimmedName;
}

function formatOptions(feature) {
    return feature.options.map(option => {
        let optionOutput = {
            "code": option.key,
            "description": option.name,
            "subFeatures": option.features.map(subFeature => subFeature.key)
        };
        if(option.material) {
            optionOutput.material = option.material;
        }
        return optionOutput;
    });
}
