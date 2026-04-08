package edu.cit.cantero.logpoint.controller;

import edu.cit.cantero.logpoint.dto.UserDTO;
import edu.cit.cantero.logpoint.dto.VisitLogDTO;
import edu.cit.cantero.logpoint.service.VisitLogService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/visit-logs")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class VisitLogController {

    @Autowired
    private VisitLogService visitLogService;

    @PostMapping("/check-in")
    public ResponseEntity<VisitLogDTO> checkIn(@RequestBody VisitLogDTO visitLogDTO, HttpSession session) {
        String userEmail = extractEmailFromSession(session);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        VisitLogDTO createdLog = visitLogService.checkIn(visitLogDTO, userEmail);
        return new ResponseEntity<>(createdLog, HttpStatus.CREATED);
    }

    @PostMapping("/check-out/{id}")
    public ResponseEntity<VisitLogDTO> checkOut(@PathVariable Long id, HttpSession session) {
        String userEmail = extractEmailFromSession(session);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        VisitLogDTO updatedLog = visitLogService.checkOut(id, userEmail);
        return ResponseEntity.ok(updatedLog);
    }

    @GetMapping
    public ResponseEntity<List<VisitLogDTO>> getVisitLogs(HttpSession session) {
        String userEmail = extractEmailFromSession(session);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        // IMPORTANT: This now returns ONLY logs created by the current user
        List<VisitLogDTO> visitLogs = visitLogService.getVisitLogsByUser(userEmail);
        return ResponseEntity.ok(visitLogs);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<VisitLogDTO>> getActiveVisits(HttpSession session) {
        String userEmail = extractEmailFromSession(session);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<VisitLogDTO> activeVisits = visitLogService.getActiveVisitsByUser(userEmail);
        return ResponseEntity.ok(activeVisits);
    }

    @GetMapping("/visitor/{visitorId}")
    public ResponseEntity<List<VisitLogDTO>> getVisitLogsByVisitor(@PathVariable Long visitorId, HttpSession session) {
        String userEmail = extractEmailFromSession(session);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<VisitLogDTO> visitLogs = visitLogService.getVisitLogsByVisitor(visitorId);
        return ResponseEntity.ok(visitLogs);
    }

    private String extractEmailFromSession(HttpSession session) {
        Object userObj = session.getAttribute("user");
        if (userObj instanceof UserDTO userDTO) {
            return userDTO.getEmail();
        }
        return null;
    }
}