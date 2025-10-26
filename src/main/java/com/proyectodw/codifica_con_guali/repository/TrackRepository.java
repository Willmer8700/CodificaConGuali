package com.proyectodw.codifica_con_guali.repository;

import com.proyectodw.codifica_con_guali.model.Track;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrackRepository extends JpaRepository<Track, Long> {
}