const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { Builder } = require('xml2js');

module.exports = async function(context) {
    const dataRoot = context.dataRoot;
    const tocYamlPath = path.join(dataRoot, 'tableOfContents.yaml');

    return yamlToXml(tocYamlPath, context.enterprise.code, context.enterprise.vendor.code);
}

function yamlToXml(yamlFilePath, enterprise, vendor) {
    // Read the YAML file
    const yamlContent = fs.readFileSync(yamlFilePath, 'utf8');
    const data = yaml.load(yamlContent);

    // Initialize XML builder
    const xmlBuilder = new Builder({ rootName: 'TableOfContents', headless: true });

    // Recursive function to build XML
    function buildXml(node, levelCode = 0) {
        const levels = [];

        Object.keys(node).forEach((key, index) => {
            const value = node[key];
            const isLeaf = Array.isArray(value);

            if (isLeaf) {
                // If it's a leaf node (array of partNumbers), create ProductRef elements
                const productRefs = value.map(partNumber => ({
                    EnterpriseRef: enterprise,
                    VendorRef: vendor,
                    ProductCode: partNumber,
                    SelectionDescription: { $: { Language: 'en-US' }, _: partNumber }
                }));

                levels.push({
                    Code: levelCode + index,
                    UILevel: 'undefined',
                    Description: { $: { Language: 'en-US' }, _: key },
                    ProductRef: productRefs
                });
            } else {
                // If it's a nested level, recurse
                const nestedLevels = buildXml(value, levelCode + index);
                levels.push({
                    Code: levelCode + index,
                    UILevel: 'undefined',
                    Description: { $: { Language: 'en-US' }, _: key },
                    Level: nestedLevels
                });
            }
        });

        return levels;
    }

    // Build the XML structure
    const xmlStructure = buildXml(data);

    // Create the root TableOfContents element
    const root = {
        Level: xmlStructure
    };

    // Convert the structure to XML
    const xml = xmlBuilder.buildObject(root);

    return xml;
}