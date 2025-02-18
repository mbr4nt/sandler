import { parseProduct } from "./parse-product.js";
import { parsePrice } from "./parse-price.js";
import { saveJson } from "./save-json.js";

export async function processProduct(fileKey, priceFile, productDataFile) {
    // Implement your logic here
    console.log(`Processing pair for key "${fileKey}": ${priceFile} and ${productDataFile}`);
    
    let csv = await parseProduct(productDataFile);
    csv = csv[0];
    console.log(csv);

    const product = {
        fileKey,
        uid: csv.id,
        name: csv.ItemNumber,
        description: csv.Description,
        price: await parsePrice(priceFile)
    }
    saveJson(`./processed/products/${fileKey}.json`, product);


}