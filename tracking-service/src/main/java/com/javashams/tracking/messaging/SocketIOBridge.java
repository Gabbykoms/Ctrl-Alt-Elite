package com.javashams.tracking.messaging;

import com.javashams.tracking.model.GeoPoint;
import com.javashams.tracking.services.LocationSink;
import com.javashams.tracking.services.RideTrackingService;
import com.javashams.tracking.model.dto.DriverLocationDto;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

/**
 * Socket.IO event bridge connecting to the backend microservice.
 * Listens for location updates from the backend and broadcasts them to clients.
 *
 * Enabled when socket.io.backend-url is configured.
 */
@Service
@ConditionalOnProperty(name = "socket.io.backend-url", matchIfMissing = true)
public class SocketIOBridge {

    private static final Logger logger = LoggerFactory.getLogger(SocketIOBridge.class);

    @Value("${socket.io.backend-url:http://localhost:3000}")
    private String backendUrl;

    private Socket socket;
    private final LocationSink locationSink;
    private final RideTrackingService rideTrackingService;

    public SocketIOBridge(LocationSink locationSink, RideTrackingService rideTrackingService) {
        this.locationSink = locationSink;
        this.rideTrackingService = rideTrackingService;
    }

    @PostConstruct
    public void connect() {
        try {
            // Connect to backend Socket.IO server
            socket = IO.socket(backendUrl);

            // Connection event
            socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    logger.info("✅ Connected to backend Socket.IO: {}", backendUrl);
                }
            });

            // Disconnect event
            socket.on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    logger.warn("🔌 Disconnected from backend Socket.IO");
                }
            });

            // Listen for shuttle location updates from backend
            socket.on("shuttle-location-update", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    handleShuttleLocationUpdate(args);
                }
            });

            // Listen for driver status updates
            socket.on("driver-status-update", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    logger.debug("📡 Driver status update: {}", args[0]);
                }
            });

            // Listen for ride status updates
            socket.on("ride-status-update", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    handleRideStatusUpdate(args);
                }
            });

            socket.connect();

        } catch (Exception e) {
            logger.error("❌ Failed to connect to backend Socket.IO", e);
        }
    }

    @PreDestroy
    public void disconnect() {
        if (socket != null && socket.connected()) {
            socket.disconnect();
            logger.info("Socket.IO disconnected");
        }
    }

    /**
     * Handle incoming shuttle location updates from the backend
     * Store them in LocationSink and update ride tracking if applicable
     */
    private void handleShuttleLocationUpdate(Object[] args) {
        try {
            if (args.length == 0) return;

            JSONObject data = (JSONObject) args[0];
            String shuttleId = data.optString("shuttleId");
            double latitude = data.optDouble("latitude");
            double longitude = data.optDouble("longitude");
            double heading = data.optDouble("heading", 0);
            long timestamp = data.optLong("timestamp", System.currentTimeMillis());

            logger.debug("📍 Received shuttle location: {} at ({}, {})", shuttleId, latitude, longitude);

            // Store in LocationSink (generic location storage)
            // We need to create a GeoPoint equivalent from the Socket.IO data
            // For now, we'll update ride tracking if this is associated with a ride
            // TODO: Enhance this based on your ride-to-shuttle mapping

            // If the data includes a rideId, update ride tracking
            String rideId = data.optString("rideId", null);
            if (rideId != null && !rideId.isEmpty()) {
                DriverLocationDto driverLocation = new DriverLocationDto(
                        shuttleId,
                        shuttleId,
                        latitude,
                        longitude,
                        heading,
                        data.optDouble("speed", 0),
                        data.optDouble("accuracy", 0),
                        timestamp
                );
                rideTrackingService.updateRideDriverLocation(rideId, driverLocation);
                logger.info("✅ Updated ride {} driver location", rideId);
            }

        } catch (Exception e) {
            logger.error("❌ Error handling shuttle location update", e);
        }
    }

    /**
     * Handle ride status updates from the backend
     * Useful for knowing when rides start/end
     */
    private void handleRideStatusUpdate(Object[] args) {
        try {
            if (args.length == 0) return;

            JSONObject data = (JSONObject) args[0];
            String rideId = data.optString("rideId");
            String status = data.optString("status");

            logger.debug("🚕 Ride {} status: {}", rideId, status);

            // Handle ride lifecycle
            if ("completed".equals(status) || "cancelled".equals(status)) {
                rideTrackingService.endRideTracking(rideId);
                logger.info("✅ Ended tracking for ride {}", rideId);
            }

        } catch (Exception e) {
            logger.error("❌ Error handling ride status update", e);
        }
    }

    /**
     * Emit an event back to the backend
     */
    public void emit(String eventName, Object data) {
        if (socket != null && socket.connected()) {
            socket.emit(eventName, data);
        }
    }

    /**
     * Check if connected to backend
     */
    public boolean isConnected() {
        return socket != null && socket.connected();
    }
}
