package com.chaybook.backend.auth.service;

import com.chaybook.backend.user.entity.User;

public interface CurrentUserProvider {
    User requireUser();
    User requireAdmin();
}
