// package com.javashams.tracking.repositories;
// 
// import com.javashams.tracking.model.Driver;
// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.jpa.repository.Query;
// import org.springframework.stereotype.Repository;
// 
// import java.util.List;
// import java.util.Optional;
// 
// /**
//  * Spring Data JPA Repository for Driver entity
//  * Provides database access and query methods for driver persistence
//  */
// @Repository
// public interface DriverRepository extends JpaRepository<Driver, String> {
//     
//     /**
//      * Find a driver by ID
//      */
//     Optional<Driver> findById(String id);
//     
//     /**
//      * Find all drivers with a specific status
//      */
//     List<Driver> findByStatus(String status);
//     
//     /**
//      * Find all drivers assigned to a shuttle
//      */
//     List<Driver> findByShuttleId(String shuttleId);
//     
//     /**
//      * Find all drivers assigned to a route
//      */
//     List<Driver> findByRouteId(String routeId);
//     
//     /**
//      * Find all online drivers
//      */
//     @Query("SELECT d FROM Driver d WHERE d.status = 'ONLINE'")
//     List<Driver> findAllOnlineDrivers();
//     
//     /**
//      * Find online drivers for a specific shuttle
//      */
//     @Query("SELECT d FROM Driver d WHERE d.status = 'ONLINE' AND d.shuttleId = :shuttleId")
//     List<Driver> findOnlineDriversByShuttle(String shuttleId);
// }
