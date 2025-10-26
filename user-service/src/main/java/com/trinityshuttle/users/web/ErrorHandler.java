package com.trinityshuttle.users.web;


import com.trinityshuttle.users.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;


import java.time.Instant;
import java.util.Map;


@ControllerAdvice
public class ErrorHandler {
    @ExceptionHandler(UserService.NotFoundException.class)
    ResponseEntity<?> handleNotFound(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err(404, ex.getMessage()));
    }


    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest().body(err(400, "Validation failed"));
    }


//    @ExceptionHandler(Exception.class)
//    ResponseEntity<?> handleGeneric(Exception ex) {
//       return ResponseEntity.status(500).body(err(500, "Internal error"));
//    }


    private Map<String, Object> err(int status, String message) {
        return Map.of(
            "timestamp", Instant.now().toString(),
            "status", status,
            "message", message
        );
    }
}