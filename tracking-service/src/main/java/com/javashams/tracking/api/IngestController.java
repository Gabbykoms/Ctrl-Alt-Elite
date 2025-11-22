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

        // 3) If this is associated with a ride, update ride tracking
        // deviceId typically contains ride context or we can extract it
        // For now, we store it as the shuttle_id
        String rideId = extractRideIdFromDeviceId(body.deviceId());
        if (rideId != null) {
            DriverLocationDto driverLocation = new DriverLocationDto(
                    body.deviceId(),  // driverId (or shuttleId)
                    body.deviceId(),  // shuttleId
                    latMicroToDegrees(body.latMicro()),
                    lonMicroToDegrees(body.lonMicro()),
                    body.brgDeg(),
                    body.spdMps(),
                    body.accM(),
                    serverMs
            );
            rideTrackingService.updateRideDriverLocation(rideId, driverLocation);
        }

        // Accepted: we processed the update
        return ResponseEntity.accepted().build();
    }

    /**
     * Helper: Extract rideId from deviceId if encoded in format "ride:123" or similar
     * For now, returns null (ride context is set separately via /v1/rides/{rideId}/start)
     */
    private String extractRideIdFromDeviceId(String deviceId) {
        // TODO: Implement if deviceId contains encoded ride context
        // Example: if (deviceId.contains(":")) { return deviceId.split(":")[0]; }
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
