package com.serversundaram.service;

import com.serversundaram.config.TenantContext;
import com.serversundaram.config.AppWorkflowProperties;
import com.serversundaram.dto.MenuItemRequest;
import com.serversundaram.entity.Category;
import com.serversundaram.entity.MenuItem;
import com.serversundaram.entity.Restaurant;
import com.serversundaram.repository.CategoryRepository;
import com.serversundaram.repository.MenuItemRepository;
import com.serversundaram.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;
    private final RestaurantRepository restaurantRepository;
    private final FileStorageService fileStorageService;
    private final AppWorkflowProperties appWorkflowProperties;

    public List<MenuItem> getAllMenuItems() {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        if (restaurantId == null) {
            return java.util.Collections.emptyList();
        }
        return menuItemRepository.findByRestaurantId(restaurantId);
    }

    public List<Category> getAllCategories() {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        if (restaurantId == null) {
            return java.util.Collections.emptyList();
        }
        return categoryRepository.findByRestaurantId(restaurantId);
    }

    public Category addCategory(Category requestCategory) {
        Long restaurantId = TenantContext.requireCurrentTenantAsLong();
        Restaurant restaurant = restaurantRepository.findById(Objects.requireNonNull(restaurantId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Restaurant context not found"));

        String categoryName = requestCategory.getName() == null ? null : requestCategory.getName().trim();
        if (!StringUtils.hasText(categoryName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category name is required");
        }

        Category existingCategory = categoryRepository.findByRestaurantIdAndNameIgnoreCase(restaurantId, categoryName);
        if (existingCategory != null) {
            return existingCategory;
        }
        
        Category category = new Category();
        category.setName(categoryName);
        category.setRestaurant(restaurant);
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        Long restaurantId = TenantContext.requireCurrentTenantAsLong();
        Category category = categoryRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        if (category.getRestaurant() == null || !restaurantId.equals(category.getRestaurant().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized access to delete category");
        }

        long linkedItems = menuItemRepository.countByCategoryIdAndRestaurantId(id, restaurantId);
        if (linkedItems > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot delete category. Move or delete menu items in this category first."
            );
        }

        categoryRepository.delete(category);
    }

    public MenuItem addItem(MenuItemRequest request, org.springframework.web.multipart.MultipartFile image) {
        Long restaurantId = TenantContext.requireCurrentTenantAsLong();
        
        // Validate required fields
        if (request.getName() == null || !StringUtils.hasText(request.getName().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item name is required");
        }
        if (request.getPrice() == null || request.getPrice() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid price is required");
        }
        if (request.getCategoryId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category ID is required to add an item. Please select or create a category first.");
        }
        
        Long safeRestaurantId = Objects.requireNonNull(restaurantId);
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
        if (category.getRestaurant() == null || !safeRestaurantId.equals(category.getRestaurant().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected category does not belong to this restaurant");
        }
        
        Restaurant restaurant = restaurantRepository.findById(safeRestaurantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Restaurant context not found"));

        MenuItem item = new MenuItem();
        item.setName(request.getName().trim());
        item.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        item.setPrice(request.getPrice());
        item.setAvailable(request.getAvailable() != null ? request.getAvailable() : true);
        item.setIsVeg(request.getIsVeg() != null ? request.getIsVeg() : true);
        item.setCategory(category);

        if (image != null && !image.isEmpty()) {
            String fileName = fileStorageService.storeFile(image);
            item.setImageUrl(appWorkflowProperties.getUrl().getBackendBase() + "/uploads/" + fileName);
        } else if (StringUtils.hasText(request.getImageUrl())) {
            item.setImageUrl(request.getImageUrl().trim());
        }

        item.setRestaurant(restaurant);
        return menuItemRepository.save(item);
    }

    public MenuItem updateItem(Long id, MenuItemRequest request, org.springframework.web.multipart.MultipartFile image) {
        Long restaurantId = TenantContext.requireCurrentTenantAsLong();
        
        // Validate required fields
        if (request.getName() == null || !StringUtils.hasText(request.getName().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item name is required");
        }
        if (request.getPrice() == null || request.getPrice() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid price is required");
        }
        
        Long safeRestaurantId = Objects.requireNonNull(restaurantId);
        MenuItem item = menuItemRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));
        
        if (item.getRestaurant() != null && !safeRestaurantId.equals(item.getRestaurant().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized access to menu item");
        }

        item.setName(request.getName().trim());
        item.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        item.setPrice(request.getPrice());
        if (request.getAvailable() != null) {
            item.setAvailable(request.getAvailable());
        }
        Boolean isVeg = request.getIsVeg();
        if (isVeg != null) {
            item.setIsVeg(isVeg);
        }

        if (request.getCategoryId() != null) {
            Category currentCategory = item.getCategory();
            if (currentCategory == null || !currentCategory.getId().equals(request.getCategoryId())) {
                Category category = categoryRepository.findById(request.getCategoryId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
                if (category.getRestaurant() == null || !safeRestaurantId.equals(category.getRestaurant().getId())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected category does not belong to this restaurant");
                }
                item.setCategory(category);
            }
        }

        if (image != null && !image.isEmpty()) {
            String fileName = fileStorageService.storeFile(image);
            item.setImageUrl(appWorkflowProperties.getUrl().getBackendBase() + "/uploads/" + fileName + "?t=" + System.currentTimeMillis());
        } else if (StringUtils.hasText(request.getImageUrl())) {
            item.setImageUrl(request.getImageUrl().trim());
        }

        return menuItemRepository.save(item);
    }

    public void deleteItem(Long id) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        Long safeRestaurantId = Objects.requireNonNull(restaurantId);
        MenuItem item = menuItemRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Menu item not found"));
        
        if (item.getRestaurant() != null && !safeRestaurantId.equals(item.getRestaurant().getId())) {
            throw new RuntimeException("Unauthorized access to delete menu item");
        }
        menuItemRepository.delete(item);
    }
}
