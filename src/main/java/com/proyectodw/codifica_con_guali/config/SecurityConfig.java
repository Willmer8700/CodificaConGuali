package com.proyectodw.codifica_con_guali.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) 
            
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(
                    "/", "/index.html", "/css/**", "/js/**", "/images/**", 
                    "/login", "/favicon.ico", "/error", "/log-result" 
                ).permitAll()

                .requestMatchers(
                    "/configurar", "/save-track", "/admin/**"
                ).hasRole("ADMIN")

                .anyRequest().denyAll()
            )
            
            .formLogin(form -> form
                .loginPage("/login") 
                .permitAll() 
                .defaultSuccessUrl("/configurar", true) 
                .failureUrl("/login?error=true")
            )
            
            .logout(logout -> logout
                .logoutUrl("/logout") 
                .logoutSuccessUrl("/") 
                .permitAll()
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}