package com.javashams.tracking.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for driver location (what students/frontend see)
 * Cleaner than full GeoPoint, contains only relevant info
 */
public record DriverLocationDto(
        @JsonProperty("driver_id") String driverId,
        @JsonProperty("shuttle_id") String shuttleId,
        @JsonProperty("latitude") Double latitude,
        @JsonProperty("longitude") Double longitude,
        @JsonProperty("heading") Double heading,
        @JsonProperty("speed_mps") Double speedMps,
        @JsonProperty("accuracy_meters") Double accuracyMeters,
        @JsonProperty("timestamp_ms") Long timestampMs
) {}
