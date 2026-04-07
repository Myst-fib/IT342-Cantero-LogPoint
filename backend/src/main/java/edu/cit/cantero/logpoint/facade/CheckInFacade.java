package edu.cit.cantero.logpoint.facade;

import edu.cit.cantero.logpoint.dto.VisitorDTO;
import edu.cit.cantero.logpoint.entity.Purpose;
import edu.cit.cantero.logpoint.entity.VisitLog;
import edu.cit.cantero.logpoint.entity.Visitor;
import edu.cit.cantero.logpoint.repository.PurposeRepository;
import edu.cit.cantero.logpoint.repository.VisitLogRepository;
import edu.cit.cantero.logpoint.repository.VisitorRepository;
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
        visitor.setDepartment(visitorDTO.getDepartment());
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

    public VisitLog createVisitLog(Visitor visitor, Purpose purpose, String hostName) {
        VisitLog visitLog = new VisitLog();
        visitLog.setVisitor(visitor);
        visitLog.setPurpose(purpose);
        visitLog.setHostName(hostName);
        visitLog.setTimeIn(LocalDateTime.now());
        visitLog.setStatus("ACTIVE");
        visitLog.setQrCode(UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        return visitLogRepository.save(visitLog);
    }
}