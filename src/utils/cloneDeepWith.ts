/**
 * Recursively clones an object, applying a customizer function to each value.
 * Similar to lodash's cloneDeepWith, but implemented natively.
 *
 * @param value - The value to clone
 * @param customizer - Function that produces custom cloned values
 * @returns Cloned value
 */
export function cloneDeepWith<T>(value: T, customizer: (val: unknown) => unknown | undefined): T {
    if (value === null || typeof value !== 'object') {
        const custom = customizer(value);
        if (custom !== undefined) {
            return custom as T;
        }
        return value;
    }

    if (value instanceof Date) {
        return new Date(value.getTime()) as T;
    }

    if (value instanceof RegExp) {
        return new RegExp(value) as T;
    }

    if (Array.isArray(value)) {
        return value.map((item) => cloneDeepWith(item, customizer)) as T;
    }

    const cloned = {} as T;
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            const custom = customizer(value[key]);
            if (typeof custom !== 'undefined') {
                cloned[key] = custom as T[Extract<keyof T, string>];
            } else {
                cloned[key] = cloneDeepWith(value[key], customizer);
            }
        }
    }

    return cloned;
}
