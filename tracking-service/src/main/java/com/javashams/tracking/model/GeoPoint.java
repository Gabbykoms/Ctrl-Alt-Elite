// src/main/java/com/javashams/tracking/model/GeoPoint.java
package com.javashams.tracking.model;


import java.time.Instant;


public record GeoPoint(
        String org,
        String deviceId,
        String tripId,
        long tsEventMs,
        long tsServerMs,
        int latMicro,
        int lonMicro,
        Double accM,
        Double spdMps,
        Double brgDeg,
        long seq,
        String idempotency
) {
    public Instant tsEvent() { return Instant.ofEpochMilli(tsEventMs); }
    public Instant tsServer() { return Instant.ofEpochMilli(tsServerMs); }
}