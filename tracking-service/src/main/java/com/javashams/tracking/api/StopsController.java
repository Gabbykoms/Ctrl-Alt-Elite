package com.javashams.tracking.api;

import com.javashams.tracking.services.StopStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/v1/stops")
public class StopsController {
    
    private static final Logger logger = LoggerFactory.getLogger(StopsController.class);
    private final StopStore stopStore;
    
    public StopsController(StopStore stopStore) {
        this.stopStore = stopStore;
    }
    
    @GetMapping
    public Mono<ResponseEntity<Map<String, Object>>> getAllStops() {
        return stopStore.getAllStops()
                .collectList()
                .map(stops -> ResponseEntity.ok(Map.of(
                        "stops", stops,
                        "total", stops.size(),
                        "timestamp", System.currentTimeMillis()
                )))
                .onErrorResume(e -> {
                    logger.error("Error retrieving stops", e);
                    return Mono.just(ResponseEntity.internalServerError()
                            .body(Map.of("error", "Failed to retrieve stops", "message", e.getMessage())));
                });
    }
    
    @GetMapping("/{stopId}")
    public Mono<ResponseEntity<?>> getStop(@PathVariable String stopId) {
        return stopStore.getStop(stopId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build())
                .onErrorResume(e -> {
                    logger.error("Error retrieving stop: {}", stopId, e);
                    return Mono.just(ResponseEntity.internalServerError()
                            .body(Map.of("error", "Failed to retrieve stop", "message", e.getMessage())));
                });
    }
    
    @PostMapping
    public Mono<ResponseEntity<?>> createStop(@RequestBody Map<String, Object> request) {
        String stopId = (String) request.get("stopId");
        String name = (String) request.get("name");
        Object latObj = request.get("latitude");
        Object lngObj = request.get("longitude");
        String description = (String) request.get("description");

        if (stopId == null || stopId.isBlank()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Missing required field: stopId")));
        }
        if (name == null || name.isBlank()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Missing required field: name")));
        }
        if (latObj == null || lngObj == null) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Missing required fields: latitude, longitude")));
        }

        Double latitude = latObj instanceof Number ? ((Number) latObj).doubleValue() : null;
        Double longitude = lngObj instanceof Number ? ((Number) lngObj).doubleValue() : null;

        if (latitude == null || longitude == null) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Latitude and longitude must be valid numbers")));
        }

        return stopStore.createStop(stopId, name, latitude, longitude, description)
                .<ResponseEntity<?>>map(stop -> ResponseEntity.status(HttpStatus.CREATED).body(stop))
                .onErrorResume(IllegalArgumentException.class, e -> 
                    Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Invalid stop data", "message", e.getMessage())))
                )
                .onErrorResume(e -> {
                    logger.error("Error creating stop", e);
                    return Mono.just(ResponseEntity.internalServerError()
                            .body(Map.of("error", "Failed to create stop", "message", e.getMessage())));
                });
    }
    
    @PutMapping("/{stopId}")
    public Mono<ResponseEntity<?>> updateStop(
            @PathVariable String stopId,
            @RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        Object latObj = request.get("latitude");
        Object lngObj = request.get("longitude");
        String description = (String) request.get("description");
        
        Double latitude = latObj instanceof Number ? ((Number) latObj).doubleValue() : null;
        Double longitude = lngObj instanceof Number ? ((Number) lngObj).doubleValue() : null;
        
        return stopStore.updateStop(stopId, name, latitude, longitude, description)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .onErrorResume(IllegalArgumentException.class, e -> 
                    Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Invalid stop data", "message", e.getMessage())))
                )
                .onErrorResume(e -> {
                    logger.error("Error updating stop: {}", stopId, e);
                    return Mono.just(ResponseEntity.internalServerError()
                            .body(Map.of("error", "Failed to update stop", "message", e.getMessage())));
                });
    }
    
    @DeleteMapping("/{stopId}")
    public Mono<ResponseEntity<?>> deleteStop(@PathVariable String stopId) {
        return stopStore.deleteStop(stopId)
                .<ResponseEntity<?>>then(Mono.just(ResponseEntity.ok(Map.of(
                        "message", "Stop deleted successfully",
                        "stop_id", stopId,
                        "timestamp", System.currentTimeMillis()
                ))))
                .onErrorResume(IllegalArgumentException.class, e -> 
                    Mono.just(ResponseEntity.notFound().build())
                )
                .onErrorResume(e -> {
                    logger.error("Error deleting stop: {}", stopId, e);
                    return Mono.just(ResponseEntity.internalServerError()
                            .body(Map.of("error", "Failed to delete stop", "message", e.getMessage())));
                });
    }
}
