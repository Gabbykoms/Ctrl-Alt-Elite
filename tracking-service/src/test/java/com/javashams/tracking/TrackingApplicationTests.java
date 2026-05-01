// src/test/java/com/javashams/tracking/TrackingApplicationTests.java
package com.javashams.tracking;

import com.javashams.tracking.api.DriverShiftReportController;
import com.javashams.tracking.api.StopsController;
import com.javashams.tracking.model.DriverShiftReport;
import com.javashams.tracking.model.Stop;
import com.javashams.tracking.model.dto.ClockInRequest;
import com.javashams.tracking.model.dto.ClockOutRequest;
import com.javashams.tracking.model.dto.StopDto;
import com.javashams.tracking.repositories.DriverShiftReportRepository;
import com.javashams.tracking.repositories.StopRepository;
import com.javashams.tracking.services.DriverShiftReportService;
import com.javashams.tracking.services.StopStore;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

// ── Application context smoke test ───────────────────────────────────────────

@SpringBootTest
class TrackingApplicationTests {
    @Test
    void contextLoads() {}
}

// ── StopStore unit tests (no Spring context, pure Mockito) ───────────────────

@ExtendWith(MockitoExtension.class)
class StopStoreTest {

    @Mock  StopRepository stopRepository;
    @InjectMocks StopStore stopStore;

    private Stop stop(String id, String name, boolean active) {
        long now = System.currentTimeMillis();
        return new Stop(id, name, 41.20, -72.57, "desc", active, now, now);
    }

    // getAllStops

