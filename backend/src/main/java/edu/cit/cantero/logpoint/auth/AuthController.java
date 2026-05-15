package edu.cit.cantero.logpoint.auth;

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

    public AuthController(UserService userService,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Register a new local user.
     * FIX: Now returns UserResponse (JSON object) instead of plain String,
     *      so the Android Retrofit call (Response<UserResponse>) parses correctly.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        // Check for duplicate email before saving
        if (userRepository.findByEmail(req.email).isPresent()) {
            return ResponseEntity.status(409).body("Email already in use");
        }

        User user = new User();
        user.setFirstName(req.firstName);
        user.setLastName(req.lastName);
        user.setEmail(req.email);
        user.setPassword(req.password); // raw password – UserService hashes it
        user.setAuthProvider("LOCAL");

        if (req.role != null && !req.role.isBlank()) {
            user.setRole(req.role);
        }

        User saved = userService.register(user);
        // Return a proper JSON object so Retrofit's GsonConverter can deserialize it
        return ResponseEntity.ok(new UserDTO(saved));
    }

    /**
     * Login with email + password.
     * Note: the "username" field in LoginRequest is treated as the email.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpSession session) {
        // req.username is the email address
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