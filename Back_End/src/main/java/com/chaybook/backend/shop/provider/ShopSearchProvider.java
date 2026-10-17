package com.chaybook.backend.shop.provider;

import com.chaybook.backend.shop.model.ShopCandidate;
import com.chaybook.backend.shop.model.ShopSearchQuery;

import java.util.List;

public interface ShopSearchProvider {
    List<ShopCandidate> search(ShopSearchQuery query);
    default boolean supportsDishSearch() {
        return false;
    }
}
