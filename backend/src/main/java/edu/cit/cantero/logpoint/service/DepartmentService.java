package edu.cit.cantero.logpoint.service;

import edu.cit.cantero.logpoint.dto.DepartmentDTO;
import edu.cit.cantero.logpoint.entity.Department;
import edu.cit.cantero.logpoint.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    public DepartmentDTO createDepartment(DepartmentDTO departmentDTO) {
        if (departmentRepository.existsByName(departmentDTO.getName())) {
            throw new RuntimeException("Department already exists");
        }

        Department department = new Department();
        department.setName(departmentDTO.getName());
        department.setDescription(departmentDTO.getDescription());

        Department savedDepartment = departmentRepository.save(department);
        return convertToDTO(savedDepartment);
    }

    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public DepartmentDTO getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));
        return convertToDTO(department);
    }

    public DepartmentDTO updateDepartment(Long id, DepartmentDTO departmentDTO) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        department.setName(departmentDTO.getName());
        department.setDescription(departmentDTO.getDescription());

        Department updatedDepartment = departmentRepository.save(department);
        return convertToDTO(updatedDepartment);
    }

    public void deleteDepartment(Long id) {
        departmentRepository.deleteById(id);
    }

    private DepartmentDTO convertToDTO(Department department) {
        DepartmentDTO dto = new DepartmentDTO();
        dto.setId(department.getId());
        dto.setName(department.getName());
        dto.setDescription(department.getDescription());
        dto.setVisitorCount((long) department.getVisitors().size());
        
        return dto;
    }
}