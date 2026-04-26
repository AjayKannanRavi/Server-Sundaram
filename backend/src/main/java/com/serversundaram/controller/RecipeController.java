package com.serversundaram.controller;

import com.serversundaram.entity.RecipeItem;
import com.serversundaram.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping("/{menuItemId}")
    public ResponseEntity<List<RecipeItem>> getRecipe(@PathVariable Long menuItemId) {
        return ResponseEntity.ok(recipeService.getRecipeForMenuItem(menuItemId));
    }

    @PostMapping("/{menuItemId}")
    public ResponseEntity<List<RecipeItem>> saveRecipe(@PathVariable Long menuItemId, @RequestBody List<RecipeItem> items) {
        return ResponseEntity.ok(recipeService.saveRecipe(menuItemId, items));
    }

    @GetMapping
    public ResponseEntity<List<RecipeItem>> getAllRecipes() {
        return ResponseEntity.ok(recipeService.getAllRecipesForRestaurant());
    }
}
