package edu.cit.cantero.logpoint.controller;

import edu.cit.cantero.logpoint.dto.LoginRequest;
import edu.cit.cantero.logpoint.dto.RegisterRequest;
import edu.cit.cantero.logpoint.dto.UserDTO;
import edu.cit.cantero.logpoint.entity.User;
import edu.cit.cantero.logpoint.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {

        User user = new User();
        user.setFirstName(req.firstName);
        user.setLastName(req.lastName);
        user.setEmail(req.email);
        user.setPassword(req.password);
        // set role if provided
        if (req.role != null && !req.role.isBlank()) {
            user.setRole(req.role);
        }
        // set initial status
        user.setStatus("ACTIVE");

        userService.register(user);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpSession session) {

        var userOpt = userService.login(req.username, req.password);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        User user = userOpt.get();
        UserDTO userDTO = new UserDTO(user);
        
        // Store the DTO in session instead of the entity
        session.setAttribute("user", userDTO);
        return ResponseEntity.ok(userDTO);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok("Logged out");
    }
}