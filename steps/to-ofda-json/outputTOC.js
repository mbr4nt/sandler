const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

function buildTree(data) {
    const tree = {};

    data.forEach(item => {
        const parts = item.path.split('/');
        let currentLevel = tree;

        parts.forEach((part, index) => {
            if (!currentLevel[part]) {
                currentLevel[part] = {};
            }
            currentLevel = currentLevel[part];

            // If it's the last part of the path, add the partNumber to an array
            if (index === parts.length - 1) {
                if (!currentLevel.partNumbers) {
                    currentLevel.partNumbers = [];
                }
                currentLevel.partNumbers.push(item.partNumber);
            }
        });
    });

    return tree;
}

function sortTree(tree) {
    const sortedTree = {};
    Object.keys(tree).sort().forEach(key => {
        if (typeof tree[key] === 'object' && !tree[key].partNumbers) {
            sortedTree[key] = sortTree(tree[key]);
        } else {
            // If partNumbers exists, replace the object with the array directly
            sortedTree[key] = tree[key].partNumbers;
        }
    });
    return sortedTree;
}

function arrayToHierarchyYaml(data) {
    // Build the tree
    const tree = buildTree(data);

    // Sort the tree alphabetically
    const sortedTree = sortTree(tree);

    // Convert the sorted tree to YAML
    const yamlString = yaml.dump(sortedTree, { noRefs: true, skipInvalid: true });

    return yamlString;
}


module.exports = async function(toc, outputDir) {

    console.log(toc);

    async function writeOutputFile(fileName, data) {
        try {
            const filePath = path.join(outputDir, fileName);
            const dirPath = path.dirname(filePath); // Get the directory path
    
            // Create the directory if it doesn't exist
            await fs.mkdir(dirPath, { recursive: true });
    
            // Write the file
            await fs.writeFile(filePath, data, 'utf8');
        } catch (error) {
            console.error(`Error writing file ${fileName}:`, error);
            throw error; // Re-throw the error if you want calling code to handle it
        }
    }

    tocYaml = arrayToHierarchyYaml(toc);

    //save to product file in outputDir/products/safeName(partNumber).json
    await writeOutputFile(`tableOfContents.yaml`, tocYaml);
}



