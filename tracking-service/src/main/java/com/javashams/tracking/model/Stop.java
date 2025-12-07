package com.javashams.tracking.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * JPA Entity for Stop persistence in PostgreSQL
 * Represents a campus shuttle stop with location coordinates
 */
@Entity
@Table(name = "stops", indexes = {
    @Index(name = "idx_stops_name", columnList = "name"),
    @Index(name = "idx_stops_is_active", columnList = "is_active"),
    @Index(name = "idx_stops_created_at", columnList = "created_at_ms"),
    @Index(name = "idx_stops_coordinates", columnList = "latitude,longitude")
})
public class Stop {
    
    @Id
    private String id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false, columnDefinition = "DECIMAL(10,6)")
    private Double latitude;
    
    @Column(nullable = false, columnDefinition = "DECIMAL(10,6)")
    private Double longitude;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, name = "is_active")
    private Boolean isActive = true;
    
    @Column(nullable = false, name = "created_at_ms")
    private Long createdAtMs;
    
    @Column(nullable = false, name = "updated_at_ms")
    private Long updatedAtMs;
    
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
    
    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
    
    // Constructors
    public Stop() {
    }
    
    public Stop(String id, String name, Double latitude, Double longitude, 
                String description, Boolean isActive, Long createdAtMs, Long updatedAtMs) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.description = description;
        this.isActive = isActive != null ? isActive : true;
        this.createdAtMs = createdAtMs;
        this.updatedAtMs = updatedAtMs;
        this.createdAt = Instant.ofEpochMilli(createdAtMs);
        this.updatedAt = Instant.ofEpochMilli(updatedAtMs);
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
    
    public Double getLatitude() {
        return latitude;
    }
    
    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }
    
    public Double getLongitude() {
        return longitude;
    }
    
    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public Long getCreatedAtMs() {
        return createdAtMs;
    }
    
    public void setCreatedAtMs(Long createdAtMs) {
        this.createdAtMs = createdAtMs;
    }
    
    public Long getUpdatedAtMs() {
        return updatedAtMs;
    }
    
    public void setUpdatedAtMs(Long updatedAtMs) {
        this.updatedAtMs = updatedAtMs;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
        updatedAtMs = System.currentTimeMillis();
    }
    
    @Override
    public String toString() {
        return "Stop{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", isActive=" + isActive +
                '}';
    }
}
