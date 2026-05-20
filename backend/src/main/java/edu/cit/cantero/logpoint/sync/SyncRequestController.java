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
public class SyncRequestController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VisitLogService visitLogService;

    // guardId → { status, requestedBy, requestedByName, timestamp }
    private static final Map<Long, Map<String, Object>> pendingRequests = new ConcurrentHashMap<>();

    // guardId → true when a live sync is actively polling
    private static final Set<Long> activeSyncs = ConcurrentHashMap.newKeySet();

    // ── Helper: safely extract Long id from UserDTO ───────────────────────────
    // Prevents subtle Integer vs Long type-mismatch issues in ConcurrentHashMap lookups
    private Long resolveId(UserDTO user) {
        if (user == null) return null;
        Object raw = user.getId();
        if (raw instanceof Long)    return (Long) raw;
        if (raw instanceof Integer) return ((Integer) raw).longValue();
        return Long.valueOf(String.valueOf(raw));
    }

    // ── GET /api/sync/guards ──────────────────────────────────────────────────
    @GetMapping("/guards")
    public ResponseEntity<?> getGuards(HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");

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
            map.put("syncStatus", req != null ? req.get("status") : "NONE");
            map.put("liveSync",  activeSyncs.contains(g.getId()));
            return map;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // ── GET /api/sync/status/{guardId} ───────────────────────────────────────
    @GetMapping("/status/{guardId}")
    public ResponseEntity<?> getSyncStatus(@PathVariable Long guardId, HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");

        Map<String, Object> req = pendingRequests.get(guardId);
        if (req == null) return ResponseEntity.ok(Map.of("status", "NONE"));
        return ResponseEntity.ok(Map.of("status", req.get("status")));
    }

    // ── POST /api/sync/request/{guardId} ─────────────────────────────────────
    @PostMapping("/request/{guardId}")
    public ResponseEntity<?> requestSync(@PathVariable Long guardId, HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        if (!"office administrator".equalsIgnoreCase(user.getRole()))
            return ResponseEntity.status(403).body("Forbidden");

        Optional<User> guardOpt = userRepository.findById(guardId);
        if (guardOpt.isEmpty()) return ResponseEntity.status(404).body("Guard not found");
        if (!"security guard".equalsIgnoreCase(guardOpt.get().getRole()))
            return ResponseEntity.status(400).body("User is not a security guard");

        Map<String, Object> req = new HashMap<>();
        req.put("status",          "PENDING");
        req.put("requestedBy",     user.getEmail());
        req.put("requestedByName", user.getFirstName() + " " + user.getLastName());
        req.put("timestamp",       System.currentTimeMillis());
        pendingRequests.put(guardId, req);

        System.out.println("[REQUEST] Stored pending for guardId=" + guardId
            + " | map keys now=" + pendingRequests.keySet());

        return ResponseEntity.ok(Map.of("message", "Sync request sent", "guardId", guardId));
    }

    // ── GET /api/sync/my-request ──────────────────────────────────────────────
    @GetMapping("/my-request")
    public ResponseEntity<?> getMyRequest(HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");

        Long guardId = resolveId(user);

        System.out.println("[MY-REQUEST] guardId=" + guardId
            + " | pendingRequests keys=" + pendingRequests.keySet());

        Map<String, Object> req = pendingRequests.get(guardId);
        if (req == null) return ResponseEntity.ok(Map.of("status", "NONE"));
        return ResponseEntity.ok(req);
    }

    // ── POST /api/sync/respond ────────────────────────────────────────────────
    @PostMapping("/respond")
    public ResponseEntity<?> respond(@RequestBody Map<String, String> body, HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");

        String decision = body.get("decision");
        if (decision == null || decision.isBlank())
            return ResponseEntity.badRequest().body("Missing decision");

        Long guardId = resolveId(user);

        System.out.println("[RESPOND] guardId=" + guardId
            + " | decision=" + decision
            + " | pendingRequests keys=" + pendingRequests.keySet());

        Map<String, Object> req = pendingRequests.get(guardId);
        if (req == null) {
            System.out.println("[RESPOND] ERROR — no pending request found for guardId=" + guardId);
            return ResponseEntity.status(404).body("No pending request found for this guard");
        }

        req.put("status", decision.toUpperCase());
        pendingRequests.put(guardId, req);

        System.out.println("[RESPOND] Updated status to " + decision.toUpperCase()
            + " for guardId=" + guardId);

        return ResponseEntity.ok(Map.of("message", "Response recorded", "status", decision));
    }

    // ── GET /api/sync/logs/{guardId} ─────────────────────────────────────────
    @GetMapping("/logs/{guardId}")
    public ResponseEntity<?> getGuardLogs(@PathVariable Long guardId, HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        if (!"office administrator".equalsIgnoreCase(user.getRole()))
            return ResponseEntity.status(403).body("Forbidden");

        Map<String, Object> req = pendingRequests.get(guardId);
        if (req == null || !"ACCEPTED".equals(req.get("status")))
            return ResponseEntity.status(403).body("Guard has not accepted the sync request");

        Optional<User> guardOpt = userRepository.findById(guardId);
        if (guardOpt.isEmpty()) return ResponseEntity.status(404).body("Guard not found");

        List<VisitLogDTO> logs = visitLogService.getVisitLogsByUser(guardOpt.get().getEmail());
        return ResponseEntity.ok(logs);
    }

    // ── GET /api/sync/live/{guardId} ─────────────────────────────────────────
    @GetMapping("/live/{guardId}")
    public ResponseEntity<?> getLiveLogs(@PathVariable Long guardId, HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        if (!"office administrator".equalsIgnoreCase(user.getRole()))
            return ResponseEntity.status(403).body("Forbidden");

        if (!activeSyncs.contains(guardId))
            return ResponseEntity.status(404).body("No active sync for this guard");

        Optional<User> guardOpt = userRepository.findById(guardId);
        if (guardOpt.isEmpty()) return ResponseEntity.status(404).body("Guard not found");

        List<VisitLogDTO> logs = visitLogService.getVisitLogsByUser(guardOpt.get().getEmail());
        return ResponseEntity.ok(logs);
    }

    // ── POST /api/sync/activate/{guardId} ────────────────────────────────────
    @PostMapping("/activate/{guardId}")
    public ResponseEntity<?> activateSync(@PathVariable Long guardId, HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        if (!"office administrator".equalsIgnoreCase(user.getRole()))
            return ResponseEntity.status(403).body("Forbidden");

        activeSyncs.add(guardId);
        pendingRequests.remove(guardId);

        System.out.println("[ACTIVATE] Live sync started for guardId=" + guardId);

        return ResponseEntity.ok(Map.of("message", "Sync activated", "guardId", guardId));
    }

    // ── POST /api/sync/cancel/{guardId} ──────────────────────────────────────
    @PostMapping("/cancel/{guardId}")
    public ResponseEntity<?> cancelSync(@PathVariable Long guardId, HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        if (!"office administrator".equalsIgnoreCase(user.getRole()))
            return ResponseEntity.status(403).body("Forbidden");

        activeSyncs.remove(guardId);
        pendingRequests.remove(guardId);

        System.out.println("[CANCEL] Sync cancelled for guardId=" + guardId);

        return ResponseEntity.ok(Map.of(
            "message", "Sync cancelled – live feed stopped. Existing snapshot retained.",
            "guardId", guardId
        ));
    }

    // ── POST /api/sync/clear/{guardId} ───────────────────────────────────────
    @PostMapping("/clear/{guardId}")
    public ResponseEntity<?> clearRequest(@PathVariable Long guardId, HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        if (!"office administrator".equalsIgnoreCase(user.getRole()))
            return ResponseEntity.status(403).body("Forbidden");

        pendingRequests.remove(guardId);
        return ResponseEntity.ok(Map.of("message", "Sync request cleared"));
    }
}