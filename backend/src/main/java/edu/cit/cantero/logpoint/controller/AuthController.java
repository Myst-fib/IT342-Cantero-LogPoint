package edu.cit.cantero.logpoint.controller;

import edu.cit.cantero.logpoint.dto.LoginRequest;
import edu.cit.cantero.logpoint.dto.RegisterRequest;
import edu.cit.cantero.logpoint.dto.UserDTO;
import edu.cit.cantero.logpoint.entity.User;
import edu.cit.cantero.logpoint.repository.UserRepository;
import edu.cit.cantero.logpoint.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;  

    public AuthController(UserService userService, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;  
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        User user = new User();
        user.setFirstName(req.firstName);
        user.setLastName(req.lastName);
        user.setEmail(req.email);
        user.setPassword(passwordEncoder.encode(req.password)); 
        user.setAuthProvider("LOCAL");
        
        if (req.role != null && !req.role.isBlank()) {
            user.setRole(req.role);
        }
        
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
        session.setAttribute("user", userDTO);
        return ResponseEntity.ok(userDTO);
    }

    @GetMapping("/oauth2/success")
    public ResponseEntity<?> oauth2Success(HttpSession session) {
        Map<String, Object> oauth2User = (Map<String, Object>) session.getAttribute("oauth2User");
        
        if (oauth2User == null) {
            return ResponseEntity.status(401).body("No OAuth2 user found in session");
        }
        
        // Find user in database
        String email = (String) oauth2User.get("email");
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }
        
        User user = userOpt.get();
        UserDTO userDTO = new UserDTO(user);
        session.setAttribute("user", userDTO);
        
        return ResponseEntity.ok(userDTO);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok("Logged out");
    }
}