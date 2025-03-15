const process = require('./process.js');
const path = require('path');

const template = path.join(__dirname, 'price-list.xml');


module.exports = async function(context) {
    let xml = "";
    for(priceList of context.priceLists) {
        xml += await process(template, priceList);
    }
    return xml;
}