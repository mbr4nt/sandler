const fs = require('fs');
const path = require('path');
const forEachProduct = require('./forEachProduct.js');

// Import all steps from the "steps" folder
const steps = [
    require('./steps/create-folder-hierarchy'),
    forEachProduct(require('./steps/calculate-upcharges')),
    forEachProduct(require('./steps/log-price-changes')),
    forEachProduct(require('./steps/features')),
    forEachProduct(require('./steps/to-encore')),
];

// Define input and output base directories
const inputDir = path.join(__dirname, 'input');
const outputDir = path.join(__dirname, 'output');

// Function to wipe and recreate the output directory
function wipeOutputDirectory() {
  if (fs.existsSync(outputDir)) {
    // Remove the output directory and all its contents
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  // Recreate the output directory
  fs.mkdirSync(outputDir);
}

// Function to run the pipeline
async function runPipeline() {
  // Wipe the output directory before starting
  wipeOutputDirectory();

  let currentInputDir = inputDir;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    let stepName = `${i + 1}-${step.name}`; // e.g., "1-doSomeWork"
    if(step.name == "productStep"){
      stepName = `${i + 1}-${step.getName()}`;
    }

    const stepOutputDir = path.join(outputDir, stepName);

    // Ensure the step's output directory exists
    if (!fs.existsSync(stepOutputDir)) {
      fs.mkdirSync(stepOutputDir);
    }

    console.log(`Running step ${i + 1}: ${step.name}`);
    console.log(`Input: ${currentInputDir}`);
    console.log(`Output: ${stepOutputDir}`);

    // Execute the step
    await step(currentInputDir, stepOutputDir);

    // Update the input directory for the next step
    currentInputDir = stepOutputDir;
  }

  console.log('Pipeline completed successfully!');
}

// Run the pipeline
runPipeline().catch((err) => {
  console.error('Pipeline failed:', err);
});