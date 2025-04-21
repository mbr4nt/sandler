const fs = require('fs').promises;
const path = require('path');

module.exports = async function (product, outputDir) {

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

    const partNumber = product.partNumber;

    let productOutput = {
        code: partNumber,
        description: product.description,
        prices: [
            {
                priceList: "P1",
                value: product.price
            }
        ],
        externalReferences: [
            {
                fileUri: product.geometry.fileName,
                usage: {
                    type: "3DAndPlanView",
                    quality: "Medium"
                }
            },
            {
                fileUri: `${partNumber}.png`,
                usage: {
                    type: "NavigationImage",
                    quality: "Medium"
                }
            }
        ],
        features: product.features.map(feature => feature.key)
    };

    //save to product file in outputDir/products/safeName(partNumber).json
    await writeOutputFile(`products/${makeSafeFileName(partNumber)}.json`, JSON.stringify(productOutput, null, 2));

    return productOutput;
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


