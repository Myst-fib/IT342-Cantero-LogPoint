package edu.cit.cantero.logpoint.controller;

import edu.cit.cantero.logpoint.dto.PurposeDTO;
import edu.cit.cantero.logpoint.service.PurposeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/purposes")
public class PurposeController {

    @Autowired
    private PurposeService purposeService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PurposeDTO> createPurpose(@Valid @RequestBody PurposeDTO purposeDTO) {
        PurposeDTO purpose = purposeService.createPurpose(purposeDTO);
        return ResponseEntity.ok(purpose);
    }

    @GetMapping
    public ResponseEntity<List<PurposeDTO>> getAllPurposes() {
        List<PurposeDTO> purposes = purposeService.getAllPurposes();
        return ResponseEntity.ok(purposes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurposeDTO> getPurposeById(@PathVariable Long id) {
        PurposeDTO purpose = purposeService.getPurposeById(id);
        return ResponseEntity.ok(purpose);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PurposeDTO> updatePurpose(@PathVariable Long id, 
                                                     @Valid @RequestBody PurposeDTO purposeDTO) {
        PurposeDTO updatedPurpose = purposeService.updatePurpose(id, purposeDTO);
        return ResponseEntity.ok(updatedPurpose);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePurpose(@PathVariable Long id) {
        purposeService.deletePurpose(id);
        return ResponseEntity.noContent().build();
    }
}