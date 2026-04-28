package edu.cit.cantero.logpoint.purpose;

import edu.cit.cantero.logpoint.purpose.Purpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PurposeRepository extends JpaRepository<Purpose, Long> {
    Optional<Purpose> findByName(String name);
    boolean existsByName(String name);
}

