package com.javashams.tracking.repositories;

import com.javashams.tracking.model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Ride entity
 * Provides database access and query methods for ride order persistence
 */
@Repository
public interface RideRepository extends JpaRepository<Ride, String> {
    
    /**
     * Find a ride by its ride ID
     */
    Optional<Ride> findByRideId(String rideId);
    
    /**
     * Find all rides for a specific student
     */
    List<Ride> findByStudentId(String studentId);
    
    /**
     * Find all rides for a specific driver
     */
    List<Ride> findByDriverId(String driverId);
    
    /**
     * Find all rides for a specific shuttle
     */
    List<Ride> findByShuttleId(String shuttleId);
    
    /**
     * Find all rides with a specific status
     */
    List<Ride> findByStatus(String status);
    
    /**
     * Find all active rides (REQUESTED or IN_PROGRESS)
     */
    @Query("SELECT r FROM Ride r WHERE r.status IN ('REQUESTED', 'IN_PROGRESS') ORDER BY r.createdAtMs DESC")
    List<Ride> findActiveRides();
    
    /**
     * Find pending rides (not assigned to driver yet)
     */
    @Query("SELECT r FROM Ride r WHERE r.status = 'REQUESTED' AND r.driverId IS NULL ORDER BY r.createdAtMs ASC")
    List<Ride> findPendingRides();
    
    /**
     * Find in-progress rides for a driver
     */
    @Query("SELECT r FROM Ride r WHERE r.status = 'IN_PROGRESS' AND r.driverId = :driverId")
    List<Ride> findInProgressRidesByDriver(String driverId);
    
    /**
     * Find recent rides for a student (ordered by creation time)
     */
    @Query("SELECT r FROM Ride r WHERE r.studentId = :studentId ORDER BY r.createdAtMs DESC")
    List<Ride> findRecentRidesByStudent(String studentId);
}
