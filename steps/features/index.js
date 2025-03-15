const csv = require('csv-parser');

module.exports = async function features(collection, range, product, readFile, writeFile) {
    console.log(`Generating features for ${collection}/${range}/${product}`);

    // Read upcharges.json
    const upchargesData = JSON.parse(await readFile('upcharges.json'));
    const { basePrice, upcharges } = upchargesData;

    // Read characteristics.csv
    const characteristics = [];

    // Read the prices.csv file
    const csvStream = (await readFile('characteristics.csv'))
        .toString()
        .split('\n')
        .filter(line => line.trim() !== '') // Remove empty lines
        .join('\n'); // Rejoin into a single string

    require('stream').Readable.from(csvStream)
        .pipe(csv())
        .on('data', (row) => characteristics.push(row))
        .on('end', async () => {
            // Process the data
            const features = processCharacteristics(characteristics, upcharges, product);

            // Write the output to features.json
            await writeFile('features.json', JSON.stringify(features, null, 2));
            console.log(`Features generated for ${collection}/${range}/${product}`);

            //pass files forward
            await writeFile('upcharges.json', await readFile('upcharges.json'));
            await writeFile('product_data.csv', await readFile('product_data.csv'));
        });
};

function processCharacteristics(characteristics, upcharges, product) {
    const featuresMap = new Map();

    characteristics.forEach(row => {
        const {
            ProductNumber,
            CharacteristicShortCode,
            OptionShortCode,
            OptionName,
            OptionStatus,
            CharacteristicFriendlyName,
            CharacteristicName,
            OptionFriendlyName,
            FinishShortCodes
        } = row;

        if (OptionStatus !== 'Active') return;

        const featureKey = `${product}-${CharacteristicShortCode}`;
        const optionKey = `${CharacteristicShortCode}-${OptionShortCode}`;

        if (!featuresMap.has(featureKey)) {
            featuresMap.set(featureKey, {
                key: featureKey,
                name: CharacteristicFriendlyName || CharacteristicName,
                options: []
            });
        }

        const feature = featuresMap.get(featureKey);
        const option = {
            key: optionKey,
            name: OptionFriendlyName || OptionName,
            upcharge: upcharges[optionKey] || 0,
            features: []
        };

        const featureOptionKey = `${product}-${CharacteristicShortCode}-${OptionShortCode}`;
        const featureOption = {
            key: featureOptionKey,
            name: `${product}-${OptionFriendlyName || OptionName}`,
            options: FinishShortCodes ? FinishShortCodes.split(',').map(code => ({
                key: code.trim(),
                name: getFinishName(code.trim())
            })) : []
        };

        option.features.push(featureOption);
        feature.options.push(option);
    });

    return Array.from(featuresMap.values());
}

function getFinishName(finishCode) {
    // Placeholder function to get the finish name based on the finish code
    // You can implement this function based on your requirements
    return `Finish: ${finishCode}`;
}