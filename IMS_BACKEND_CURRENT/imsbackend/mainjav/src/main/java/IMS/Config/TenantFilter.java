package IMS.Config;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import IMS.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // Prefer header, fallback to Host (subdomain) parsing
            String tenant = request.getHeader("X-Tenant-ID");
            if (tenant == null || tenant.isBlank()) {
                String host = request.getHeader("Host");
                if (host != null && host.contains(".")) {
                    tenant = host.split("\\.")[0];
                }
            }

            if (tenant != null && !tenant.isBlank()) TenantContext.setTenant(tenant);

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
