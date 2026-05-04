package com.javashams.tracking.repositories;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javashams.tracking.config.SupabaseConfig;
import com.javashams.tracking.model.DriverShiftReport;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Objects;

@Repository
public class DriverShiftReportRepository {

    private final WebClient webClient;

    public DriverShiftReportRepository(SupabaseConfig config, ObjectMapper objectMapper) {
        this.webClient = WebClient.builder()
            .baseUrl(Objects.requireNonNull(config.getUrl(), "SUPABASE_URL must be configured"))
            .defaultHeader("apikey", Objects.requireNonNull(config.getAnonKey(), "SUPABASE_ANON_KEY must be configured"))
            .defaultHeader("Authorization", "Bearer " + Objects.requireNonNull(config.getServiceRoleKey(), "SUPABASE_SERVICE_ROLE_KEY must be configured"))
            .defaultHeader("Content-Type", "application/json")
            .codecs(configurer -> {
                configurer.defaultCodecs().jackson2JsonEncoder(new Jackson2JsonEncoder(objectMapper));
                configurer.defaultCodecs().jackson2JsonDecoder(new Jackson2JsonDecoder(objectMapper));
            })
            .build();
    }

    public Mono<DriverShiftReport> save(DriverShiftReport report) {
        return webClient.post()
            .uri("/rest/v1/driver_shift_reports")
            .header("Prefer", "resolution=merge-duplicates,return=representation")
            .bodyValue(report)
            .retrieve()
            .onStatus(
                status -> status.is4xxClientError() || status.is5xxServerError(),
                response -> response.bodyToMono(String.class)
                    .flatMap(body -> Mono.error(new RuntimeException(
                        "Supabase " + response.statusCode() + ": " + body)))
            )
            .bodyToFlux(DriverShiftReport.class)
            .next()
            .defaultIfEmpty(report);
    }

    public Mono<DriverShiftReport> findById(String id) {
        return webClient.get()
            .uri("/rest/v1/driver_shift_reports?id=eq." + id)
            .retrieve()
            .bodyToFlux(DriverShiftReport.class)
            .next();
    }

    public Flux<DriverShiftReport> findByDriverIdOrderByClockInTimeDesc(String driverId) {
        return webClient.get()
            .uri("/rest/v1/driver_shift_reports?driver_id=eq." + driverId + "&order=clock_in_time.desc")
            .retrieve()
            .bodyToFlux(DriverShiftReport.class);
    }

    public Mono<DriverShiftReport> findOpenShiftByDriverId(String driverId) {
        return webClient.get()
            .uri("/rest/v1/driver_shift_reports?driver_id=eq." + driverId + "&status=eq.IN_PROGRESS")
            .retrieve()
            .bodyToFlux(DriverShiftReport.class)
            .next();
    }

    public Flux<DriverShiftReport> findAllOrderByClockInTimeDesc() {
        return webClient.get()
            .uri("/rest/v1/driver_shift_reports?order=clock_in_time.desc")
            .retrieve()
            .bodyToFlux(DriverShiftReport.class);
    }
}
