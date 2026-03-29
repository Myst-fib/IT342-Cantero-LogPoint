package edu.cit.cantero.logpoint.service;

import edu.cit.cantero.logpoint.dto.VisitLogDTO;
import edu.cit.cantero.logpoint.entity.Purpose;
import edu.cit.cantero.logpoint.entity.User;
import edu.cit.cantero.logpoint.entity.VisitLog;
import edu.cit.cantero.logpoint.entity.Visitor;
import edu.cit.cantero.logpoint.repository.PurposeRepository;
import edu.cit.cantero.logpoint.repository.UserRepository;
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
public class VisitLogService {

    @Autowired
    private VisitLogRepository visitLogRepository;

    @Autowired
    private VisitorRepository visitorRepository;

    @Autowired
    private PurposeRepository purposeRepository;

    @Autowired
    private UserRepository userRepository;

    public VisitLogDTO checkIn(VisitLogDTO visitLogDTO, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Visitor visitor = visitorRepository.findById(visitLogDTO.getVisitorId())
                .orElseThrow(() -> new RuntimeException("Visitor not found"));

        Purpose purpose = purposeRepository.findById(visitLogDTO.getPurposeId())
                .orElseThrow(() -> new RuntimeException("Purpose not found"));

        VisitLog visitLog = new VisitLog();
        visitLog.setVisitor(visitor);
        visitLog.setPurpose(purpose);
        visitLog.setCreatedBy(user);
        visitLog.setTimeIn(LocalDateTime.now());
        visitLog.setStatus("ACTIVE");
        visitLog.setHostName(visitLogDTO.getHostName());
        visitLog.setNotes(visitLogDTO.getNotes());
        visitLog.setQrCode(generateQRCode());

        VisitLog savedVisitLog = visitLogRepository.save(visitLog);
        return convertToDTO(savedVisitLog);
    }

    public VisitLogDTO checkOut(Long id) {
        VisitLog visitLog = visitLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visit log not found"));

        visitLog.setTimeOut(LocalDateTime.now());
        visitLog.setStatus("COMPLETED");

        VisitLog updatedVisitLog = visitLogRepository.save(visitLog);
        return convertToDTO(updatedVisitLog);
    }

    public List<VisitLogDTO> getVisitLogsByUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return visitLogRepository.findByCreatedBy_Id(user.getId())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<VisitLogDTO> getActiveVisitsByUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return visitLogRepository.findByCreatedBy_Id(user.getId())
                .stream()
                .filter(visit -> "ACTIVE".equals(visit.getStatus()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<VisitLogDTO> getVisitLogsByVisitor(Long visitorId) {
        Visitor visitor = visitorRepository.findById(visitorId)
                .orElseThrow(() -> new RuntimeException("Visitor not found"));

        return visitLogRepository.findByVisitor(visitor)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<VisitLogDTO> getVisitLogsBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        return visitLogRepository.findVisitLogsBetweenDates(startDate, endDate)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private String generateQRCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private VisitLogDTO convertToDTO(VisitLog visitLog) {
        VisitLogDTO dto = new VisitLogDTO();
        dto.setId(visitLog.getId());
        dto.setVisitorId(visitLog.getVisitor().getId());
        dto.setVisitorName(visitLog.getVisitor().getFullName()); // Now this works
        dto.setPurposeId(visitLog.getPurpose().getId());
        dto.setPurposeName(visitLog.getPurpose().getName());
        dto.setTimeIn(visitLog.getTimeIn());
        dto.setTimeOut(visitLog.getTimeOut());
        dto.setStatus(visitLog.getStatus());
        dto.setHostName(visitLog.getHostName());
        dto.setNotes(visitLog.getNotes());
        dto.setQrCode(visitLog.getQrCode());
        dto.setCreatedById(visitLog.getCreatedBy().getId());
        
        // Fix: Check if first name and last name exist, otherwise use email
        String createdByName;
        if (visitLog.getCreatedBy().getFirstName() != null && visitLog.getCreatedBy().getLastName() != null) {
            createdByName = visitLog.getCreatedBy().getFirstName() + " " + visitLog.getCreatedBy().getLastName();
        } else {
            createdByName = visitLog.getCreatedBy().getEmail();
        }
        dto.setCreatedByName(createdByName);
        
        return dto;
    }
}