// src/main/java/com/javashams/tracking/services/LocationSink.java
package com.javashams.tracking.services;

import com.javashams.tracking.model.GeoPoint;

import java.util.Collection;

public interface LocationSink {

    /** upsert “latest” location for this (org, deviceId) */
    void upsertLatest(GeoPoint p);

    /** optional: history, leave as no-op for now */
    default void appendHistory(GeoPoint p) { }

    /** get latest location for a given org + deviceId, or null if none */
    GeoPoint findLatest(String org, String deviceId);

    /** get all latest locations for an org */
    Collection<GeoPoint> findAllLatestForOrg(String org);
}
