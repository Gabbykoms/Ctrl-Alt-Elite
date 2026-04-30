// // src/main/java/com/javashams/tracking/api/GeoSseController.java
// package com.javashams.tracking.api;
// 
// 
// import com.javashams.tracking.model.GeoPoint;
// import org.springframework.http.MediaType;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.RequestParam;
// import org.springframework.web.bind.annotation.RestController;
// import reactor.core.publisher.Flux;
// import reactor.core.publisher.Sinks;
// 
// 
// import java.time.Duration;
// 
// 
// @RestController
// public class GeoSseController {
//     private final Sinks.Many<GeoPoint> sink = Sinks.many().multicast().onBackpressureBuffer();
// 
// 
//     // You can call this from a Rabbit consumer to push live points to SSE clients
//     public void push(GeoPoint p) { sink.tryEmitNext(p); }
// 
// 
//     @GetMapping(path = "/sse/geo", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
//     public Flux<GeoPoint> stream(@RequestParam(defaultValue = "trinity") String org) {
//         return sink.asFlux()
//                 .filter(p -> p.org().equals(org))
//                 .sample(Duration.ofSeconds(1)); // throttle to ~1Hz
//     }
// }