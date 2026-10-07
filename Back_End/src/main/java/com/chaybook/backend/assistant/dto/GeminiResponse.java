package com.chaybook.backend.assistant.dto;

import java.util.List;

public class GeminiResponse {
    private List<Candidate> candidates;

    public List<Candidate> getCandidates() {
        return candidates;
    }

    public void setCandidates(List<Candidate> candidates) {
        this.candidates = candidates;
    }

    public static class Candidate {
        private GeminiRequest.Content content;

        public GeminiRequest.Content getContent() {
            return content;
        }

        public void setContent(GeminiRequest.Content content) {
            this.content = content;
        }
    }
}