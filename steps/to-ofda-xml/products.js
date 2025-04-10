const { Builder } = require('xml2js');
const fs = require('fs').promises;
const path = require('path');

module.exports = async function(context) {
    
    const dataRoot = context.dataRoot;
    const productsFolder = path.join(dataRoot, 'products');
    let xml = "";
    
    try {
        await fs.access(productsFolder); // Check if the folder is accessible
    } catch (error) {
        // If the folder doesn't exist, log a warning and return an empty string
        console.warn(`The materials folder does not exist at: ${productsFolder}`);
        return xml; // Return empty string since there's nothing to process
    } 
    // Read every JSON file in the folder
    try {
        const files = await fs.readdir(productsFolder);

        // Loop through each file
        for (const file of files) {
            // Only process JSON files
            if (!file.endsWith('.json')) continue;

            const filePath = path.join(productsFolder, file);
            const data = await fs.readFile(filePath, 'utf8');
            xml += jsonToXml(JSON.parse(data)); 

            // Add a line break
            xml += '\n';
        }

    } catch (error) {
        console.error(`Error reading files from the materials folder: ${error.message}`);
        throw error; // Re-throw the error to handle it at a higher level
    }

    return xml;
}

function jsonToXml(json) {
    const builder = new Builder({
        renderOpts: { pretty: true, indent: '\t', newline: '\n' },
        headless: true,
    });

    // Prepare external references
    const externalReferences = json.externalReferences.map(ref => ({
        ExternalReference: {
            FileURI: ref.fileUri,
            Usage: {
                Type: ref.usage.type,
                Quality: ref.usage.quality,
            },
        },
    }));

    // Prepare features - assuming json.features is an array
    const features = Array.isArray(json.features) ? 
        json.features.map((feature, index) => ({
            $: { Sequence: index + 1 },
            FeatureRef: feature,
        })) : 
        [{
            $: { Sequence: 1 },
            FeatureRef: json.features,
        }];

    const xmlObject = {
        Product: {
            Code: json.code,
            Description: {
                $: { Language: 'en-US' },
                _: json.description,
            },
            Price: {
                PriceListRef: json.prices[0].priceList,
                Value: json.prices[0].value,
            },
            ProductExternalReference: externalReferences,
            MirrorAngleOfSymmetry: 90, // Hardcoded as per example
            Features: features,
            ProductPropertyVisibility: 1, // Hardcoded as per example
        },
    };

    return builder.buildObject(xmlObject);
}