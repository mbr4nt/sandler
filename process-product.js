import { parseProduct } from "./parse-product.js";
import { parsePrice } from "./parse-price.js";
import { saveJson } from "./save-json.js";

export async function processProduct(fileKey, priceFile, productDataFile) {
    // Implement your logic here
    console.log(`Processing pair for key "${fileKey}": ${priceFile} and ${productDataFile}`);
    
    const csv = await parseProduct(productDataFile);
    const row = csv[0];
    const prices = await parsePrice(priceFile);
    
    for (const price of prices) {
        const model = `${row.ItemNumber}:${price.uid}`;
        const product = {
            model,	
            path: `${row.collection}/${row.range}/${row.ItemNumber}`,
            name: row.ItemNumber,
            description: row.Description,
            price: price.amount,
            features: processFeatures(model, price.options),
        }
        saveJson(`./processed/products/${row.ItemNumber}-${price.uid}.json`, product);
    }
}

function processFeatures(model, options) {
    const features = [];
    for (const option of options) {
        const [name, value] = option.split("-");
        features.push({
            key: `${model}-${option}`,
            name,
            options: [ ///TODO: this is fake
                {
                    "key": "WL",
                    "name": "Wood grain plastic laminate",
                    "upcharge": 0,
                    "features": []
                }
            ]
        });
    }
    return features;
}