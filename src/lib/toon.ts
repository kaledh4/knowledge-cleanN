
/**
 * Token-Oriented Object Notation (TOON) Encoder
 * 
 * TOON is a compact, human-readable encoding of the JSON data model that minimizes tokens 
 * and makes structure easy for models to follow.
 * 
 * Spec:
 * - YAML's indentation-based structure for nested objects
 * - CSV-style tabular layout for uniform arrays
 */

export function toToon(data: any): string {
    return encodeValue(data, undefined, 0);
}

function encodeValue(value: any, key: string | undefined, indent: number): string {
    const prefix = '  '.repeat(indent);

    // Handle null/undefined
    if (value === null || value === undefined) {
        return key ? `${prefix}${key}: null` : `${prefix}null`;
    }

    // Handle Primitives
    if (typeof value !== 'object') {
        const strVal = String(value);
        // Simple escaping if needed (e.g. if it contains newlines)
        // For now, assuming simple values as per spec examples
        return key ? `${prefix}${key}: ${strVal}` : `${prefix}${strVal}`;
    }

    // Handle Arrays
    if (Array.isArray(value)) {
        const count = value.length;

        // 1. Array of Primitives (CSV style)
        // friends[3]: ana,luis,sam
        if (value.length > 0 && value.every(v => typeof v !== 'object' && v !== null)) {
            const csv = value.map(v => String(v).replace(/,/g, '\\,')).join(',');
            return key ? `${prefix}${key}[${count}]: ${csv}` : `${prefix}[${count}]: ${csv}`;
        }

        // 2. Uniform Array of Objects (Table style)
        // hikes[3]{id,name,...}:
        //   1,Blue Lake Trail,...
        if (isUniformObjectArray(value)) {
            const keys = getAllKeys(value);
            const header = key
                ? `${prefix}${key}[${count}]{${keys.join(',')}}:`
                : `${prefix}[${count}]{${keys.join(',')}}:`;

            if (value.length === 0) return header;

            const rows = value.map(item => {
                return '  '.repeat(indent + 1) + keys.map(k => {
                    const val = item[k];
                    if (val === undefined || val === null) return '';
                    // Escape commas in values
                    return String(val).replace(/,/g, '\\,').replace(/\n/g, '\\n');
                }).join(',');
            }).join('\n');

            return `${header}\n${rows}`;
        }

        // 3. Mixed/Complex Array (Fallback to YAML-like list)
        // items:
        //   - val1
        //   - val2
        // For now, we'll use a simplified list format or JSON if complex
        // Using JSON for complex/mixed arrays to ensure safety
        return key ? `${prefix}${key}: ${JSON.stringify(value)}` : `${prefix}${JSON.stringify(value)}`;
    }

    // Handle Objects
    // If we have a key, we print "key:" then indented children
    if (key) {
        const header = `${prefix}${key}:`;
        const body = Object.entries(value)
            .map(([k, v]) => encodeValue(v, k, indent + 1))
            .join('\n');
        return `${header}\n${body}`;
    } else {
        // Root object, just print children
        return Object.entries(value)
            .map(([k, v]) => encodeValue(v, k, indent))
            .join('\n');
    }
}

function isUniformObjectArray(arr: any[]): boolean {
    if (arr.length === 0) return true; // Empty array can be treated as uniform
    // Must be all objects, not arrays, not null
    if (!arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
        return false;
    }

    // Check if values are mostly primitives (nested objects in CSV are hard)
    // If any value is an object/array, we might want to skip CSV optimization
    // unless we flatten it. For now, let's only do CSV if values are primitives.
    const hasComplexValues = arr.some(obj =>
        Object.values(obj).some(v => typeof v === 'object' && v !== null)
    );

    return !hasComplexValues;
}

function getAllKeys(arr: any[]): string[] {
    const keys = new Set<string>();
    arr.forEach(obj => Object.keys(obj).forEach(k => keys.add(k)));
    return Array.from(keys);
}
