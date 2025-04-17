const log = require('../../log.js');

async function isValidCSVString(csvString) {
    //check if the text contains the string "data available"
    if (csvString.includes('data available')) {
        return false;
    }
    return true;
  }

module.exports = async function basicValidation(collection, range, product, readFile, writeFile) {
    
    const tryOpen = async (filePath) => {
        try {
            const data = await readFile(filePath);
            if(!await isValidCSVString(data)) {
                log(`File ${filePath} for product ${product} is not a valid CSV file. contents: ${data}`);
                return null;
            }
            return data;
        }
        catch (error) {
            log(`Error opening file ${filePath}: ${error.message}`);
            return null;
        }
    }

    const ensure = async (filePaths) => {
        //ensure each file exists by trying to open it. if it works, pass it forward (AKA call writeFile)
        //if any fail, don't write anything forward. log the error.

        const filesToWrite = {};

        for (const filePath of filePaths) {
            const data = await tryOpen(filePath);
            if (data) {
                filesToWrite[filePath] = data;
            }
        }
        // If all files are valid, write them forward
        if(Object.keys(filesToWrite).length === filePaths.length) {
            for (const [filePath, data] of Object.entries(filesToWrite)) {
                await writeFile(filePath, data);
            }
        }
    }

    await ensure([
        'prices.csv',
        'characteristics.csv',
        'product_data.csv'
    ]);

};

