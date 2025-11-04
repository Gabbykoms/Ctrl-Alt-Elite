// src/main/java/com/javashams/tracking/config/RabbitConfig.java
package com.javashams.tracking.config;


import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
public class RabbitConfig {
    @Value("${app.rabbit.exchange}") private String exchangeName;
    @Value("${app.rabbit.push-queue}") private String pushQueueName;
    @Value("${app.rabbit.latest-queue}") private String latestQueueName;


    @Bean TopicExchange geoExchange() { return new TopicExchange(exchangeName, true, false); }


    @Bean Queue pushQueue() {
        return QueueBuilder.durable(pushQueueName)
                .withArgument("x-queue-type", "quorum")
                .withArgument("x-message-ttl", 30000)
                .build();
    }


    @Bean Queue latestQueue() {
        return QueueBuilder.durable(latestQueueName)
                .withArgument("x-queue-type", "quorum")
                .withArgument("x-single-active-consumer", true)
                .build();
    }


    @Bean Binding bindPush(Queue pushQueue, TopicExchange ex) {
        return BindingBuilder.bind(pushQueue).to(ex).with("org.#");
    }


    @Bean Binding bindLatest(Queue latestQueue, TopicExchange ex) {
        return BindingBuilder.bind(latestQueue).to(ex).with("org.*.device.*");
    }
}