package com.trinityshuttle.users;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.trinityshuttle.users.controller.UserController;
import com.trinityshuttle.users.dto.CreateUserRequest;
import com.trinityshuttle.users.dto.UpdateUserRequest;
import com.trinityshuttle.users.dto.UserDto;
import com.trinityshuttle.users.entity.Role;
import com.trinityshuttle.users.entity.User;
import com.trinityshuttle.users.repository.UserRepository;
import com.trinityshuttle.users.service.UserService;
import com.trinityshuttle.users.web.ErrorHandler;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;


import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    UserRepository repo;

    @InjectMocks
    UserService service;

    private User user(Long id) {
        var u = new User();
        u.setId(id);
        u.setName("Alice");
        u.setPhotoUrl("https://img");
        u.setHouse("North");
        u.setRole(Role.STUDENT);
        return u;
    }

    @Test
    void getUser_found() {
        when(repo.findById(1L)).thenReturn(Optional.of(user(1L)));

        var dto = service.getUser(1L);

        assertThat(dto.id()).isEqualTo(1L);
        assertThat(dto.name()).isEqualTo("Alice");
        verify(repo).findById(1L);
    }

    @Test
    void getUser_notFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getUser(99L))
                .isInstanceOf(UserService.NotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void createUser_persists_andReturnsDto() {
        var req = new CreateUserRequest("Bob", "https://img", "South", Role.DRIVER);

        // Verify the entity we pass to save is built from the request:
        when(repo.save(Mockito.any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(10L);
            return u;
        });

        var dto = service.createUser(req);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(repo).save(captor.capture());
        var saved = captor.getValue();

        assertThat(saved.getName()).isEqualTo("Bob");
        assertThat(saved.getPhotoUrl()).isEqualTo("https://img");
        assertThat(saved.getHouse()).isEqualTo("South");
        assertThat(saved.getRole()).isEqualTo(Role.DRIVER);

        assertThat(dto.id()).isEqualTo(10L);
        assertThat(dto.role()).isEqualTo(Role.DRIVER);
    }

    @Test
    void updateUser_updatesOnlyProvidedFields() {
        var existing = user(5L);
        when(repo.findById(5L)).thenReturn(Optional.of(existing));

        var req = new UpdateUserRequest("NewName", null, "FRED", Role.ADMIN);

        var dto = service.updateUser(5L, req);

        assertThat(existing.getName()).isEqualTo("NewName");
        assertThat(existing.getPhotoUrl()).isEqualTo("https://img"); // unchanged
        assertThat(existing.getHouse()).isEqualTo("FRED");
        assertThat(existing.getRole()).isEqualTo(Role.ADMIN);

        assertThat(dto.name()).isEqualTo("NewName");
        assertThat(dto.role()).isEqualTo(Role.ADMIN);
        verify(repo).findById(5L);
        // No explicit save needed since entity is managed in real JPA; unit test just checks mutation.
    }

    @Test
    void deleteUser_whenFound_deletes() {
        var existing = user(7L);
        when(repo.findById(7L)).thenReturn(Optional.of(existing));

        service.deleteUser(7L);

        verify(repo).delete(existing);
    }

    @Test
    void deleteUser_notFound_throws() {
        when(repo.findById(8L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteUser(8L))
                .isInstanceOf(UserService.NotFoundException.class);
        verify(repo, never()).delete(any());
    }

    @Test
    void getAllUsers_mapsToDtos() {
        when(repo.findAll()).thenReturn(List.of(user(1L), user(2L)));

        var dtos = service.getAllUsers();

        assertThat(dtos).hasSize(2);
        assertThat(dtos.get(0).id()).isEqualTo(1L);
        assertThat(dtos.get(1).id()).isEqualTo(2L);
        verify(repo).findAll();
    }
}


@WebMvcTest(controllers = UserController.class)
@Import(ErrorHandler.class)
class UserControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    UserService service;

    private UserDto dto(long id) {
        return new UserDto(id, "Alice", "https://img", "North", Role.STUDENT);
    }

    @Test
    void get_byId_returnsUser() throws Exception {
        Mockito.when(service.getUser(1L)).thenReturn(dto(1));

        mvc.perform(get("/api/v1/users/1").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Alice"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    void get_byId_notFound_usesAdvice() throws Exception {
        Mockito.when(service.getUser(99L)).thenThrow(new UserService.NotFoundException("User 99 not found"));

        mvc.perform(get("/api/v1/users/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message", containsString("99")));
    }

    @Test
    void list_returnsAll() throws Exception {
        Mockito.when(service.getAllUsers()).thenReturn(List.of(dto(1), dto(2)));

        mvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    void create_valid_returnsDto() throws Exception {
        var req = new CreateUserRequest("Bob", "https://img", "South", Role.DRIVER);
        var body = objectMapper.writeValueAsString(req);

        var returned = new UserDto(10L, "Bob", "https://img", "South", Role.DRIVER);
        Mockito.when(service.createUser(Mockito.any(CreateUserRequest.class))).thenReturn(returned);

        mvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.role").value("DRIVER"));
    }

    @Test
    void create_missingName_triggersValidation400() throws Exception {
        // name is blank -> violates @NotBlank/@Size
        String body = """
            {"name":"", "photoUrl":"x", "house":"Y", "role":"STUDENT"}
            """;

        mvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void patch_updatesAndReturnsDto() throws Exception {
        var req = new UpdateUserRequest("New", null, "FRED", Role.ADMIN);
        var body = objectMapper.writeValueAsString(req);

        var returned = new UserDto(3L, "New", "https://img", "FRED", Role.ADMIN);
        Mockito.when(service.updateUser(eq(3L), Mockito.any(UpdateUserRequest.class))).thenReturn(returned);

        mvc.perform(patch("/api/v1/users/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.name").value("New"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void delete_returns204() throws Exception {
        // service.deleteUser returns void; just ensure endpoint returns 204 and service is called
        mvc.perform(delete("/api/v1/users/5"))
                .andExpect(status().isNoContent());

        Mockito.verify(service).deleteUser(5L);
    }
}
