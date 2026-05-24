package edu.cit.cantero.logpoint.sync;

import edu.cit.cantero.logpoint.shared.User;
import edu.cit.cantero.logpoint.shared.UserRepository;
import edu.cit.cantero.logpoint.visitLog.VisitLogService;
import edu.cit.cantero.logpoint.auth.UserDTO;
import edu.cit.cantero.logpoint.visitLog.VisitLogDTO;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/sync")
// Allow both web (localhost:3000) and mobile (no origin / Android emulator)
public class SyncRequestController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VisitLogService visitLogService;

    private static final Map<Long, Map<String, Object>> pendingRequests = new ConcurrentHashMap<>();
    private static final Map<Long, Long> activeSyncs = new ConcurrentHashMap<>();

    private Long resolveId(UserDTO user) {
        if (user == null) return null;
        Object raw = user.getId();
        if (raw instanceof Long)    return (Long) raw;
        if (raw instanceof Integer) return ((Integer) raw).longValue();
        return Long.valueOf(String.valueOf(raw));
    }

    private UserDTO resolveUser(HttpSession session, String headerEmail, String headerRole) {
        UserDTO sessionUser = resolveUser(session, headerEmail, headerRole);
        if (sessionUser != null) return sessionUser;
        if (headerEmail != null && !headerEmail.isBlank()) {
            // Reconstruct a minimal UserDTO from headers for cross-domain requests
            return edu.cit.cantero.logpoint.shared.UserRepository.class.cast(null) == null
                ? buildUserFromHeader(headerEmail, headerRole)
                : null;
        }
        return null;
    }

    private UserDTO buildUserFromHeader(String email, String role) {
        try {
            Optional<edu.cit.cantero.logpoint.shared.User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                return new UserDTO(userOpt.get());
            }
        } catch (Exception ignored) {}
        return null;
    }

    @GetMapping("/guards")
    public ResponseEntity<?> getGuards(HttpSession session, @RequestHeader(value = "X-User-Email", required = false) String headerEmail, @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        UserDTO user = resolveUser(session, headerEmail, headerRole);
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");

        Long adminId = resolveId(user);

        List<User> guards = userRepository.findAll().stream()
                .filter(u -> "security guard".equalsIgnoreCase(u.getRole()))
                .toList();

        List<Map<String, Object>> result = guards.stream().map(g -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id",        g.getId());
            map.put("firstName", g.getFirstName());
            map.put("lastName",  g.getLastName());
            map.put("email",     g.getEmail());
            map.put("role",      g.getRole());
            map.put("status",    g.getStatus());

            Map<String, Object> req = pendingRequests.get(g.getId());
            if (req != null) {
                Object reqAdminId = req.get("requestedBy");
                boolean isMine = adminId != null && adminId.toString().equals(String.valueOf(reqAdminId));
                map.put("syncStatus", isMine ? req.get("status") : "NONE");
            } else {
                map.put("syncStatus", "NONE");
            }

            Long activatedBy = activeSyncs.get(g.getId());
            boolean isMyLiveSync = adminId != null && adminId.equals(activatedBy);
            map.put("liveSync", isMyLiveSync);
            return map;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/status/{guardId}")
    public ResponseEntity<?> getSyncStatus(@PathVariable Long guardId, HttpSession session, @RequestHeader(value = "X-User-Email", required = false) String headerEmail, @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        UserDTO user = resolveUser(session, headerEmail, headerRole);
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");

        Long adminId = resolveId(user);

        Map<String, Object> req = pendingRequests.get(guardId);
        if (req == null) return ResponseEntity.ok(Map.of("status", "NONE"));

        Object reqAdminId = req.get("requestedBy");
        if (adminId == null || !adminId.toString().equals(String.valueOf(reqAdminId))) {
            return ResponseEntity.ok(Map.of("status", "NONE"));
        }

        return ResponseEntity.ok(Map.of("status", req.get("status")));
    }

    @PostMapping("/request/{guardId}")
    public ResponseEntity<?> requestSync(@PathVariable Long guardId, HttpSession session, @RequestHeader(value = "X-User-Email", required = false) String headerEmail, @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        UserDTO user = resolveUser(session, headerEmail, headerRole);
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        if (!"office administrator".equalsIgnoreCase(user.getRole()))
            return ResponseEntity.status(403).body("Forbidden");

        Long adminId = resolveId(user);

        Optional<User> guardOpt = userRepository.findById(guardId);
        if (guardOpt.isEmpty()) return ResponseEntity.status(404).body("Guard not found");
        if (!"security guard".equalsIgnoreCase(guardOpt.get().getRole()))
            return ResponseEntity.status(400).body("User is not a security guard");

        Map<String, Object> req = new HashMap<>();
        req.put("status",           "PENDING");
        req.put("requestedBy",      adminId);
        req.put("requestedByEmail", user.getEmail());
        req.put("requestedByName",  user.getFirstName() + " " + user.getLastName());
        req.put("timestamp",        System.currentTimeMillis());
        pendingRequests.put(guardId, req);

        System.out.println("[REQUEST] Admin=" + adminId + " requested sync with guardId=" + guardId);
        return ResponseEntity.ok(Map.of("message", "Sync request sent", "guardId", guardId));
    }

    @GetMapping("/my-request")
    public ResponseEntity<?> getMyRequest(HttpSession session, @RequestHeader(value = "X-User-Email", required = false) String headerEmail, @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        UserDTO user = resolveUser(session, headerEmail, headerRole);
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");

        Long guardId = resolveId(user);
        Map<String, Object> req = pendingRequests.get(guardId);
        if (req == null) return ResponseEntity.ok(Map.of("status", "NONE"));
        return ResponseEntity.ok(req);
    }

    @PostMapping("/respond")
    public ResponseEntity<?> respond(@RequestBody Map<String, String> body, HttpSession session, @RequestHeader(value = "X-User-Email", required = false) String headerEmail, @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        UserDTO user = resolveUser(session, headerEmail, headerRole);
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");

        String decision = body.get("decision");
        if (decision == null || decision.isBlank())
            return ResponseEntity.badRequest().body("Missing decision");

        Long guardId = resolveId(user);
        Map<String, Object> req = pendingRequests.get(guardId);
        if (req == null) {
            System.out.println("[RESPOND] ERROR — no pending request found for guardId=" + guardId);
            return ResponseEntity.status(404).body("No pending request found for this guard");
        }

        req.put("status", decision.toUpperCase());
        pendingRequests.put(guardId, req);

        System.out.println("[RESPOND] guardId=" + guardId + " updated to " + decision.toUpperCase());
        return ResponseEntity.ok(Map.of("message", "Response recorded", "status", decision));
    }

    @GetMapping("/logs/{guardId}")
    public ResponseEntity<?> getGuardLogs(@PathVariable Long guardId, HttpSession session, @RequestHeader(value = "X-User-Email", required = false) String headerEmail, @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        UserDTO user = resolveUser(session, headerEmail, headerRole);
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        if (!"office administrator".equalsIgnoreCase(user.getRole()))
            return ResponseEntity.status(403).body("Forbidden");

        Long adminId = resolveId(user);
        Map<String, Object> req = pendingRequests.get(guardId);
        if (req == null) return ResponseEntity.status(403).body("No pending request for this guard");

        Object reqAdminId = req.get("requestedBy");
        if (adminId == null || !adminId.toString().equals(String.valueOf(reqAdminId)))
            return ResponseEntity.status(403).body("You did not initiate this sync request");

        if (!"ACCEPTED".equals(req.get("status")))
            return ResponseEntity.status(403).body("Guard has not accepted the sync request");

        Optional<User> guardOpt = userRepository.findById(guardId);
        if (guardOpt.isEmpty()) return ResponseEntity.status(404).body("Guard not found");

        List<VisitLogDTO> logs = visitLogService.getVisitLogsByUser(guardOpt.get().getEmail());
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/live/{guardId}")
    public ResponseEntity<?> getLiveLogs(@PathVariable Long guardId, HttpSession session, @RequestHeader(value = "X-User-Email", required = false) String headerEmail, @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        UserDTO user = resolveUser(session, headerEmail, headerRole);
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        if (!"office administrator".equalsIgnoreCase(user.getRole()))
            return ResponseEntity.status(403).body("Forbidden");

        Long adminId = resolveId(user);
        Long activatedBy = activeSyncs.get(guardId);

        if (activatedBy == null) return ResponseEntity.status(404).body("No active sync for this guard");
        if (!activatedBy.equals(adminId))
            return ResponseEntity.status(403).body("This sync was not initiated by you");

        Optional<User> guardOpt = userRepository.findById(guardId);
        if (guardOpt.isEmpty()) return ResponseEntity.status(404).body("Guard not found");

        List<VisitLogDTO> logs = visitLogService.getVisitLogsByUser(guardOpt.get().getEmail());
        return ResponseEntity.ok(logs);
    }

    @PostMapping("/activate/{guardId}")
    public ResponseEntity<?> activateSync(@PathVariable Long guardId, HttpSession session, @RequestHeader(value = "X-User-Email", required = false) String headerEmail, @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        UserDTO user = resolveUser(session, headerEmail, headerRole);
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        if (!"office administrator".equalsIgnoreCase(user.getRole()))
            return ResponseEntity.status(403).body("Forbidden");

        Long adminId = resolveId(user);
        activeSyncs.put(guardId, adminId);
        pendingRequests.remove(guardId);

        System.out.println("[ACTIVATE] Admin=" + adminId + " live sync started for guardId=" + guardId);
        return ResponseEntity.ok(Map.of("message", "Sync activated", "guardId", guardId));
    }

    @PostMapping("/cancel/{guardId}")
    public ResponseEntity<?> cancelSync(@PathVariable Long guardId, HttpSession session, @RequestHeader(value = "X-User-Email", required = false) String headerEmail, @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        UserDTO user = resolveUser(session, headerEmail, headerRole);
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        if (!"office administrator".equalsIgnoreCase(user.getRole()))
            return ResponseEntity.status(403).body("Forbidden");

        Long adminId = resolveId(user);
        Long activatedBy = activeSyncs.get(guardId);
        if (activatedBy != null && !activatedBy.equals(adminId))
            return ResponseEntity.status(403).body("You did not initiate this sync");

        activeSyncs.remove(guardId);
        pendingRequests.remove(guardId);

        System.out.println("[CANCEL] Admin=" + adminId + " cancelled sync for guardId=" + guardId);
        return ResponseEntity.ok(Map.of(
            "message", "Sync cancelled – live feed stopped. Existing snapshot retained.",
            "guardId", guardId
        ));
    }

    @PostMapping("/clear/{guardId}")
    public ResponseEntity<?> clearRequest(@PathVariable Long guardId, HttpSession session, @RequestHeader(value = "X-User-Email", required = false) String headerEmail, @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        UserDTO user = resolveUser(session, headerEmail, headerRole);
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        if (!"office administrator".equalsIgnoreCase(user.getRole()))
            return ResponseEntity.status(403).body("Forbidden");

        pendingRequests.remove(guardId);
        return ResponseEntity.ok(Map.of("message", "Sync request cleared"));
    }
}