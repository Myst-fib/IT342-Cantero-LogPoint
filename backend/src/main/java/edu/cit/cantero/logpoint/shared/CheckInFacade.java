package edu.cit.cantero.logpoint.shared;

import edu.cit.cantero.logpoint.visitor.VisitorDTO;
import edu.cit.cantero.logpoint.purpose.Purpose;
import edu.cit.cantero.logpoint.visitor.Visitor;
import edu.cit.cantero.logpoint.shared.User;
import edu.cit.cantero.logpoint.purpose.PurposeRepository;
import edu.cit.cantero.logpoint.visitLog.VisitLogRepository;
import edu.cit.cantero.logpoint.shared.VisitorRepository;
import edu.cit.cantero.logpoint.visitLog.VisitLog;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class CheckInFacade {

    @Autowired
    private VisitorRepository visitorRepository;

    @Autowired
    private PurposeRepository purposeRepository;

    @Autowired
    private VisitLogRepository visitLogRepository;

    public Visitor saveVisitor(VisitorDTO visitorDTO) {
        Visitor visitor = new Visitor();
        visitor.setVisitorName(visitorDTO.getVisitorName());
        visitor.setContactNo(visitorDTO.getContactNo());
        visitor.setHost(visitorDTO.getHost());
        visitor.setPurpose(visitorDTO.getPurpose());
        return visitorRepository.save(visitor);
    }

    public Purpose findOrCreatePurpose(String purposeName) {
        return purposeRepository.findByName(purposeName)
                .orElseGet(() -> {
                    Purpose newPurpose = new Purpose();
                    newPurpose.setName(purposeName);
                    return purposeRepository.save(newPurpose);
                });
    }

    public VisitLog createVisitLog(Visitor visitor, Purpose purpose, String hostName, User createdBy, LocalDateTime timeIn) {
        VisitLog visitLog = new VisitLog();
        visitLog.setVisitor(visitor);
        visitLog.setPurpose(purpose);
        visitLog.setHostName(hostName);
        visitLog.setCreatedBy(createdBy);
        // Use the user-provided timeIn if given, otherwise default to now
        visitLog.setTimeIn(timeIn != null ? timeIn : LocalDateTime.now());
        visitLog.setStatus("ACTIVE");
        return visitLogRepository.save(visitLog);
    }
}