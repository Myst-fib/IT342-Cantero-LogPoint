package edu.cit.cantero.logpoint.repository;

import edu.cit.cantero.logpoint.entity.Purpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PurposeRepository extends JpaRepository<Purpose, Long> {
    Optional<Purpose> findByName(String name);
    boolean existsByName(String name);
}

