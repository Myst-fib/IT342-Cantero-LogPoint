package edu.cit.cantero.logpoint.auth;

import edu.cit.cantero.logpoint.email.EmailService;
import edu.cit.cantero.logpoint.shared.User;
import edu.cit.cantero.logpoint.shared.UserRepository;
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
    private final EmailService emailService;

    public AuthController(UserService userService,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          EmailService emailService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userRepository.findByEmail(req.email).isPresent()) {
            return ResponseEntity.status(409).body("Email already in use");
        }

        User user = new User();
        user.setFirstName(req.firstName);
        user.setLastName(req.lastName);
        user.setEmail(req.email);
        user.setPassword(req.password);
        user.setAuthProvider("LOCAL");

        if (req.role != null && !req.role.isBlank()) {
            user.setRole(req.role);
        }

        User saved = userService.register(user);

        // Send welcome email
        emailService.sendWelcomeEmail(saved.getEmail(), saved.getFirstName(), saved.getRole());

        return ResponseEntity.ok(new UserDTO(saved));
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

    /**
     * Called by the frontend role-selection page after a new Google user picks their role.
     * Sets the role, sends a welcome email, and returns the full user DTO.
     */
    @PostMapping("/set-role")
    public ResponseEntity<?> setRole(@RequestBody Map<String, String> body, HttpSession session) {
        String email = body.get("email");
        String role  = body.get("role");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        if (role == null || role.isBlank()) {
            return ResponseEntity.badRequest().body("Role is required");
        }

        // Validate allowed roles
        if (!role.equalsIgnoreCase("Office Administrator") && !role.equalsIgnoreCase("Guard")) {
            return ResponseEntity.badRequest().body("Invalid role. Must be 'Office Administrator' or 'Guard'");
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User user = userOpt.get();

        // Only allow setting role when still PENDING
        if (!"PENDING".equals(user.getRole()) && user.getRole() != null) {
            return ResponseEntity.status(409).body("Role already assigned");
        }

        user.setRole(role);
        userRepository.save(user);

        // Send welcome email now that we know the role
        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName(), user.getRole());

        UserDTO userDTO = new UserDTO(user);
        session.setAttribute("user", userDTO);
        return ResponseEntity.ok(userDTO);
    }

    @GetMapping("/oauth2/success")
    public ResponseEntity<?> oauth2Success(HttpSession session) {
        Map<String, Object> oauth2User =
                (Map<String, Object>) session.getAttribute("oauth2User");

        if (oauth2User == null) {
            return ResponseEntity.status(401).body("No OAuth2 user found in session");
        }

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