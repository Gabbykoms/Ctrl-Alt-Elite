// // src/main/java/com/javashams/tracking/messaging/GeoPublisher.java
// package com.javashams.tracking.messaging;


// import com.javashams.tracking.model.GeoPoint;
// import org.springframework.amqp.rabbit.core.RabbitTemplate;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.stereotype.Service;


// import java.util.Date;


// @Service
// public class GeoPublisher {
//     private final RabbitTemplate template;
//     private final String exchangeName;


//     public GeoPublisher(RabbitTemplate template, @Value("${app.rabbit.exchange}") String exchangeName) {
//         this.template = template;
//         this.exchangeName = exchangeName;
//         this.template.setMandatory(true);
// // Confirm/return callbacks are auto-configured by Boot when properties set
//     }


//     public void publish(GeoPoint p) {
//         String rk = "org." + p.org() + ".trip." + p.tripId() + ".device." + p.deviceId();
//         template.convertAndSend(exchangeName, rk, p, m -> {
//             m.getMessageProperties().setMessageId(p.idempotency());
//             m.getMessageProperties().setTimestamp(new Date(p.tsEventMs()));
//             return m;
//         });
//     }
// }