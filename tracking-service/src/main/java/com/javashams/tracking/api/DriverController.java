package com.javashams.tracking.api;

import com.javashams.tracking.model.Driver;
import com.javashams.tracking.repositories.DriverRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * REST API endpoints for Driver persistence and operations
 * Provides driver lifecycle management: create, clock-in, clock-out, delete, update
 */
@RestController
@RequestMapping("/v1/drivers")
public class DriverController {

    private final DriverRepository driverRepository;

    public DriverController(DriverRepository driverRepository) {
        this.driverRepository = driverRepository;
    }

    /**
     * POST /v1/drivers
     * Create a new driver (basic info only)
     * Sets status to OFFLINE, all location fields are null
     * Auto-generates ID if not provided
     */
    @PostMapping
    public ResponseEntity<Driver> createDriver(@RequestBody Driver driver) {
        // Auto-generate ID if not provided
        if (driver.getId() == null || driver.getId().isEmpty()) {
            driver.setId("driver-" + UUID.randomUUID().toString());
        }
        
        // Ensure status is OFFLINE for new drivers
        driver.setStatus("OFFLINE");
        // Clear location fields
        driver.setShuttleId(null);
        driver.setRouteId(null);
        driver.setCurrentLat(null);
        driver.setCurrentLng(null);
        driver.setLastLocationUpdateAtMs(null);
        
        Driver saved = driverRepository.save(driver);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * POST /v1/drivers/{id}/clock-in
     * Clock in a driver - sets status to ONLINE with current location
     * Requires: latitude, longitude, and optionally shuttleId/routeId
     */
    @PostMapping("/{id}/clock-in")
    public ResponseEntity<Driver> clockIn(
            @PathVariable String id,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) String shuttleId,
            @RequestParam(required = false) String routeId
    ) {
        Optional<Driver> existing = driverRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Driver driver = existing.get();
        driver.setStatus("ONLINE");
        driver.setCurrentLat(latitude);
        driver.setCurrentLng(longitude);
        driver.setLastLocationUpdateAtMs(System.currentTimeMillis());
        
        if (shuttleId != null) {
            driver.setShuttleId(shuttleId);
        }
        if (routeId != null) {
            driver.setRouteId(routeId);
        }

        Driver updated = driverRepository.save(driver);
        return ResponseEntity.ok(updated);
    }

    /**
     * POST /v1/drivers/{id}/clock-out
     * Clock out a driver - sets status to OFFLINE and clears location data
     * Keeps id and name, clears everything else
     */
    @PostMapping("/{id}/clock-out")
    public ResponseEntity<Driver> clockOut(@PathVariable String id) {
        Optional<Driver> existing = driverRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Driver driver = existing.get();
        driver.setStatus("OFFLINE");
        driver.setShuttleId(null);
        driver.setRouteId(null);
        driver.setCurrentLat(null);
        driver.setCurrentLng(null);
        driver.setLastLocationUpdateAtMs(null);

        Driver updated = driverRepository.save(driver);
        return ResponseEntity.ok(updated);
    }

    /**
     * POST /v1/drivers/{id}/update-location
     * Update driver's current location and last update timestamp
     * Only updates location fields, preserves other data
     */
    @PostMapping("/{id}/update-location")
    public ResponseEntity<Driver> updateLocation(
            @PathVariable String id,
            @RequestParam Double latitude,
            @RequestParam Double longitude
    ) {
        Optional<Driver> existing = driverRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Driver driver = existing.get();
        driver.setCurrentLat(latitude);
        driver.setCurrentLng(longitude);
        driver.setLastLocationUpdateAtMs(System.currentTimeMillis());

        Driver updated = driverRepository.save(driver);
        return ResponseEntity.ok(updated);
    }

    /**
     * GET /v1/drivers/{id}
     * Get a driver by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Driver> getDriver(@PathVariable String id) {
        Optional<Driver> driver = driverRepository.findById(id);
        return driver.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * GET /v1/drivers
     * Get all drivers
     */
    @GetMapping
    public ResponseEntity<List<Driver>> getAllDrivers() {
        List<Driver> drivers = driverRepository.findAll();
        return ResponseEntity.ok(drivers);
    }

    /**
     * GET /v1/drivers/status/online
     * Get all online drivers
     */
    @GetMapping("/status/online")
    public ResponseEntity<List<Driver>> getOnlineDrivers() {
        List<Driver> drivers = driverRepository.findAllOnlineDrivers();
        return ResponseEntity.ok(drivers);
    }

    /**
     * GET /v1/drivers/shuttle/{shuttleId}
     * Get all drivers assigned to a shuttle
     */
    @GetMapping("/shuttle/{shuttleId}")
    public ResponseEntity<List<Driver>> getDriversByShuttle(@PathVariable String shuttleId) {
        List<Driver> drivers = driverRepository.findByShuttleId(shuttleId);
        return ResponseEntity.ok(drivers);
    }

    /**
     * GET /v1/drivers/shuttle/{shuttleId}/online
     * Get all online drivers for a shuttle
     */
    @GetMapping("/shuttle/{shuttleId}/online")
    public ResponseEntity<List<Driver>> getOnlineDriversByShuttle(@PathVariable String shuttleId) {
        List<Driver> drivers = driverRepository.findOnlineDriversByShuttle(shuttleId);
        return ResponseEntity.ok(drivers);
    }

    /**
     * PUT /v1/drivers/{id}
     * Update a driver (name, shuttle, route)
     * Does NOT update status or location (use clock-in/clock-out or update-location)
     */
    @PutMapping("/{id}")
    public ResponseEntity<Driver> updateDriver(@PathVariable String id, @RequestBody Driver driverUpdates) {
        Optional<Driver> existing = driverRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Driver driver = existing.get();
        
        // Update mutable fields (but NOT status or location)
        if (driverUpdates.getName() != null) {
            driver.setName(driverUpdates.getName());
        }
        if (driverUpdates.getShuttleId() != null) {
            driver.setShuttleId(driverUpdates.getShuttleId());
        }
        if (driverUpdates.getRouteId() != null) {
            driver.setRouteId(driverUpdates.getRouteId());
        }

        Driver updated = driverRepository.save(driver);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /v1/drivers/{id}
     * Completely delete a driver from the database
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDriver(@PathVariable String id) {
        if (!driverRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        driverRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
