package com.trinityshuttle.users.dto;


import com.trinityshuttle.users.entity.Role;


public record UserDto(
    Long id,
    String name,
    String photoUrl,
    String house,
    Role role
) {}