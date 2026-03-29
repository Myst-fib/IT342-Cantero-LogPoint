package edu.cit.cantero.logpoint.repository;

import edu.cit.cantero.logpoint.entity.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VisitorRepository extends JpaRepository<Visitor, Long> {
    
    // Get all visitors ordered by creation date (newest first)
    List<Visitor> findAllByOrderByCreatedAtDesc();
    
    // Search visitors by name, host, or department
    @Query("SELECT v FROM Visitor v WHERE v.visitorName LIKE %:search% OR v.host LIKE %:search% OR v.department LIKE %:search%")
    List<Visitor> searchVisitors(@Param("search") String search);
    
    // Optional: Find by department if needed
    List<Visitor> findByDepartment(String department);
    
    // Optional: Find by purpose if needed
    List<Visitor> findByPurpose(String purpose);
}