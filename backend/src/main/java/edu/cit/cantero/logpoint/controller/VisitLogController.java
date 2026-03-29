package edu.cit.cantero.logpoint.controller;

import edu.cit.cantero.logpoint.dto.VisitLogDTO;
import edu.cit.cantero.logpoint.service.VisitLogService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/visit-logs")
public class VisitLogController {

    @Autowired
    private VisitLogService visitLogService;

    @PostMapping("/check-in")
    public ResponseEntity<VisitLogDTO> checkIn(@Valid @RequestBody VisitLogDTO visitLogDTO,
                                                Authentication authentication) {
        String email = authentication.getName();
        VisitLogDTO visitLog = visitLogService.checkIn(visitLogDTO, email);
        return ResponseEntity.ok(visitLog);
    }

    @PostMapping("/check-out/{id}")
    public ResponseEntity<VisitLogDTO> checkOut(@PathVariable Long id) {
        VisitLogDTO visitLog = visitLogService.checkOut(id);
        return ResponseEntity.ok(visitLog);
    }

    @GetMapping
    public ResponseEntity<List<VisitLogDTO>> getAllVisitLogs(Authentication authentication) {
        String email = authentication.getName();
        List<VisitLogDTO> visitLogs = visitLogService.getVisitLogsByUser(email);
        return ResponseEntity.ok(visitLogs);
    }

    @GetMapping("/active")
    public ResponseEntity<List<VisitLogDTO>> getActiveVisits(Authentication authentication) {
        String email = authentication.getName();
        List<VisitLogDTO> activeVisits = visitLogService.getActiveVisitsByUser(email);
        return ResponseEntity.ok(activeVisits);
    }

    @GetMapping("/visitor/{visitorId}")
    public ResponseEntity<List<VisitLogDTO>> getVisitLogsByVisitor(@PathVariable Long visitorId) {
        List<VisitLogDTO> visitLogs = visitLogService.getVisitLogsByVisitor(visitorId);
        return ResponseEntity.ok(visitLogs);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<VisitLogDTO>> getVisitLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<VisitLogDTO> visitLogs = visitLogService.getVisitLogsBetweenDates(startDate, endDate);
        return ResponseEntity.ok(visitLogs);
    }
}