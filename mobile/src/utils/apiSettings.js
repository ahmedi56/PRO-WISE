/**
 * Safely parses the JSON body of a fetch response.
 * Handles empty responses securely without throwing SyntaxErrors.
 *
 * @param {Response} response - The fetch Response object
 * @returns {Promise<any|null>} - The parsed JSON or null if empty/invalid
 */
export const readJson = async (response) => {
    try {
        const text = await response.text();
        if (!text) return null;
        return JSON.parse(text);
    } catch (err) {
        return null;
    }
};
