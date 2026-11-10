package com.chaybook.backend.media.dto;

public class MediaUploadResponse {

    private String url;
    private String mediaType;
    private String publicId;

    public MediaUploadResponse() {
    }

    public MediaUploadResponse(
            String url,
            String mediaType,
            String publicId
    ) {
        this.url = url;
        this.mediaType = mediaType;
        this.publicId = publicId;
    }

    public String getUrl() {
        return url;
    }

    public String getMediaType() {
        return mediaType;
    }

    public String getPublicId() {
        return publicId;
    }
}