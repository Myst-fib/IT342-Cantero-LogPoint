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
@RequestMapping("/api/user")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * GET /api/user/me
     * Returns the currently authenticated user from the session.
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session,
                                @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null && headerEmail != null && !headerEmail.isBlank()) {
            Optional<edu.cit.cantero.logpoint.shared.User> userOpt = userRepository.findByEmail(headerEmail);
            if (userOpt.isPresent()) return ResponseEntity.ok(new UserDTO(userOpt.get()));
            return ResponseEntity.status(401).body("Not authenticated");
        }
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        return ResponseEntity.ok(user);
    }

    /**
     * PUT /api/user/update
     * Updates the profile of the currently authenticated user.
     * Accepts: firstName, lastName, email
     */
    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> body,
            HttpSession session,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {

        UserDTO sessionUser = resolveSessionUser(session, headerEmail);
        if (sessionUser == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        Optional<User> userOpt = userRepository.findByEmail(sessionUser.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User user = userOpt.get();

        // ── Personal info updates ─────────────────────────
        String firstName = body.get("firstName");
        String lastName  = body.get("lastName");
        String email     = body.get("email");

        if (firstName != null && !firstName.isBlank()) {
            user.setFirstName(firstName.trim());
        }
        if (lastName != null && !lastName.isBlank()) {
            user.setLastName(lastName.trim());
        }
        if (email != null && !email.isBlank()) {
            Optional<User> existing = userRepository.findByEmail(email.trim());
            if (existing.isPresent() && !existing.get().getId().equals(user.getId())) {
                return ResponseEntity.status(409).body("Email is already in use by another account.");
            }
            user.setEmail(email.trim());
        }

        // ── Save and refresh session ───────────────────────
        User saved = userRepository.save(user);
        UserDTO updatedDTO = new UserDTO(saved);
        session.setAttribute("user", updatedDTO);

        return ResponseEntity.ok(updatedDTO);
    }

    /**
     * PUT /api/user/update-password
     * Updates ONLY the password for the currently authenticated user.
     * Accepts: currentPassword, newPassword
     */
    @PutMapping("/update-password")
    public ResponseEntity<?> updatePassword(
            @RequestBody Map<String, String> body,
            HttpSession session,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {

        UserDTO sessionUser = resolveSessionUser(session, headerEmail);
        if (sessionUser == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        Optional<User> userOpt = userRepository.findByEmail(sessionUser.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User user = userOpt.get();

        // ── Check if user is LOCAL ──────────────────────────
        if (!"LOCAL".equalsIgnoreCase(user.getAuthProvider())) {
            return ResponseEntity.status(400)
                    .body("Password changes are managed by your auth provider.");
        }

        // ── Validate password fields ──────────────────────
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (currentPassword == null || currentPassword.isBlank()) {
            return ResponseEntity.status(400).body("Current password is required.");
        }

        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.status(400).body("New password is required.");
        }

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.status(400).body("Current password is incorrect.");
        }

        // Validate new password
        if (newPassword.length() < 8) {
            return ResponseEntity.status(400).body("New password must be at least 8 characters.");
        }

        // ── Update password ────────────────────────────────
        user.setPassword(passwordEncoder.encode(newPassword));
        User saved = userRepository.save(user);
        UserDTO updatedDTO = new UserDTO(saved);
        session.setAttribute("user", updatedDTO);

        return ResponseEntity.ok(updatedDTO);
    }

    /**
     * PUT /api/user/update-picture
     * Updates the profile picture of the currently authenticated user.
     * Accepts: pictureUrl (base64 data URL string, e.g. "data:image/jpeg;base64,...")
     * The image is stored directly in the database as a base64 string.
     */
    @PutMapping("/update-picture")
    public ResponseEntity<?> updatePicture(
            @RequestBody Map<String, String> body,
            HttpSession session,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {

        UserDTO sessionUser = resolveSessionUser(session, headerEmail);
        if (sessionUser == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        Optional<User> userOpt = userRepository.findByEmail(sessionUser.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        String pictureData = body.get("pictureUrl");

        if (pictureData == null || pictureData.isBlank()) {
            return ResponseEntity.status(400).body("No picture data provided.");
        }

        // Basic validation: must be a data URL
        if (!pictureData.startsWith("data:image/")) {
            return ResponseEntity.status(400).body("Invalid image format.");
        }

        // Rough size check: base64 of 2MB ≈ ~2.7M chars
        if (pictureData.length() > 3_000_000) {
            return ResponseEntity.status(400).body("Image is too large. Please use an image under 2MB.");
        }

        User user = userOpt.get();
        user.setPictureUrl(pictureData);

        User saved = userRepository.save(user);
        UserDTO updatedDTO = new UserDTO(saved);
        session.setAttribute("user", updatedDTO);

        return ResponseEntity.ok(updatedDTO);
    }

    private UserDTO resolveSessionUser(HttpSession session, String headerEmail) {
        UserDTO sessionUser = (UserDTO) session.getAttribute("user");
        if (sessionUser != null) return sessionUser;
        if (headerEmail != null && !headerEmail.isBlank()) {
            Optional<edu.cit.cantero.logpoint.shared.User> userOpt = userRepository.findByEmail(headerEmail);
            if (userOpt.isPresent()) return new UserDTO(userOpt.get());
        }
        return null;
    }
}