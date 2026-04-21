package com.stag.gym.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (jwt != null && jwtUtils.validateToken(jwt)) {
                String email = jwtUtils.getEmailFromToken(jwt);
                Claims claims = jwtUtils.getClaimsFromToken(jwt);
                
                String role = claims.get("role", String.class);
                
                // Robust Long retrieval for branchId
                Object branchIdObj = claims.get("branchId");
                Long tokenBranchId = null;
                if (branchIdObj instanceof Number) {
                    tokenBranchId = ((Number) branchIdObj).longValue();
                }

                Long finalBranchId = tokenBranchId;
                
                // If OWNER, allow X-Branch-ID header or branchId query param to override
                if ("OWNER".equals(role)) {
                    String headerBranchId = request.getHeader("X-Branch-ID");
                    String queryBranchId = request.getParameter("branchId");
                    
                    String branchIdStr = StringUtils.hasText(queryBranchId) ? queryBranchId : headerBranchId;

                    if (StringUtils.hasText(branchIdStr)) {
                        try {
                            finalBranchId = Long.parseLong(branchIdStr);
                        } catch (NumberFormatException e) {
                            // ignore
                        }
                    }
                }

                BranchContext.setCurrentBranchId(finalBranchId);
                
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        email, null, Collections.singletonList(authority));
                
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                logger.info(String.format("Authenticated user %s with role %s for branch %d", email, role, finalBranchId));
            } else if (jwt != null) {
                logger.warn("Invalid JWT token received");
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            BranchContext.clear();
        }
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
