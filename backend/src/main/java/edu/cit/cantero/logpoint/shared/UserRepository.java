package edu.cit.cantero.logpoint.shared;

import edu.cit.cantero.logpoint.shared.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
