// src/main/java/com/javashams/tracking/api/IngestController.java
package com.javashams.tracking.api;


import com.javashams.tracking.messaging.GeoPublisher;
import com.javashams.tracking.model.GeoPoint;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/v1")
public class IngestController {
    private final GeoPublisher publisher;


    public IngestController(GeoPublisher publisher) { this.publisher = publisher; }


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
        publisher.publish(p);
        return ResponseEntity.accepted().build();
    }
}