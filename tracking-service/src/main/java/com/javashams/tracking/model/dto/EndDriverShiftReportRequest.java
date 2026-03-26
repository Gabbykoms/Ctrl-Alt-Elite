package com.javashams.tracking.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request payload for ending a driver shift report.
 */
public record EndDriverShiftReportRequest(
        @JsonProperty("ending_mileage") Long endingMileage,
        @JsonProperty("condition_notes") String conditionNotes
) {
}
