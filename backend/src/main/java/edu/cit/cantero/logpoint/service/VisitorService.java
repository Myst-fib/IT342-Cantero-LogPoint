package edu.cit.cantero.logpoint.service;

import edu.cit.cantero.logpoint.dto.VisitorDTO;
import edu.cit.cantero.logpoint.entity.Purpose;
import edu.cit.cantero.logpoint.entity.VisitLog;
import edu.cit.cantero.logpoint.entity.Visitor;
import edu.cit.cantero.logpoint.repository.PurposeRepository;
import edu.cit.cantero.logpoint.repository.VisitLogRepository;
import edu.cit.cantero.logpoint.repository.VisitorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class VisitorService {

    @Autowired
    private VisitorRepository visitorRepository;

    @Autowired
    private VisitLogRepository visitLogRepository;      // ADD THIS

    @Autowired
    private PurposeRepository purposeRepository;        // ADD THIS

    public VisitorDTO createVisitor(VisitorDTO visitorDTO) {
        // 1. Create and save Visitor
        Visitor visitor = new Visitor();
        visitor.setVisitorName(visitorDTO.getVisitorName());
        visitor.setContactNo(visitorDTO.getContactNo());
        visitor.setHost(visitorDTO.getHost());
        visitor.setPurpose(visitorDTO.getPurpose());
        visitor.setDepartment(visitorDTO.getDepartment());

        Visitor savedVisitor = visitorRepository.save(visitor);

        // 2. Find or create a Purpose matching the string
        String purposeName = visitorDTO.getPurpose();
        Purpose purpose = purposeRepository.findByName(purposeName)
                .orElseGet(() -> {
                    Purpose newPurpose = new Purpose();
                    newPurpose.setName(purposeName);
                    return purposeRepository.save(newPurpose);
                });

        // 3. Auto-create a VisitLog
        VisitLog visitLog = new VisitLog();
        visitLog.setVisitor(savedVisitor);
        visitLog.setPurpose(purpose);
        visitLog.setHostName(visitorDTO.getHost());
        visitLog.setTimeIn(LocalDateTime.now());
        visitLog.setStatus("ACTIVE");
        visitLog.setQrCode(UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        // createdBy is null here since VisitorController has no Authentication —
        // see note below if you want to wire it in

        visitLogRepository.save(visitLog);

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