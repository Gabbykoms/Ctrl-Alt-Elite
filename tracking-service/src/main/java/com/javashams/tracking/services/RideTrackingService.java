// package com.javashams.tracking.services;
// 
// import com.javashams.tracking.model.dto.DriverLocationDto;
// import com.javashams.tracking.model.dto.StudentLocationDto;
// import com.javashams.tracking.model.dto.RideTrackingDto;
// import org.springframework.stereotype.Service;
// 
// import java.util.Map;
// import java.util.concurrent.ConcurrentHashMap;
// 
// /**
//  * Service to manage tracking contexts for individual rides.
//  * Isolates driver and student locations per ride.
//  */
// @Service
// public class RideTrackingService {
// 
//     /**
//      * Map of rideId -> RideTrackingDto
//      * Stores the current tracking state for each active ride
//      */
//     private final Map<String, RideTrackingDto> rideContexts = new ConcurrentHashMap<>();
// 
//     /**
//      * Map of rideId -> DriverLocationDto
//      * Stores latest driver location for each ride
//      */
//     private final Map<String, DriverLocationDto> rideDriverLocations = new ConcurrentHashMap<>();
// 
//     /**
//      * Map of rideId -> StudentLocationDto
//      * Stores student pickup/dropoff locations for each ride
//      */
//     private final Map<String, StudentLocationDto> rideStudentLocations = new ConcurrentHashMap<>();
// 
//     /**
//      * Map of shuttleId/deviceId -> rideId
//      * Allows us to find which ride a GPS update belongs to
//      * Key: shuttleId (e.g., "bus-1")
//      * Value: rideId (e.g., "ride-123")
//      */
//     private final Map<String, String> shuttleToRideMapping = new ConcurrentHashMap<>();
// 
//     /**
//      * Start tracking a new ride
//      */
//     public void startRideTracking(RideTrackingDto rideTracking) {
//         rideContexts.put(rideTracking.rideId(), rideTracking);
//         
//         // Also map the shuttle to this ride so GPS updates can find it
//         if (rideTracking.shuttleId() != null) {
//             shuttleToRideMapping.put(rideTracking.shuttleId(), rideTracking.rideId());
//         }
//     }
// 
//     /**
//      * End tracking for a ride (cleanup)
//      */
//     public void endRideTracking(String rideId) {
//         // Get the ride context before removing it to find the shuttleId
//         RideTrackingDto ride = rideContexts.remove(rideId);
//         if (ride != null && ride.shuttleId() != null) {
//             shuttleToRideMapping.remove(ride.shuttleId());
//         }
//         
//         rideDriverLocations.remove(rideId);
//         rideStudentLocations.remove(rideId);
//     }
// 
//     /**
//      * Get the current ride context
//      */
//     public RideTrackingDto getRideContext(String rideId) {
//         return rideContexts.get(rideId);
//     }
// 
//     /**
//      * Update driver location for a specific ride
//      */
//     public void updateRideDriverLocation(String rideId, DriverLocationDto driverLocation) {
//         if (rideContexts.containsKey(rideId)) {
//             rideDriverLocations.put(rideId, driverLocation);
//         }
//     }
// 
//     /**
//      * Get driver location for a specific ride
//      */
//     public DriverLocationDto getRideDriverLocation(String rideId) {
//         return rideDriverLocations.get(rideId);
//     }
// 
//     /**
//      * Store student location for a specific ride
//      */
//     public void setRideStudentLocation(String rideId, StudentLocationDto studentLocation) {
//         if (rideContexts.containsKey(rideId)) {
//             rideStudentLocations.put(rideId, studentLocation);
//         }
//     }
// 
//     /**
//      * Get student location for a specific ride
//      */
//     public StudentLocationDto getRideStudentLocation(String rideId) {
//         return rideStudentLocations.get(rideId);
//     }
// 
//     /**
//      * Check if a ride is actively being tracked
//      */
//     public boolean isRideTracking(String rideId) {
//         return rideContexts.containsKey(rideId);
//     }
// 
//     /**
//      * Find rideId by shuttleId/deviceId
//      * Used by IngestController to determine which ride a GPS update belongs to
//      * @param shuttleId the shuttle/device ID from GPS
//      * @return the associated rideId, or null if not found
//      */
//     public String getRideIdByShuttleId(String shuttleId) {
//         return shuttleToRideMapping.get(shuttleId);
//     }
// }
