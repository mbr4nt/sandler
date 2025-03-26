const fs = require('fs');
const fsPromise = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');

function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        let map = {};
        let groups = [];
        let groupSet = new Map();

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const normalizedRow = Object.fromEntries(
                    Object.entries(row).map(([key, value]) => [key.trim().replace(/"/g, ''), value])
                );
            
                const id = normalizedRow.ID; 
                const title = normalizedRow.Title;
                const finishes = normalizedRow.Finishes_finish ? normalizedRow.Finishes_finish.split('|') : [];
                

                if (!groupSet.has(id)) {
                    groupSet.set(id, { id, title });
                    groups.push({ id, title });
                }

                finishes.forEach(finish => {
                    const finishCode = finish.split('-')[0];
                    if (finishCode) {
                        map[finishCode] = id;
                    }
                });
            })
            .on('end', () => resolve({ map, groups }))
            .on('error', reject);
    });
}

function processFeature(feature, map, groups) {
    let validOptions = feature.options.filter(option =>
        option.subFeatures.length === 0 &&
        option.material &&
        map[option.code.toLowerCase()]
    );

    if (validOptions.length === 0) return [feature];

    let groupedOptions = {};
    validOptions.forEach(option => {
        let groupId = map[option.code.toLowerCase()];
        if (!groupedOptions[groupId]) {
            groupedOptions[groupId] = [];
        }
        groupedOptions[groupId].push(option);
    });

    let rootFeature = {
        ...feature,
        options: Object.keys(groupedOptions).map(groupId => {
            let group = groups.find(g => g.id == groupId);
            return {
                code: `${feature.code}-${groupId}`,
                description: group.title,
                subFeatures: [`${feature.code}-${groupId}`]
            };
        })
    };

    let newFeatures = Object.keys(groupedOptions).map(groupId => {
        let group = groups.find(g => g.id == groupId);
        return {
            code: `${feature.code}-${groupId}`,
            description: group.title,
            groupCode: group.title,
            options: groupedOptions[groupId]
        };
    });

    return [rootFeature, ...newFeatures];
}

function safeFeatureName(code) {
    return code.replace(/[^a-zA-Z0-9_-]/g, '_');
}

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

module.exports = async function groupFabrics(inputDir, outputDir) {
    //first copy everything
    copyFilesRecursively(inputDir, outputDir);

    //then delete features folder from output
    const featuresPath = path.join(outputDir, 'features');
    await fs.rmSync(featuresPath, { recursive: true, force: true });



    const materialsPath = path.join(__dirname, '../../input/materials');
    const inputFiles = await fsPromise.readdir(materialsPath);
    const finishFile = inputFiles.find(file => file.startsWith('Dynamics-Finish-Sets-Export'));
    let { map, groups } = await parseCSV(path.join(__dirname, '../../input/materials', finishFile));

    const inputPath = path.join(inputDir, 'features');
    const outputPath = path.join(outputDir, 'features');

    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }
    

    const files = fs.readdirSync(inputPath).filter(file => file.endsWith('.json'));



    for (const file of files) {
        const featurePath = path.join(inputPath, file);
        const feature = JSON.parse(fs.readFileSync(featurePath, 'utf8'));

        const processedFeatures = processFeature(feature, map, groups);
        if (processedFeatures) {
            processedFeatures.forEach(f => {
                const safeName = safeFeatureName(f.code);
                const outputFilePath = path.join(outputPath, `${safeName}.json`);
                fs.writeFileSync(outputFilePath, JSON.stringify(f, null, 2));
            });
        }
    }
}
