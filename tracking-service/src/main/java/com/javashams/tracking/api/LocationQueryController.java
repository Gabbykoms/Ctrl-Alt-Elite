// src/main/java/com/javashams/tracking/api/LocationQueryController.java
package com.javashams.tracking.api;

import com.javashams.tracking.model.GeoPoint;
import com.javashams.tracking.services.LocationSink;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1")
public class LocationQueryController {

    private final LocationSink locationSink;

    public LocationQueryController(LocationSink locationSink) {
        this.locationSink = locationSink;
    }

    // GET /v1/locations/latest?org=trinity&deviceId=bus-1
    @GetMapping("/locations/latest")
    public ResponseEntity<GeoPoint> getLatest(
            @RequestParam String org,
            @RequestParam String deviceId
    ) {
        GeoPoint p = locationSink.findLatest(org, deviceId);
        if (p == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(p);
    }

    // GET /v1/locations/latest/org/trinity
    @GetMapping("/locations/latest/org/{org}")
    public List<GeoPoint> getAllForOrg(@PathVariable String org) {
        return locationSink.findAllLatestForOrg(org).stream().toList();
    }
}
