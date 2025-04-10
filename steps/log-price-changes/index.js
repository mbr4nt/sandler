/**
 * This module recalculates product prices based on upcharges defined in `upcharges.json` and compares them
 * to the existing prices in `prices.csv`. It outputs a `price-updates.csv` file containing rows where the
 * recalculated price differs from the original price. The output includes:
 * - ProductStyleId: The unique identifier for the product style.
 * - VERProductConfigCombinationCode: The combination of option codes used to calculate the new price.
 * - oldPrice: The original price from `prices.csv`.
 * - newPrice: The recalculated price based on `upcharges.json`.
 * - difference: The difference between the new price and the old price.
 *
 */
const csv = require('csv-parser');

module.exports = async function logPriceChanges(collection, range, product, readFile, writeFile) {

    // Read the upcharges.json file
    const upchargesData = JSON.parse(await readFile('upcharges.json'));
    const { basePrice, upcharges } = upchargesData;

    // Read the prices.csv file
    const pricesStream = (await readFile('prices.csv'))
        .toString()
        .split('\n')
        .filter(line => line.trim() !== '') // Remove empty lines
        .join('\n'); // Rejoin into a single string

    const priceUpdates = [];

    await new Promise((resolve, reject) => {
        require('stream').Readable.from(pricesStream)
            .pipe(csv())
            .on('data', (row) => {
                const { ProductStyleId, VERProductConfigCombinationCode, Price } = row;
                const oldPrice = parseFloat(Price);

                // Calculate the new price based on the upcharges
                const styleComponents = VERProductConfigCombinationCode.split('/');
                let newPrice = basePrice;
                styleComponents.forEach(component => {
                    if (upcharges[component]) {
                        newPrice += upcharges[component];
                    }
                });

                // Round to 2 decimal places
                newPrice = Math.round(newPrice * 100) / 100;

                // Check if there's a price change
                if (newPrice !== oldPrice) {
                    priceUpdates.push({
                        ProductStyleId,
                        VERProductConfigCombinationCode,
                        oldPrice,
                        newPrice,
                        difference: newPrice - oldPrice
                    });
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });

    // Write the price-updates.csv file if there are any changes
    if (priceUpdates.length > 0) {
        const csvContent = [
            'ProductStyleId,VERProductConfigCombinationCode,oldPrice,newPrice,difference',
            ...priceUpdates.map(update => 
                `${update.ProductStyleId},${update.VERProductConfigCombinationCode},${update.oldPrice},${update.newPrice},${update.difference}`
            )
        ].join('\n');

        await writeFile('price-updates.csv', csvContent);
    }

    //pass files forward
    await writeFile('upcharges.json', await readFile('upcharges.json'));
    await writeFile('characteristics.csv', await readFile('characteristics.csv'));
    await writeFile('product_data.csv', await readFile('product_data.csv'));
};