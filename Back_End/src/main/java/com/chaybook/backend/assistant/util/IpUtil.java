package com.chaybook.backend.assistant.util;

import jakarta.servlet.http.HttpServletRequest;

public class IpUtil {
    public static String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}