package com.serversundaram.common;

import java.util.List;

/**
 * Generic DTO mapper interface for converting entities to/from DTOs.
 * Implements the Mapper pattern for clean entity-DTO separation.
 *
 * @param <E> Entity type
 * @param <D> DTO type
 */
public interface DtoMapper<E, D> {

    /**
     * Convert entity to DTO.
     */
    D toDto(E entity);

    /**
     * Convert DTO to entity.
     */
    E toEntity(D dto);

    /**
     * Convert list of entities to DTOs.
     */
    default List<D> toDtoList(List<E> entities) {
        return entities.stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Convert list of DTOs to entities.
     */
    default List<E> toEntityList(List<D> dtos) {
        return dtos.stream()
                .map(this::toEntity)
                .toList();
    }
}
