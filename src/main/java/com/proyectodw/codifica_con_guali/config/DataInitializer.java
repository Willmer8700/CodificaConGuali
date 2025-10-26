package com.proyectodw.codifica_con_guali.config;

import com.proyectodw.codifica_con_guali.model.AdminUser;
import com.proyectodw.codifica_con_guali.repository.AdminUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    /**
     * Este método se ejecutará automáticamente al iniciar la aplicación.
     * Se usa para precargar datos en la base de datos.
     */
    @Bean
    public CommandLineRunner loadData(AdminUserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Revisa si el usuario 'admin' ya existe en la BD
            if (userRepository.findByUsername("admin").isEmpty()) {
                
                System.out.println("--- Creando usuario 'admin' por defecto ---");
                
                // Si no existe, crea uno nuevo
                AdminUser admin = new AdminUser();
                admin.setUsername("admin");
                
                // Codifica la contraseña 'admin123' usando el PasswordEncoder de Spring
                admin.setPassword(passwordEncoder.encode("admin123"));
                
                admin.setRole("ROLE_ADMIN");
                
                // Guarda el nuevo usuario en la base de datos
                userRepository.save(admin);
                
                System.out.println("--- Usuario 'admin' creado con éxito ---");
            }
        };
    }
}
