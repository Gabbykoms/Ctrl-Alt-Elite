// // src/main/java/com/javashams/tracking/messaging/LatestConsumer.java
// package com.javashams.tracking.messaging;


// import com.javashams.tracking.model.GeoPoint;
// import com.javashams.tracking.service.LocationSink;
// import org.springframework.amqp.rabbit.annotation.RabbitListener;
// import org.springframework.stereotype.Component;


// @Component
// public class LatestConsumer {
//     private final LocationSink sink;


//     public LatestConsumer(LocationSink sink) { this.sink = sink; }


//     @RabbitListener(queues = "${app.rabbit.latest-queue}", ackMode = "AUTO", concurrency = "1-4")
//     public void onMessage(GeoPoint p) {
// // TODO: add dedupe/out-of-order checks
//         sink.upsertLatest(p);
// // Optionally also append history
// // sink.appendHistory(p);
//     }
// }