package edu.cit.cantero.logpoint.service;

import edu.cit.cantero.logpoint.dto.PurposeDTO;
import edu.cit.cantero.logpoint.entity.Purpose;
import edu.cit.cantero.logpoint.repository.PurposeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PurposeService {

    @Autowired
    private PurposeRepository purposeRepository;

    public PurposeDTO createPurpose(PurposeDTO purposeDTO) {
        if (purposeRepository.existsByName(purposeDTO.getName())) {
            throw new RuntimeException("Purpose already exists");
        }

        Purpose purpose = new Purpose();
        purpose.setName(purposeDTO.getName());

        Purpose savedPurpose = purposeRepository.save(purpose);
        return convertToDTO(savedPurpose);
    }

    public List<PurposeDTO> getAllPurposes() {
        return purposeRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PurposeDTO getPurposeById(Long id) {
        Purpose purpose = purposeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purpose not found"));
        return convertToDTO(purpose);
    }

    public PurposeDTO updatePurpose(Long id, PurposeDTO purposeDTO) {
        Purpose purpose = purposeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purpose not found"));

        purpose.setName(purposeDTO.getName());

        Purpose updatedPurpose = purposeRepository.save(purpose);
        return convertToDTO(updatedPurpose);
    }

    public void deletePurpose(Long id) {
        purposeRepository.deleteById(id);
    }

    private PurposeDTO convertToDTO(Purpose purpose) {
        PurposeDTO dto = new PurposeDTO();
        dto.setId(purpose.getId());
        dto.setName(purpose.getName());
        dto.setUsageCount((long) purpose.getVisitLogs().size());
        
        return dto;
    }
}