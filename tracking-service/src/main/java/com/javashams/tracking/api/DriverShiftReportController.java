package com.javashams.tracking.api;

import com.javashams.tracking.model.dto.ClockInRequest;
import com.javashams.tracking.model.dto.ClockOutRequest;
import com.javashams.tracking.services.DriverShiftReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/v1/shifts")
public class DriverShiftReportController {

    private static final Logger logger = LoggerFactory.getLogger(DriverShiftReportController.class);

    private final DriverShiftReportService shiftReportService;

    public DriverShiftReportController(DriverShiftReportService shiftReportService) {
        this.shiftReportService = shiftReportService;
    }

    @PostMapping("/clock-in")
    public Mono<ResponseEntity<?>> clockIn(@RequestBody ClockInRequest request) {
        return shiftReportService.clockIn(request)
                .<ResponseEntity<?>>map(report -> ResponseEntity.status(HttpStatus.CREATED).body(report))
                .onErrorResume(IllegalArgumentException.class, e ->
                        Mono.just(ResponseEntity.badRequest()
                                .body(Map.of("error", e.getMessage()))))
                .onErrorResume(IllegalStateException.class, e ->
                        Mono.just(ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(Map.of("error", e.getMessage()))))
                .onErrorResume(e -> {
                    logger.error("Unexpected error during clock-in for driver: {}", request.driverId(), e);
                    return Mono.just(ResponseEntity.internalServerError()
                            .body(Map.of("error", "Failed to clock in", "message", e.getMessage())));
                });
    }

    @PostMapping("/clock-out")
    public Mono<ResponseEntity<?>> clockOut(@RequestBody ClockOutRequest request) {
        return shiftReportService.clockOut(request.driverId(), request)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .onErrorResume(IllegalArgumentException.class, e ->
                        Mono.just(ResponseEntity.badRequest()
                                .body(Map.of("error", e.getMessage()))))
                .onErrorResume(e -> {
                    logger.error("Unexpected error during clock-out for driver: {}", request.driverId(), e);
                    return Mono.just(ResponseEntity.internalServerError()
                            .body(Map.of("error", "Failed to clock out", "message", e.getMessage())));
                });
    }

    @GetMapping
    public Mono<ResponseEntity<?>> getAllShifts() {
        return shiftReportService.getAllShifts()
                .collectList()
                .<ResponseEntity<?>>map(shifts -> ResponseEntity.ok(Map.of(
                        "shifts", shifts,
                        "total", shifts.size()
                )))
                .onErrorResume(e -> {
                    logger.error("Error retrieving all shifts", e);
                    return Mono.just(ResponseEntity.internalServerError()
                            .body(Map.of("error", "Failed to retrieve shifts", "message", String.valueOf(e.getMessage()))));
                });
    }

    @GetMapping("/driver/{driverId}")
    public Mono<ResponseEntity<?>> getShiftsForDriver(@PathVariable String driverId) {
        return shiftReportService.getShiftsForDriver(driverId)
                .collectList()
                .<ResponseEntity<?>>map(shifts -> ResponseEntity.ok(Map.of(
                        "shifts", shifts,
                        "total", shifts.size(),
                        "driver_id", driverId
                )))
                .onErrorResume(e -> {
                    logger.error("Error retrieving shifts for driver: {}", driverId, e);
                    return Mono.just(ResponseEntity.internalServerError()
                            .body(Map.of("error", "Failed to retrieve shifts", "message", e.getMessage())));
                });
    }
}
