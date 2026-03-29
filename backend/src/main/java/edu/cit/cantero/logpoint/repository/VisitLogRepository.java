package edu.cit.cantero.logpoint.repository;

import edu.cit.cantero.logpoint.entity.VisitLog;
import edu.cit.cantero.logpoint.entity.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VisitLogRepository extends JpaRepository<VisitLog, Long> {
    List<VisitLog> findByVisitor(Visitor visitor);
    List<VisitLog> findByCreatedBy_Id(Long userId);
    List<VisitLog> findByStatus(String status);
    
    @Query("SELECT v FROM VisitLog v WHERE v.timeIn BETWEEN :startDate AND :endDate")
    List<VisitLog> findVisitLogsBetweenDates(@Param("startDate") LocalDateTime startDate, 
                                             @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT v FROM VisitLog v WHERE v.visitor.id = :visitorId AND v.status = 'ACTIVE'")
    List<VisitLog> findActiveVisitsByVisitor(@Param("visitorId") Long visitorId);
    
    @Query("SELECT COUNT(v) FROM VisitLog v WHERE v.createdBy.id = :userId AND v.status = 'ACTIVE'")
    long countActiveVisitsByUser(@Param("userId") Long userId);
}