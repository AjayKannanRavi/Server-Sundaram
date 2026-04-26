package com.serversundaram.controller;

import com.serversundaram.dto.MenuItemRequest;
import com.serversundaram.entity.Category;
import com.serversundaram.entity.MenuItem;
import com.serversundaram.service.MenuService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<MenuItem>> getAllMenuItems() {
        return ResponseEntity.ok(menuService.getAllMenuItems());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(menuService.getAllCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> addCategory(@RequestBody Category category) {
        return ResponseEntity.ok(menuService.addCategory(category));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable("id") Long id) {
        menuService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Add a new menu item â€” supports multipart (with image) or simple JSON.
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<MenuItem> addItem(
            @RequestPart("item") String itemJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        MenuItemRequest request = parseMenuItem(itemJson);
        return ResponseEntity.ok(menuService.addItem(request, image));
    }

    /**
     * Update a menu item â€” supports multipart (with image) or simple JSON.
     * A single endpoint handles both cases: image part is optional.
     */
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<MenuItem> updateItem(
            @PathVariable("id") Long id,
            @RequestPart("item") String itemJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        MenuItemRequest request = parseMenuItem(itemJson);
        return ResponseEntity.ok(menuService.updateItem(id, request, image));
    }

    @PutMapping(value = "/{id}", consumes = "application/json")
    public ResponseEntity<MenuItem> updateItemJson(
            @PathVariable("id") Long id,
            @RequestBody MenuItemRequest request) {
        return ResponseEntity.ok(menuService.updateItem(id, request, null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable("id") Long id) {
        menuService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }

    private MenuItemRequest parseMenuItem(String itemJson) {
        if (itemJson == null || itemJson.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Menu item payload is required");
        }
        try {
            return objectMapper.readValue(itemJson, MenuItemRequest.class);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid menu item payload");
        }
    }
}
