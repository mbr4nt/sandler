const fs = require('fs');
const path = require('path');
const levenshtein = require('fast-levenshtein');

class DWGIndexer {
    constructor() {
        this.index = [];
    }

    indexFiles(rootPath) {
        this._traverseDirectory(rootPath);
    }

    _traverseDirectory(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                this._traverseDirectory(fullPath);
            } else if (entry.isFile() && 
                      path.extname(entry.name).toLowerCase() === '.dwg') {
                this._addToIndex(fullPath);
            }
        }
    }

    _normalize(text) {
        return text
            .replace(/[-_.]/g, ' ')  // Replace separators with spaces
            .toLowerCase()
            .split(/\s+/)           // Split into tokens
            .filter(t => t !== '');  // Remove empty tokens
    }

    _addToIndex(filePath) {
        const dirPath = path.dirname(filePath);
        const fileName = path.basename(filePath, '.dwg');
        
        // Split directory path into components
        const dirComponents = dirPath.split(path.sep);
        // Combine with filename and normalize
        const allComponents = [...dirComponents, fileName];
        
        const tokens = allComponents
            .flatMap(component => this._normalize(component))
            .filter(t => t !== 'symbols'); // Optional: exclude common root folder

        this.index.push({
            filePath: filePath,
            tokens: tokens
        });
    }

    findBestMatch(productName, maxResults = 5) {
        if (this.index.length === 0) return [];
        
        const productTokens = this._normalize(productName);
        const matches = [];

        for (const entry of this.index) {
            let totalScore = 0;
            
            for (const productToken of productTokens) {
                let minDistance = Infinity;
                
                for (const entryToken of entry.tokens) {
                    const distance = levenshtein.get(productToken, entryToken);
                    if (distance < minDistance) {
                        minDistance = distance;
                        if (minDistance === 0) break; // Early exit for perfect match
                    }
                }
                
                totalScore += minDistance;
            }
            
            matches.push({
                filePath: entry.filePath,
                score: totalScore,
                tokens: entry.tokens // Optional: include for debugging
            });
        }

        return matches
            .sort((a, b) => a.score - b.score)
            .slice(0, maxResults);
    }
}

module.exports = DWGIndexer;

