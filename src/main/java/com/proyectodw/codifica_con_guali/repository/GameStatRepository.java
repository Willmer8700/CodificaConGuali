package com.proyectodw.codifica_con_guali.repository;

import com.proyectodw.codifica_con_guali.model.GameStat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface GameStatRepository extends JpaRepository<GameStat, Long> {
    List<GameStat> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
}