package com.chaybook.backend.video;

import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.video.dto.*;
import com.chaybook.backend.video.entity.VideoSubmission;
import com.chaybook.backend.video.repository.*;
import com.chaybook.backend.video.service.impl.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class VideoIntakeTest {
    private final VideoSubmissionRepository submissions = mock(VideoSubmissionRepository.class);
    private final VideoAnalysisRepository analyses = mock(VideoAnalysisRepository.class);
    private final VideoUserGuard users = mock(VideoUserGuard.class);
    private final VideoSourceService sources = mock(VideoSourceService.class);
    private final PrivateVideoStorage storage = mock(PrivateVideoStorage.class);
    private final VideoJobStore jobs = mock(VideoJobStore.class);
    private final VideoResponseMapper responses = mock(VideoResponseMapper.class);
    private final VideoAnalysisServiceImpl service = new VideoAnalysisServiceImpl(
            submissions, analyses, mock(UserRecipeRepository.class), users, sources, storage,
            jobs, mock(VideoJson.class), mock(VideoDraftRules.class), mock(VideoIngredientMatcher.class), responses);
    private final VideoSourceInfo upload = new VideoSourceInfo("UPLOAD", null, "temp-key", BigDecimal.TEN);

    private VideoSubmission submission(int id) {
        var submission = new VideoSubmission();
        ReflectionTestUtils.setField(submission, "submissionId", id);
        return submission;
    }

    @Test void locksAccountBeforeReusingActiveSubmissionWithoutInsert() {
        var existing = submission(7);
        var user = new User();
        when(users.requireActiveForSubmission(1)).thenReturn(user);
        when(submissions.findActiveByUserId(eq(1), any())).thenReturn(List.of(existing));
        var store = new VideoJobStore(submissions, analyses, users, VideoTestProperties.defaults("unused"),
                mock(VideoJson.class), mock(VideoDraftRules.class));

        assertEquals(new VideoIntakeResult(7, false), store.createSubmission(1, upload, true));
        var order = inOrder(users, submissions);
        order.verify(users).requireActiveForSubmission(1);
        order.verify(submissions).findActiveByUserId(eq(1), any());
        verify(submissions, never()).saveAndFlush(any());
    }

    @Test void createsWhenThereIsNoActiveSubmission() {
        when(users.requireActiveForSubmission(1)).thenReturn(new User());
        when(submissions.findActiveByUserId(eq(1), any())).thenReturn(List.of());
        when(submissions.saveAndFlush(any())).thenReturn(submission(8));
        var store = new VideoJobStore(submissions, analyses, users, VideoTestProperties.defaults("unused"),
                mock(VideoJson.class), mock(VideoDraftRules.class));
        assertEquals(new VideoIntakeResult(8, true), store.createSubmission(1, upload, true));
    }

    @Test void activeSubmissionAvoidsAnotherUploadOrYoutubeLookup() {
        var existing = submission(7);
        var response = new VideoSubmissionResponse(7, "CHECKING", null, null, null, null,
                "UPLOAD", null, BigDecimal.TEN);
        when(submissions.findActiveByUserId(eq(1), any())).thenReturn(List.of(existing));
        when(analyses.findBySubmission_SubmissionId(7)).thenReturn(Optional.empty());
        when(responses.submission(existing, null)).thenReturn(response);

        assertSame(response, service.submitUpload(1, null, true));
        assertSame(response, service.submitUrl(1, new SubmitVideoUrlRequest("https://youtu.be/abcdefghijk", true)));
        verifyNoInteractions(sources, jobs, storage);
    }

    @Test void concurrentIntakeCleansUnusedUploadAndReturnsExistingJob() {
        var existing = submission(7);
        when(submissions.findActiveByUserId(eq(1), any())).thenReturn(List.of());
        when(sources.upload(null)).thenReturn(upload);
        when(jobs.createSubmission(1, upload, true)).thenReturn(new VideoIntakeResult(7, false));
        when(submissions.findBySubmissionIdAndUser_UserId(7, 1)).thenReturn(Optional.of(existing));
        when(analyses.findBySubmission_SubmissionId(7)).thenReturn(Optional.empty());
        service.submitUpload(1, null, true);
        verify(storage).deleteQuietly("temp-key");
        verify(responses).submission(existing, null);
    }

    @Test void activeLookupUsesAuthenticatedOwnerOnly() {
        when(submissions.findActiveByUserId(eq(2), any())).thenReturn(List.of());
        assertTrue(service.getActiveSubmission(2).isEmpty());
        verify(users).requireActive(2);
        verify(submissions).findActiveByUserId(eq(2), any());
        verify(submissions, never()).findActiveByUserId(eq(1), any());
    }
}
