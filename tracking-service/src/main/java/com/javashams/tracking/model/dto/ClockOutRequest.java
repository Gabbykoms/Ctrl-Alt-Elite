package com.javashams.tracking.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ClockOutRequest(
        @JsonProperty("driver_id") String driverId,
        @JsonProperty("ending_mileage") Long endingMileage,
        @JsonProperty("condition_notes") String conditionNotes
) {
}
