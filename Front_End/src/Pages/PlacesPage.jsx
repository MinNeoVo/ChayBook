import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Leaf,
  LocateFixed,
  MapPin,
  Utensils,
} from "lucide-react";
import { getNearbyShopRecommendations } from "../services/shopServices";
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
  const [locationState, setLocationState] = useState("loading");
  const [locationError, setLocationError] = useState("");
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [sort, setSort] = useState("distance");
  const locationRequested = useRef(false);

  const orderedShops = useMemo(() => {
    const results = [...shops];
    if (sort === "name") results.sort((a, b) => a.name.localeCompare(b.name));
    else results.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return results;
  }, [shops, sort]);

  const searchNearby = useCallback(async (coords, mode, radius) => {
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
      setShops(Array.isArray(response?.items) ? response.items : []);
    } catch (requestError) {
      setShops([]);
      setError(requestError.message || "Không thể tải địa điểm gần đây. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt này không hỗ trợ truy cập vị trí.");
      setLocationState("error");
      return;
    }
    setLocationState("loading");
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationState("ready");
        setLocationError("");
      },
      (geoError) => {
        const message = geoError.code === geoError.PERMISSION_DENIED
          ? "Bạn đã từ chối quyền truy cập vị trí. Hãy cho phép trình duyệt truy cập vị trí để tìm địa điểm gần bạn."
          : "Không thể lấy vị trí của bạn. Hãy kiểm tra kết nối và thử lại.";
        setLocationError(message);
        setLocationState("error");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
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
            <p>Chúng tôi sẽ tìm nhà hàng chay và thuần chay gần bạn dựa trên vị trí hiện tại.</p>
          </div>
          <div className="places-hero-art"><Utensils size={60} /></div>
        </section>

        <section className="places-search-panel">
          <div className="places-form-grid">
            <div className="places-current-location">
              <MapPin size={18} />
              <div>
                <strong>{locationState === "loading" ? "Đang tìm vị trí…" : location ? "Đang tìm quanh vị trí hiện tại" : "Cần vị trí để tìm địa điểm gần đây"}</strong>
                <span>{location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Cho phép truy cập vị trí khi trình duyệt yêu cầu."}</span>
              </div>
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
            <button className={`places-location-button ${locationState === "ready" ? "places-location-ready" : ""}`} type="button" onClick={requestLocation} disabled={locationState === "loading"}>
              <LocateFixed size={16} />{locationState === "loading" ? "Đang xác định…" : locationState === "ready" ? "Làm mới vị trí" : "Dùng vị trí của tôi"}
            </button>
            <a className="places-submit-button places-maps-area-link" href={mapsAreaUrl(location)} target="_blank" rel="noreferrer"><MapPin size={16} />Mở Google Maps</a>
          </div>
          <div className="places-search-foot"><span>Vị trí của bạn được dùng để tìm và sắp xếp địa điểm gần đây.</span><span>Tối đa 10 kết quả · Sắp xếp theo khoảng cách</span></div>
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
              <div><span>Đang tìm quanh</span><strong>{location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Vị trí hiện tại của bạn"}</strong></div>
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
