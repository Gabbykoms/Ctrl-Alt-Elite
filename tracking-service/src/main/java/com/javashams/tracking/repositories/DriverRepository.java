package com.javashams.tracking.repositories;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javashams.tracking.config.SupabaseConfig;
import com.javashams.tracking.model.Driver;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Objects;

@Repository
public class DriverRepository {

    private final WebClient webClient;

    public DriverRepository(SupabaseConfig config, ObjectMapper objectMapper) {
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

    public Mono<Driver> findById(String id) {
        return webClient.get()
            .uri("/rest/v1/drivers?id=eq.{id}", id)
            .retrieve()
            .bodyToFlux(Driver.class)
            .next();
    }
}
