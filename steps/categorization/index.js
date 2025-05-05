const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const safeClassName = require('./safe-class-name.js');
const outputCMFile = require('./output-cm-file.js');



function copyFilesRecursively(srcDir, destDir) {
    // Ensure destination directory exists
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // Read all files and directories from source directory
    fs.readdirSync(srcDir).forEach(item => {
        const srcItem = path.join(srcDir, item);
        const destItem = path.join(destDir, item);

        if (fs.statSync(srcItem).isDirectory()) {
            // Recursively copy subdirectory
            copyFilesRecursively(srcItem, destItem);
        } else {
            // Copy file
            fs.copyFileSync(srcItem, destItem);
        }
    });
}

module.exports = async function categorization(inputDir, outputDir) {
    //first copy everything
    copyFilesRecursively(inputDir, outputDir);

    try {
        // Read the YAML file
        const filePath = path.join(inputDir, 'tableOfContents.yaml');
        const fileContents = fs.readFileSync(filePath, 'utf8');

        // Parse the YAML content
        const data = yaml.load(fileContents);

        let mainFunctionContent = `public void buildInclassLibrary(LibraryLimb parent, symbol pkg) { \n\t`;

        // Check if the 'Inclass' section exists
        if (data && data.Inclass) {
            // Iterate over each range in Inclass
            for (const [range, products] of Object.entries(data.Inclass)) {
                // Call the processRange function for each range
                await processRange(range, products);
                const safeRangeName = await safeClassName(range);
                const functionName = `build${safeRangeName}Library`;
                mainFunctionContent += `\n\t${functionName}(parent, pkg);`;
            }
            mainFunctionContent += `\n}`;
            await outputCMFile('inclass/buildInclassLibrary.cm', mainFunctionContent);
        } else {
            console.log("No 'Inclass' section found in the YAML file.");
        }
    } catch (error) {
        console.error('Error processing table of contents:', error);
    }

    // Example implementation of processRange (you'll replace this with your actual function)
    async function processRange(range, products) {
        await outputSnappers(range, products);
        await outputLibraryFunction(range, products);
    }
    
    async function outputSnappers(range, products) {
        const rangeSnapperName = await safeClassName(range);
        let rangeSnapperContent = `public class ${rangeSnapperName} extends InclassSnapper { }`;
        for(const product of products) {
            const productSnapperName = await safeClassName(product);
            const productSnapperContent = `

public class ${productSnapperName} extends ${rangeSnapperName} { 
    public constructor() {
        super("${product}");
    }
}`;
            rangeSnapperContent += productSnapperContent;
        }
        const rangeFilePath = `inclass/snappers/${rangeSnapperName}.cm`;
        outputCMFile(rangeFilePath, rangeSnapperContent);
        // Your actual processing logic here
    }

    async function outputLibraryFunction(range, products) {
        const safeRangeName = await safeClassName(range);
        const functionName = `build${safeRangeName}Library`;

        let content = `
public void ${functionName}(LibraryLimb parent, symbol pkg) {
    ToolGroupLimb group(parent, pkg, "${safeRangeName}-group-limb");
`;
        for (const product of products) {
            const productSnapperName = await safeClassName(product);
            content += `
    SnapperLimb(group, pkg, "${product}", image=inclassIcon("${product}"), label="${product}", spawner=InclassSnapperSpawner("${product}"), hint=productButtonMediumTallWithLabel);`;
        }
        content += `\n}`;
        await outputCMFile(`inclass/library/${functionName}.cm`, content);
    }
}





