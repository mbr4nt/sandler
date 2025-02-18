import saveFile from './save-file.js'; // Assuming save-file.js is the async ES module from the previous example
import { saveJson } from './save-json.js';
const tab = '   ';

export default async function exportToSif(catalog) {
    await Promise.all([
        generateFile1(catalog),
        generateFile2(catalog),
        generateFile3(catalog),
        generateFileMON(catalog),
        generateFilePLI(catalog),
    ]);
}

async function generateFile3(catalog) {
    let catalogKey = catalog.key;
    let filename = `./processed/sif/${catalogKey}.3`;
    let content = '';
    let map = {};
    for (let product of catalog.products) {
        for (let feature of product.features) {
            addFeatureToMap(map, feature);
        }
    }
    for (let key in map) {
        let feature = map[key];
        content += `PO=${key}\n`;
        content += `OG=${feature.name}\n`;
        if (feature.options) for (let options of feature.options) {
            content += `ON=${options.key}\n`;
            content += `OD=${options.name}\n`;
            if (options.upcharge)
                content += `O1=${options.upcharge.toFixed(2)}\n`;
            if (options.features) for (let subfeature of options.features) {
                content += `SO=${subfeature.key}\n`; //TODO: what if there are more than one? what sif key to use?
            }
        }
    }
    await saveFile(content, filename);
}

async function generateFileMON(catalog) {
    let catalogKey = catalog.key;
    let filename = `./processed/sif/${catalogKey}.MON`;
    let content = '';
    let map = {};
    for (let product of catalog.products) {
        for (let feature of product.features) {
            addFeatureToMap(map, feature);
        }
    }
    for (let key in map) {
        let feature = map[key];
        content += `PO=${key}\n`;
        content += `OG=${feature.name}\n`;
        if (feature.layer)
            content += `3DLA=${feature.layer}\n`;
        if (feature.options) for (let option of feature.options) {
            content += `ON=${option.key}\n`;
            content += `OD=${option.name}\n`;
            if (option.material)
                content += `IM=${option.material}\n`;
        }
    }
    await saveFile(content, filename);
}

async function generateFilePLI(catalog) {
    let catalogKey = catalog.key;
    let filename = `./processed/sif/${catalogKey}.PLI`;
    let content = '';
    for (let product of catalog.products) {
        if (product.geometry)
            if (product.geometry.layers) for (let layer of product.geometry.layers) {
                content += `PN=${product.model}\n`;
                content += `3DLA=${layer.name}\n`;
                content += `IM=${layer.material}\n`;
            }
    }
    await saveFile(content, filename);
}

function addFeatureToMap(map, feature) {
    //TODO: detect bad duplicates
    if (!map[feature.key]) {
        map[feature.key] = [];
    }
    map[feature.key] = feature;
    for (let options of feature.options) {
        if (options.features) for (let subfeature of options.features) {
            addFeatureToMap(map, subfeature);
        }
    }
}

async function generateFile2(catalog) {
    let catalogKey = catalog.key;
    let filename = `./processed/sif/${catalogKey}.2`;
    let content = '';
    for (let product of catalog.products) {
        content += `PN=${product.model}\n`;
        content += `PD=${product.description}\n`;
        content += `P1=${product.price}\n`;
        let index = 0;
        for (let feature of product.features) {
            content += `G${index}=${feature.key}\n`;
            index++;
        }
        if (product.geometry)
            content += `3D=${product.geometry.fileName}\n`;
    }
    await saveFile(content, filename);
}

async function generateFile1(catalog) {
    let catalogKey = catalog.key;
    let catalogName = catalog.name;
    let filename = `./processed/sif/${catalogKey}.1`;
    let content = `SL=${catalogName}\n`;
    let paths = [];
    let map = {};
    for (let product of catalog.products) {
        let path = product.path; // Assuming each product has a `path` property
        paths.push(path);
        if (!map[path]) {
            map[path] = [];
        }
        map[path].push(product.model);
    }
    content += await buildHierarchy(paths, `SL=${tab}`, map);

    await saveFile(content, filename);
}

async function buildHierarchy(paths, prefix, map) {
    const hierarchy = {};

    paths.forEach(path => {
        const parts = path.split("/"); // Split the path into parts
        let currentLevel = hierarchy; // Start at the root level of the hierarchy

        parts.forEach(part => {
            if (!currentLevel[part]) {
                currentLevel[part] = {}; // Create a new level if it doesn't exist
            }
            currentLevel = currentLevel[part]; // Move to the next level
        });
    });

    await saveJson('./processed/hierarchy.json', hierarchy);

    function formatHierarchy(obj, level = 0, path="") {
        if(Object.keys(obj).length > 0) {
            let result = "";
            for (const key in obj) {
                result += `SL=${tab}${tab.repeat(level)}${key}\n`;
                result += formatHierarchy(obj[key], level + 1, `${path}${key}/`);
            }
            if(result) return `${result}`;
            else return "cu";
        }
        else return printPath(path);
    }

    function printPath(path) {
        let content = "";
        if (path.endsWith("/")) {
            path = path.substring(0, path.length - 1);
        }
        let models = map[path];
        for (let model of models) {
            content += `PN=${model}\n`;
        }
        return content;
    }

    return formatHierarchy(hierarchy);
}