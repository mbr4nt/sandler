module.exports = async function(context) {
    if(context.materialApplicationArea) return `
<MaterialApplication>
    <MaterialRef>${context.material}</MaterialRef>
</MaterialApplication>
    `;
    return '';
}