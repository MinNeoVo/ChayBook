package com.chaybook.backend.admin.post.service;

import com.chaybook.backend.admin.post.dto.AdminPostVideoResponse;

public interface AdminPostVideoService {

    AdminPostVideoResponse.Page getSubmissions(
            Integer adminId,
            String type,
            String status,
            String keyword,
            int page,
            int size
    );

    AdminPostVideoResponse.Statistics getStatistics(Integer adminId);

    AdminPostVideoResponse getDetail(Integer adminId, String type, Integer contentId);

    void updateStatus(
            Integer adminId,
            String type,
            Integer contentId,
            String status,
            String reason
    );
}
