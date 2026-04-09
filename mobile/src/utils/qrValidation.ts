interface QRParseResult {
    valid: boolean;
    productId: string | null;
    error: string | null;
}

/**
 * Extracts a product ID from a PRO-WISE QR code URL.
 * Supports patterns: {any-domain}/products/{id}
 * Returns { valid: boolean, productId: string | null, error: string | null }
 */
export const parseQRCodeUrl = (url: string | undefined): QRParseResult => {
    if (!url) {
        return { valid: false, productId: null, error: 'No URL provided' };
    }

    try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);

        // Expected path: /products/:id
        if (pathSegments[0] === 'products' && pathSegments[1]) {
            return {
                valid: true,
                productId: pathSegments[1],
                error: null
            };
        }

        return {
            valid: false,
            productId: null,
            error: 'This is not a valid PRO-WISE product QR code.'
        };
    } catch (e) {
        // Fallback for non-URL strings or incomplete URLs
        const match = url.match(/\/products\/([a-f0-9]{24}|[a-z0-9-]+)$/i);
        if (match && match[1]) {
            return {
                valid: true,
                productId: match[1],
                error: null
            };
        }

        return {
            valid: false,
            productId: null,
            error: 'Invalid QR code format.'
        };
    }
};
