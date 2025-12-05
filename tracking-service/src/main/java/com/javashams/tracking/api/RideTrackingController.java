package com.javashams.tracking.api;

import com.javashams.tracking.model.dto.DriverLocationDto;
import com.javashams.tracking.model.dto.RideTrackingDto;
import com.javashams.tracking.model.dto.StudentLocationDto;
import com.javashams.tracking.services.RideTrackingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * API endpoints for ride-scoped location tracking.
 * Allows the backend to initialize/finalize rides and query locations.
 */
@RestController
@RequestMapping("/v1/rides")
public class RideTrackingController {

    private final RideTrackingService rideTrackingService;

    public RideTrackingController(RideTrackingService rideTrackingService) {
        this.rideTrackingService = rideTrackingService;
    }

    /**
     * POST /v1/rides/{rideId}/start
     * Initialize tracking for a new ride
     * Called by backend when a ride is created/confirmed
     */
    @PostMapping("/{rideId}/start")
    public ResponseEntity<RideTrackingDto> startRide(
            @PathVariable String rideId,
            @RequestBody RideTrackingDto rideTracking
    ) {
        // Start tracking the ride in the service
        rideTrackingService.startRideTracking(rideTracking);
        
        // Also extract and store the student location from the ride tracking data
        StudentLocationDto studentLocation = new StudentLocationDto(
                rideTracking.studentId(),
                rideTracking.pickupLatitude(),
                rideTracking.pickupLongitude(),
                rideTracking.dropoffLatitude(),
                rideTracking.dropoffLongitude(),
                null,  // pickupAddress (can be added later)
                null,  // dropoffAddress (can be added later)
                rideTracking.createdAtMs()
        );
        rideTrackingService.setRideStudentLocation(rideId, studentLocation);
        
        return ResponseEntity.ok(rideTracking);
    }

    /**
     * POST /v1/rides/{rideId}/end
     * Stop tracking a ride (cleanup)
     * Called by backend when ride is completed/cancelled
     */
    @PostMapping("/{rideId}/end")
    public ResponseEntity<Void> endRide(@PathVariable String rideId) {
        rideTrackingService.endRideTracking(rideId);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /v1/rides/{rideId}/driver-location
     * Get the latest driver location for a ride
     * Called by frontend/backend to fetch driver position for student view
     */
    @GetMapping("/{rideId}/driver-location")
    public ResponseEntity<DriverLocationDto> getDriverLocation(@PathVariable String rideId) {
        DriverLocationDto location = rideTrackingService.getRideDriverLocation(rideId);
        
        if (location == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(location);
    }

    /**
     * GET /v1/rides/{rideId}/student-location
     * Get the student's pickup/dropoff locations for a ride
     * Called by frontend/backend to fetch student location for driver view
     */
    @GetMapping("/{rideId}/student-location")
    public ResponseEntity<StudentLocationDto> getStudentLocation(@PathVariable String rideId) {
        StudentLocationDto location = rideTrackingService.getRideStudentLocation(rideId);
        
        if (location == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(location);
    }

    /**
     * GET /v1/rides/{rideId}/context
     * Get the full ride tracking context (for debugging/admin)
     */
    @GetMapping("/{rideId}/context")
    public ResponseEntity<RideTrackingDto> getRideContext(@PathVariable String rideId) {
        RideTrackingDto context = rideTrackingService.getRideContext(rideId);
        
        if (context == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(context);
    }
}
