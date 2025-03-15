const process = require('./process.js');
const fs = require('fs').promises;
const path = require('path');

const template = path.join(__dirname, 'option-price.xml');


module.exports = async function(context) {
    let xml = "";

    //loop
    if(!context.optionPrices) return '';
    for (const upcharge of context.upcharges) {
        xml += await process(template, upcharge);
        //add a line break
        xml += '\n';
    }
    return xml;
}