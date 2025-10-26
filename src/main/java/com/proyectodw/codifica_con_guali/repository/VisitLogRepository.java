package com.proyectodw.codifica_con_guali.repository;

import com.proyectodw.codifica_con_guali.model.VisitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface VisitLogRepository extends JpaRepository<VisitLog, Long> {

    List<VisitLog> findByVisitTimeBetween(LocalDateTime start, LocalDateTime end);

    long countByVisitTimeBetween(LocalDateTime start, LocalDateTime end);
}
