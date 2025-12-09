package com.javashams.tracking.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javashams.tracking.model.dto.StopDto;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;

/**
 * Redis configuration for location storage, pub/sub, and stop caching.
 * Provides RedisTemplate beans for String and StopDto serialization.
 */
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.afterPropertiesSet();
        return template;
    }

    /**
     * RedisTemplate for caching StopDto objects
     * Uses default serialization with Redis connection factory
     */
    @Bean
    public RedisTemplate<String, StopDto> stopDtoRedisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, StopDto> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
