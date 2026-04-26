/**
 * Utility module for flattening/unnesting arrays.
 */

/**
 * Flattens a multidimensional array into a single-dimensional array.
 * This is a wrapper around the native Array.prototype.flat() method for deep unnesting.
 *
 * @param {Array} arr - The multidimensional array to flatten.
 * @param {number} [depth=Infinity] - The depth level specifying how deep a nested array structure should be flattened. Defaults to Infinity.
 * @returns {Array} A new array with all sub-array elements concatenated into it recursively up to the specified depth.
 */
export const unnestArray = (arr, depth = Infinity) => {
    if (!Array.isArray(arr)) {
        return [arr];
    }
    return arr.flat(depth);
};

/**
 * Extracts a specific property from an array of objects and flattens the result.
 * Useful when you have an array of objects where each object contains an array property you want to combine.
 *
 * @param {Array<Object>} array - The array of objects.
 * @param {string} propertyKey - The key of the array property to extract and unnest.
 * @returns {Array} A flattened array containing the extracted values.
 */
export const unnestObjectProperty = (array, propertyKey) => {
    if (!Array.isArray(array)) {
        return [];
    }
    return array.map(item => item[propertyKey]).flat(Infinity).filter(Boolean);
};
