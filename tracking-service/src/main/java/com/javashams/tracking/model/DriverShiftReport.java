package com.javashams.tracking.model;

import jakarta.persistence.*;

import java.time.LocalDate;

/**
 * JPA Entity for driver shift dashboard reports.
 * Stores shift-level operational details captured by driver dashboards.
 */
@Entity
@Table(name = "driver_shift_reports", indexes = {
    @Index(name = "idx_driver_shift_reports_driver_id", columnList = "driver_id"),
    @Index(name = "idx_driver_shift_reports_report_date", columnList = "report_date")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uq_driver_shift_driver_date", columnNames = {"driver_id", "report_date"})
})
public class DriverShiftReport {

    @Id
    private String id;

    @Column(nullable = false, name = "report_date")
    private LocalDate reportDate;

    @Column(nullable = true, name = "radio_number")
    private String radioNumber;

    @Column(nullable = false, name = "driver_id")
    private String driverId;

    @Column(nullable = false, name = "driver_name")
    private String driverName;

    @Column(nullable = true, name = "vehicle_license")
    private String vehicleLicense;

    @Column(nullable = false, name = "starting_mileage")
    private Long startingMileage;

    @Column(nullable = true, name = "ending_mileage")
    private Long endingMileage;

    @Column(nullable = true, name = "condition_notes", columnDefinition = "TEXT")
    private String conditionNotes;

    @Column(nullable = false, name = "created_at_ms")
    private Long createdAtMs;

    @Column(nullable = false, name = "updated_at_ms")
    private Long updatedAtMs;

    public DriverShiftReport() {
    }

    public DriverShiftReport(String id, LocalDate reportDate, String radioNumber, String driverId,
                             String driverName, String vehicleLicense, Long startingMileage,
                             Long endingMileage, String conditionNotes, Long createdAtMs, Long updatedAtMs) {
        this.id = id;
        this.reportDate = reportDate;
        this.radioNumber = radioNumber;
        this.driverId = driverId;
        this.driverName = driverName;
        this.vehicleLicense = vehicleLicense;
        this.startingMileage = startingMileage;
        this.endingMileage = endingMileage;
        this.conditionNotes = conditionNotes;
        this.createdAtMs = createdAtMs;
        this.updatedAtMs = updatedAtMs;
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
}