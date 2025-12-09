package com.javashams.tracking.model;

import jakarta.persistence.*;

/**
 * JPA Entity for Driver persistence in PostgreSQL
 * Represents a shuttle/bus driver with location tracking
 */
@Entity
@Table(name = "drivers", indexes = {
    @Index(name = "idx_drivers_status", columnList = "status"),
    @Index(name = "idx_drivers_shuttle_id", columnList = "shuttle_id")
})
public class Driver {
    
    @Id
    private String id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = true)
    private String shuttleId;
    
    @Column(nullable = true)
    private String routeId;
    
    @Column(nullable = true, columnDefinition = "DECIMAL(10,6)")
    private Double currentLat;
    
    @Column(nullable = true, columnDefinition = "DECIMAL(10,6)")
    private Double currentLng;
    
    @Column(nullable = true, name = "last_location_update_at_ms")
    private Long lastLocationUpdateAtMs;
    
    @Column(nullable = false)
    private String status = "OFFLINE"; // OFFLINE | ONLINE
    
    // Constructors
    public Driver() {
    }
    
    public Driver(String id, String name) {
        this.id = id;
        this.name = name;
        this.status = "OFFLINE";
    }
    
    public Driver(String id, String name, String shuttleId, String routeId, 
                  Double currentLat, Double currentLng, Long lastLocationUpdateAtMs, 
                  String status) {
        this.id = id;
        this.name = name;
        this.shuttleId = shuttleId;
        this.routeId = routeId;
        this.currentLat = currentLat;
        this.currentLng = currentLng;
        this.lastLocationUpdateAtMs = lastLocationUpdateAtMs;
        this.status = status != null ? status : "OFFLINE";
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getShuttleId() {
        return shuttleId;
    }
    
    public void setShuttleId(String shuttleId) {
        this.shuttleId = shuttleId;
    }
    
    public String getRouteId() {
        return routeId;
    }
    
    public void setRouteId(String routeId) {
        this.routeId = routeId;
    }
    
    public Double getCurrentLat() {
        return currentLat;
    }
    
    public void setCurrentLat(Double currentLat) {
        this.currentLat = currentLat;
    }
    
    public Double getCurrentLng() {
        return currentLng;
    }
    
    public void setCurrentLng(Double currentLng) {
        this.currentLng = currentLng;
    }
    
    public Long getLastLocationUpdateAtMs() {
        return lastLocationUpdateAtMs;
    }
    
    public void setLastLocationUpdateAtMs(Long lastLocationUpdateAtMs) {
        this.lastLocationUpdateAtMs = lastLocationUpdateAtMs;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
}
