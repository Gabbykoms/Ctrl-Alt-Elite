package com.trinityshuttle.users.service;


import com.trinityshuttle.users.dto.UpdateUserRequest;
import com.trinityshuttle.users.dto.CreateUserRequest;
import com.trinityshuttle.users.dto.UserDto;
import com.trinityshuttle.users.entity.User;
import com.trinityshuttle.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
public class UserService {
    private final UserRepository repo;


    public UserService(UserRepository repo) { this.repo = repo; }


    @Transactional(readOnly = true)
    public UserDto getUser(Long id) {
        var u = repo.findById(id).orElseThrow(() -> new NotFoundException("User %d not found".formatted(id)));
        return toDto(u);
    }


    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest req) {
        var u = repo.findById(id).orElseThrow(() -> new NotFoundException("User %d not found".formatted(id)));
        if (req.name() != null) u.setName(req.name());
        if (req.photoUrl() != null) u.setPhotoUrl(req.photoUrl());
        if (req.house() != null) u.setHouse(req.house());
        if (req.role() != null) u.setRole(req.role());
        return toDto(u);
    }

    @Transactional
    public UserDto createUser(CreateUserRequest req) {
        var u = new User();
        u.setName(req.name());
        u.setPhotoUrl(req.photoUrl());
        u.setHouse(req.house());
        u.setRole(req.role());

        var saved = repo.save(u);
        return toDto(saved);
    }

    private static UserDto toDto(User u) {
       return new UserDto(u.getId(), u.getName(), u.getPhotoUrl(), u.getHouse(), u.getRole());
    }


    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String msg) { super(msg); }
    }
}