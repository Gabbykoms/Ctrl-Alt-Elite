package com.trinityshuttle.users.dto;

import com.trinityshuttle.users.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank @Size(min = 1, max = 200) String name,
        String photoUrl,
        String house,
        @NotNull Role role
) {}