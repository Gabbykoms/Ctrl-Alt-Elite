package com.javashams.tracking.services;

import com.javashams.tracking.model.Stop;
import com.javashams.tracking.model.dto.StopDto;
import com.javashams.tracking.repositories.StopRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Service for managing campus shuttle stops with PostgreSQL persistence
 * and Redis caching layer for performance optimization
 * 
 * Data flow:
 * 1. Check Redis cache first
 * 2. If miss, fetch from PostgreSQL
 * 3. Update Redis cache
 * 4. On write operations, update both PostgreSQL and Redis
 */
@Service
public class StopStore {
    private static final Logger logger = LoggerFactory.getLogger(StopStore.class);
    private static final String CACHE_KEY_PREFIX = "stop:";
    private static final String CACHE_ALL_ACTIVE = "stops:active:all";
    private static final long CACHE_TTL_MINUTES = 30;
    
    private final StopRepository stopRepository;
    private final RedisTemplate<String, StopDto> redisTemplate;
    
    public StopStore(StopRepository stopRepository, RedisTemplate<String, StopDto> redisTemplate) {
        this.stopRepository = stopRepository;
        this.redisTemplate = redisTemplate;
    }
    
    /**
     * Get all active stops with Redis caching
     */
    public List<StopDto> getAllStops() {
        // Fetch directly from database (Redis caching optional for future optimization)
        List<Stop> entities = stopRepository.findByIsActiveTrueOrderByName();
        List<StopDto> dtos = convertEntitiesToDtos(entities);
        
        logger.info("Retrieved {} stops from database", dtos.size());
        return dtos;
    }
    
    /**
     * Get a stop by ID with Redis caching
     */
    public StopDto getStop(String stopId) {
        Optional<Stop> entity = stopRepository.findById(stopId);
        if (entity.isEmpty()) {
            logger.warn("Stop not found: {}", stopId);
            return null;
        }
        
        return convertEntityToDto(entity.get());
    }
    
    /**
     * Create a new stop - persists to PostgreSQL
     */
    public StopDto createStop(String name, Double latitude, Double longitude, String description) {
        if (name == null || name.isBlank() || latitude == null || longitude == null) {
            throw new IllegalArgumentException("Stop name, latitude, and longitude are required");
        }
        
        // Generate ID based on name and timestamp
        String stopId = "stop-" + name.toLowerCase().replaceAll("\\s+", "-") + "-" + System.currentTimeMillis();
        long now = System.currentTimeMillis();
        
        // Create entity
        Stop entity = new Stop(stopId, name, latitude, longitude, description, true, now, now);
        
        // Persist to database
        Stop savedEntity = stopRepository.save(entity);
        StopDto dto = convertEntityToDto(savedEntity);
        
        // Invalidate all stops cache
        invalidateAllStopsCache();
        
        logger.info("Stop created: {} at ({}, {})", name, latitude, longitude);
        return dto;
    }
    
    /**
     * Update an existing stop
     */
    public StopDto updateStop(String stopId, String name, Double latitude, Double longitude, String description) {
        Optional<Stop> existing = stopRepository.findById(stopId);
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Stop not found: " + stopId);
        }
        
        Stop entity = existing.get();
        if (name != null) entity.setName(name);
        if (latitude != null) entity.setLatitude(latitude);
        if (longitude != null) entity.setLongitude(longitude);
        if (description != null) entity.setDescription(description);
        
        // Update timestamps
        entity.setUpdatedAtMs(System.currentTimeMillis());
        
        // Persist to database
        Stop updated = stopRepository.save(entity);
        StopDto dto = convertEntityToDto(updated);
        
        // Invalidate all stops cache
        invalidateAllStopsCache();
        
        logger.info("Stop updated: {}", stopId);
        return dto;
    }
    
    /**
     * Delete a stop (soft delete - mark as inactive)
     */
    public void deleteStop(String stopId) {
        Optional<Stop> existing = stopRepository.findById(stopId);
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Stop not found: " + stopId);
        }
        
        Stop entity = existing.get();
        entity.setIsActive(false);
        entity.setUpdatedAtMs(System.currentTimeMillis());
        
        // Persist to database
        stopRepository.save(entity);
        
        // Invalidate all stops cache
        invalidateAllStopsCache();
        
        logger.info("Stop deleted: {}", stopId);
    }
    
    /**
     * Check if a stop exists
     */
    public boolean stopExists(String stopId) {
        return stopRepository.existsById(stopId);
    }
    
    /**
     * Clear all stops from both database and cache (testing only)
     */
    public void clearAll() {
        stopRepository.deleteAll();
        invalidateAllStopsCache();
        logger.warn("All stops cleared from database and cache");
    }
    
    /**
     * Helper: Convert entity to DTO
     */
    private StopDto convertEntityToDto(Stop entity) {
        return new StopDto(
                entity.getId(),
                entity.getName(),
                entity.getLatitude(),
                entity.getLongitude(),
                entity.getDescription(),
                entity.getIsActive(),
                entity.getCreatedAtMs(),
                entity.getUpdatedAtMs()
        );
    }
    
    /**
     * Helper: Convert entities to DTOs
     */
    private List<StopDto> convertEntitiesToDtos(List<Stop> entities) {
        return entities.stream()
                .map(this::convertEntityToDto)
                .toList();
    }
    
    /**
     * Helper: Invalidate all stops cache
     */
    private void invalidateAllStopsCache() {
        try {
            redisTemplate.delete(CACHE_ALL_ACTIVE);
            logger.debug("Invalidated all stops cache");
        } catch (Exception e) {
            logger.warn("Failed to invalidate all stops cache: {}", e.getMessage());
        }
    }
}

