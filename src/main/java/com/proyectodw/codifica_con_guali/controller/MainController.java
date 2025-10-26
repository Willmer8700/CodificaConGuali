package com.proyectodw.codifica_con_guali.controller;

import com.proyectodw.codifica_con_guali.model.Track;
import com.proyectodw.codifica_con_guali.model.GameStat;
import com.proyectodw.codifica_con_guali.model.VisitLog;
import com.proyectodw.codifica_con_guali.repository.TrackRepository;
import com.proyectodw.codifica_con_guali.repository.GameStatRepository;
import com.proyectodw.codifica_con_guali.repository.VisitLogRepository;
import com.proyectodw.codifica_con_guali.service.ActivityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.ModelAndView;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Controller
public class MainController {

    @Autowired
    private TrackRepository trackRepository;

    @Autowired
    private ActivityLogService logService;

    @Autowired
    private GameStatRepository gameStatRepository;

    @Autowired
    private VisitLogRepository visitLogRepository;

    @GetMapping("/")
    public ModelAndView index() {
        visitLogRepository.save(new VisitLog());

        ModelAndView modelAndView = new ModelAndView("index");
        List<Track> allTracks = trackRepository.findAll();

        modelAndView.addObject("allTracks", allTracks);

        if (allTracks.isEmpty()) {
            System.out.println("--- Base de datos de Tracks vacía, precargando pistas ---");
            allTracks = new ArrayList<>();
            allTracks.add(new Track("TrazaArriba", "[[4,0],[3,0],[2,0],[1,0],[0,0]]"));
            allTracks.add(new Track("TrazaDerecha", "[[4,0],[4,1],[4,2],[4,3],[4,4]]"));
            allTracks.add(new Track("TrazaCombinada", "[[4,0],[3,0],[2,0],[2,1],[2,2],[1,2]]"));
            trackRepository.saveAll(allTracks);
            allTracks = trackRepository.findAll();
            modelAndView.addObject("allTracks", allTracks);
            System.out.println("--- Pistas precargadas ---");
        }

        Random rand = new Random();
        if (!allTracks.isEmpty()) {
            Track randomTrack = allTracks.get(rand.nextInt(allTracks.size()));
            modelAndView.addObject("track", randomTrack);
            modelAndView.addObject("trackPathJson", randomTrack.getPath());
            System.out.println("Cargando pista aleatoria: " + randomTrack.getName());
        } else {
            System.out.println("Advertencia: No hay pistas en la base de datos para mostrar.");
            modelAndView.addObject("track", null);
            modelAndView.addObject("trackPathJson", "[]");
        }

        return modelAndView;
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/configurar")
    public ModelAndView configurar() {
        ModelAndView modelAndView = new ModelAndView("index");
        List<Track> allTracks = trackRepository.findAll();
        modelAndView.addObject("allTracks", allTracks);

        if (!allTracks.isEmpty()) {
            Random rand = new Random();
            Track randomTrack = allTracks.get(rand.nextInt(allTracks.size()));
            modelAndView.addObject("track", randomTrack);
            modelAndView.addObject("trackPathJson", randomTrack.getPath());
        } else {
            modelAndView.addObject("track", null);
            modelAndView.addObject("trackPathJson", "[]");
        }
        return modelAndView;
    }

    @PostMapping("/log-result")
    public ResponseEntity<String> logGameResult(@RequestBody Map<String, String> payload) {
        System.out.println("--- Recibido POST en /log-result ---");
        System.out.println("Payload recibido: " + payload);

        String trackName = payload.get("trackName");
        String result = payload.get("result");

        if (trackName == null || trackName.isEmpty() || result == null || result.isEmpty()) {
            System.err.println("Error: Datos incompletos recibidos. TrackName=" + trackName + ", Result=" + result);
            return ResponseEntity.badRequest().body("Datos incompletos");
        }

        System.out.println("Intentando guardar GameStat: Track=" + trackName + ", Result=" + result);
        try {
            GameStat stat = new GameStat(trackName, result);
            gameStatRepository.save(stat);
            System.out.println("GameStat guardado con éxito.");
            return ResponseEntity.ok("Resultado registrado");
        } catch (Exception e) {
            System.err.println("¡ERROR AL GUARDAR GameStat!");
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error interno al guardar estadística: " + e.getMessage());
        }
    }

    @PostMapping("/save-track")
    public ResponseEntity<String> saveTrack(@RequestBody Track track) {
        trackRepository.save(track);
        logService.logAdminAction("Guardó la pista: '" + track.getName() + "'");
        return ResponseEntity.ok("Pista guardada con éxito");
    }

    @GetMapping("/admin/export-track")
    public ResponseEntity<byte[]> exportTrack(@RequestParam Long trackId) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new RuntimeException("Track no encontrado con ID: " + trackId));

        byte[] trackJsonBytes = track.getPath().getBytes();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentDispositionFormData("attachment", track.getName().replaceAll("\\s+", "_") + ".json");

        logService.logAdminAction("Exportó la pista: '" + track.getName() + "'");
        return ResponseEntity.ok().headers(headers).body(trackJsonBytes);
    }

    @PostMapping("/admin/import-track")
    public ResponseEntity<String> importTrack(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Por favor, selecciona un archivo para subir.");
        }
        try {
            String content = new String(file.getBytes());
            String originalFilename = file.getOriginalFilename();
            String name = (originalFilename != null && originalFilename.contains("."))
                    ? originalFilename.substring(0, originalFilename.lastIndexOf('.'))
                    : (originalFilename != null ? originalFilename : "PistaImportada");

            Track newTrack = new Track(name, content);
            trackRepository.save(newTrack);

            logService.logAdminAction("Importó la pista desde archivo: '" + name + "'");
            return ResponseEntity.ok("Pista importada con éxito: " + name);
        } catch (IOException e) {
            logService.logAdminAction("Error al intentar importar pista desde archivo.");
            return ResponseEntity.status(500).body("Error al leer el archivo: " + e.getMessage());
        }
    }
}
