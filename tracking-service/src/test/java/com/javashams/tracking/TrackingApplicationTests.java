// src/test/java/com/javashams/tracking/TrackingApplicationTests.java
package com.javashams.tracking;

import com.javashams.tracking.api.StopsController;
import com.javashams.tracking.model.Stop;
import com.javashams.tracking.model.dto.StopDto;
import com.javashams.tracking.repositories.StopRepository;
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
