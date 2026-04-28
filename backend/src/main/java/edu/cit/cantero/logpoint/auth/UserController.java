package edu.cit.cantero.logpoint.auth;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import edu.cit.cantero.logpoint.auth.UserDTO;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");

        if (user == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        return ResponseEntity.ok(user);
    }
}