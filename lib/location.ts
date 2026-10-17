const mapsHostPattern = /^(www\.)?(maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.|google\.[a-z.]+\/maps)/i;
const coordinatesPattern = /^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/;

/**
 * Turns whatever a customer typed into the location field into an openable Google Maps link:
 * full links pass through, bare maps links get https://, "lat, lng" becomes a pin,
 * and anything else (an address or landmark) becomes a Maps search.
 */
export function toGoogleMapsUrl(input: string): string | undefined {
    const value = input.trim();
    if (!value) return undefined;
    if (/^https?:\/\//i.test(value)) return value;
    if (mapsHostPattern.test(value)) return `https://${value}`;
    const coordinates = value.match(coordinatesPattern);
    if (coordinates) return `https://www.google.com/maps?q=${coordinates[1]},${coordinates[2]}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}
