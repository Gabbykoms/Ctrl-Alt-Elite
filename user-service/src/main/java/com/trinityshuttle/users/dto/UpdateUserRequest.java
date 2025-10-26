package com.trinityshuttle.users.dto;


import com.trinityshuttle.users.entity.Role;
import jakarta.validation.constraints.Size;


public record UpdateUserRequest(
    @Size(min = 1, max = 200) String name,
    String photoUrl,
    String house,
    Role role
) {}