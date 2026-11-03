import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Leaf,
  LocateFixed,
  MapPin,
  Search,
  Utensils,
} from "lucide-react";
import {
  autocompleteShopAddress,
  geocodeShopAddress,
  getNearbyShopRecommendations,
} from "../services/shopServices";
import PlacesMap from "./PlacesMap";
import "./PlacesPage.css";

const DEFAULT_RADIUS = 10000;

function formatDistance(distanceMeters) {
  if (!Number.isFinite(distanceMeters)) return "Chưa có khoảng cách";
  if (distanceMeters < 1000) return `Cách ${Math.round(distanceMeters)} m`;
  return `Cách ${(distanceMeters / 1000).toFixed(1)} km`;
}

function mapsAreaUrl(location) {
  if (!location) return "https://www.google.com/maps/search/vegetarian+restaurants";
  return `https://www.google.com/maps/search/vegetarian+restaurants/@${location.latitude},${location.longitude},14z`;
}

function mapsPlaceUrl(shop) {
  const query = encodeURIComponent([shop.name, shop.address].filter(Boolean).join(" "));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function ShopCard({ shop, index }) {
  return (
    <article className={`nearby-shop-card ${index === 0 ? "nearby-shop-card-featured" : ""}`}>
      <div className="shop-card-index">{String(index + 1).padStart(2, "0")}</div>
      <div className="shop-card-content">
        <div className="shop-card-title-row">
          <h3>{shop.name}</h3>
          <span className="shop-distance"><MapPin size={13} />{formatDistance(shop.distanceMeters)}</span>
        </div>
        <p className="shop-address"><MapPin size={13} />{shop.address || "Chưa có địa chỉ"}</p>
        <div className="shop-evidence-row">
          <span className="shop-dietary-badge"><Leaf size={12} />Danh mục món thực vật</span>
          <span className="shop-dish-status">Gợi ý gần bạn</span>
        </div>
        <p className="shop-reason">Gợi ý dựa trên vị trí và danh mục chế độ ăn. Vui lòng kiểm tra thực đơn hiện tại với nhà hàng.</p>
        <div className="shop-card-footer">
          <span className="shop-attribution">{shop.attributions?.map((item) => item.provider).filter(Boolean).join(" · ")}</span>
          <a href={mapsPlaceUrl(shop)} target="_blank" rel="noreferrer">Chỉ đường <ExternalLink size={13} /></a>
        </div>
      </div>
    </article>
  );
}

function PlacesPage() {
  const [dietaryMode, setDietaryMode] = useState("VEGETARIAN");
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_RADIUS);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [searchLocationLabel, setSearchLocationLabel] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [locationState, setLocationState] = useState("loading");
  const [locationError, setLocationError] = useState("");
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [sort, setSort] = useState("distance");
  const locationRequested = useRef(false);
  const locationSelectionVersion = useRef(0);
  const searchRequestVersion = useRef(0);

  useEffect(() => {
    const trimmedAddress = address.trim();
    if (selectedSuggestion?.formattedAddress === trimmedAddress || trimmedAddress.length < 3) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      setSuggestionsError("");
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      setSuggestionsError("");
      try {
        const results = await autocompleteShopAddress(trimmedAddress, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setSuggestions(Array.isArray(results) ? results : []);
          setSuggestionsOpen(true);
          setActiveSuggestionIndex(-1);
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setSuggestionsError(requestError.message || "Không tải được gợi ý địa chỉ.");
        }
      } finally {
        if (!controller.signal.aborted) setSuggestionsLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [address, selectedSuggestion]);

  const orderedShops = useMemo(() => {
    const results = [...shops];
    if (sort === "name") results.sort((a, b) => a.name.localeCompare(b.name));
    else results.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return results;
  }, [shops, sort]);

  const searchNearby = useCallback(async (coords, mode, radius) => {
    const requestVersion = ++searchRequestVersion.current;
    setLoading(true);
    setError("");
    setHasSearched(true);
    try {
      const response = await getNearbyShopRecommendations({
        latitude: coords.latitude,
        longitude: coords.longitude,
        radiusMeters: radius,
        dietaryMode: mode,
        limit: 10,
      });
      if (requestVersion !== searchRequestVersion.current) return;
      setShops(Array.isArray(response?.items) ? response.items : []);
    } catch (requestError) {
      if (requestVersion !== searchRequestVersion.current) return;
      setShops([]);
      setError(requestError.message || "Không thể tải địa điểm gần đây. Vui lòng thử lại.");
    } finally {
      if (requestVersion === searchRequestVersion.current) setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    const requestVersion = ++locationSelectionVersion.current;
    setGeocoding(false);
    setAddress("");
    setSelectedSuggestion(null);
    setSuggestions([]);
    setSuggestionsOpen(false);
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt này không hỗ trợ truy cập vị trí.");
      setLocationState("error");
      return;
    }
    setLocationState("loading");
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (requestVersion !== locationSelectionVersion.current) return;
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setSearchLocationLabel("Vị trí hiện tại");
        setLocationState("ready");
        setLocationError("");
      },
      (geoError) => {
        if (requestVersion !== locationSelectionVersion.current) return;
        const message = geoError.code === geoError.PERMISSION_DENIED
          ? "Bạn đã từ chối quyền truy cập vị trí. Hãy cho phép trình duyệt truy cập vị trí để tìm địa điểm gần bạn."
          : "Không thể lấy vị trí của bạn. Hãy kiểm tra kết nối và thử lại.";
        setLocationError(message);
        setLocationState("error");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }, []);

  const searchByAddress = useCallback(async (event) => {
    event.preventDefault();
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setLocationError("Vui lòng nhập địa chỉ cần tìm.");
      return;
    }

    setGeocoding(true);
    const requestVersion = ++locationSelectionVersion.current;
    setLocationError("");
    setError("");
    setSuggestionsOpen(false);
    try {
      const result = selectedSuggestion?.formattedAddress === trimmedAddress
        ? selectedSuggestion
        : await geocodeShopAddress(trimmedAddress);
      if (requestVersion !== locationSelectionVersion.current) return;
      setLocation({ latitude: result.latitude, longitude: result.longitude });
      const resolvedAddress = result.formattedAddress || trimmedAddress;
      setAddress(resolvedAddress);
      setSearchLocationLabel(resolvedAddress);
      setSelectedSuggestion(result);
      setLocationState("ready");
    } catch (requestError) {
      if (requestVersion !== locationSelectionVersion.current) return;
      setLocationError(requestError.message || "Không tìm thấy địa chỉ này. Hãy thử nhập địa chỉ cụ thể hơn.");
    } finally {
      if (requestVersion === locationSelectionVersion.current) setGeocoding(false);
    }
  }, [address, selectedSuggestion]);

  const chooseSuggestion = useCallback((suggestion) => {
    setAddress(suggestion.formattedAddress);
    setSelectedSuggestion(suggestion);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
  }, []);

  useEffect(() => {
    if (locationRequested.current) return;
    locationRequested.current = true;
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (location) searchNearby(location, dietaryMode, radiusMeters);
  }, [location, dietaryMode, radiusMeters, searchNearby]);

  return (
    <main className="places-page">
      <div className="places-shell">
        <div className="places-breadcrumb"><span>Trang chủ</span><span>/</span><span>Khám phá</span><span>/</span><strong>Địa điểm ăn chay gần đây</strong></div>

        <section className="places-hero">
          <div className="places-hero-copy">
            <span className="places-eyebrow"><Leaf size={13} /> Tìm địa điểm gần bạn</span>
            <h1>Địa điểm ăn chay gần bạn</h1>
            <p>Nhập một địa chỉ bất kỳ để tìm nhà hàng chay và thuần chay ở khu vực đó.</p>
          </div>
          <div className="places-hero-art"><Utensils size={60} /></div>
        </section>

        <section className="places-search-panel">
          <form className="places-form-grid" onSubmit={searchByAddress}>
            <div className="places-address-autocomplete">
              <label className="places-address-input">
                <Search size={17} />
                <input
                  value={address}
                  onChange={(event) => {
                    setAddress(event.target.value);
                    setSelectedSuggestion(null);
                    setSuggestionsError("");
                    setSuggestionsOpen(true);
                  }}
                  onFocus={() => address.trim().length >= 3 && setSuggestionsOpen(true)}
                  onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" && suggestions.length) {
                      event.preventDefault();
                      setSuggestionsOpen(true);
                      setActiveSuggestionIndex((index) => (index + 1) % suggestions.length);
                    } else if (event.key === "ArrowUp" && suggestions.length) {
                      event.preventDefault();
                      setActiveSuggestionIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
                    } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
                      event.preventDefault();
                      chooseSuggestion(suggestions[activeSuggestionIndex]);
                    } else if (event.key === "Escape") {
                      setSuggestionsOpen(false);
                    }
                  }}
                  placeholder="Nhập địa chỉ, ví dụ 230/8 Quận 1, TP.HCM"
                  aria-label="Địa chỉ cần tìm quán chay"
                  aria-autocomplete="list"
                  aria-expanded={suggestionsOpen && suggestions.length > 0}
                  maxLength={200}
                />
              </label>
              {suggestionsOpen && (suggestionsLoading || suggestions.length > 0 || suggestionsError) && (
                <div className="places-address-suggestions" role="listbox" aria-label="Gợi ý địa chỉ">
                  {suggestionsLoading && <div className="places-suggestion-status">Đang tìm gợi ý…</div>}
                  {suggestionsError && <div className="places-suggestion-status places-suggestion-error">{suggestionsError}</div>}
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.latitude}:${suggestion.longitude}:${suggestion.formattedAddress}`}
                      type="button"
                      role="option"
                      aria-selected={activeSuggestionIndex === index}
                      className={activeSuggestionIndex === index ? "places-suggestion-active" : ""}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseSuggestion(suggestion)}
                    >
                      <MapPin size={15} />
                      <span>{suggestion.formattedAddress}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select value={dietaryMode} onChange={(event) => setDietaryMode(event.target.value)} aria-label="Tùy chọn chế độ ăn">
              <option value="VEGETARIAN">Ăn chay & thuần chay</option>
              <option value="VEGAN">Chỉ thuần chay</option>
            </select>
            <select value={radiusMeters} onChange={(event) => setRadiusMeters(Number(event.target.value))} aria-label="Bán kính tìm kiếm">
              <option value={3000}>Trong phạm vi 3 km</option>
              <option value={5000}>Trong phạm vi 5 km</option>
              <option value={10000}>Trong phạm vi 10 km</option>
            </select>
            <button className={`places-location-button ${locationState === "ready" && searchLocationLabel === "Vị trí hiện tại" ? "places-location-ready" : ""}`} type="button" onClick={requestLocation} disabled={locationState === "loading"}>
              <LocateFixed size={16} />{locationState === "loading" ? "Đang xác định…" : "Vị trí hiện tại"}
            </button>
            <button className="places-submit-button" type="submit" disabled={geocoding || !address.trim()}>
              <Search size={16} />{geocoding ? "Đang tìm địa chỉ…" : "Tìm quán"}
            </button>
          </form>
          <div className="places-search-foot"><span>{searchLocationLabel ? `Đang tìm quanh: ${searchLocationLabel}` : "Nhập địa chỉ rồi bấm Tìm quán, hoặc chọn vị trí hiện tại."}</span><span>Tối đa 10 kết quả · Sắp xếp theo khoảng cách</span></div>
        </section>

        {(locationError || error) && <div className="places-alert"><AlertCircle size={17} /><span>{locationError || error}</span></div>}

        <section className="places-results-layout">
          <div className="places-location-card">
            <div className="places-section-heading">
              <div><span className="places-live-dot" /><h2>Vị trí tìm kiếm</h2></div>
              <button onClick={requestLocation} disabled={locationState === "loading"}><LocateFixed size={14} />{locationState === "loading" ? "Đang xác định…" : "Làm mới"}</button>
            </div>
            <PlacesMap location={location} shops={orderedShops} radiusMeters={radiusMeters} />
            <div className="places-location-details">
              <div><span>Đang tìm quanh</span><strong>{searchLocationLabel || (location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Chưa chọn địa chỉ")}</strong></div>
              <a href={mapsAreaUrl(location)} target="_blank" rel="noreferrer">Khám phá khu vực trên Google Maps <ExternalLink size={13} /></a>
            </div>
            <p className="places-map-caption">Gợi ý dựa trên danh mục địa điểm và khoảng cách. Thực đơn nhà hàng có thể thay đổi.</p>
          </div>

          <div className="places-list-column">
            <div className="places-list-heading">
              <div><h2>Địa điểm gần đây</h2><span>{hasSearched ? `${orderedShops.length} kết quả` : "Đang tìm địa điểm…"}</span></div>
              <label>Sắp xếp <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="distance">Gần nhất</option><option value="name">Tên</option></select><ChevronDown size={13} /></label>
            </div>
            {loading ? <div className="places-state-card"><span className="places-spinner" /><strong>Đang tìm địa điểm ăn chay gần bạn…</strong><span>Quá trình này có thể mất vài giây.</span></div>
              : error ? <div className="places-state-card"><AlertCircle size={24} /><strong>Không thể tải địa điểm</strong><span>{error}</span><button className="places-retry-button" onClick={() => location && searchNearby(location, dietaryMode, radiusMeters)}>Thử lại</button></div>
                : !location ? <div className="places-state-card"><div className="places-state-icon"><LocateFixed size={22} /></div><strong>Chia sẻ vị trí để bắt đầu</strong><span>Cho phép truy cập vị trí để tự động tải nhà hàng chay và thuần chay gần bạn.</span><button className="places-retry-button" onClick={requestLocation}>Dùng vị trí của tôi</button></div>
                  : orderedShops.length === 0 ? <div className="places-state-card"><div className="places-state-icon"><MapPin size={22} /></div><strong>Không tìm thấy địa điểm trong phạm vi {radiusMeters / 1000} km</strong><span>Hãy tăng bán kính hoặc chỉ tìm địa điểm thuần chay để thu hẹp danh mục.</span></div>
                    : <div className="places-shop-list">{orderedShops.map((shop, index) => <ShopCard key={shop.placeId || `${shop.name}-${index}`} shop={shop} index={index} />)}</div>}
          </div>
        </section>

        {hasSearched && orderedShops.length > 0 && <div className="places-attribution-note"><Leaf size={15} /><span>Danh mục chế độ ăn dựa trên dữ liệu địa điểm và có thể không phản ánh thực đơn hiện tại. Vui lòng xác nhận trực tiếp với nhà hàng.</span></div>}
      </div>
    </main>
  );
}

export default PlacesPage;
