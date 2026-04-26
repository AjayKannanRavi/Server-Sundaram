package com.serversundaram.util;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Utility class for unnesting/flattening complex multidimensional arrays and collections.
 */
public class ArrayUnnestUtil {

    private ArrayUnnestUtil() {
        // Utility class
    }

    /**
     * Flattens a potentially nested structure of Lists/Collections into a single one-dimensional List.
     * @param nestedCollection The nested collection.
     * @return A flat List containing all non-collection elements.
     */
    public static <T> List<T> unnestCollection(Collection<?> nestedCollection) {
        List<T> flatList = new ArrayList<>();
        if (nestedCollection == null) return flatList;

        for (Object item : nestedCollection) {
            if (item instanceof Collection) {
                flatList.addAll(unnestCollection((Collection<?>) item));
            } else if (item != null && item.getClass().isArray()) {
                flatList.addAll(unnestArray(item));
            } else {
                @SuppressWarnings("unchecked")
                T typedItem = (T) item;
                flatList.add(typedItem);
            }
        }
        return flatList;
    }

    /**
     * Flattens a multidimensional Java Array into a one-dimensional List.
     * @param array The array object (e.g., Object[][], int[][]).
     * @return A flat List of elements.
     */
    public static <T> List<T> unnestArray(Object array) {
        List<T> flatList = new ArrayList<>();
        if (array == null || !array.getClass().isArray()) {
            return flatList;
        }

        int length = Array.getLength(array);
        for (int i = 0; i < length; i++) {
            Object element = Array.get(array, i);
            if (element instanceof Collection) {
                flatList.addAll(unnestCollection((Collection<?>) element));
            } else if (element != null && element.getClass().isArray()) {
                flatList.addAll(unnestArray(element));
            } else {
                @SuppressWarnings("unchecked")
                T typedElement = (T) element;
                flatList.add(typedElement);
            }
        }
        return flatList;
    }
}
