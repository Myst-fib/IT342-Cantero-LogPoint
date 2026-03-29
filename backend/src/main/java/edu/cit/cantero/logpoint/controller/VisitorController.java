package edu.cit.cantero.logpoint.controller;

import edu.cit.cantero.logpoint.dto.VisitorDTO;
import edu.cit.cantero.logpoint.service.VisitorService;
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
    public ResponseEntity<VisitorDTO> createVisitor(@Valid @RequestBody VisitorDTO visitorDTO) {
        VisitorDTO createdVisitor = visitorService.createVisitor(visitorDTO);
        return new ResponseEntity<>(createdVisitor, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<VisitorDTO>> getAllVisitors() {
        List<VisitorDTO> visitors = visitorService.getAllVisitors();
        return ResponseEntity.ok(visitors);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VisitorDTO> getVisitorById(@PathVariable Long id) {
        VisitorDTO visitor = visitorService.getVisitorById(id);
        return ResponseEntity.ok(visitor);
    }

    @GetMapping("/search")
    public ResponseEntity<List<VisitorDTO>> searchVisitors(@RequestParam String q) {
        List<VisitorDTO> visitors = visitorService.searchVisitors(q);
        return ResponseEntity.ok(visitors);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VisitorDTO> updateVisitor(@PathVariable Long id, @Valid @RequestBody VisitorDTO visitorDTO) {
        VisitorDTO updatedVisitor = visitorService.updateVisitor(id, visitorDTO);
        return ResponseEntity.ok(updatedVisitor);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVisitor(@PathVariable Long id) {
        visitorService.deleteVisitor(id);
        return ResponseEntity.noContent().build();
    }
}