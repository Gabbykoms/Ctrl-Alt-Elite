// package com.javashams.tracking.api;
// 
// import com.javashams.tracking.model.Driver;
// import com.javashams.tracking.model.DriverShiftReport;
// import com.javashams.tracking.model.dto.EndDriverShiftReportRequest;
// import com.javashams.tracking.model.dto.StartDriverShiftReportRequest;
// import com.javashams.tracking.repositories.DriverRepository;
// import com.javashams.tracking.repositories.DriverShiftReportRepository;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;
// 
// import java.time.LocalDate;
// import java.util.List;
// import java.util.Optional;
// import java.util.UUID;
// 
// /**
//  * REST API endpoints for driver shift report persistence.
//  * Supports shift-start creation and shift-end completion updates.
//  */
// @RestController
// @RequestMapping("/v1/driver-shift-reports")
// public class DriverShiftReportController {
// 
//     private final DriverShiftReportRepository driverShiftReportRepository;
//     private final DriverRepository driverRepository;
// 
//     public DriverShiftReportController(DriverShiftReportRepository driverShiftReportRepository,
//                                        DriverRepository driverRepository) {
//         this.driverShiftReportRepository = driverShiftReportRepository;
//         this.driverRepository = driverRepository;
//     }
// 
//     /**
//      * POST /v1/driver-shift-reports/start
//      * Create a new shift report at shift start.
//      */
//     @PostMapping("/start")
//     public ResponseEntity<?> startShiftReport(@RequestBody StartDriverShiftReportRequest request) {
//         if (request.reportDate() == null || request.driverId() == null || request.driverId().isBlank()
//                 || request.startingMileage() == null) {
//             return ResponseEntity.badRequest().body("report_date, driver_id, and starting_mileage are required");
//         }
// 
//         if (request.startingMileage() < 0) {
//             return ResponseEntity.badRequest().body("starting_mileage must be >= 0");
//         }
// 
//         Optional<DriverShiftReport> existing = driverShiftReportRepository
//                 .findByDriverIdAndReportDate(request.driverId(), request.reportDate());
//         if (existing.isPresent()) {
//             return ResponseEntity.status(HttpStatus.CONFLICT)
//                     .body("A shift report already exists for this driver and date");
//         }
// 
//         String resolvedDriverName = request.driverName();
//         if (resolvedDriverName == null || resolvedDriverName.isBlank()) {
//             Optional<Driver> driver = driverRepository.findById(request.driverId());
//             if (driver.isPresent()) {
//                 resolvedDriverName = driver.get().getName();
//             }
//         }
// 
//         if (resolvedDriverName == null || resolvedDriverName.isBlank()) {
//             return ResponseEntity.badRequest().body("driver_name is required when driver is not found");
//         }
// 
//         long now = System.currentTimeMillis();
//         DriverShiftReport report = new DriverShiftReport();
//         report.setId("shift-report-" + UUID.randomUUID());
//         report.setReportDate(request.reportDate());
//         report.setRadioNumber(request.radioNumber());
//         report.setDriverId(request.driverId());
//         report.setDriverName(resolvedDriverName);
//         report.setVehicleLicense(request.vehicleLicense());
//         report.setStartingMileage(request.startingMileage());
//         report.setEndingMileage(null);
//         report.setConditionNotes(request.conditionNotes());
//         report.setCreatedAtMs(now);
//         report.setUpdatedAtMs(now);
// 
//         DriverShiftReport saved = driverShiftReportRepository.save(report);
//         return ResponseEntity.status(HttpStatus.CREATED).body(saved);
//     }
// 
//     /**
//      * PATCH /v1/driver-shift-reports/{id}/end
//      * Complete an existing shift report with ending mileage.
//      */
//     @PatchMapping("/{id}/end")
//     public ResponseEntity<?> endShiftReport(@PathVariable String id,
//                                             @RequestBody EndDriverShiftReportRequest request) {
//         Optional<DriverShiftReport> existing = driverShiftReportRepository.findById(id);
//         if (existing.isEmpty()) {
//             return ResponseEntity.notFound().build();
//         }
// 
//         if (request.endingMileage() == null) {
//             return ResponseEntity.badRequest().body("ending_mileage is required");
//         }
// 
//         DriverShiftReport report = existing.get();
//         if (request.endingMileage() < report.getStartingMileage()) {
//             return ResponseEntity.badRequest().body("ending_mileage must be >= starting_mileage");
//         }
// 
//         report.setEndingMileage(request.endingMileage());
//         if (request.conditionNotes() != null) {
//             report.setConditionNotes(request.conditionNotes());
//         }
//         report.setUpdatedAtMs(System.currentTimeMillis());
// 
//         DriverShiftReport saved = driverShiftReportRepository.save(report);
//         return ResponseEntity.ok(saved);
//     }
// 
//     /**
//      * GET /v1/driver-shift-reports/{id}
//      * Get a shift report by ID.
//      */
//     @GetMapping("/{id}")
//     public ResponseEntity<DriverShiftReport> getShiftReportById(@PathVariable String id) {
//         Optional<DriverShiftReport> report = driverShiftReportRepository.findById(id);
//         return report.map(ResponseEntity::ok)
//                 .orElseGet(() -> ResponseEntity.notFound().build());
//     }
// 
//     /**
//      * GET /v1/driver-shift-reports
//      * List all shift reports.
//      */
//     @GetMapping
//     public ResponseEntity<List<DriverShiftReport>> getAllShiftReports() {
//         return ResponseEntity.ok(driverShiftReportRepository.findAll());
//     }
// 
//     /**
//      * GET /v1/driver-shift-reports/driver/{driverId}
//      * List shift reports for a driver.
//      */
//     @GetMapping("/driver/{driverId}")
//     public ResponseEntity<List<DriverShiftReport>> getShiftReportsByDriver(@PathVariable String driverId) {
//         return ResponseEntity.ok(driverShiftReportRepository.findByDriverIdOrderByReportDateDesc(driverId));
//     }
// 
//     /**
//      * GET /v1/driver-shift-reports/date/{reportDate}
//      * List shift reports for a date (format: yyyy-MM-dd).
//      */
//     @GetMapping("/date/{reportDate}")
//     public ResponseEntity<List<DriverShiftReport>> getShiftReportsByDate(@PathVariable LocalDate reportDate) {
//         return ResponseEntity.ok(driverShiftReportRepository.findByReportDateOrderByCreatedAtMsDesc(reportDate));
//     }
// }
