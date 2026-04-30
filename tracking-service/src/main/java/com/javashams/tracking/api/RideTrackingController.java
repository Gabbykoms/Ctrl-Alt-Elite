// package com.javashams.tracking.api;
// 
// import com.javashams.tracking.model.Driver;
// import com.javashams.tracking.model.Ride;
// import com.javashams.tracking.model.dto.DriverLocationDto;
// import com.javashams.tracking.model.dto.RideTrackingDto;
// import com.javashams.tracking.model.dto.StudentLocationDto;
// import com.javashams.tracking.repositories.DriverRepository;
// import com.javashams.tracking.repositories.RideRepository;
// import com.javashams.tracking.services.RideTrackingService;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;
// 
// import java.util.List;
// import java.util.Optional;
// 
// /**
//  * API endpoints for ride-scoped location tracking and persistence.
//  * Allows the backend to initialize/finalize rides, manage rides/drivers in DB,
//  * and query real-time locations.
//  */
// @RestController
// @RequestMapping("/v1/rides")
// public class RideTrackingController {
// 
//     private final RideTrackingService rideTrackingService;
//     private final RideRepository rideRepository;
//     private final DriverRepository driverRepository;
// 
//     public RideTrackingController(RideTrackingService rideTrackingService,
//                                   RideRepository rideRepository,
//                                   DriverRepository driverRepository) {
//         this.rideTrackingService = rideTrackingService;
//         this.rideRepository = rideRepository;
//         this.driverRepository = driverRepository;
//     }
// 
//     /**
//      * POST /v1/rides/{rideId}/start
//      * Initialize tracking for a new ride
//      * Called by backend when a ride is created/confirmed
//      */
//     @PostMapping("/{rideId}/start")
//     public ResponseEntity<RideTrackingDto> startRide(
//             @PathVariable String rideId,
//             @RequestBody RideTrackingDto rideTracking
//     ) {
//         // Start tracking the ride in the service
//         rideTrackingService.startRideTracking(rideTracking);
//         
//         // Also extract and store the student location from the ride tracking data
//         StudentLocationDto studentLocation = new StudentLocationDto(
//                 rideTracking.studentId(),
//                 rideTracking.pickupLatitude(),
//                 rideTracking.pickupLongitude(),
//                 rideTracking.dropoffLatitude(),
//                 rideTracking.dropoffLongitude(),
//                 null,  // pickupAddress (can be added later)
//                 null,  // dropoffAddress (can be added later)
//                 rideTracking.createdAtMs()
//         );
//         rideTrackingService.setRideStudentLocation(rideId, studentLocation);
//         
//         return ResponseEntity.ok(rideTracking);
//     }
// 
//     /**
//      * POST /v1/rides/{rideId}/end
//      * Stop tracking a ride (cleanup)
//      * Called by backend when ride is completed/cancelled
//      */
//     @PostMapping("/{rideId}/end")
//     public ResponseEntity<Void> endRide(@PathVariable String rideId) {
//         rideTrackingService.endRideTracking(rideId);
//         return ResponseEntity.ok().build();
//     }
// 
//     /**
//      * GET /v1/rides/{rideId}/driver-location
//      * Get the latest driver location for a ride
//      * Called by frontend/backend to fetch driver position for student view
//      */
//     @GetMapping("/{rideId}/driver-location")
//     public ResponseEntity<DriverLocationDto> getDriverLocation(@PathVariable String rideId) {
//         DriverLocationDto location = rideTrackingService.getRideDriverLocation(rideId);
//         
//         if (location == null) {
//             return ResponseEntity.notFound().build();
//         }
//         
//         return ResponseEntity.ok(location);
//     }
// 
//     /**
//      * GET /v1/rides/{rideId}/student-location
//      * Get the student's pickup/dropoff locations for a ride
//      * Called by frontend/backend to fetch student location for driver view
//      */
//     @GetMapping("/{rideId}/student-location")
//     public ResponseEntity<StudentLocationDto> getStudentLocation(@PathVariable String rideId) {
//         StudentLocationDto location = rideTrackingService.getRideStudentLocation(rideId);
//         
//         if (location == null) {
//             return ResponseEntity.notFound().build();
//         }
//         
//         return ResponseEntity.ok(location);
//     }
// 
//     /**
//      * GET /v1/rides/{rideId}/context
//      * Get the full ride tracking context (for debugging/admin)
//      */
//     @GetMapping("/{rideId}/context")
//     public ResponseEntity<RideTrackingDto> getRideContext(@PathVariable String rideId) {
//         RideTrackingDto context = rideTrackingService.getRideContext(rideId);
//         
//         if (context == null) {
//             return ResponseEntity.notFound().build();
//         }
//         
//         return ResponseEntity.ok(context);
//     }
// 
//     // ============================================================================
//     // PERSISTENCE ENDPOINTS - Ride/Driver Database CRUD
//     // ============================================================================
// 
//     /**
//      * POST /v1/rides/create
//      * Create a new ride in the database
//      * Auto-assigns an available online driver if one exists for the shuttle
//      * If no driver available, driver_id remains null (REQUESTED status)
//      */
//     @PostMapping("/create")
//     public ResponseEntity<Ride> createRide(@RequestBody Ride ride) {
//         if (ride.getCreatedAtMs() == null) {
//             ride.setCreatedAtMs(System.currentTimeMillis());
//         }
//         
//         // Try to assign an online driver for this shuttle
//         List<Driver> availableDrivers = driverRepository.findOnlineDriversByShuttle(ride.getShuttleId());
//         if (!availableDrivers.isEmpty()) {
//             // Assign the first available driver
//             ride.setDriverId(availableDrivers.get(0).getId());
//             ride.setStatus("IN_PROGRESS");  // Change status to IN_PROGRESS if driver found
//         } else {
//             // No driver available, set status to REQUESTED and leave driver_id null
//             ride.setStatus("REQUESTED");
//             ride.setDriverId(null);
//         }
//         
//         Ride saved = rideRepository.save(ride);
//         return ResponseEntity.status(HttpStatus.CREATED).body(saved);
//     }
// 
//     /**
//      * GET /v1/rides (modified to include DB query)
//      * Get all rides from database
//      */
//     @GetMapping
//     public ResponseEntity<List<Ride>> getAllRides() {
//         List<Ride> rides = rideRepository.findAll();
//         return ResponseEntity.ok(rides);
//     }
// 
//     /**
//      * GET /v1/rides/{rideId}/details
//      * Get ride details from database
//      */
//     @GetMapping("/{rideId}/details")
//     public ResponseEntity<Ride> getRideDetails(@PathVariable String rideId) {
//         Optional<Ride> ride = rideRepository.findByRideId(rideId);
//         return ride.map(ResponseEntity::ok)
//                 .orElseGet(() -> ResponseEntity.notFound().build());
//     }
// 
//     /**
//      * PUT /v1/rides/{rideId}
//      * Update a ride in the database
//      */
//     @PutMapping("/{rideId}")
//     public ResponseEntity<Ride> updateRide(@PathVariable String rideId, @RequestBody Ride rideUpdates) {
//         Optional<Ride> existing = rideRepository.findByRideId(rideId);
//         if (existing.isEmpty()) {
//             return ResponseEntity.notFound().build();
//         }
// 
//         Ride ride = existing.get();
//         
//         if (rideUpdates.getDriverId() != null) {
//             ride.setDriverId(rideUpdates.getDriverId());
//         }
//         if (rideUpdates.getStatus() != null) {
//             ride.setStatus(rideUpdates.getStatus());
//         }
//         if (rideUpdates.getCompletedAtMs() != null) {
//             ride.setCompletedAtMs(rideUpdates.getCompletedAtMs());
//         }
// 
//         Ride updated = rideRepository.save(ride);
//         return ResponseEntity.ok(updated);
//     }
// 
//     /**
//      * POST /v1/rides/driver/{driverId}/location
//      * Update driver location (in-memory tracking + persistent DB update)
//      * Called periodically by driver app to broadcast current location
//      */
//     @PostMapping("/driver/{driverId}/location")
//     public ResponseEntity<Driver> updateDriverLocation(
//             @PathVariable String driverId,
//             @RequestBody DriverLocationDto locationUpdate
//     ) {
//         // Update in-memory tracking for all rides this driver is tracking
//         rideTrackingService.updateRideDriverLocation(driverId, locationUpdate);
//         
//         // Update driver in database
//         Optional<Driver> existing = driverRepository.findById(driverId);
//         if (existing.isEmpty()) {
//             return ResponseEntity.notFound().build();
//         }
// 
//         Driver driver = existing.get();
//         driver.setCurrentLat(locationUpdate.latitude());
//         driver.setCurrentLng(locationUpdate.longitude());
//         driver.setLastLocationUpdateAtMs(System.currentTimeMillis());
//         
//         Driver updated = driverRepository.save(driver);
//         return ResponseEntity.ok(updated);
//     }
// 
//     /**
//      * GET /v1/rides/student/{studentId}/active
//      * Get active rides for a student
//      */
//     @GetMapping("/student/{studentId}/active")
//     public ResponseEntity<List<Ride>> getActiveRidesForStudent(@PathVariable String studentId) {
//         List<Ride> rides = rideRepository.findRecentRidesByStudent(studentId);
//         return ResponseEntity.ok(rides);
//     }
// 
//     /**
//      * GET /v1/rides/driver/{driverId}/assigned
//      * Get all rides assigned to a driver
//      */
//     @GetMapping("/driver/{driverId}/assigned")
//     public ResponseEntity<List<Ride>> getRidesForDriver(@PathVariable String driverId) {
//         List<Ride> rides = rideRepository.findByDriverId(driverId);
//         return ResponseEntity.ok(rides);
//     }
// 
//     /**
//      * GET /v1/rides/{rideId}/driver-location-details
//      * Get the driver's current location details for a specific ride
//      * Returns the driver object with current lat/lng and other metadata
//      */
//     @GetMapping("/{rideId}/driver-location-details")
//     public ResponseEntity<Driver> getDriverLocationForRide(@PathVariable String rideId) {
//         // Get the ride
//         Optional<Ride> ride = rideRepository.findByRideId(rideId);
//         if (ride.isEmpty()) {
//             return ResponseEntity.notFound().build();
//         }
// 
//         // Check if ride has a driver assigned
//         String driverId = ride.get().getDriverId();
//         if (driverId == null) {
//             return ResponseEntity.notFound().build();  // No driver assigned yet
//         }
// 
//         // Get the driver details
//         Optional<Driver> driver = driverRepository.findById(driverId);
//         return driver.map(ResponseEntity::ok)
//                 .orElseGet(() -> ResponseEntity.notFound().build());
//     }
// 
//     /**
//      * GET /v1/rides/query/pending
//      * Get all pending rides (REQUESTED status with no driver assigned)
//      * These rides are waiting for a driver to become available
//      */
//     @GetMapping("/query/pending")
//     public ResponseEntity<List<Ride>> getPendingRides() {
//         List<Ride> rides = rideRepository.findPendingRides();
//         return ResponseEntity.ok(rides);
//     }
// 
//     /**
//      * GET /v1/rides/query/active
//      * Get all active rides (REQUESTED or IN_PROGRESS)
//      */
//     @GetMapping("/query/active")
//     public ResponseEntity<List<Ride>> getActiveRides() {
//         List<Ride> rides = rideRepository.findActiveRides();
//         return ResponseEntity.ok(rides);
//     }
// }
