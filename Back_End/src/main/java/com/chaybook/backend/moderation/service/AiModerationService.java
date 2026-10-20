package com.chaybook.backend.moderation.service;

import com.chaybook.backend.community.entity.Post;

public interface AiModerationService {

    void moderatePost(Post post);
}