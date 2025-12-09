package com.javashams.tracking.repositories;

import com.javashams.tracking.model.Stop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Stop entity persistence
 * Provides database access methods for CRUD operations
 */
@Repository
public interface StopRepository extends JpaRepository<Stop, String> {
    
    /**
     * Find all active stops, ordered by name
     */
    List<Stop> findByIsActiveTrueOrderByName();
    
    /**
     * Find a stop by name
     */
    Optional<Stop> findByNameIgnoreCase(String name);
    
    /**
     * Find all stops (including inactive)
     */
    List<Stop> findAllByOrderByName();
}
