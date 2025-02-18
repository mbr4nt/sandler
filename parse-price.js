import fs from 'fs';
import csv from 'csv-parser';

export function parsePrice(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                // Extract frame and shell from VERProductConfigCombinationCode
                const options = data.VERProductConfigCombinationCode.split('/');

                // Create the desired object structure
                const item = {
                    uid: data.ProductStyleId,
                    product: data.ItemNumber,
                    currency: data.PriceCurrencyCode,
                    amount: parseFloat(data.Price),
                    options,
                };

                results.push(item);
            })
            .on('end', () => {
                resolve(results); // Resolve the promise with the results
            })
            .on('error', (error) => {
                reject(error); // Reject the promise if there's an error
            });
    });
}