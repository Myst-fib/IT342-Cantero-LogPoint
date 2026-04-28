package edu.cit.cantero.logpoint.shared;

import edu.cit.cantero.logpoint.shared.RefreshToken;
import edu.cit.cantero.logpoint.shared.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
    void deleteByToken(String token);
    long deleteByExpiryDateBefore(java.time.LocalDateTime now);
}