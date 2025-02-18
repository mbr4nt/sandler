import fs from 'fs';
import csv from 'csv-parser';

export function parseProduct(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                results.push(data);
            })
            .on('end', () => {
                resolve(results); // Resolve the promise with the results
            })
            .on('error', (error) => {
                reject(error); // Reject the promise if there's an error
            });
    });
}