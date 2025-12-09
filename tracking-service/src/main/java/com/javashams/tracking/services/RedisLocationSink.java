package com.javashams.tracking.services;

import com.javashams.tracking.model.GeoPoint;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Redis-backed implementation of LocationSink.
 * Provides persistent location storage with TTL and fast lookups.
 *
 * Enabled when spring.data.redis.host is configured.
 * Falls back to InMemoryLocationSink if Redis is not available.
 */
@Service
@ConditionalOnProperty(name = "spring.redis.host", matchIfMissing = false)
public class RedisLocationSink implements LocationSink {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    // Redis key patterns
    private static final String LOCATION_KEY_PREFIX = "location:";
    private static final String ORG_INDEX_PREFIX = "org-index:";
    private static final long TTL_MINUTES = 60; // Locations expire after 1 hour

    public RedisLocationSink(RedisTemplate<String, String> redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void upsertLatest(GeoPoint p) {
        try {
            String key = key(p.org(), p.deviceId());
            String jsonValue = objectMapper.writeValueAsString(p);

            // Store location with TTL
            redisTemplate.opsForValue().set(
                    LOCATION_KEY_PREFIX + key,
                    jsonValue,
                    TTL_MINUTES,
                    TimeUnit.MINUTES
            );

            // Update org index for quick lookups by org
            String orgIndexKey = ORG_INDEX_PREFIX + p.org();
            redisTemplate.opsForSet().add(orgIndexKey, key);
            redisTemplate.expire(orgIndexKey, TTL_MINUTES, TimeUnit.MINUTES);

        } catch (Exception e) {
            throw new RuntimeException("Failed to store location in Redis", e);
        }
    }

    @Override
    public GeoPoint findLatest(String org, String deviceId) {
        try {
            String key = key(org, deviceId);
            String jsonValue = redisTemplate.opsForValue().get(LOCATION_KEY_PREFIX + key);

            if (jsonValue == null) {
                return null;
            }

            return objectMapper.readValue(jsonValue, GeoPoint.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve location from Redis", e);
        }
    }

    @Override
    public Collection<GeoPoint> findAllLatestForOrg(String org) {
        try {
            String orgIndexKey = ORG_INDEX_PREFIX + org;

            // Get all device keys for this org
            java.util.Set<String> deviceKeys = redisTemplate.opsForSet().members(orgIndexKey);

            if (deviceKeys == null || deviceKeys.isEmpty()) {
                return List.of();
            }

            // Fetch all locations for this org
            return deviceKeys.stream()
                    .map(deviceKey -> {
                        try {
                            String jsonValue = redisTemplate.opsForValue().get(LOCATION_KEY_PREFIX + deviceKey);
                            if (jsonValue != null) {
                                return objectMapper.readValue(jsonValue, GeoPoint.class);
                            }
                            return null;
                        } catch (Exception e) {
                            return null;
                        }
                    })
                    .filter(p -> p != null)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve org locations from Redis", e);
        }
    }

    private String key(String org, String deviceId) {
        return org + "::" + deviceId;
    }
}
