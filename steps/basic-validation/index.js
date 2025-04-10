const log = require('../../log.js');

module.exports = async function basicValidation(collection, range, product, readFile, writeFile) {
    
    const tryOpen = async (filePath) => {
        try {
            const data = await readFile(filePath);
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

