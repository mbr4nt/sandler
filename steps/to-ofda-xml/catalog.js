const process = require('./process.js');
const path = require('path');

const template = path.join(__dirname, 'catalog.xml');

module.exports = async function(context) {
    return await process(template, context);
}