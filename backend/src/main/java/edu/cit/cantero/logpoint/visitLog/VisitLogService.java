package edu.cit.cantero.logpoint.visitLog;

import edu.cit.cantero.logpoint.email.EmailService;
import edu.cit.cantero.logpoint.purpose.Purpose;
import edu.cit.cantero.logpoint.shared.User;
import edu.cit.cantero.logpoint.visitor.Visitor;
import edu.cit.cantero.logpoint.purpose.PurposeRepository;
import edu.cit.cantero.logpoint.shared.UserRepository;
import edu.cit.cantero.logpoint.shared.VisitorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VisitLogService {

    @Autowired private VisitLogRepository visitLogRepository;
    @Autowired private VisitorRepository visitorRepository;
    @Autowired private PurposeRepository purposeRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private EmailService emailService;

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

        VisitLog savedVisitLog = visitLogRepository.save(visitLog);

        // Send check-in notification email to the staff member who logged the visit
        String staffName = user.getFirstName() + " " + user.getLastName();
        emailService.sendVisitorCheckInNotification(
                user.getEmail(),
                staffName,
                visitor.getVisitorName(),
                purpose.getName(),
                visitLogDTO.getHostName(),
                savedVisitLog.getTimeIn()
        );

        return convertToDTO(savedVisitLog);
    }

    public VisitLogDTO checkOut(Long id, String userEmail) {
        VisitLog visitLog = visitLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visit log not found"));
        visitLog.setTimeOut(LocalDateTime.now());
        visitLog.setStatus("COMPLETED");
        return convertToDTO(visitLogRepository.save(visitLog));
    }

    public List<VisitLogDTO> getVisitLogsByUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return visitLogRepository.findByCreatedBy_IdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<VisitLogDTO> getActiveVisitsByUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return visitLogRepository.findByCreatedBy_IdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(v -> "ACTIVE".equals(v.getStatus()))
                .map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<VisitLogDTO> getVisitLogsByVisitor(Long visitorId) {
        Visitor visitor = visitorRepository.findById(visitorId)
                .orElseThrow(() -> new RuntimeException("Visitor not found"));
        return visitLogRepository.findByVisitor(visitor)
                .stream()
                .filter(log -> log.getCreatedBy() != null)
                .map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<VisitLogDTO> getVisitLogsBetweenDates(LocalDateTime start, LocalDateTime end) {
        return visitLogRepository.findVisitLogsBetweenDates(start, end)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<VisitLogDTO> getAllVisitLogs() {
        return visitLogRepository.findAll()
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public VisitLogDTO updateVisitLog(Long id, UpdateVisitLogRequest updateRequest, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        VisitLog visitLog = visitLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visit log not found with id: " + id));

        if (!visitLog.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("You don't have permission to edit this record");
        }

        Visitor visitor = visitLog.getVisitor();
        if (visitor != null) {
            visitor.setVisitorName(updateRequest.getVisitorName());
            visitor.setContactNo(updateRequest.getContactNo());
            visitorRepository.save(visitor);
        } else {
            Visitor newVisitor = new Visitor();
            newVisitor.setVisitorName(updateRequest.getVisitorName());
            newVisitor.setContactNo(updateRequest.getContactNo());
            visitLog.setVisitor(visitorRepository.save(newVisitor));
        }

        Purpose purpose = purposeRepository.findByName(updateRequest.getPurpose())
                .orElseGet(() -> {
                    Purpose p = new Purpose();
                    p.setName(updateRequest.getPurpose());
                    return purposeRepository.save(p);
                });
        visitLog.setPurpose(purpose);
        visitLog.setHostName(updateRequest.getHost());

        return convertToDTO(visitLogRepository.save(visitLog));
    }

    public void deleteVisitLog(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        VisitLog visitLog = visitLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visit log not found"));
        if (!visitLog.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("You don't have permission to delete this record");
        }
        visitLogRepository.delete(visitLog);
    }

    private VisitLogDTO convertToDTO(VisitLog visitLog) {
        VisitLogDTO dto = new VisitLogDTO();
        dto.setId(visitLog.getId());
        dto.setVisitorId(visitLog.getVisitor().getId());
        dto.setVisitorName(visitLog.getVisitor().getVisitorName());
        dto.setContactNo(visitLog.getVisitor().getContactNo());
        dto.setPurposeId(visitLog.getPurpose().getId());
        dto.setPurposeName(visitLog.getPurpose().getName());
        dto.setTimeIn(visitLog.getTimeIn());
        dto.setTimeOut(visitLog.getTimeOut());
        dto.setStatus(visitLog.getStatus());
        dto.setHostName(visitLog.getHostName());

        if (visitLog.getCreatedBy() != null) {
            dto.setCreatedById(visitLog.getCreatedBy().getId());
            String name = visitLog.getCreatedBy().getFirstName() != null
                    ? visitLog.getCreatedBy().getFirstName() + " " + visitLog.getCreatedBy().getLastName()
                    : visitLog.getCreatedBy().getEmail();
            dto.setCreatedByName(name);
        }
        return dto;
    }
}