package com.proyectodw.codifica_con_guali.controller;

import com.proyectodw.codifica_con_guali.model.AdminUser;
import com.proyectodw.codifica_con_guali.model.GameStat;
import com.proyectodw.codifica_con_guali.repository.AdminUserRepository;
import com.proyectodw.codifica_con_guali.repository.GameStatRepository;
import com.proyectodw.codifica_con_guali.repository.VisitLogRepository; // <-- 1. IMPORT AÑADIDO
import com.proyectodw.codifica_con_guali.service.ActivityLogService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/admin")
public class AdminController {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogService logService;
    private final GameStatRepository gameStatRepository;
    private final VisitLogRepository visitLogRepository;

    public AdminController(AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder,
            ActivityLogService logService,
            GameStatRepository gameStatRepository,
            VisitLogRepository visitLogRepository)
    {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.logService = logService;
        this.gameStatRepository = gameStatRepository;
        this.visitLogRepository = visitLogRepository;
    }

    @GetMapping("/users")
    public String listUsers(Model model) {
        model.addAttribute("users", adminUserRepository.findAll());
        return "admin/admin-users";
    }

    @GetMapping("/users/new")
    public String showNewUserForm(Model model) {
        model.addAttribute("user", new AdminUser());
        model.addAttribute("pageTitle", "Crear Nuevo Administrador");
        return "admin/admin-user-form";
    }

    @GetMapping("/users/edit/{id}")
    public String showEditUserForm(@PathVariable Long id, Model model) {
        AdminUser user = adminUserRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ID de usuario inválido:" + id));

        user.setPassword("");

        model.addAttribute("user", user);
        model.addAttribute("pageTitle", "Editar Administrador");
        return "admin/admin-user-form";
    }

    @PostMapping("/users/save")
    public String saveUser(@ModelAttribute("user") AdminUser user, RedirectAttributes redirectAttributes) {
        String action;
        if (user.getId() == null) {
            action = "Creó al nuevo usuario: '" + user.getUsername() + "'";
            if (user.getPassword() != null && !user.getPassword().isEmpty()) {
                user.setPassword(passwordEncoder.encode(user.getPassword()));
            } else {
                redirectAttributes.addFlashAttribute("error", "La contraseña no puede estar vacía al crear.");
                return "redirect:/admin/users/new";
            }
        } else {
            action = "Editó al usuario: '" + user.getUsername() + "'";
            if (user.getPassword() == null || user.getPassword().isEmpty()) {
                AdminUser existingUser = adminUserRepository.findById(user.getId()).orElse(null);
                if (existingUser != null) {
                    user.setPassword(existingUser.getPassword());
                } else {
                    redirectAttributes.addFlashAttribute("error", "Error: Usuario no encontrado.");
                    return "redirect:/admin/users";
                }
            } else {
                user.setPassword(passwordEncoder.encode(user.getPassword()));
            }
        }
        user.setRole("ROLE_ADMIN");
        adminUserRepository.save(user);
        logService.logAdminAction(action);
        redirectAttributes.addFlashAttribute("message", "¡Usuario guardado con éxito!");
        return "redirect:/admin/users";
    }

    @GetMapping("/users/delete/{id}")
    public String deleteUser(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        String username = adminUserRepository.findById(id).map(AdminUser::getUsername).orElse("ID: " + id);
        try {
            adminUserRepository.deleteById(id);
            logService.logAdminAction("Eliminó al usuario: '" + username + "'");
            redirectAttributes.addFlashAttribute("message", "Usuario eliminado con éxito.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al eliminar el usuario: " + e.getMessage());
            logService.logAdminAction("Error al intentar eliminar al usuario: '" + username + "'");
        }
        return "redirect:/admin/users";
    }

    @GetMapping("/log")
    public String showActivityLog(Model model) {
        model.addAttribute("logs", logService.getAllLogs());
        return "admin/activity-log";
    }

    @GetMapping("/stats")
    public String showStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Optional<LocalDate> startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Optional<LocalDate> endDate,
            Model model) {

        List<GameStat> stats;
        long totalVisits;
        LocalDateTime startDateTime = null;
        LocalDateTime endDateTime = null;

        if (startDate.isPresent() && endDate.isPresent()) {
            startDateTime = startDate.get().atStartOfDay();
            endDateTime = endDate.get().atTime(LocalTime.MAX);
            System.out.println("Filtrando estadísticas y visitas entre: " + startDateTime + " y " + endDateTime);
            stats = gameStatRepository.findByTimestampBetween(startDateTime, endDateTime);
            totalVisits = visitLogRepository.countByVisitTimeBetween(startDateTime, endDateTime);
        } else {
            System.out.println("Obteniendo todas las estadísticas y visitas.");
            stats = gameStatRepository.findAll();
            totalVisits = visitLogRepository.count();
        }

        long totalPlays = stats.size();
        long totalSuccess = stats.stream().filter(s -> "SUCCESS".equals(s.getResult())).count();
        long totalFail = totalPlays - totalSuccess;
        double successRate = (totalPlays > 0) ? (100.0 * totalSuccess / totalPlays) : 0.0;

        model.addAttribute("totalPlays", totalPlays);
        model.addAttribute("totalSuccess", totalSuccess);
        model.addAttribute("totalFail", totalFail);
        model.addAttribute("successRate", String.format("%.2f", successRate));
        model.addAttribute("totalVisits", totalVisits);

        model.addAttribute("startDate", startDate.map(LocalDate::toString).orElse(""));
        model.addAttribute("endDate", endDate.map(LocalDate::toString).orElse(""));

        return "admin/stats";
    }
}
