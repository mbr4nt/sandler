/**
 * Converts a string into a Java-safe class name.
 * - Ensures the name starts with a letter or underscore
 * - Removes or replaces invalid characters
 * - Handles empty strings
 * - Preserves camelCase if present
 * 
 * @param {string} input - The input string to convert
 * @returns {string} A valid Java class name
 */
function toJavaClassName(input) {
    if (!input || typeof input !== 'string') {
        return 'GeneratedClassName';
    }

    // Trim whitespace
    let result = input.trim();
    
    if (result.length === 0) {
        return 'GeneratedClassName';
    }

    // Replace invalid characters with underscores
    result = result.replace(/[^a-zA-Z0-9_$]/g, '_');
    
    // Ensure the first character is valid (letter or underscore)
    if (!/^[a-zA-Z_$]/.test(result)) {
        result = '_' + result;
    }
    
    // Remove multiple consecutive underscores
    result = result.replace(/_+/g, '_');
    
    // Remove leading/trailing underscores (unless it's the only character)
    if (result.length > 1) {
        result = result.replace(/^_+|_+$/g, '');
        if (result.length === 0) {
            result = 'GeneratedClassName';
        }
    }
    
    // Convert to camel case if it contains underscores
    if (result.includes('_')) {
        result = result.split('_')
            .filter(part => part.length > 0)
            .map((part, i) => 
                i === 0 
                    ? part.charAt(0).toLowerCase() + part.slice(1)
                    : part.charAt(0).toUpperCase() + part.slice(1)
            )
            .join('');
    }
    
    // Capitalize the first letter for class name convention
    if (result.length > 0) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
    }
    
    // Ensure the name isn't a Java reserved keyword
    const javaKeywords = new Set([
        'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 
        'char', 'class', 'const', 'continue', 'default', 'do', 'double', 
        'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 
        'goto', 'if', 'implements', 'import', 'instanceof', 'int', 
        'interface', 'long', 'native', 'new', 'package', 'private', 
        'protected', 'public', 'return', 'short', 'static', 'strictfp', 
        'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 
        'transient', 'try', 'void', 'volatile', 'while'
    ]);
    
    if (javaKeywords.has(result.toLowerCase())) {
        result = result + '_';
    }
    
    // Ensure the name isn't empty after all processing
    if (result.length === 0) {
        return 'GeneratedClassName';
    }
    
    return result;
}

module.exports = async function safeClassName(productCode) {
    return toJavaClassName(productCode) + "Snapper";
}