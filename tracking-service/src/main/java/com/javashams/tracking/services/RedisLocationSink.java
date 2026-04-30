// package com.javashams.tracking.services;
// 
// // Redis disabled - tracking service now uses Supabase PostgreSQL only
// // Uncomment and re-add Redis dependencies to build.gradle.kts to re-enable
// 
// // import com.javashams.tracking.model.GeoPoint;
// // import com.fasterxml.jackson.databind.ObjectMapper;
// // import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
// // import org.springframework.data.redis.core.RedisTemplate;
// // import org.springframework.stereotype.Service;
// // import java.util.Collection;
// // import java.util.List;
// // import java.util.concurrent.TimeUnit;
// // import java.util.stream.Collectors;
// 
// // @Service
// // @ConditionalOnProperty(name = "spring.redis.host", matchIfMissing = false)
// // public class RedisLocationSink implements LocationSink {
// //     private final RedisTemplate<String, String> redisTemplate;
// //     private final ObjectMapper objectMapper;
// //     private static final String LOCATION_KEY_PREFIX = "location:";
// //     private static final String ORG_INDEX_PREFIX = "org-index:";
// //     private static final long TTL_MINUTES = 60;
// //
// //     public RedisLocationSink(RedisTemplate<String, String> redisTemplate, ObjectMapper objectMapper) {
// //         this.redisTemplate = redisTemplate;
// //         this.objectMapper = objectMapper;
// //     }
// //     ... full implementation omitted
// // }
