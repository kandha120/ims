package IMS.Config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final TenantFilter tenantFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter, TenantFilter tenantFilter) {
        this.jwtFilter = jwtFilter;
        this.tenantFilter = tenantFilter;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {
                }) // use CorsConfigurationSource bean
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                    // Public endpoints (login, register, swagger)
                    .requestMatchers(
                        "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**",
                        "/auth/login", "/auth/register", "/auth/reset-password",
                        "/api/auth/login", "/api/auth/register")
                    .permitAll()

                    // Role-based protection
                    // Users management - admin & superadmin only
                    .requestMatchers("/api/users/**").hasAnyAuthority("admin", "superadmin")

                    // Products, Purchase, Sales, Reports -> admin + manager
                    .requestMatchers(
                        "/api/products/**",
                        "/api/purchase/**",
                        "/api/purchases/**",
                        "/api/purchase-order/**",
                        "/api/sales/**",
                        "/api/reports/**")
                    .hasAnyAuthority("admin", "manager")

                    // Staff limited: sales and stock read access
                    .requestMatchers(
                        "/api/sales/**",
                        "/api/stock/**")
                    .hasAnyAuthority("admin", "manager", "staff")

                    // everything else needs JWT authenticated
                    .anyRequest().authenticated())
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(form -> form.disable())
                .logout(logout -> logout
                        .logoutUrl("/auth/logout")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.getWriter().write("Logout successful");
                        })
                        .permitAll());

        // TenantFilter should run early to set tenant context
        http.addFilterBefore(tenantFilter, JwtAuthenticationFilter.class);
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // React dev server
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
                "http://localhost:5176"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // apply to all paths
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
