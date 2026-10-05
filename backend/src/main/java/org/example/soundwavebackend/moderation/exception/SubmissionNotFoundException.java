package org.example.soundwavebackend.moderation.exception;

public class SubmissionNotFoundException extends RuntimeException {
    private final Long submissionId;

    public SubmissionNotFoundException(Long submissionId) {
        super("Track submission not found with id: " + submissionId);
        this.submissionId = submissionId;
    }

    public Long getSubmissionId() {
        return submissionId;
    }
}
