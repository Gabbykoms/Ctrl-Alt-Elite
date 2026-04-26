package com.javashams.tracking.services;

import com.javashams.tracking.model.Stop;
import com.javashams.tracking.model.dto.StopDto;
import com.javashams.tracking.repositories.StopRepository;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

@Service
public class StopStore {
    private static final Logger logger = LoggerFactory.getLogger(StopStore.class);

    private final StopRepository stopRepository;

    public StopStore(StopRepository stopRepository) {
        this.stopRepository = stopRepository;
    }

    public List<StopDto> getAllStops() {
        List<Stop> entities = stopRepository.findByIsActiveTrueOrderByName();
        List<StopDto> dtos = convertEntitiesToDtos(entities);
        logger.info("Retrieved {} stops from database", dtos.size());
        return dtos;
    }

    public StopDto getStop(String stopId) {
        Optional<Stop> entity = stopRepository.findById(stopId);
        if (entity.isEmpty()) {
            logger.warn("Stop not found: {}", stopId);
            return null;
        }
        return convertEntityToDto(entity.get());
    }

    public StopDto createStop(String name, Double latitude, Double longitude, String description) {
        if (name == null || name.isBlank() || latitude == null || longitude == null) {
            throw new IllegalArgumentException("Stop name, latitude, and longitude are required");
        }

        String stopId = "stop-" + name.toLowerCase().replaceAll("\\s+", "-") + "-" + System.currentTimeMillis();
        long now = System.currentTimeMillis();

        Stop entity = new Stop(stopId, name, latitude, longitude, description, true, now, now);
        Stop savedEntity = stopRepository.save(entity);

        logger.info("Stop created: {} at ({}, {})", name, latitude, longitude);
        return convertEntityToDto(savedEntity);
    }

    public StopDto updateStop(String stopId, String name, Double latitude, Double longitude, String description) {
        Optional<Stop> existing = stopRepository.findById(stopId);
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Stop not found: " + stopId);
        }

        Stop entity = existing.get();
        if (name != null) entity.setName(name);
        if (latitude != null) entity.setLatitude(latitude);
        if (longitude != null) entity.setLongitude(longitude);
        if (description != null) entity.setDescription(description);
        entity.setUpdatedAtMs(System.currentTimeMillis());

        Stop updated = stopRepository.save(entity);
        logger.info("Stop updated: {}", stopId);
        return convertEntityToDto(updated);
    }

    public void deleteStop(String stopId) {
        Optional<Stop> existing = stopRepository.findById(stopId);
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Stop not found: " + stopId);
        }

        Stop entity = existing.get();
        entity.setIsActive(false);
        entity.setUpdatedAtMs(System.currentTimeMillis());
        stopRepository.save(entity);

        logger.info("Stop deleted: {}", stopId);
    }

    public boolean stopExists(String stopId) {
        return stopRepository.existsById(stopId);
    }

    public void clearAll() {
        stopRepository.deleteAll();
        logger.warn("All stops cleared from database");
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

    private List<StopDto> convertEntitiesToDtos(List<Stop> entities) {
        return entities.stream()
                .map(this::convertEntityToDto)
                .toList();
    }
}
