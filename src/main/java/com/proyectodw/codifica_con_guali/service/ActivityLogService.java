package com.proyectodw.codifica_con_guali.service;

import com.proyectodw.codifica_con_guali.model.ActivityLog;
import com.proyectodw.codifica_con_guali.repository.ActivityLogRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import java.util.List; 

@Service 
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    public ActivityLogService(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    public void logAdminAction(String action) {
        String username = "SISTEMA";

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal != null) {
            username = principal.toString();
        }

        ActivityLog logEntry = new ActivityLog(username, action);

        activityLogRepository.save(logEntry);
    }

    public List<ActivityLog> getAllLogs() {
        return activityLogRepository.findAllByOrderByTimestampDesc();
    }
}

