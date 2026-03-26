package com.javashams.tracking.repositories;

import com.javashams.tracking.model.DriverShiftReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for driver shift reports.
 */
@Repository
public interface DriverShiftReportRepository extends JpaRepository<DriverShiftReport, String> {

    Optional<DriverShiftReport> findByDriverIdAndReportDate(String driverId, LocalDate reportDate);

    List<DriverShiftReport> findByDriverIdOrderByReportDateDesc(String driverId);

    List<DriverShiftReport> findByReportDateOrderByCreatedAtMsDesc(LocalDate reportDate);
}
