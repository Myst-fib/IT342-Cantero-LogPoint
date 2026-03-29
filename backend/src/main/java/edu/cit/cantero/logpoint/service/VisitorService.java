package edu.cit.cantero.logpoint.service;

import edu.cit.cantero.logpoint.dto.VisitorDTO;
import edu.cit.cantero.logpoint.entity.Visitor;
import edu.cit.cantero.logpoint.repository.VisitorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VisitorService {

    @Autowired
    private VisitorRepository visitorRepository;

    public VisitorDTO createVisitor(VisitorDTO visitorDTO) {
        Visitor visitor = new Visitor();
        visitor.setVisitorName(visitorDTO.getVisitorName());
        visitor.setContactNo(visitorDTO.getContactNo());
        visitor.setHost(visitorDTO.getHost());
        visitor.setPurpose(visitorDTO.getPurpose());
        visitor.setDepartment(visitorDTO.getDepartment());
        
        // Set timeIn as current time
        visitorDTO.setTimeIn(LocalDateTime.now());
        
        Visitor savedVisitor = visitorRepository.save(visitor);
        return convertToDTO(savedVisitor);
    }

    public List<VisitorDTO> getAllVisitors() {
        return visitorRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public VisitorDTO getVisitorById(Long id) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visitor not found with id: " + id));
        return convertToDTO(visitor);
    }

    public List<VisitorDTO> searchVisitors(String searchTerm) {
        return visitorRepository.searchVisitors(searchTerm)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public VisitorDTO updateVisitor(Long id, VisitorDTO visitorDTO) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visitor not found with id: " + id));
        
        visitor.setVisitorName(visitorDTO.getVisitorName());
        visitor.setContactNo(visitorDTO.getContactNo());
        visitor.setHost(visitorDTO.getHost());
        visitor.setPurpose(visitorDTO.getPurpose());
        visitor.setDepartment(visitorDTO.getDepartment());
        
        Visitor updatedVisitor = visitorRepository.save(visitor);
        return convertToDTO(updatedVisitor);
    }

    public void deleteVisitor(Long id) {
        if (!visitorRepository.existsById(id)) {
            throw new RuntimeException("Visitor not found with id: " + id);
        }
        visitorRepository.deleteById(id);
    }

    private VisitorDTO convertToDTO(Visitor visitor) {
        VisitorDTO dto = new VisitorDTO();
        dto.setId(visitor.getId());
        dto.setVisitorName(visitor.getVisitorName());
        dto.setContactNo(visitor.getContactNo());
        dto.setHost(visitor.getHost());
        dto.setPurpose(visitor.getPurpose());
        dto.setDepartment(visitor.getDepartment());
        dto.setCreatedAt(visitor.getCreatedAt());
        dto.setUpdatedAt(visitor.getUpdatedAt());
        return dto;
    }
}