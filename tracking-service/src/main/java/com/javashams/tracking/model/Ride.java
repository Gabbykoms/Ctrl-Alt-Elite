package com.javashams.tracking.model;

import jakarta.persistence.*;

/**
 * JPA Entity for Ride Order persistence in PostgreSQL
 * Represents a shuttle ride request with status tracking
 */
@Entity
@Table(name = "rides", indexes = {
    @Index(name = "idx_rides_student_id", columnList = "student_id"),
    @Index(name = "idx_rides_driver_id", columnList = "driver_id"),
    @Index(name = "idx_rides_shuttle_id", columnList = "shuttle_id"),
    @Index(name = "idx_rides_status", columnList = "status"),
    @Index(name = "idx_rides_created_at_ms", columnList = "created_at_ms")
})
public class Ride {
    
    @Id
    @Column(name = "ride_id")
    private String rideId;
    
    @Column(nullable = false)
    private String studentId;
    
    @Column(nullable = true, name = "driver_id")
    private String driverId; // Nullable - driver might not be assigned yet
    
    @Column(nullable = false)
    private String shuttleId;
    
    @Column(nullable = false)
    private String status = "REQUESTED"; // REQUESTED | IN_PROGRESS | COMPLETED | CANCELED
    
    @Column(nullable = false, name = "pickup_lat", columnDefinition = "DECIMAL(10,6)")
    private Double pickupLat;
    
    @Column(nullable = false, name = "pickup_lng", columnDefinition = "DECIMAL(10,6)")
    private Double pickupLng;
    
    @Column(nullable = false, name = "dropoff_lat", columnDefinition = "DECIMAL(10,6)")
    private Double dropoffLat;
    
    @Column(nullable = false, name = "dropoff_lng", columnDefinition = "DECIMAL(10,6)")
    private Double dropoffLng;
    
    @Column(nullable = false, name = "created_at_ms")
    private Long createdAtMs;
    
    @Column(nullable = true, name = "completed_at_ms")
    private Long completedAtMs;
    
    // Constructors
    public Ride() {
    }
    
    public Ride(String rideId, String studentId, String shuttleId, 
                Double pickupLat, Double pickupLng, Double dropoffLat, Double dropoffLng) {
        this.rideId = rideId;
        this.studentId = studentId;
        this.shuttleId = shuttleId;
        this.pickupLat = pickupLat;
        this.pickupLng = pickupLng;
        this.dropoffLat = dropoffLat;
        this.dropoffLng = dropoffLng;
        this.status = "REQUESTED";
        this.createdAtMs = System.currentTimeMillis();
    }
    
    public Ride(String rideId, String studentId, String driverId, String shuttleId, String status,
                Double pickupLat, Double pickupLng, Double dropoffLat, Double dropoffLng,
                Long createdAtMs, Long completedAtMs) {
        this.rideId = rideId;
        this.studentId = studentId;
        this.driverId = driverId;
        this.shuttleId = shuttleId;
        this.status = status != null ? status : "REQUESTED";
        this.pickupLat = pickupLat;
        this.pickupLng = pickupLng;
        this.dropoffLat = dropoffLat;
        this.dropoffLng = dropoffLng;
        this.createdAtMs = createdAtMs;
        this.completedAtMs = completedAtMs;
    }
    
    // Getters and Setters
    public String getRideId() {
        return rideId;
    }
    
    public void setRideId(String rideId) {
        this.rideId = rideId;
    }
    
    public String getStudentId() {
        return studentId;
    }
    
    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }
    
    public String getDriverId() {
        return driverId;
    }
    
    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }
    
    public String getShuttleId() {
        return shuttleId;
    }
    
    public void setShuttleId(String shuttleId) {
        this.shuttleId = shuttleId;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Double getPickupLat() {
        return pickupLat;
    }
    
    public void setPickupLat(Double pickupLat) {
        this.pickupLat = pickupLat;
    }
    
    public Double getPickupLng() {
        return pickupLng;
    }
    
    public void setPickupLng(Double pickupLng) {
        this.pickupLng = pickupLng;
    }
    
    public Double getDropoffLat() {
        return dropoffLat;
    }
    
    public void setDropoffLat(Double dropoffLat) {
        this.dropoffLat = dropoffLat;
    }
    
    public Double getDropoffLng() {
        return dropoffLng;
    }
    
    public void setDropoffLng(Double dropoffLng) {
        this.dropoffLng = dropoffLng;
    }
    
    public Long getCreatedAtMs() {
        return createdAtMs;
    }
    
    public void setCreatedAtMs(Long createdAtMs) {
        this.createdAtMs = createdAtMs;
    }
    
    public Long getCompletedAtMs() {
        return completedAtMs;
    }
    
    public void setCompletedAtMs(Long completedAtMs) {
        this.completedAtMs = completedAtMs;
    }
}
