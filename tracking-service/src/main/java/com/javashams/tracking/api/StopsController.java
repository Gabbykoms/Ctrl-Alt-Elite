package com.javashams.tracking.api;

import com.javashams.tracking.model.dto.StopDto;
import com.javashams.tracking.services.StopStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

/**
 * API endpoints for managing campus shuttle stops
 * Admin-only operations for creating and deleting stops
 * Public read-only access to view stops
 */
@RestController
@RequestMapping("/v1/stops")
public class StopsController {
    
    private static final Logger logger = LoggerFactory.getLogger(StopsController.class);
    
    private final StopStore stopStore;
    
    public StopsController(StopStore stopStore) {
        this.stopStore = stopStore;
    }
    
    /**
     * GET /v1/stops
     * Get all active stops (public endpoint)
     * Returns: List of all active stops with coordinates
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllStops() {
        try {
            List<StopDto> stops = stopStore.getAllStops();
            logger.info("📍 Retrieved {} stops", stops.size());
            
            return ResponseEntity.ok(Map.of(
                    "stops", stops,
                    "total", stops.size(),
                    "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            logger.error("❌ Error retrieving stops", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to retrieve stops", "message", e.getMessage()));
        }
    }
    
    /**
     * GET /v1/stops/{stopId}
     * Get a single stop by ID (public endpoint)
     */
    @GetMapping("/{stopId}")
    public ResponseEntity<?> getStop(@PathVariable String stopId) {
        try {
            StopDto stop = stopStore.getStop(stopId);
            if (stop == null) {
                return ResponseEntity.notFound().build();
            }
            
            logger.info("📍 Retrieved stop: {}", stopId);
            return ResponseEntity.ok(stop);
        } catch (Exception e) {
            logger.error("❌ Error retrieving stop: {}", stopId, e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to retrieve stop", "message", e.getMessage()));
        }
    }
    
    /**
     * POST /v1/stops
     * Create a new stop (ADMIN ONLY)
     * Request body:
     * {
     *   "name": "Stop Name",
     *   "latitude": 41.747,
     *   "longitude": -72.683,
     *   "description": "Optional description"
     * }
     */
    @PostMapping
    public ResponseEntity<?> createStop(@RequestBody Map<String, Object> request) {
        try {
            // Extract fields from request
            String name = (String) request.get("name");
            Object latObj = request.get("latitude");
            Object lngObj = request.get("longitude");
            String description = (String) request.get("description");
            
            // Validate required fields
            if (name == null || name.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing required field: name"));
            }
            
            if (latObj == null || lngObj == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing required fields: latitude, longitude"));
            }
            
            // Convert to Double
            Double latitude = latObj instanceof Number ? ((Number) latObj).doubleValue() : null;
            Double longitude = lngObj instanceof Number ? ((Number) lngObj).doubleValue() : null;
            
            if (latitude == null || longitude == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Latitude and longitude must be valid numbers"));
            }
            
            // Create the stop
            StopDto newStop = stopStore.createStop(name, latitude, longitude, description);
            
            logger.info("✅ Stop created: {} (ID: {})", name, newStop.id());
            return ResponseEntity.status(201).body(newStop);
            
        } catch (IllegalArgumentException e) {
            logger.warn("⚠️ Invalid stop data: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid stop data", "message", e.getMessage()));
        } catch (Exception e) {
            logger.error("❌ Error creating stop", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to create stop", "message", e.getMessage()));
        }
    }
    
    /**
     * PUT /v1/stops/{stopId}
     * Update an existing stop (ADMIN ONLY)
     * Request body (all fields optional):
     * {
     *   "name": "Updated Name",
     *   "latitude": 41.747,
     *   "longitude": -72.683,
     *   "description": "Updated description"
     * }
     */
    @PutMapping("/{stopId}")
    public ResponseEntity<?> updateStop(
            @PathVariable String stopId,
            @RequestBody Map<String, Object> request) {
        try {
            String name = (String) request.get("name");
            Object latObj = request.get("latitude");
            Object lngObj = request.get("longitude");
            String description = (String) request.get("description");
            
            Double latitude = latObj instanceof Number ? ((Number) latObj).doubleValue() : null;
            Double longitude = lngObj instanceof Number ? ((Number) lngObj).doubleValue() : null;
            
            // Update the stop
            StopDto updated = stopStore.updateStop(stopId, name, latitude, longitude, description);
            
            logger.info("✅ Stop updated: {}", stopId);
            return ResponseEntity.ok(updated);
            
        } catch (IllegalArgumentException e) {
            logger.warn("⚠️ Stop not found or invalid data: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid stop data", "message", e.getMessage()));
        } catch (Exception e) {
            logger.error("❌ Error updating stop: {}", stopId, e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to update stop", "message", e.getMessage()));
        }
    }
    
    /**
     * DELETE /v1/stops/{stopId}
     * Delete a stop (ADMIN ONLY)
     * Performs soft delete (marks as inactive)
     */
    @DeleteMapping("/{stopId}")
    public ResponseEntity<?> deleteStop(@PathVariable String stopId) {
        try {
            stopStore.deleteStop(stopId);
            
            logger.info("✅ Stop deleted: {}", stopId);
            return ResponseEntity.ok(Map.of(
                    "message", "Stop deleted successfully",
                    "stop_id", stopId,
                    "timestamp", System.currentTimeMillis()
            ));
            
        } catch (IllegalArgumentException e) {
            logger.warn("⚠️ Stop not found: {}", stopId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("❌ Error deleting stop: {}", stopId, e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to delete stop", "message", e.getMessage()));
        }
    }
}
