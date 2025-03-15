const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

module.exports = async function createFolderHierarchy(inputDir, outputDir) {
  // Read all files from the input directory (including subdirectories)
  const files = getAllFiles(inputDir);

  // Group files by product key
  const fileGroups = groupFilesByProductKey(files);

  // Process each group
  for (const group of fileGroups) {
    const productDataFile = group.find(file => file.toLowerCase().includes('_product_data.csv'));
    if (!productDataFile) {
      console.warn(`No product_data.csv found for group: ${group.join(', ')}`);
      continue;
    }

    // Extract product information from product_data.csv
    const productInfo = await extractProductInfo(productDataFile);
    if (!productInfo) {
      console.warn(`Failed to extract product info from: ${productDataFile}`);
      continue;
    }

    // Create the output directory structure
    const outputPath = path.join(outputDir, productInfo.collection, productInfo.range, productInfo.ItemNumber);
    fs.mkdirSync(outputPath, { recursive: true });

    // Move files to the new directory
    for (const file of group) {
      const fileName = path.basename(file).toLowerCase();
      let newFileName;

      if (fileName.includes('_product_data.csv')) {
        newFileName = 'product_data.csv';
      } else if (fileName.includes('_prices.csv')) {
        newFileName = 'prices.csv';
      } else if (fileName.includes('_characteristics.csv')) {
        newFileName = 'characteristics.csv';
      } else {
        console.warn(`Unexpected file in group: ${file}`);
        continue;
      }

      const newFilePath = path.join(outputPath, newFileName);
      fs.copyFileSync(file, newFilePath);
      console.log(`Moved: ${file} -> ${newFilePath}`);
    }
  }

  console.log('Folder hierarchy creation completed.');
};

// Helper function to recursively get all files in a directory
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Helper function to group files by product key
function groupFilesByProductKey(files) {
  const groups = new Map();

  for (const file of files) {
    const fileName = path.basename(file).toLowerCase();
    const productKeyMatch = fileName.match(/^(.+)_(product_data|prices|characteristics)\.csv$/);
    if (productKeyMatch) {
      const productKey = productKeyMatch[1];
      if (!groups.has(productKey)) {
        groups.set(productKey, []);
      }
      groups.get(productKey).push(file);
    }
  }

  return Array.from(groups.values());
}

// Helper function to extract product info from product_data.csv
function extractProductInfo(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        if (results.length > 0) {
          resolve(results[0]); // Assuming the first row contains the product info
        } else {
          resolve(null);
        }
      })
      .on('error', (err) => reject(err));
  });
}