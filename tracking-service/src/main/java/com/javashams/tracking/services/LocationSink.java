// src/main/java/com/javashams/tracking/service/LocationSink.java
package com.javashams.tracking.services;


import com.javashams.tracking.model.GeoPoint;


/**
 * Storage abstraction – implement with Redis, Postgres, etc.
 */
public interface LocationSink {
    default void upsertLatest(GeoPoint p) { /* no-op default */ }
    default void appendHistory(GeoPoint p) { /* no-op default */ }
}