    @Test
    @DisplayName("getAllStops: maps active stops to DTOs")
    void getAllStops_returnsMappedDtos() {
        when(stopRepository.findByIsActiveTrueOrderByName())
                .thenReturn(Flux.just(stop("id-1", "Library", true)));

        StepVerifier.create(stopStore.getAllStops())
                .assertNext(dto -> {
                    assertThat(dto.id()).isEqualTo("id-1");
                    assertThat(dto.name()).isEqualTo("Library");
                    assertThat(dto.isActive()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("getAllStops: returns empty flux when no active stops")
    void getAllStops_returnsEmpty() {
        when(stopRepository.findByIsActiveTrueOrderByName()).thenReturn(Flux.empty());

        StepVerifier.create(stopStore.getAllStops())
                .verifyComplete();
    }

    // getStop

    @Test
    @DisplayName("getStop: returns DTO when stop exists")
    void getStop_returnsDto_whenFound() {
        when(stopRepository.findById("id-1")).thenReturn(Mono.just(stop("id-1", "Main Quad", true)));

        StepVerifier.create(stopStore.getStop("id-1"))
                .assertNext(dto -> assertThat(dto.id()).isEqualTo("id-1"))
                .verifyComplete();
    }

    @Test
    @DisplayName("getStop: returns empty when stop does not exist")
    void getStop_returnsEmpty_whenNotFound() {
        when(stopRepository.findById(anyString())).thenReturn(Mono.empty());

        StepVerifier.create(stopStore.getStop("ghost"))
                .verifyComplete();
    }

    // createStop — validation

    @Test
    @DisplayName("createStop: errors when stopId is null")
    void createStop_errors_whenStopIdNull() {
        StepVerifier.create(stopStore.createStop(null, "Library", 41.20, -72.57, "desc"))
                .expectError(IllegalArgumentException.class)
                .verify();
    }

    @Test
    @DisplayName("createStop: errors when stopId is blank")
    void createStop_errors_whenStopIdBlank() {
        StepVerifier.create(stopStore.createStop("   ", "Library", 41.20, -72.57, "desc"))
                .expectError(IllegalArgumentException.class)
                .verify();
    }

    @Test
    @DisplayName("createStop: errors when name is null")
    void createStop_errors_whenNameNull() {
        StepVerifier.create(stopStore.createStop("stop-test", null, 41.20, -72.57, "desc"))
                .expectError(IllegalArgumentException.class)
                .verify();
    }

    @Test
    @DisplayName("createStop: errors when name is blank")
    void createStop_errors_whenNameBlank() {
        StepVerifier.create(stopStore.createStop("stop-test", "   ", 41.20, -72.57, "desc"))
                .expectError(IllegalArgumentException.class)
                .verify();
    }

    @Test
    @DisplayName("createStop: errors when latitude is null")
    void createStop_errors_whenLatNull() {
        StepVerifier.create(stopStore.createStop("stop-test", "Library", null, -72.57, "desc"))
                .expectError(IllegalArgumentException.class)
                .verify();
    }

    @Test
    @DisplayName("createStop: errors when longitude is null")
    void createStop_errors_whenLonNull() {
        StepVerifier.create(stopStore.createStop("stop-test", "Library", 41.20, null, "desc"))
                .expectError(IllegalArgumentException.class)
                .verify();
    }

    // createStop — happy path

    @Test
    @DisplayName("createStop: saves entity with provided stopId and returns DTO")
    void createStop_savesAndReturnsDto() {
        ArgumentCaptor<Stop> captor = ArgumentCaptor.forClass(Stop.class);
        when(stopRepository.save(captor.capture()))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        StepVerifier.create(stopStore.createStop("stop-lib", "Library", 41.20, -72.57, "main library"))
                .assertNext(dto -> {
                    assertThat(dto.id()).isEqualTo("stop-lib");
                    assertThat(dto.name()).isEqualTo("Library");
                    assertThat(dto.latitude()).isEqualTo(41.20);
                    assertThat(dto.longitude()).isEqualTo(-72.57);
                    assertThat(dto.description()).isEqualTo("main library");
                    assertThat(dto.isActive()).isTrue();
                })
                .verifyComplete();

        Stop saved = captor.getValue();
        assertThat(saved.getId()).isEqualTo("stop-lib");
        assertThat(saved.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("createStop: description can be null")
    void createStop_allowsNullDescription() {
        when(stopRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        StepVerifier.create(stopStore.createStop("stop-lib", "Library", 41.20, -72.57, null))
                .assertNext(dto -> assertThat(dto.description()).isNull())
                .verifyComplete();
    }

    // updateStop

    @Test
    @DisplayName("updateStop: errors when stop is not found")
    void updateStop_errors_whenNotFound() {
        when(stopRepository.findById("missing")).thenReturn(Mono.empty());

        StepVerifier.create(stopStore.updateStop("missing", "New Name", null, null, null))
                .expectErrorMatches(e -> e instanceof IllegalArgumentException
                        && e.getMessage().contains("missing"))
                .verify();
    }

    @Test
    @DisplayName("updateStop: only applies non-null fields")
    void updateStop_appliesOnlyNonNullFields() {
        Stop original = stop("id-1", "Library", true);
        when(stopRepository.findById("id-1")).thenReturn(Mono.just(original));
        when(stopRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        StepVerifier.create(stopStore.updateStop("id-1", "Library Renamed", null, null, null))
                .assertNext(dto -> {
                    assertThat(dto.name()).isEqualTo("Library Renamed");
                    assertThat(dto.latitude()).isEqualTo(41.20);   // unchanged
                    assertThat(dto.longitude()).isEqualTo(-72.57); // unchanged
                    assertThat(dto.description()).isEqualTo("desc"); // unchanged
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("updateStop: advances updated_at_ms")
    void updateStop_advancesUpdatedAtMs() {
        long before = System.currentTimeMillis();
        Stop original = stop("id-1", "Library", true);
        when(stopRepository.findById("id-1")).thenReturn(Mono.just(original));
        when(stopRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        StepVerifier.create(stopStore.updateStop("id-1", "Library Renamed", null, null, null))
                .assertNext(dto -> assertThat(dto.updatedAtMs()).isGreaterThanOrEqualTo(before))
                .verifyComplete();
    }

    // deleteStop

    @Test
    @DisplayName("deleteStop: errors when stop is not found")
    void deleteStop_errors_whenNotFound() {
        when(stopRepository.findById("ghost")).thenReturn(Mono.empty());

        StepVerifier.create(stopStore.deleteStop("ghost"))
                .expectErrorMatches(e -> e instanceof IllegalArgumentException
                        && e.getMessage().contains("ghost"))
                .verify();
    }

    @Test
    @DisplayName("deleteStop: sets is_active to false on the saved entity")
    void deleteStop_setsIsActiveFalse() {
        Stop original = stop("id-1", "Library", true);
        ArgumentCaptor<Stop> captor = ArgumentCaptor.forClass(Stop.class);
        when(stopRepository.findById("id-1")).thenReturn(Mono.just(original));
        when(stopRepository.save(captor.capture())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        StepVerifier.create(stopStore.deleteStop("id-1"))
                .verifyComplete();

        assertThat(captor.getValue().getIsActive()).isFalse();
    }

    @Test
    @DisplayName("deleteStop: advances updated_at_ms on soft delete")
    void deleteStop_advancesUpdatedAtMs() {
        long before = System.currentTimeMillis();
        Stop original = stop("id-1", "Library", true);
        ArgumentCaptor<Stop> captor = ArgumentCaptor.forClass(Stop.class);
        when(stopRepository.findById("id-1")).thenReturn(Mono.just(original));
        when(stopRepository.save(captor.capture())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        StepVerifier.create(stopStore.deleteStop("id-1")).verifyComplete();

        assertThat(captor.getValue().getUpdatedAtMs()).isGreaterThanOrEqualTo(before);
    }
}

// ── StopsController slice tests (WebFlux layer only, StopStore mocked) ────────

@WebFluxTest(StopsController.class)
class StopsControllerTest {

    @Autowired WebTestClient webTestClient;
    @MockBean StopStore stopStore;

    private StopDto dto(String id, String name, boolean active) {
        long now = System.currentTimeMillis();
        return new StopDto(id, name, 41.20, -72.57, "desc", active, now, now);
    }

    // GET /v1/stops

    @Test
    @DisplayName("GET /v1/stops: 200 with wrapped stops list")
    void getAllStops_returns200() {
        when(stopStore.getAllStops()).thenReturn(Flux.just(dto("id-1", "Library", true)));

        webTestClient.get().uri("/v1/stops")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.total").isEqualTo(1)
                .jsonPath("$.stops[0].id").isEqualTo("id-1")
                .jsonPath("$.stops[0].name").isEqualTo("Library")
                .jsonPath("$.stops[0].is_active").isEqualTo(true)
                .jsonPath("$.timestamp").isNumber();
    }

    @Test
    @DisplayName("GET /v1/stops: 200 with empty list when no active stops")
    void getAllStops_returns200_emptyList() {
        when(stopStore.getAllStops()).thenReturn(Flux.empty());

        webTestClient.get().uri("/v1/stops")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.total").isEqualTo(0)
                .jsonPath("$.stops").isArray();
    }

    // GET /v1/stops/{id}

    @Test
    @DisplayName("GET /v1/stops/{id}: 200 when stop is found")
    void getStop_returns200_whenFound() {
        when(stopStore.getStop("id-1")).thenReturn(Mono.just(dto("id-1", "Library", true)));

        webTestClient.get().uri("/v1/stops/id-1")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.id").isEqualTo("id-1")
                .jsonPath("$.name").isEqualTo("Library")
                .jsonPath("$.is_active").isEqualTo(true);
    }

    @Test
    @DisplayName("GET /v1/stops/{id}: 404 when stop is not found")
    void getStop_returns404_whenNotFound() {
        when(stopStore.getStop("ghost")).thenReturn(Mono.empty());

        webTestClient.get().uri("/v1/stops/ghost")
                .exchange()
                .expectStatus().isNotFound();
    }

    // POST /v1/stops

    @Test
    @DisplayName("POST /v1/stops: 201 with valid body")
    void createStop_returns201() {
        when(stopStore.createStop(eq("sc-001"), eq("Student Center"), eq(41.20), eq(-72.57), eq("Center of campus")))
                .thenReturn(Mono.just(dto("sc-001", "Student Center", true)));

        webTestClient.post().uri("/v1/stops")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                        "stopId", "sc-001",
                        "name", "Student Center",
                        "latitude", 41.20,
                        "longitude", -72.57,
                        "description", "Center of campus"
                ))
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.id").isEqualTo("sc-001")
                .jsonPath("$.name").isEqualTo("Student Center");
    }

    @Test
    @DisplayName("POST /v1/stops: 201 without optional description")
    void createStop_returns201_withoutDescription() {
        when(stopStore.createStop(eq("sc-001"), eq("Student Center"), eq(41.20), eq(-72.57), isNull()))
                .thenReturn(Mono.just(dto("sc-001", "Student Center", true)));

        webTestClient.post().uri("/v1/stops")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("stopId", "sc-001", "name", "Student Center", "latitude", 41.20, "longitude", -72.57))
                .exchange()
                .expectStatus().isCreated();
    }

    @Test
    @DisplayName("POST /v1/stops: 400 when stopId is missing")
    void createStop_returns400_whenStopIdMissing() {
        webTestClient.post().uri("/v1/stops")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("name", "Nowhere Stop", "latitude", 41.20, "longitude", -72.57))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.error").isEqualTo("Missing required field: stopId");
    }

    @Test
    @DisplayName("POST /v1/stops: 400 when name is missing")
    void createStop_returns400_whenNameMissing() {
        webTestClient.post().uri("/v1/stops")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("stopId", "sc-001", "latitude", 41.20, "longitude", -72.57))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.error").isEqualTo("Missing required field: name");
    }

    @Test
    @DisplayName("POST /v1/stops: 400 when latitude and longitude are missing")
    void createStop_returns400_whenLatLonMissing() {
        webTestClient.post().uri("/v1/stops")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("stopId", "sc-001", "name", "Nowhere Stop"))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.error").isEqualTo("Missing required fields: latitude, longitude");
    }

    @Test
    @DisplayName("POST /v1/stops: 400 when service rejects input")
    void createStop_returns400_whenServiceRejects() {
        when(stopStore.createStop(any(), any(), any(), any(), any()))
                .thenReturn(Mono.error(new IllegalArgumentException("name required")));

        webTestClient.post().uri("/v1/stops")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("stopId", "sc-001", "name", "X", "latitude", 41.20, "longitude", -72.57))
                .exchange()
                .expectStatus().isBadRequest();
    }

    // PUT /v1/stops/{id}

    @Test
    @DisplayName("PUT /v1/stops/{id}: 200 when stop is updated")
    void updateStop_returns200() {
        when(stopStore.updateStop(eq("id-1"), eq("Library Updated"), isNull(), isNull(), isNull()))
                .thenReturn(Mono.just(dto("id-1", "Library Updated", true)));

        webTestClient.put().uri("/v1/stops/id-1")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("name", "Library Updated"))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.id").isEqualTo("id-1")
                .jsonPath("$.name").isEqualTo("Library Updated");
    }

    @Test
    @DisplayName("PUT /v1/stops/{id}: 400 when stop is not found")
    void updateStop_returns400_whenNotFound() {
        when(stopStore.updateStop(eq("ghost"), any(), any(), any(), any()))
                .thenReturn(Mono.error(new IllegalArgumentException("Stop not found: ghost")));

        webTestClient.put().uri("/v1/stops/ghost")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("name", "X"))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.message").isEqualTo("Stop not found: ghost");
    }

    // DELETE /v1/stops/{id}

    @Test
    @DisplayName("DELETE /v1/stops/{id}: 200 with success message")
    void deleteStop_returns200() {
        when(stopStore.deleteStop("id-1")).thenReturn(Mono.empty());

        webTestClient.delete().uri("/v1/stops/id-1")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.message").isEqualTo("Stop deleted successfully")
                .jsonPath("$.stop_id").isEqualTo("id-1")
                .jsonPath("$.timestamp").isNumber();
    }

    @Test
    @DisplayName("DELETE /v1/stops/{id}: 404 when stop is not found")
    void deleteStop_returns404_whenNotFound() {
        when(stopStore.deleteStop("ghost"))
                .thenReturn(Mono.error(new IllegalArgumentException("Stop not found: ghost")));

        webTestClient.delete().uri("/v1/stops/ghost")
                .exchange()
                .expectStatus().isNotFound();
    }
}

// ── DriverShiftReportService unit tests ──────────────────────────────────────

@ExtendWith(MockitoExtension.class)
class DriverShiftReportServiceTest {

    @Mock
    DriverShiftReportRepository shiftReportRepository;

    @InjectMocks
    DriverShiftReportService shiftReportService;

    private DriverShiftReport shift(String id, String driverId, String status, long startingMileage) {
        DriverShiftReport report = new DriverShiftReport();
        report.setId(id);
        report.setDriverId(driverId);
        report.setDriverName("Test Driver");
        report.setReportDate(LocalDate.now());
        report.setStartingMileage(startingMileage);
        report.setStatus(status);
        report.setClockInTime(Instant.now());
        long now = System.currentTimeMillis();
        report.setCreatedAtMs(now);
        report.setUpdatedAtMs(now);
        return report;
    }

    // clockIn — validation

    @Test
    @DisplayName("clockIn: errors when driver_id is null")
    void clockIn_errors_whenDriverIdNull() {
        ClockInRequest req = new ClockInRequest(null, "John Driver", null, null, 10000L, null);
        StepVerifier.create(shiftReportService.clockIn(req))
                .expectErrorMatches(e -> e instanceof IllegalArgumentException
                        && e.getMessage().equals("driver_id is required"))
                .verify();
    }

    @Test
    @DisplayName("clockIn: errors when driver_id is blank")
    void clockIn_errors_whenDriverIdBlank() {
        ClockInRequest req = new ClockInRequest("   ", "John Driver", null, null, 10000L, null);
        StepVerifier.create(shiftReportService.clockIn(req))
                .expectErrorMatches(e -> e instanceof IllegalArgumentException
                        && e.getMessage().equals("driver_id is required"))
                .verify();
    }

    @Test
    @DisplayName("clockIn: errors when driver_name is null")
    void clockIn_errors_whenDriverNameNull() {
        ClockInRequest req = new ClockInRequest("driver-1", null, null, null, 10000L, null);
        StepVerifier.create(shiftReportService.clockIn(req))
                .expectErrorMatches(e -> e instanceof IllegalArgumentException
                        && e.getMessage().equals("driver_name is required"))
                .verify();
    }

    @Test
    @DisplayName("clockIn: errors when driver_name is blank")
    void clockIn_errors_whenDriverNameBlank() {
        ClockInRequest req = new ClockInRequest("driver-1", "   ", null, null, 10000L, null);
        StepVerifier.create(shiftReportService.clockIn(req))
                .expectErrorMatches(e -> e instanceof IllegalArgumentException
                        && e.getMessage().equals("driver_name is required"))
                .verify();
    }

    @Test
    @DisplayName("clockIn: errors when starting_mileage is null")
    void clockIn_errors_whenStartingMileageNull() {
        ClockInRequest req = new ClockInRequest("driver-1", "John Driver", null, null, null, null);
        StepVerifier.create(shiftReportService.clockIn(req))
                .expectErrorMatches(e -> e instanceof IllegalArgumentException
                        && e.getMessage().contains("starting_mileage"))
                .verify();
    }

    @Test
    @DisplayName("clockIn: errors when starting_mileage is negative")
    void clockIn_errors_whenStartingMileageNegative() {
        ClockInRequest req = new ClockInRequest("driver-1", "John Driver", null, null, -1L, null);
        StepVerifier.create(shiftReportService.clockIn(req))
                .expectErrorMatches(e -> e instanceof IllegalArgumentException
                        && e.getMessage().contains("starting_mileage"))
                .verify();
    }

    // clockIn — conflict

    @Test
    @DisplayName("clockIn: errors when driver already has an open shift")
    void clockIn_errors_whenOpenShiftExists() {
        when(shiftReportRepository.findOpenShiftByDriverId("driver-1"))
                .thenReturn(Mono.just(shift("shift-existing", "driver-1", "IN_PROGRESS", 10000L)));

        ClockInRequest req = new ClockInRequest("driver-1", "John Driver", null, null, 12000L, null);
        StepVerifier.create(shiftReportService.clockIn(req))
                .expectErrorMatches(e -> e instanceof IllegalStateException
                        && e.getMessage().contains("open shift"))
                .verify();
    }

    // clockIn — happy path

    @Test
    @DisplayName("clockIn: saves shift with correct fields")
    void clockIn_savesShiftWithCorrectFields() {
        ArgumentCaptor<DriverShiftReport> captor = ArgumentCaptor.forClass(DriverShiftReport.class);
        when(shiftReportRepository.findOpenShiftByDriverId("driver-1")).thenReturn(Mono.empty());
        when(shiftReportRepository.save(captor.capture()))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        ClockInRequest req = new ClockInRequest("driver-1", "John Driver", "R-01", "ABC-123", 10000L, "All good");
        StepVerifier.create(shiftReportService.clockIn(req))
                .assertNext(report -> {
                    assertThat(report.getDriverId()).isEqualTo("driver-1");
                    assertThat(report.getDriverName()).isEqualTo("John Driver");
                    assertThat(report.getStatus()).isEqualTo("IN_PROGRESS");
                    assertThat(report.getStartingMileage()).isEqualTo(10000L);
                    assertThat(report.getClockInTime()).isNotNull();
                    assertThat(report.getClockOutTime()).isNull();
                    assertThat(report.getReportDate()).isEqualTo(LocalDate.now());
                    assertThat(report.getId()).startsWith("shift-");
                })
                .verifyComplete();

        assertThat(captor.getValue().getRadioNumber()).isEqualTo("R-01");
        assertThat(captor.getValue().getVehicleLicense()).isEqualTo("ABC-123");
        assertThat(captor.getValue().getConditionNotes()).isEqualTo("All good");
    }

    @Test
    @DisplayName("clockIn: optional fields can all be null")
    void clockIn_allowsNullOptionalFields() {
        when(shiftReportRepository.findOpenShiftByDriverId("driver-1")).thenReturn(Mono.empty());
        when(shiftReportRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        ClockInRequest req = new ClockInRequest("driver-1", "John Driver", null, null, 10000L, null);
        StepVerifier.create(shiftReportService.clockIn(req))
                .assertNext(report -> {
                    assertThat(report.getRadioNumber()).isNull();
                    assertThat(report.getVehicleLicense()).isNull();
                    assertThat(report.getConditionNotes()).isNull();
                })
                .verifyComplete();
    }

    // clockOut — validation

    @Test
    @DisplayName("clockOut: errors when ending_mileage is null")
    void clockOut_errors_whenEndingMileageNull() {
        ClockOutRequest req = new ClockOutRequest("driver-1", null, null);
        StepVerifier.create(shiftReportService.clockOut("driver-1", req))
                .expectErrorMatches(e -> e instanceof IllegalArgumentException
                        && e.getMessage().equals("ending_mileage is required"))
                .verify();
    }

    @Test
    @DisplayName("clockOut: errors when no open shift found")
    void clockOut_errors_whenNoOpenShift() {
        when(shiftReportRepository.findOpenShiftByDriverId("driver-1")).thenReturn(Mono.empty());

        ClockOutRequest req = new ClockOutRequest("driver-1", 15000L, null);
        StepVerifier.create(shiftReportService.clockOut("driver-1", req))
                .expectErrorMatches(e -> e instanceof IllegalArgumentException
                        && e.getMessage().contains("No open shift"))
                .verify();
    }

    @Test
    @DisplayName("clockOut: errors when ending_mileage is less than starting_mileage")
    void clockOut_errors_whenEndingMileageLessThanStarting() {
        when(shiftReportRepository.findOpenShiftByDriverId("driver-1"))
                .thenReturn(Mono.just(shift("shift-1", "driver-1", "IN_PROGRESS", 10000L)));

        ClockOutRequest req = new ClockOutRequest("driver-1", 5000L, null);
        StepVerifier.create(shiftReportService.clockOut("driver-1", req))
                .expectErrorMatches(e -> e instanceof IllegalArgumentException
                        && e.getMessage().contains("ending_mileage must be >="))
                .verify();
    }

    // clockOut — happy path

    @Test
    @DisplayName("clockOut: completes shift with correct fields")
    void clockOut_completesShiftWithCorrectFields() {
        long before = System.currentTimeMillis();
        when(shiftReportRepository.findOpenShiftByDriverId("driver-1"))
                .thenReturn(Mono.just(shift("shift-1", "driver-1", "IN_PROGRESS", 10000L)));
        when(shiftReportRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        ClockOutRequest req = new ClockOutRequest("driver-1", 15000L, null);
        StepVerifier.create(shiftReportService.clockOut("driver-1", req))
                .assertNext(report -> {
                    assertThat(report.getStatus()).isEqualTo("COMPLETED");
                    assertThat(report.getEndingMileage()).isEqualTo(15000L);
                    assertThat(report.getClockOutTime()).isNotNull();
                    assertThat(report.getUpdatedAtMs()).isGreaterThanOrEqualTo(before);
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("clockOut: updates condition_notes when provided")
    void clockOut_updatesConditionNotes_whenProvided() {
        DriverShiftReport existing = shift("shift-1", "driver-1", "IN_PROGRESS", 10000L);
        existing.setConditionNotes("Original notes");
        when(shiftReportRepository.findOpenShiftByDriverId("driver-1")).thenReturn(Mono.just(existing));
        when(shiftReportRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        ClockOutRequest req = new ClockOutRequest("driver-1", 15000L, "Updated at end of shift");
        StepVerifier.create(shiftReportService.clockOut("driver-1", req))
                .assertNext(report -> assertThat(report.getConditionNotes()).isEqualTo("Updated at end of shift"))
                .verifyComplete();
    }

    @Test
    @DisplayName("clockOut: preserves existing condition_notes when null in request")
    void clockOut_preservesConditionNotes_whenNullInRequest() {
        DriverShiftReport existing = shift("shift-1", "driver-1", "IN_PROGRESS", 10000L);
        existing.setConditionNotes("Original notes");
        when(shiftReportRepository.findOpenShiftByDriverId("driver-1")).thenReturn(Mono.just(existing));
        when(shiftReportRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        ClockOutRequest req = new ClockOutRequest("driver-1", 15000L, null);
        StepVerifier.create(shiftReportService.clockOut("driver-1", req))
                .assertNext(report -> assertThat(report.getConditionNotes()).isEqualTo("Original notes"))
                .verifyComplete();
    }

    // getShiftsForDriver

    @Test
    @DisplayName("getShiftsForDriver: returns flux of shifts")
    void getShiftsForDriver_returnsShifts() {
        when(shiftReportRepository.findByDriverIdOrderByClockInTimeDesc("driver-1"))
                .thenReturn(Flux.just(
                        shift("shift-2", "driver-1", "COMPLETED", 12000L),
                        shift("shift-1", "driver-1", "COMPLETED", 10000L)
                ));

        StepVerifier.create(shiftReportService.getShiftsForDriver("driver-1"))
                .assertNext(r -> assertThat(r.getId()).isEqualTo("shift-2"))
                .assertNext(r -> assertThat(r.getId()).isEqualTo("shift-1"))
                .verifyComplete();
    }

    @Test
    @DisplayName("getShiftsForDriver: returns empty when no shifts exist")
    void getShiftsForDriver_returnsEmpty_whenNoShifts() {
        when(shiftReportRepository.findByDriverIdOrderByClockInTimeDesc("driver-1"))
                .thenReturn(Flux.empty());

        StepVerifier.create(shiftReportService.getShiftsForDriver("driver-1"))
                .verifyComplete();
    }
}

// ── DriverShiftReportController slice tests ───────────────────────────────────

@WebFluxTest(DriverShiftReportController.class)
class DriverShiftReportControllerTest {

    @Autowired
    WebTestClient webTestClient;

    @MockBean
    DriverShiftReportService shiftReportService;

    private DriverShiftReport shift(String id, String driverId) {
        DriverShiftReport report = new DriverShiftReport();
        report.setId(id);
        report.setDriverId(driverId);
        report.setDriverName("John Driver");
        report.setStartingMileage(10000L);
        report.setStatus("IN_PROGRESS");
        report.setClockInTime(Instant.now());
        long now = System.currentTimeMillis();
        report.setCreatedAtMs(now);
        report.setUpdatedAtMs(now);
        return report;
    }

    // POST /v1/shifts/clock-in

    @Test
    @DisplayName("POST /v1/shifts/clock-in: 201 with valid body")
    void clockIn_returns201() {
        when(shiftReportService.clockIn(any())).thenReturn(Mono.just(shift("shift-1", "driver-1")));

        webTestClient.post().uri("/v1/shifts/clock-in")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                        "driver_id", "driver-1",
                        "driver_name", "John Driver",
                        "starting_mileage", 10000
                ))
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.id").isEqualTo("shift-1")
                .jsonPath("$.status").isEqualTo("IN_PROGRESS");
    }

    @Test
    @DisplayName("POST /v1/shifts/clock-in: 400 when service rejects input")
    void clockIn_returns400_whenServiceRejectsInput() {
        when(shiftReportService.clockIn(any()))
                .thenReturn(Mono.error(new IllegalArgumentException("driver_name is required")));

        webTestClient.post().uri("/v1/shifts/clock-in")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("driver_id", "driver-1", "starting_mileage", 10000))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.error").isEqualTo("driver_name is required");
    }

    @Test
    @DisplayName("POST /v1/shifts/clock-in: 409 when driver already has an open shift")
    void clockIn_returns409_whenOpenShiftExists() {
        when(shiftReportService.clockIn(any()))
                .thenReturn(Mono.error(new IllegalStateException("Driver already has an open shift: shift-1")));

        webTestClient.post().uri("/v1/shifts/clock-in")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("driver_id", "driver-1", "driver_name", "John Driver", "starting_mileage", 10000))
                .exchange()
                .expectStatus().isEqualTo(409)
                .expectBody()
                .jsonPath("$.error").value(v -> assertThat(v.toString()).contains("open shift"));
    }

    // POST /v1/shifts/clock-out

    @Test
    @DisplayName("POST /v1/shifts/clock-out: 200 with valid body")
    void clockOut_returns200() {
        DriverShiftReport completed = shift("shift-1", "driver-1");
        completed.setStatus("COMPLETED");
        completed.setEndingMileage(15000L);
        when(shiftReportService.clockOut(eq("driver-1"), any())).thenReturn(Mono.just(completed));

        webTestClient.post().uri("/v1/shifts/clock-out")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("driver_id", "driver-1", "ending_mileage", 15000))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.status").isEqualTo("COMPLETED")
                .jsonPath("$.ending_mileage").isEqualTo(15000);
    }

    @Test
    @DisplayName("POST /v1/shifts/clock-out: 400 when service rejects input")
    void clockOut_returns400_whenServiceRejectsInput() {
        when(shiftReportService.clockOut(eq("driver-1"), any()))
                .thenReturn(Mono.error(new IllegalArgumentException("ending_mileage is required")));

        webTestClient.post().uri("/v1/shifts/clock-out")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("driver_id", "driver-1"))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.error").isEqualTo("ending_mileage is required");
    }

    // GET /v1/shifts/driver/{driverId}

    @Test
    @DisplayName("GET /v1/shifts/driver/{driverId}: 200 with wrapped list")
    void getShiftsForDriver_returns200() {
        when(shiftReportService.getShiftsForDriver("driver-1"))
                .thenReturn(Flux.just(shift("shift-2", "driver-1"), shift("shift-1", "driver-1")));

        webTestClient.get().uri("/v1/shifts/driver/driver-1")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.total").isEqualTo(2)
                .jsonPath("$.driver_id").isEqualTo("driver-1")
                .jsonPath("$.shifts[0].id").isEqualTo("shift-2");
    }

    @Test
    @DisplayName("GET /v1/shifts/driver/{driverId}: 200 with empty list when no shifts")
    void getShiftsForDriver_returns200_whenEmpty() {
        when(shiftReportService.getShiftsForDriver("driver-1")).thenReturn(Flux.empty());

        webTestClient.get().uri("/v1/shifts/driver/driver-1")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.total").isEqualTo(0)
                .jsonPath("$.shifts").isArray();
    }
}
