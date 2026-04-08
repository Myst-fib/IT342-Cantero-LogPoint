package edu.cit.cantero.logpoint.service;

import edu.cit.cantero.logpoint.dto.VisitorDTO;
import edu.cit.cantero.logpoint.entity.Purpose;
import edu.cit.cantero.logpoint.entity.Visitor;
import edu.cit.cantero.logpoint.entity.User;
import edu.cit.cantero.logpoint.facade.CheckInFacade;
import edu.cit.cantero.logpoint.repository.UserRepository;
import edu.cit.cantero.logpoint.repository.VisitorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VisitorService {

    @Autowired
    private VisitorRepository visitorRepository;

    @Autowired
    private CheckInFacade checkInFacade;

    @Autowired
    private UserRepository userRepository;

    public VisitorDTO createVisitor(VisitorDTO visitorDTO, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Visitor savedVisitor = checkInFacade.saveVisitor(visitorDTO);
        Purpose purpose = checkInFacade.findOrCreatePurpose(visitorDTO.getPurpose());
        checkInFacade.createVisitLog(savedVisitor, purpose, visitorDTO.getHost(), user);
        return convertToDTO(savedVisitor);
    }

    public List<VisitorDTO> getAllVisitors(String userEmail) {
        return visitorRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public VisitorDTO getVisitorById(Long id, String userEmail) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visitor not found with id: " + id));
        return convertToDTO(visitor);
    }

    public List<VisitorDTO> searchVisitors(String searchTerm, String userEmail) {
        return visitorRepository.searchVisitors(searchTerm)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public VisitorDTO updateVisitor(Long id, VisitorDTO visitorDTO, String userEmail) {
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

    public void deleteVisitor(Long id, String userEmail) {
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