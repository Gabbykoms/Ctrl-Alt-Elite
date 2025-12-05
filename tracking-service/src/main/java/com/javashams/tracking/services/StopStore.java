package com.javashams.tracking.services;

import com.javashams.tracking.model.dto.StopDto;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for managing campus shuttle stops
 * Stores stop data with coordinates and metadata
 * Can be backed by Redis or in-memory storage
 */
@Service
public class StopStore {
    private static final Logger logger = LoggerFactory.getLogger(StopStore.class);
    
    // In-memory storage (can be replaced with Redis)
    private final Map<String, StopDto> stops = new ConcurrentHashMap<>();
    
    public StopStore() {
        // Initialize with some default stops for Trinity College
        initializeDefaultStops();
    }
    
    /**
     * Get all active stops
     */
    public List<StopDto> getAllStops() {
        return stops.values().stream()
                .filter(stop -> stop.isActive() != null && stop.isActive())
                .sorted(Comparator.comparing(StopDto::name))
                .toList();
    }
    
    /**
     * Get a stop by ID
     */
    public StopDto getStop(String stopId) {
        StopDto stop = stops.get(stopId);
        if (stop == null) {
            logger.warn("Stop not found: {}", stopId);
            return null;
        }
        return stop;
    }
    
    /**
     * Create a new stop
     * Admin-only operation
     */
    public StopDto createStop(String name, Double latitude, Double longitude, String description) {
        if (name == null || name.isBlank() || latitude == null || longitude == null) {
            throw new IllegalArgumentException("Stop name, latitude, and longitude are required");
        }
        
        // Generate ID based on name and timestamp
        String stopId = "stop-" + name.toLowerCase().replaceAll("\\s+", "-") + "-" + System.currentTimeMillis();
        
        StopDto stop = new StopDto(
                stopId,
                name,
                latitude,
                longitude,
                description,
                true,
                System.currentTimeMillis(),
                System.currentTimeMillis()
        );
        
        stops.put(stopId, stop);
        logger.info("✅ Stop created: {} at ({}, {})", name, latitude, longitude);
        
        return stop;
    }
    
    /**
     * Update an existing stop
     * Admin-only operation
     */
    public StopDto updateStop(String stopId, String name, Double latitude, Double longitude, String description) {
        StopDto existing = stops.get(stopId);
        if (existing == null) {
            throw new IllegalArgumentException("Stop not found: " + stopId);
        }
        
        StopDto updated = new StopDto(
                existing.id(),
                name != null ? name : existing.name(),
                latitude != null ? latitude : existing.latitude(),
                longitude != null ? longitude : existing.longitude(),
                description != null ? description : existing.description(),
                existing.isActive(),
                existing.createdAtMs(),
                System.currentTimeMillis()
        );
        
        stops.put(stopId, updated);
        logger.info("✅ Stop updated: {}", stopId);
        
        return updated;
    }
    
    /**
     * Delete a stop (soft delete - mark as inactive)
     * Admin-only operation
     */
    public void deleteStop(String stopId) {
        StopDto existing = stops.get(stopId);
        if (existing == null) {
            throw new IllegalArgumentException("Stop not found: " + stopId);
        }
        
        // Soft delete by marking inactive
        StopDto deleted = new StopDto(
                existing.id(),
                existing.name(),
                existing.latitude(),
                existing.longitude(),
                existing.description(),
                false,  // Mark as inactive
                existing.createdAtMs(),
                System.currentTimeMillis()
        );
        
        stops.put(stopId, deleted);
        logger.info("✅ Stop deleted: {}", stopId);
    }
    
    /**
     * Check if a stop exists
     */
    public boolean stopExists(String stopId) {
        return stops.containsKey(stopId);
    }
    
    /**
     * Clear all stops (for testing)
     */
    public void clearAll() {
        stops.clear();
        logger.warn("⚠️ All stops cleared");
    }
    
    /**
     * Initialize with default Trinity College stops
     */
    private void initializeDefaultStops() {
        // Trinity College campus stops
        createStop("Main Quad", 41.747, -72.683, "Main courtyard of Trinity College");
        createStop("Long Walk", 41.749, -72.685, "Historic residential area");
        createStop("Athletic Center", 41.745, -72.680, "Sports and athletic facilities");
        createStop("Science Center", 41.748, -72.686, "Science and technology building");
        createStop("Library", 41.746, -72.684, "College library and study center");
        createStop("Crescent Neighborhood", 41.751, -72.690, "Student residential area");
        createStop("Vernon Street", 41.743, -72.675, "Off-campus location");
        createStop("Summit's", 41.753, -72.692, "Dining and student center");
    }
}
