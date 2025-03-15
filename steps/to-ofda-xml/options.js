const process = require('./process.js');
const fs = require('fs').promises;
const path = require('path');

const template = path.join(__dirname, 'option.xml');


module.exports = async function(context) {
    let xml = "";

    //loop
    let index = 1;
    for (const option of context.options) {
        option.sequence = index++;
        xml += await process(template, option);
        //add a line break
        xml += '\n';
    }
    return xml;
}