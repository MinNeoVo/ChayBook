package com.chaybook.backend.shop.controller;

import com.chaybook.backend.shop.dto.ShopGeocodeResponse;
import com.chaybook.backend.shop.service.GeoapifyGeocodingService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/shops")
public class ShopGeocodingController {
    private final ObjectProvider<GeoapifyGeocodingService> geocodingServiceProvider;

    public ShopGeocodingController(ObjectProvider<GeoapifyGeocodingService> geocodingServiceProvider) {
        this.geocodingServiceProvider = geocodingServiceProvider;
    }

    @GetMapping("/geocode")
    public ShopGeocodeResponse geocode(
            @RequestParam String address,
            @AuthenticationPrincipal Jwt jwt
    ) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        GeoapifyGeocodingService service = geocodingServiceProvider.getIfAvailable();
        if (service == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Chức năng tìm địa chỉ chưa sẵn sàng.");
        }
        return service.geocode(address);
    }

    @GetMapping("/address-suggestions")
    public List<ShopGeocodeResponse> autocomplete(
            @RequestParam String text,
            @AuthenticationPrincipal Jwt jwt
    ) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        GeoapifyGeocodingService service = geocodingServiceProvider.getIfAvailable();
        if (service == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Chức năng gợi ý địa chỉ chưa sẵn sàng.");
        }
        return service.autocomplete(text);
    }
}
