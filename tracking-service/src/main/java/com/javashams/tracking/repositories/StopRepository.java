package com.javashams.tracking.repositories;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javashams.tracking.model.Stop;
import com.javashams.tracking.config.SupabaseConfig;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Objects;

@Repository
public class StopRepository {

    private final WebClient webClient;

    public StopRepository(SupabaseConfig config, ObjectMapper objectMapper) {
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

    public Flux<Stop> findByIsActiveTrueOrderByName() {
        return webClient.get()
            .uri("/rest/v1/stops?is_active=eq.true&order=name.asc")
            .retrieve()
            .bodyToFlux(Stop.class);
    }

    public Mono<Stop> findById(String id) {
        return webClient.get()
            .uri("/rest/v1/stops?id=eq." + id)
            .retrieve()
            .bodyToFlux(Stop.class)
            .next();
    }

    public Mono<Stop> save(Stop stop) {
        return webClient.post()
            .uri("/rest/v1/stops")
            .header("Prefer", "resolution=merge-duplicates,return=representation")
            .bodyValue(stop)
            .retrieve()
            .onStatus(
                status -> status.is4xxClientError() || status.is5xxServerError(),
                response -> response.bodyToMono(String.class)
                    .flatMap(body -> Mono.error(new RuntimeException(
                        "Supabase " + response.statusCode() + ": " + body)))
            )
            .bodyToFlux(Stop.class)
            .next()
            .defaultIfEmpty(stop);
    }

    public Mono<Boolean> existsById(String id) {
        return findById(id).hasElement();
    }

    public Mono<Void> deleteAll() {
        return webClient.delete()
            .uri("/rest/v1/stops")
            .retrieve()
            .bodyToMono(Void.class);
    }
}
