package com.javashams.tracking.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;

/**
 * Request payload for creating a driver shift report at shift start.
 */
public record StartDriverShiftReportRequest(
        @JsonProperty("report_date") LocalDate reportDate,
        @JsonProperty("radio_number") String radioNumber,
        @JsonProperty("driver_id") String driverId,
        @JsonProperty("driver_name") String driverName,
        @JsonProperty("vehicle_license") String vehicleLicense,
        @JsonProperty("starting_mileage") Long startingMileage,
        @JsonProperty("condition_notes") String conditionNotes
) {
}
