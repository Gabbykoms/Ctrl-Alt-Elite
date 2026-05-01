package com.javashams.tracking.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
@Table(name = "drivers", indexes = {
    @Index(name = "idx_drivers_tracking_status", columnList = "tracking_status"),
    @Index(name = "idx_drivers_route_id", columnList = "route_id")
})
public class Driver {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @JsonProperty("route_id")
    @Column(nullable = true, name = "route_id")
    private String routeId;

    @JsonProperty("current_lat")
    @Column(nullable = true, name = "current_lat")
    private Double currentLat;

    @JsonProperty("current_lng")
    @Column(nullable = true, name = "current_lng")
    private Double currentLng;

    @JsonProperty("last_location_update_at_ms")
    @Column(nullable = true, name = "last_location_update_at_ms")
    private Long lastLocationUpdateAtMs;

    @JsonProperty("tracking_status")
    @Column(nullable = true, name = "tracking_status")
    private String status;
    
    public Driver() {
    }

    public Driver(String id, String name) {
        this.id = id;
        this.name = name;
        this.status = "OFFLINE";
    }

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
