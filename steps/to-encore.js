const csv = require('csv-parser');
const { Readable } = require('stream');

module.exports = async function toEncore(collection, range, partNumber, readFile, writeFile) {
  try {
    // Validate input parameters
    if (!collection || !range) throw new Error('Collection and range parameters are required');
    if (typeof partNumber !== 'string') throw new Error('Part number must be a string');

    // Read and parse all data sources in parallel
    const [products, features, upcharges] = await Promise.all([
      readProductData(readFile),
      readFeaturesData(readFile),
      readUpchargesData(readFile)
    ]);

    // Find matching product
    const product = products.find(p => p.ItemNumber === partNumber);
    if (!product) throw new Error(`Product "${partNumber}" not found in CSV data`);

    // Prepare Encore catalog structure
    const encoreData = {
      catalog: "SDL", //TODO: Confirm catalog name
      path: `${collection}/${range}`,
      partNumber: product.ItemNumber,
      description: product.Description,
      price: upcharges.basePrice, // Directly use base price from upcharges.json
      geometry: createGeometry(),
      props: extractProductProps(product),
      features: processFeatures(product, features)
    };

    // Generate safe filename and write output
    const fileName = generateSafeFilename(product.ItemNumber);
    await writeFile(`${fileName}.encore.json`, JSON.stringify(encoreData, null, 2));

  } catch (error) {
    console.error(`Error processing product "${partNumber}":`, error);
    throw error;
  }
};

// Data readers
async function readProductData(readFile) {
  const csvData = await readFile('product_data.csv');
  return new Promise((resolve, reject) => {
    const results = [];
    Readable.from(csvData)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function readFeaturesData(readFile) {
  const featuresRaw = await readFile('features.json');
  const features = JSON.parse(featuresRaw);
  if (!Array.isArray(features)) throw new Error('features.json must contain an array');
  return features;
}

async function readUpchargesData(readFile) {
  const upchargesRaw = await readFile('upcharges.json');
  const upcharges = JSON.parse(upchargesRaw);
  if (typeof upcharges.basePrice !== 'number') {
    throw new Error('upcharges.json must contain a numeric basePrice');
  }
  return upcharges;
}

// Feature processor
function processFeatures(product, features) {
  const result = [];
  
  // Process Frame features
  const frameFeature = features.find(f => f.name === 'Frame');
  if (frameFeature && product.Frame) {
    const frameOptions = processOptions(frameFeature, product.Frame);
    if (frameOptions) result.push(frameOptions);
  }

  // Process Shell features
  const shellFeature = features.find(f => f.name === 'Shell');
  if (shellFeature && product.Shell) {
    const shellOptions = processOptions(shellFeature, product.Shell);
    if (shellOptions) result.push(shellOptions);
  }

  return result;
}

function processOptions(feature, productValues) {
  const values = productValues.split(',').map(v => v.trim());
  const matchedOptions = feature.options.filter(option => 
    values.some(value => option.key.endsWith(`-${value}`))
  );

  if (!matchedOptions.length) return null;

  return {
    ...feature,
    options: matchedOptions.map(option => ({
      ...option,
      features: option.features ? deepClone(option.features) : []
    }))
  };
}

// Utilities
function deepClone(features) {
  return features.map(feature => ({
    ...feature,
    options: feature.options.map(option => ({
      ...option,
      features: option.features ? deepClone(option.features) : []
    }))
  }));
}

function extractProductProps(product) {
  const excluded = new Set(['id', 'ItemNumber', 'Description', 'Frame', 'Shell']);
  return Object.entries(product).reduce((acc, [key, value]) => {
    if (!excluded.has(key) && value !== '') {
      acc[key] = isNaN(value) ? value : Number(value);
    }
    return acc;
  }, {});
}

function createGeometry() {
  return { fileName: '', layers: [] };
}

function generateSafeFilename(partNumber) {
  return partNumber
    .replace(/[^a-zA-Z0-9-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}