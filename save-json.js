import fs from 'fs/promises'; // Use fs/promises for async file operations
import path from 'path';

/**
 * Saves a JSON object to a file.
 * @param {string} filePath - The path where the JSON file will be saved.
 * @param {object} jsonData - The JSON object to save.
 * @returns {Promise<void>} - A promise that resolves when the file is saved.
 */
export async function saveJson(filePath, jsonData) {
    try {
        // Convert the JSON object to a formatted string
        const jsonString = JSON.stringify(jsonData, null, 2); // 2 spaces for indentation
        // Ensure the directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true }); // Create directory if it doesn't exist
        // Write the JSON string to the file
        await fs.writeFile(filePath, jsonString, 'utf8');
        console.log(`JSON saved successfully to ${filePath}`);
    } catch (error) {
        console.error(`Error saving JSON to disk: ${error.message}`);
    }
}

