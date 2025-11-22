package com.javashams.tracking.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for a ride's tracking context
 * Used to initialize and track a ride from start to completion
 */
public record RideTrackingDto(
        @JsonProperty("ride_id") String rideId,
        @JsonProperty("student_id") String studentId,
        @JsonProperty("driver_id") String driverId,
        @JsonProperty("shuttle_id") String shuttleId,
        @JsonProperty("status") String status,
        @JsonProperty("pickup_latitude") Double pickupLatitude,
        @JsonProperty("pickup_longitude") Double pickupLongitude,
        @JsonProperty("dropoff_latitude") Double dropoffLatitude,
        @JsonProperty("dropoff_longitude") Double dropoffLongitude,
        @JsonProperty("created_at_ms") Long createdAtMs,
        @JsonProperty("completed_at_ms") Long completedAtMs
) {}
