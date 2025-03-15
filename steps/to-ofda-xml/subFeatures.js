const process = require('./process.js');
const fs = require('fs').promises;
const path = require('path');

const template = path.join(__dirname, 'sub-feature.xml');


module.exports = async function(context) {
    let xml = "";
    if(!context.subFeatures) return '';
    for(const featureCode of context.subFeatures) {
        xml += await process(template, {
            featureCode
        });
        xml += '\n';
    }
    return xml;
}