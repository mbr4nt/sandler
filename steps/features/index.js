const csv = require('csv-parser');
const fs = require('fs').promises;
const path = require('path');

module.exports = async function features(collection, range, product, readFile, writeFile) {

    // Read upcharges.json
    const upchargesData = JSON.parse(await readFile('upcharges.json'));
    const { basePrice, upcharges } = upchargesData;

    // Read characteristics.csv
    const characteristics = [];
    const csvStream = (await readFile('characteristics.csv'))
        .toString()
        .split('\n')
        .filter(line => line.trim() !== '')
        .join('\n');

    require('stream').Readable.from(csvStream)
        .pipe(csv())
        .on('data', (row) => characteristics.push(row))
        .on('end', async () => {
            // Load finish data
            const finishes = await loadFinishData();

            // Process the data
            const features = processCharacteristics(characteristics, upcharges, product, finishes);

            // Write the output to features.json
            await writeFile('features.json', JSON.stringify(features, null, 2));

            // Pass files forward
            await writeFile('upcharges.json', await readFile('upcharges.json'));
            await writeFile('product_data.csv', await readFile('product_data.csv'));
        });
};

async function loadFinishData() {
    const materialsPath = path.join(__dirname, '../../input/materials');
    const files = await fs.readdir(materialsPath);
    const finishFile = files.find(file => file.startsWith('Dynamics-Finishes-Export'));
    if (!finishFile) {
        console.warn('No finishes file found!');
        return {};
    }

    const finishes = {};
    const filePath = path.join(materialsPath, finishFile);
    const csvData = await fs.readFile(filePath, 'utf8');
    require('stream').Readable.from(csvData)
        .pipe(csv())
        .on('data', (row) => {
            finishes[row.FinishShortCode.trim()] = row.FinishFriendlyName.trim();
        });

    return new Promise((resolve) => {
        setTimeout(() => resolve(finishes), 500); // Ensure data is fully loaded
    });
}

function processCharacteristics(characteristics, upcharges, product, finishes) {
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
                groupCode: CharacteristicFriendlyName || CharacteristicName,
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

        const featureOptionKey = `${CharacteristicShortCode}-${OptionShortCode}`;
        const groupCode = OptionFriendlyName || OptionName;
        const featureOption = {
            key: featureOptionKey,
            name: `${groupCode}`,
            options: FinishShortCodes ? FinishShortCodes.split(',').map(code => ({
                key: code.trim(),
                name: getFinishName(code.trim(), finishes),
                material: code.trim()
            })) : []
        };

        option.features.push(featureOption);
        feature.options.push(option);
    });

    return Array.from(featuresMap.values());
}

function getFinishName(finishCode, finishes) {
    return finishes[finishCode] || `Finish: ${finishCode}`;
}
