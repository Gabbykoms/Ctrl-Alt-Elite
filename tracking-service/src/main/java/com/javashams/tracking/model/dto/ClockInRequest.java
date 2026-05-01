package com.javashams.tracking.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ClockInRequest(
        @JsonProperty("driver_id") String driverId,
        @JsonProperty("driver_name") String driverName,
        @JsonProperty("radio_number") String radioNumber,
        @JsonProperty("vehicle_license") String vehicleLicense,
        @JsonProperty("starting_mileage") Long startingMileage,
        @JsonProperty("condition_notes") String conditionNotes
) {
}
