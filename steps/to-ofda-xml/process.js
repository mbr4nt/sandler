const fs = require('fs');
const path = require('path');

module.exports = async function process(templatePath, context) {
    
    let root = {
      context
    };

    try {
        // Read the XML template file
        const templateContent = fs.readFileSync(templatePath, 'utf8');

        // Regex to match all variables like ${variableName} or ${variableName(context.prop)}
        const variableRegex = /\$\{([^}]+)\}/g;

        // Find all matches in the template
        let match;
        let processedContent = templateContent;

        while ((match = variableRegex.exec(templateContent)) !== null) {
            const fullMatch = match[0]; // e.g., ${enterprise(context.enterprise)} or ${context.catalog.code}
            const variableExpression = match[1]; // e.g., enterprise(context.enterprise) or context.catalog.code

            // Check if the expression is a function call (e.g., enterprise(context.enterprise))
            if (variableExpression.includes('(') && variableExpression.endsWith(')')) {
                // Extract the function name and the context argument
                const [functionName, contextArg] = variableExpression.split('(');
                const contextPath = contextArg.slice(0, -1); // Remove the closing parenthesis

                // Dynamically import the corresponding JS file
                const modulePath = `./${functionName}.js`;
                const dynamicModule = await import(modulePath);

                // Assuming the function is the default export
                const dynamicFunction = dynamicModule.default;

                if (typeof dynamicFunction === 'function') {
                    // Resolve the context argument (e.g., context.enterprise)
                    const resolvedContext = resolveContextPath(root, contextPath);

                    // Execute the function with the resolved context
                    const replacementXml = await dynamicFunction(resolvedContext);

                    // Get the indentation of the line where the variable is located
                    const lines = processedContent.split('\n');
                    const lineWithVariable = lines.find(line => line.includes(fullMatch));
                    const indentation = lineWithVariable.match(/^\s*/)[0];

                    // Indent the replacement XML to match the original indentation
                    const indentedReplacementXml = replacementXml
                        .split('\n')
                        .map((line, index) => (index === 0 ? line : `${indentation}${line}`))
                        .join('\n');

                    // Replace the variable with the indented XML
                    processedContent = processedContent.replace(fullMatch, indentedReplacementXml);
                } else {
                    console.warn(`No function found for variable: ${functionName}`);
                }
            } else {
                // Handle direct context property access (e.g., ${context.catalog.code})
                const contextPath = variableExpression; // e.g., context.catalog.code
                const value = resolveContextPath(root, contextPath);

                // Replace the variable with the resolved value
                processedContent = processedContent.replace(fullMatch, value);
            }
        }

        return processedContent;
    } catch (error) {
        console.error('Error processing template:', error);
        throw error;
    }
}

function resolveContextPath(context, path) {
  try {
      // Split the path into parts (e.g., "catalog.code" -> ["catalog", "code"])
      const parts = path.split('.');

      // Traverse the context object using the parts
      return parts.reduce((obj, part) => {
          if (obj && typeof obj === 'object') {
              // Handle array notation (e.g., "priceLists[0].code")
              const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
              if (arrayMatch) {
                  const arrayName = arrayMatch[1]; // e.g., "priceLists"
                  const arrayIndex = parseInt(arrayMatch[2], 10); // e.g., 0
                  return obj[arrayName]?.[arrayIndex]; // Access the array element
              } else {
                  return obj[part]; // Access the property directly
              }
          }
          return undefined; // If the path is invalid, return undefined
      }, context);
  } catch (error) {
      console.error(`Error resolving path "${path}":`, error);
      return undefined;
  }
}