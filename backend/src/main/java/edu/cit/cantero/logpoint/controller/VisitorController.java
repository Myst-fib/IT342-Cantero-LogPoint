package edu.cit.cantero.logpoint.controller;

import edu.cit.cantero.logpoint.dto.UserDTO;
import edu.cit.cantero.logpoint.dto.VisitorDTO;
import edu.cit.cantero.logpoint.service.VisitorService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/visitors")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class VisitorController {

    @Autowired
    private VisitorService visitorService;

    @PostMapping
    public ResponseEntity<VisitorDTO> createVisitor(@Valid @RequestBody VisitorDTO visitorDTO, HttpSession session) {
        String userEmail = extractEmailFromSession(session);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return new ResponseEntity<>(visitorService.createVisitor(visitorDTO, userEmail), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<VisitorDTO>> getAllVisitors(HttpSession session) {
        String userEmail = extractEmailFromSession(session);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(visitorService.getAllVisitors(userEmail));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VisitorDTO> getVisitorById(@PathVariable Long id, HttpSession session) {
        String userEmail = extractEmailFromSession(session);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(visitorService.getVisitorById(id, userEmail));
    }

    @GetMapping("/search")
    public ResponseEntity<List<VisitorDTO>> searchVisitors(@RequestParam String q, HttpSession session) {
        String userEmail = extractEmailFromSession(session);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(visitorService.searchVisitors(q, userEmail));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VisitorDTO> updateVisitor(@PathVariable Long id, @Valid @RequestBody VisitorDTO visitorDTO, HttpSession session) {
        String userEmail = extractEmailFromSession(session);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(visitorService.updateVisitor(id, visitorDTO, userEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVisitor(@PathVariable Long id, HttpSession session) {
        String userEmail = extractEmailFromSession(session);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        visitorService.deleteVisitor(id, userEmail);
        return ResponseEntity.noContent().build();
    }

    private String extractEmailFromSession(HttpSession session) {
        Object userObj = session.getAttribute("user");
        if (userObj instanceof UserDTO userDTO) {
            return userDTO.getEmail();
        }
        return null;
    }
}