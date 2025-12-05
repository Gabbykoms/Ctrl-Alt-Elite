// // src/main/java/com/javashams/tracking/api/IngestController.java
// package com.javashams.tracking.api;


// import com.javashams.tracking.messaging.GeoPublisher;
// import com.javashams.tracking.model.GeoPoint;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;


// @RestController
// @RequestMapping("/v1")
// public class IngestController {
//     private final GeoPublisher publisher;


//     public IngestController(GeoPublisher publisher) { this.publisher = publisher; }


//     @PostMapping("/locations:single")
//     public ResponseEntity<Void> ingest(@RequestBody GeoPoint body) {
//         long serverMs = System.currentTimeMillis();
//         GeoPoint p = new GeoPoint(
//                 body.org(), body.deviceId(), body.tripId(),
//                 body.tsEventMs(), serverMs,
//                 body.latMicro(), body.lonMicro(),
//                 body.accM(), body.spdMps(), body.brgDeg(),
//                 body.seq(), body.idempotency()
//         );
//         publisher.publish(p);
//         return ResponseEntity.accepted().build();
//     }
// }


// src/main/java/com/javashams/tracking/api/IngestController.java
package com.javashams.tracking.api;

import com.javashams.tracking.model.GeoPoint;
import com.javashams.tracking.model.dto.DriverLocationDto;
import com.javashams.tracking.services.LocationSink;
import com.javashams.tracking.services.RideTrackingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1")
public class IngestController {

    private final LocationSink locationSink;
    private final GeoSseController geoSseController;
    private final RideTrackingService rideTrackingService;

    public IngestController(LocationSink locationSink, GeoSseController geoSseController, RideTrackingService rideTrackingService) {
        this.locationSink = locationSink;
        this.geoSseController = geoSseController;
        this.rideTrackingService = rideTrackingService;
    }

    @PostMapping("/locations:single")
    public ResponseEntity<Void> ingest(@RequestBody GeoPoint body) {
        long serverMs = System.currentTimeMillis();
        GeoPoint p = new GeoPoint(
                body.org(), body.deviceId(), body.tripId(),
                body.tsEventMs(), serverMs,
                body.latMicro(), body.lonMicro(),
                body.accM(), body.spdMps(), body.brgDeg(),
                body.seq(), body.idempotency()
        );

        // 1) store latest
        locationSink.upsertLatest(p);

        // 2) push to SSE subscribers
        geoSseController.push(p);

        // 3) Update ALL active rides that have this shuttleId/deviceId
        // This is the key: find all rides and update their driver location if this device is the shuttle
        updateRidesForDevice(body.deviceId(), body.latMicro(), body.lonMicro(), 
                            body.brgDeg(), body.spdMps(), body.accM(), serverMs);

        // Accepted: we processed the update
        return ResponseEntity.accepted().build();
    }

    /**
     * Update all active rides that have this device/shuttle as their driver
     * This connects GPS data to ride-scoped tracking
     */
    private void updateRidesForDevice(String deviceId, int latMicro, int lonMicro, 
                                      Double heading, Double speedMps, Double accuracy, long timestampMs) {
        // Find the ride associated with this shuttle/device
        String rideId = rideTrackingService.getRideIdByShuttleId(deviceId);
        
        if (rideId != null) {
            DriverLocationDto driverLocation = new DriverLocationDto(
                    deviceId,  // driverId (or shuttleId)
                    deviceId,  // shuttleId
                    latMicroToDegrees(latMicro),
                    lonMicroToDegrees(lonMicro),
                    heading,
                    speedMps,
                    accuracy,
                    timestampMs
            );
            rideTrackingService.updateRideDriverLocation(rideId, driverLocation);
        }
    }

    /**
     * Helper: Extract rideId from deviceId if encoded in format "ride:123" or similar
     * Supports formats: "bus-1:ride-123", "ride-123:bus-1", etc.
     */
    private String extractRideIdFromTripId(String deviceId) {
        // Check if deviceId contains a colon (indicates encoded format)
        if (deviceId != null && deviceId.contains(":")) {
            String[] parts = deviceId.split(":");
            if (parts.length == 2) {
                // Try both possibilities: could be "ride-id:device-id" or "device-id:ride-id"
                String part1 = parts[0].trim();
                String part2 = parts[1].trim();
                
                // Return the part that looks like a rideId (contains "ride-")
                if (part1.contains("ride-")) return part1;
                if (part2.contains("ride-")) return part2;
                
                // If neither contains "ride-", assume first part is rideId
                return part1;
            }
        }
        return null;
    }

    /**
     * Helper: Convert microdegrees to decimal degrees
     * GeoPoint stores lat/lng as integers in microdegrees (1e6 factor)
     */
    private Double latMicroToDegrees(int latMicro) {
        return latMicro / 1_000_000.0;
    }

    private Double lonMicroToDegrees(int lonMicro) {
        return lonMicro / 1_000_000.0;
    }
}
