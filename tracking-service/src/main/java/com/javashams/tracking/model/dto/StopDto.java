package com.javashams.tracking.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for stop information (campus shuttle stop)
 * Contains location coordinates and stop name
 * Immutable record for thread-safety
 */
public record StopDto(
        @JsonProperty("id") String id,
        @JsonProperty("name") String name,
        @JsonProperty("latitude") Double latitude,
        @JsonProperty("longitude") Double longitude,
        @JsonProperty("description") String description,
        @JsonProperty("is_active") Boolean isActive,
        @JsonProperty("created_at_ms") Long createdAtMs,
        @JsonProperty("updated_at_ms") Long updatedAtMs
) {
    /**
     * Convenience constructor for creating a stop with minimal info
     */
    public StopDto(String id, String name, Double latitude, Double longitude) {
        this(id, name, latitude, longitude, null, true, System.currentTimeMillis(), System.currentTimeMillis());
    }
}
