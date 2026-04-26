package com.serversundaram;

import java.lang.reflect.Field;
import com.serversundaram.entity.RestaurantTable;

public class InspectEntity {
    public static void main(String[] args) {
        System.out.println("Inspecting RestaurantTable fields:");
        for (Field field : RestaurantTable.class.getDeclaredFields()) {
            System.out.println(field.getName() + " : " + field.getType().getName());
        }
    }
}
