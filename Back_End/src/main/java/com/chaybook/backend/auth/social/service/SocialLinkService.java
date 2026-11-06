package com.chaybook.backend.auth.social.service;

import com.chaybook.backend.auth.social.dto.SocialFlowDtos.LinkRequest;
import com.chaybook.backend.auth.social.dto.VerifiedSocialIdentity;
import com.chaybook.backend.auth.social.entity.SocialProvider;
import com.chaybook.backend.auth.social.model.SocialFlowContext.Actor;
import com.chaybook.backend.auth.social.model.SocialFlowContext.LinkIntent;
import com.chaybook.backend.auth.social.model.SocialFlowContext.LinkProof;

public interface SocialLinkService {

    LinkProof createProof(Actor actor);

    void requestCode(LinkProof proof, Actor actor);

    LinkIntent prepare(
            Actor actor,
            SocialProvider provider,
            LinkRequest request,
            LinkProof proof
    );

    void complete(
            LinkIntent intent,
            Actor actor,
            VerifiedSocialIdentity identity
    );
}