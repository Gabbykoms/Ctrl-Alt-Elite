package com.javashams.tracking.services;

import com.javashams.tracking.model.DriverShiftReport;
import com.javashams.tracking.model.dto.ClockInRequest;
import com.javashams.tracking.model.dto.ClockOutRequest;
import com.javashams.tracking.repositories.DriverShiftReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class DriverShiftReportService {

    private static final Logger logger = LoggerFactory.getLogger(DriverShiftReportService.class);

    private final DriverShiftReportRepository shiftReportRepository;

    public DriverShiftReportService(DriverShiftReportRepository shiftReportRepository) {
        this.shiftReportRepository = shiftReportRepository;
    }

    public Mono<DriverShiftReport> clockIn(ClockInRequest request) {
        if (request.driverId() == null || request.driverId().isBlank()) {
            return Mono.error(new IllegalArgumentException("driver_id is required"));
        }
        if (request.driverName() == null || request.driverName().isBlank()) {
            return Mono.error(new IllegalArgumentException("driver_name is required"));
        }
        if (request.startingMileage() == null || request.startingMileage() < 0) {
            return Mono.error(new IllegalArgumentException("starting_mileage is required and must be >= 0"));
        }

        return shiftReportRepository.findOpenShiftByDriverId(request.driverId())
            .flatMap(existing -> Mono.<DriverShiftReport>error(
                new IllegalStateException("Driver already has an open shift: " + existing.getId())))
            .switchIfEmpty(Mono.defer(() -> {
                long now = System.currentTimeMillis();
                DriverShiftReport report = new DriverShiftReport();
                report.setId("shift-" + UUID.randomUUID());
                report.setDriverId(request.driverId());
                report.setDriverName(request.driverName());
                report.setReportDate(LocalDate.now());
                report.setRadioNumber(request.radioNumber());
                report.setVehicleLicense(request.vehicleLicense());
                report.setStartingMileage(request.startingMileage());
                report.setConditionNotes(request.conditionNotes());
                report.setStatus("IN_PROGRESS");
                report.setClockInTime(Instant.now());
                report.setCreatedAtMs(now);
                report.setUpdatedAtMs(now);
                return shiftReportRepository.save(report);
            }))
            .doOnSuccess(r -> logger.info("Driver {} clocked in, shift: {}", request.driverId(), r.getId()));
    }

    public Mono<DriverShiftReport> clockOut(String driverId, ClockOutRequest request) {
        if (request.endingMileage() == null) {
            return Mono.error(new IllegalArgumentException("ending_mileage is required"));
        }

        return shiftReportRepository.findOpenShiftByDriverId(driverId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("No open shift found for driver: " + driverId)))
            .flatMap(report -> {
                if (request.endingMileage() < report.getStartingMileage()) {
                    return Mono.<DriverShiftReport>error(new IllegalArgumentException(
                        "ending_mileage must be >= starting_mileage (" + report.getStartingMileage() + ")"));
                }
                report.setEndingMileage(request.endingMileage());
                report.setClockOutTime(Instant.now());
                report.setStatus("COMPLETED");
                report.setUpdatedAtMs(System.currentTimeMillis());
                if (request.conditionNotes() != null) {
                    report.setConditionNotes(request.conditionNotes());
                }
                return shiftReportRepository.save(report);
            })
            .doOnSuccess(r -> logger.info("Driver {} clocked out, shift: {}", driverId, r.getId()));
    }

    public Flux<DriverShiftReport> getShiftsForDriver(String driverId) {
        return shiftReportRepository.findByDriverIdOrderByClockInTimeDesc(driverId)
            .doOnComplete(() -> logger.info("Retrieved shifts for driver: {}", driverId));
    }
}
