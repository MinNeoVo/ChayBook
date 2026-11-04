package com.chaybook.backend.auth.social.service;

import com.chaybook.backend.auth.social.dto.SocialFlowDtos.PendingResponse;
import com.chaybook.backend.auth.social.dto.VerifiedSocialIdentity;
import com.chaybook.backend.auth.social.model.SocialFlowContext.Registration;
import com.chaybook.backend.user.entity.User;

public interface SocialRegistrationService {

    Registration begin(VerifiedSocialIdentity identity);

    PendingResponse getPending(Registration registration);

    void requestCode(Registration registration, String email);

    User complete(Registration registration, String email, String code);
}