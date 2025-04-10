const csv = require('csv-parser');
const log = require('../../log.js');
module.exports = async function calculateUpcharges(collection, range, product, readFile, writeFile) {

    const pricesFilePath = 'prices.csv';
    const upchargesFilePath = 'upcharges.json';

    const prices = [];

    // Read and parse the prices.csv file
    const pricesData = await readFile(pricesFilePath);
    const pricesStream = csv({
        mapHeaders: ({ header }) => header.trim(),
        mapValues: ({ value }) => value.trim()
    });

    let success = true;

    if (pricesData == "\"No data available\"") {
        await log(`No data found in ${pricesFilePath}.`, 'error');
        success = false;
    }

    pricesStream.write(pricesData);
    pricesStream.end();

    pricesStream
        .on('data', (row) => {
            prices.push({
                price: parseInt(row.Price, 10),
                configCombination: row.VERProductConfigCombinationCode
            });
        })
        .on('end', async () => {

            if (prices.length == 0) {
                log(`No prices found for ${collection}/${range}/${product}.`);
            } else {


                // Determine the base price (lowest price)
                const basePrice = Math.min(...prices.map(p => p.price));
                const roundedBasePrice = Math.round(basePrice / 10) * 10;

                // Group prices by their configuration options
                const optionGroups = {};

                prices.forEach(p => {
                    const options = p.configCombination.split('/');
                    options.forEach(option => {
                        const [category, optionId] = option.split('-');
                        if (!optionGroups[category]) {
                            optionGroups[category] = {};
                        }
                        if (!optionGroups[category][optionId]) {
                            optionGroups[category][optionId] = [];
                        }
                        optionGroups[category][optionId].push(p.price);
                    });
                });

                // Calculate initial upcharges for each option
                const upcharges = {};

                for (const category in optionGroups) {
                    const options = optionGroups[category];
                    const optionPrices = Object.values(options).map(prices => Math.min(...prices));
                    const minOptionPrice = Math.min(...optionPrices);

                    for (const optionId in options) {
                        const optionPrice = Math.min(...options[optionId]);
                        const upcharge = optionPrice - minOptionPrice;
                        upcharges[`${category}-${optionId}`] = Math.round(upcharge / 10) * 10;
                    }

                    // Ensure at least one option in the category has a charge of zero
                    const cheapestOptionId = Object.keys(options).find(optionId =>
                        Math.min(...options[optionId]) === minOptionPrice
                    );
                    upcharges[`${category}-${cheapestOptionId}`] = 0;
                }

                // Identify cheapest options per category
                const cheapestOptions = new Set();
                for (const category in optionGroups) {
                    const options = optionGroups[category];
                    let minPrice = Infinity;
                    let cheapestOptionKey = null;
                    for (const optionId in options) {
                        const optionKey = `${category}-${optionId}`;
                        if (upcharges[optionKey] === 0) {
                            cheapestOptions.add(optionKey);
                            break; // Each category has one cheapest
                        }
                    }
                }

                // Track maximum increases for non-cheapest options
                const maxIncreases = {};
                for (const priceInfo of prices) {
                    const { price: originalPrice, configCombination } = priceInfo;
                    const options = configCombination.split('/');
                    let sumUpcharge = options.reduce((sum, option) => sum + (upcharges[option] || 0), 0);
                    const requiredUpcharge = originalPrice - basePrice;
                    const deficit = requiredUpcharge - sumUpcharge;

                    if (deficit > 0) {
                        const nonCheapestOptions = options.filter(option => !cheapestOptions.has(option));
                        if (nonCheapestOptions.length === 0) {
                            log(`Configuration ${configCombination} requires upcharge ${requiredUpcharge} but has no non-cheapest options.`);
                            continue;
                        }

                        const perOptionIncrease = Math.ceil(deficit / nonCheapestOptions.length / 10) * 10;
                        nonCheapestOptions.forEach(option => {
                            maxIncreases[option] = Math.max(maxIncreases[option] || 0, perOptionIncrease);
                        });
                    }
                }

                // Apply the maximum increases to non-cheapest options
                Object.entries(maxIncreases).forEach(([option, increase]) => {
                    upcharges[option] = (upcharges[option] || 0) + increase;
                });

                // Ensure upcharges are rounded and categories have a zero option
                for (const category in optionGroups) {
                    const options = optionGroups[category];
                    let hasZero = false;

                    // Round and check for zero
                    Object.keys(options).forEach(optionId => {
                        const optionKey = `${category}-${optionId}`;
                        upcharges[optionKey] = Math.round(upcharges[optionKey] / 10) * 10;
                        if (upcharges[optionKey] === 0) hasZero = true;
                    });

                    if (!hasZero) {
                        console.error(`Category ${category} has no zero upcharge; adjusting.`);
                        let minUpcharge = Infinity;
                        let minOptionKey = null;
                        Object.keys(options).forEach(optionId => {
                            const optionKey = `${category}-${optionId}`;
                            if (upcharges[optionKey] < minUpcharge) {
                                minUpcharge = upcharges[optionKey];
                                minOptionKey = optionKey;
                            }
                        });
                        if (minOptionKey) upcharges[minOptionKey] = 0;
                    }
                }

                // Write the upcharges.json file
                const upchargesData = {
                    basePrice: roundedBasePrice,
                    upcharges: upcharges
                };


                if (success) {
                    await writeFile(upchargesFilePath, JSON.stringify(upchargesData, null, 2));
                    await writeFile('prices.csv', await readFile('prices.csv'));
                    await writeFile('characteristics.csv', await readFile('characteristics.csv'));
                    await writeFile('product_data.csv', await readFile('product_data.csv'));
                }
            }
        });
};