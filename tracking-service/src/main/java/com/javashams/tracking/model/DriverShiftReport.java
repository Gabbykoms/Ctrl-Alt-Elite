package com.javashams.tracking.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
@Table(name = "driver_shift_reports", indexes = {
    @Index(name = "idx_driver_shift_reports_driver_id", columnList = "driver_id"),
    @Index(name = "idx_driver_shift_reports_report_date", columnList = "report_date")
})
public class DriverShiftReport {

    @Id
    private String id;

    @JsonProperty("report_date")
    @Column(nullable = false, name = "report_date")
    private LocalDate reportDate;

    @JsonProperty("radio_number")
    @Column(nullable = true, name = "radio_number")
    private String radioNumber;

    @JsonProperty("driver_id")
    @Column(nullable = false, name = "driver_id")
    private String driverId;

    @JsonProperty("driver_name")
    @Column(nullable = false, name = "driver_name")
    private String driverName;

    @JsonProperty("vehicle_license")
    @Column(nullable = true, name = "vehicle_license")
    private String vehicleLicense;

    @JsonProperty("starting_mileage")
    @Column(nullable = false, name = "starting_mileage")
    private Long startingMileage;

    @JsonProperty("ending_mileage")
    @Column(nullable = true, name = "ending_mileage")
    private Long endingMileage;

    @JsonProperty("condition_notes")
    @Column(nullable = true, name = "condition_notes", columnDefinition = "TEXT")
    private String conditionNotes;

    @JsonProperty("created_at_ms")
    @Column(nullable = false, name = "created_at_ms")
    private Long createdAtMs;

    @JsonProperty("updated_at_ms")
    @Column(nullable = false, name = "updated_at_ms")
    private Long updatedAtMs;

    @JsonProperty("status")
    @Column(nullable = true, name = "status")
    private String status;

    @JsonProperty("clock_in_time")
    @Column(nullable = false, name = "clock_in_time")
    private Instant clockInTime;

    @JsonProperty("clock_out_time")
    @Column(nullable = true, name = "clock_out_time")
    private Instant clockOutTime;

    public DriverShiftReport() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public LocalDate getReportDate() {
        return reportDate;
    }

    public void setReportDate(LocalDate reportDate) {
        this.reportDate = reportDate;
    }

    public String getRadioNumber() {
        return radioNumber;
    }

    public void setRadioNumber(String radioNumber) {
        this.radioNumber = radioNumber;
    }

    public String getDriverId() {
        return driverId;
    }

    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getVehicleLicense() {
        return vehicleLicense;
    }

    public void setVehicleLicense(String vehicleLicense) {
        this.vehicleLicense = vehicleLicense;
    }

    public Long getStartingMileage() {
        return startingMileage;
    }

    public void setStartingMileage(Long startingMileage) {
        this.startingMileage = startingMileage;
    }

    public Long getEndingMileage() {
        return endingMileage;
    }

    public void setEndingMileage(Long endingMileage) {
        this.endingMileage = endingMileage;
    }

    public String getConditionNotes() {
        return conditionNotes;
    }

    public void setConditionNotes(String conditionNotes) {
        this.conditionNotes = conditionNotes;
    }

    public Long getCreatedAtMs() {
        return createdAtMs;
    }

    public void setCreatedAtMs(Long createdAtMs) {
        this.createdAtMs = createdAtMs;
    }

    public Long getUpdatedAtMs() {
        return updatedAtMs;
    }

    public void setUpdatedAtMs(Long updatedAtMs) {
        this.updatedAtMs = updatedAtMs;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getClockInTime() {
        return clockInTime;
    }

    public void setClockInTime(Instant clockInTime) {
        this.clockInTime = clockInTime;
    }

    public Instant getClockOutTime() {
        return clockOutTime;
    }

    public void setClockOutTime(Instant clockOutTime) {
        this.clockOutTime = clockOutTime;
    }
}
