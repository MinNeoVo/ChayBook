package com.chaybook.backend.video.policy;

import com.chaybook.backend.video.dto.VideoReviewAssessment;
import com.chaybook.backend.video.dto.VideoReviewDecision;
import com.chaybook.backend.video.enums.AssessmentAnswer;
import com.chaybook.backend.video.enums.VideoSubmissionStatus;

import org.springframework.stereotype.Component;

@Component
public class VideoReviewPolicy {

    public VideoReviewDecision evaluate(
            VideoReviewAssessment assessment
    ) {
        if (assessment == null) {
            throw new IllegalArgumentException(
                    "Assessment must not be null"
            );
        }

        AssessmentAnswer food = effectiveAnswer(
                assessment.foodTopic()
        );

        if (food == AssessmentAnswer.NO) {
            return new VideoReviewDecision(
                    VideoSubmissionStatus.REJECTED,
                    "NOT_FOOD_CONTENT"
            );
        }

        if (food != AssessmentAnswer.YES) {
            return new VideoReviewDecision(
                    VideoSubmissionStatus.UNDETERMINED,
                    "FOOD_TOPIC_UNCERTAIN"
            );
        }

        AssessmentAnswer vegetarian = effectiveAnswer(
                assessment.vegetarianFood()
        );

        if (vegetarian == AssessmentAnswer.NO) {
            return new VideoReviewDecision(
                    VideoSubmissionStatus.REJECTED,
                    "NON_VEGETARIAN_CONTENT"
            );
        }

        if (vegetarian != AssessmentAnswer.YES) {
            return new VideoReviewDecision(
                    VideoSubmissionStatus.UNDETERMINED,
                    "VEGETARIAN_STATUS_UNCERTAIN"
            );
        }

        return new VideoReviewDecision(
                VideoSubmissionStatus.ACCEPTED,
                "ACCEPTED"
        );
    }

    private AssessmentAnswer effectiveAnswer(
            VideoReviewAssessment.Check check
    ) {
        if (check == null
                || check.answer() == null
                || check.answer() == AssessmentAnswer.UNKNOWN
                || check.evidence() == null
                || check.evidence().isEmpty()) {
            return AssessmentAnswer.UNKNOWN;
        }

        return check.answer();
    }
}