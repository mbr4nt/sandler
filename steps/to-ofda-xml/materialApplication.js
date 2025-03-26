module.exports = async function(context) {
    if(context.material) return `
<MaterialApplication>
    <MaterialRef>${context.material}</MaterialRef>
</MaterialApplication>
    `;
    return '';
}