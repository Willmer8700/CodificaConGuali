package com.proyectodw.codifica_con_guali.config;

import com.proyectodw.codifica_con_guali.model.AdminUser;
import com.proyectodw.codifica_con_guali.repository.AdminUserRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class JpaUserDetailsService implements UserDetailsService {

    private final AdminUserRepository adminUserRepository;

    public JpaUserDetailsService(AdminUserRepository adminUserRepository) {
        this.adminUserRepository = adminUserRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return adminUserRepository
                .findByUsername(username)
                .map(this::toUserDetails) 
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
    }

    private UserDetails toUserDetails(AdminUser adminUser) {
        return User.builder()
                .username(adminUser.getUsername())
                .password(adminUser.getPassword())
                
                // --- CAMBIO IMPORTANTE AQUÍ ---
                // En lugar de .roles(), usamos .authorities()
                // Esto toma el valor exacto de la base de datos ("ROLE_ADMIN")
                // y lo usa como la autoridad.
                .authorities(adminUser.getRole()) 
                // --- FIN DEL CAMBIO ---
                
                .build();
    }
}