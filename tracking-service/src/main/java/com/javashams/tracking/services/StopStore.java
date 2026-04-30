package com.javashams.tracking.services;

import com.javashams.tracking.model.Stop;
import com.javashams.tracking.model.dto.StopDto;
import com.javashams.tracking.repositories.StopRepository;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class StopStore {
    private static final Logger logger = LoggerFactory.getLogger(StopStore.class);

    private final StopRepository stopRepository;

    public StopStore(StopRepository stopRepository) {
        this.stopRepository = stopRepository;
    }

    public Flux<StopDto> getAllStops() {
        return stopRepository.findByIsActiveTrueOrderByName()
                .map(this::convertEntityToDto)
                .doOnComplete(() -> logger.info("Streamed all active stops"));
    }

    public Mono<StopDto> getStop(String stopId) {
        return stopRepository.findById(stopId)
                .map(this::convertEntityToDto)
                .doOnSuccess(stop -> {
                    if (stop == null) logger.warn("Stop not found: {}", stopId);
                });
    }

    public Mono<StopDto> createStop(String stopId, String name, Double latitude, Double longitude, String description) {
        if (stopId == null || stopId.isBlank()) {
            return Mono.error(new IllegalArgumentException("Stop ID is required"));
        }
        if (name == null || name.isBlank() || latitude == null || longitude == null) {
            return Mono.error(new IllegalArgumentException("Stop name, latitude, and longitude are required"));
        }

        long now = System.currentTimeMillis();
        Stop entity = new Stop(stopId, name, latitude, longitude, description, true, now, now);

        return stopRepository.save(entity)
                .doOnSuccess(s -> logger.info("Stop created: {} at ({}, {})", name, latitude, longitude))
                .map(this::convertEntityToDto);
    }

    public Mono<StopDto> updateStop(String stopId, String name, Double latitude, Double longitude, String description) {
        return stopRepository.findById(stopId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Stop not found: " + stopId)))
                .flatMap(entity -> {
                    if (name != null) entity.setName(name);
                    if (latitude != null) entity.setLatitude(latitude);
                    if (longitude != null) entity.setLongitude(longitude);
                    if (description != null) entity.setDescription(description);
                    long now = System.currentTimeMillis();
                    entity.setUpdatedAtMs(now);
                    entity.setUpdatedAt(java.time.Instant.ofEpochMilli(now));

                    return stopRepository.save(entity);
                })
                .doOnSuccess(s -> logger.info("Stop updated: {}", stopId))
                .map(this::convertEntityToDto);
    }

    public Mono<Void> deleteStop(String stopId) {
        return stopRepository.findById(stopId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Stop not found: " + stopId)))
                .flatMap(entity -> {
                    long now = System.currentTimeMillis();
                    entity.setIsActive(false);
                    entity.setUpdatedAtMs(now);
                    entity.setUpdatedAt(java.time.Instant.ofEpochMilli(now));
                    return stopRepository.save(entity);
                })
                .doOnSuccess(s -> logger.info("Stop deleted (soft): {}", stopId))
                .then();
    }

    public Mono<Boolean> stopExists(String stopId) {
        return stopRepository.existsById(stopId);
    }

    public Mono<Void> clearAll() {
        return stopRepository.deleteAll()
                .doOnSuccess(v -> logger.warn("All stops cleared from database"));
    }

    private StopDto convertEntityToDto(Stop entity) {
        return new StopDto(
                entity.getId(),
                entity.getName(),
                entity.getLatitude(),
                entity.getLongitude(),
                entity.getDescription(),
                entity.getIsActive(),
                entity.getCreatedAtMs(),
                entity.getUpdatedAtMs()
        );
    }
}
