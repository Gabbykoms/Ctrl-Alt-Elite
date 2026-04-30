// // src/main/java/com/javashams/tracking/services/InMemoryLocationSink.java
// package com.javashams.tracking.services;
// 
// import com.javashams.tracking.model.GeoPoint;
// import org.springframework.stereotype.Service;
// 
// import java.util.Collection;
// import java.util.Map;
// import java.util.concurrent.ConcurrentHashMap;
// import java.util.stream.Collectors;
// 
// @Service
// public class InMemoryLocationSink implements LocationSink {
// 
//     private final Map<String, GeoPoint> latestByOrgDevice = new ConcurrentHashMap<>();
// 
//     private String key(String org, String deviceId) {
//         return org + "::" + deviceId;
//     }
// 
//     @Override
//     public void upsertLatest(GeoPoint p) {
//         latestByOrgDevice.put(key(p.org(), p.deviceId()), p);
//     }
// 
//     @Override
//     public GeoPoint findLatest(String org, String deviceId) {
//         return latestByOrgDevice.get(key(org, deviceId));
//     }
// 
//     @Override
//     public Collection<GeoPoint> findAllLatestForOrg(String org) {
//         return latestByOrgDevice.values().stream()
//                 .filter(p -> org.equals(p.org()))
//                 .collect(Collectors.toList());
//     }
// }
