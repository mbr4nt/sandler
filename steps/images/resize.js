const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Resizes a PNG image and saves it to the specified output path
 * @param {string} inputPath - Path to the input PNG file
 * @param {string} outputPath - Path to save the resized PNG
 * @param {Object} options - Resizing options
 * @param {number} [options.width] - New width (maintains aspect ratio if height not specified)
 * @param {number} [options.height] - New height (maintains aspect ratio if width not specified)
 * @param {string} [options.fit] - How the image should fit the new dimensions: 'cover', 'contain', 'fill', 'inside', or 'outside'
 * @param {string} [options.background] - Background color when using 'contain' (default: transparent)
 * @param {boolean} [options.withoutEnlargement] - Prevent enlarging the image if dimensions are smaller than original
 * @returns {Promise<string>} - Resolves with output path when complete
 * @throws {Error} - If input file doesn't exist or processing fails
 */
async function resizePng(inputPath, outputPath, options = {}) {
  // Validate input path
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file does not exist: ${inputPath}`);
  }

  // Validate output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Default options
  const resizeOptions = {
    fit: sharp.fit.inside,
    withoutEnlargement: true,
    ...options
  };

  // Process the image
  try {
    await sharp(inputPath)
      .resize(resizeOptions)
      .png({
        compressionLevel: 9, // Highest compression
        adaptiveFiltering: true,
        force: true // Force PNG output
      })
      .toFile(outputPath);
    
    return outputPath;
  } catch (err) {
    throw new Error(`Failed to resize image: ${err.message}`);
  }
}

module.exports = resizePng;