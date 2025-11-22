package com.javashams.tracking.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for student location (what drivers see)
 * Includes pickup/dropoff details for the ride
 */
public record StudentLocationDto(
        @JsonProperty("student_id") String studentId,
        @JsonProperty("pickup_latitude") Double pickupLatitude,
        @JsonProperty("pickup_longitude") Double pickupLongitude,
        @JsonProperty("dropoff_latitude") Double dropoffLatitude,
        @JsonProperty("dropoff_longitude") Double dropoffLongitude,
        @JsonProperty("pickup_address") String pickupAddress,
        @JsonProperty("dropoff_address") String dropoffAddress,
        @JsonProperty("requested_at_ms") Long requestedAtMs
) {}
