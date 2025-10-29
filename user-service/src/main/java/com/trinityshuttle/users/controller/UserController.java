package com.trinityshuttle.users.controller;


import com.trinityshuttle.users.dto.CreateUserRequest;
import com.trinityshuttle.users.dto.UpdateUserRequest;
import com.trinityshuttle.users.dto.UserDto;
import com.trinityshuttle.users.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping(path = "/api/v1/users", produces = MediaType.APPLICATION_JSON_VALUE)
public class UserController {
    private final UserService service;


    public UserController(UserService service) { this.service = service; }


    @GetMapping("/{id}")
    public UserDto get(@PathVariable Long id) {
        return service.getUser(id);
    }


    @PatchMapping("/{id}")
    public UserDto patch(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest body) {
        return service.updateUser(id, body);
    }

    @PostMapping
    public UserDto create(@Valid @RequestBody CreateUserRequest body) {
        return service.createUser(body);
    }

//    @DeleteMapping("/{id}")
//    public UserDto delete(@PathVariable Long id) {
//        return service.deleteUser(id);
//    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.deleteUser(id);
    }

    @GetMapping
    public List<UserDto> getAll() {
        return service.getAllUsers();
    }


}