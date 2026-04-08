/**
 * Formats a product name by removing the manufacturer prefix if present.
 * Example: "Samsung Galaxy A55" with manufacturer "Samsung" -> "Galaxy A55"
 */
export const formatProductName = (name: string | undefined, manufacturer: string | undefined): string => {
    if (!name) return '';
    if (!manufacturer) return name;
    
    try {
        // Escape special characters in manufacturer for regex
        const escapedManuf = manufacturer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`^${escapedManuf}\\s+`, 'i');
        const stripped = name.replace(regex, '');
        return stripped || name;
    } catch (e) {
        return name;
    }
};
