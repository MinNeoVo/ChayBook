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
import "./PlacesPage.css";

const DEFAULT_RADIUS = 10000;

function formatDistance(distanceMeters) {
  if (!Number.isFinite(distanceMeters)) return "Distance unavailable";
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m away`;
  return `${(distanceMeters / 1000).toFixed(1)} km away`;
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
        <p className="shop-address"><MapPin size={13} />{shop.address || "Address not provided"}</p>
        <div className="shop-evidence-row">
          <span className="shop-dietary-badge"><Leaf size={12} />Plant-based category</span>
          <span className="shop-dish-status">Nearby suggestion</span>
        </div>
        <p className="shop-reason">Suggested by location and dietary category. Please check the current menu with the restaurant.</p>
        <div className="shop-card-footer">
          <span className="shop-attribution">{shop.attributions?.map((item) => item.provider).filter(Boolean).join(" · ")}</span>
          <a href={mapsPlaceUrl(shop)} target="_blank" rel="noreferrer">Directions <ExternalLink size={13} /></a>
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
      setError(requestError.message || "Could not load nearby places. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("This browser does not support location access.");
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
          ? "Location access was declined. Allow location in your browser to find nearby places."
          : "Could not get your location. Check your connection and try again.";
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
        <div className="places-breadcrumb"><span>Home</span><span>/</span><span>Explore</span><span>/</span><strong>Nearby Vegetarian Places</strong></div>

        <section className="places-hero">
          <div className="places-hero-copy">
            <span className="places-eyebrow"><Leaf size={13} /> Nearby place finder</span>
            <h1>Vegetarian places near you</h1>
            <p>We’ll find nearby vegetarian and vegan restaurants using your current location.</p>
          </div>
          <div className="places-hero-art"><Utensils size={60} /></div>
        </section>

        <section className="places-search-panel">
          <div className="places-form-grid">
            <div className="places-current-location">
              <MapPin size={18} />
              <div>
                <strong>{locationState === "loading" ? "Finding your location…" : location ? "Searching near your current location" : "Location needed to find nearby places"}</strong>
                <span>{location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Allow location access when your browser asks."}</span>
              </div>
            </div>
            <select value={dietaryMode} onChange={(event) => setDietaryMode(event.target.value)} aria-label="Dietary preference">
              <option value="VEGETARIAN">Vegetarian & vegan</option>
              <option value="VEGAN">Vegan only</option>
            </select>
            <select value={radiusMeters} onChange={(event) => setRadiusMeters(Number(event.target.value))} aria-label="Search radius">
              <option value={3000}>Within 3 km</option>
              <option value={5000}>Within 5 km</option>
              <option value={10000}>Within 10 km</option>
            </select>
            <button className={`places-location-button ${locationState === "ready" ? "places-location-ready" : ""}`} type="button" onClick={requestLocation} disabled={locationState === "loading"}>
              <LocateFixed size={16} />{locationState === "loading" ? "Finding you…" : locationState === "ready" ? "Refresh location" : "Use my location"}
            </button>
            <a className="places-submit-button places-maps-area-link" href={mapsAreaUrl(location)} target="_blank" rel="noreferrer"><MapPin size={16} />Open in Google Maps</a>
          </div>
          <div className="places-search-foot"><span>Your location is used to find and sort nearby places.</span><span>Up to 10 results · Sorted by distance</span></div>
        </section>

        {(locationError || error) && <div className="places-alert"><AlertCircle size={17} /><span>{locationError || error}</span></div>}

        <section className="places-results-layout">
          <div className="places-location-card">
            <div className="places-section-heading">
              <div><span className="places-live-dot" /><h2>Search location</h2></div>
              <button onClick={requestLocation} disabled={locationState === "loading"}><LocateFixed size={14} />{locationState === "loading" ? "Locating…" : "Refresh"}</button>
            </div>
            <div className="places-location-visual">
              <div className="places-location-orbit places-orbit-one" />
              <div className="places-location-orbit places-orbit-two" />
              <div className="places-location-pin"><MapPin size={27} fill="currentColor" /></div>
              <span className="places-location-radius">{radiusMeters / 1000} km search radius</span>
            </div>
            <div className="places-location-details">
              <div><span>Searching around</span><strong>{location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Your current location"}</strong></div>
              <a href={mapsAreaUrl(location)} target="_blank" rel="noreferrer">Explore area in Google Maps <ExternalLink size={13} /></a>
            </div>
            <p className="places-map-caption">Suggestions are based on nearby place categories and distance. Restaurant menus may change.</p>
          </div>

          <div className="places-list-column">
            <div className="places-list-heading">
              <div><h2>Nearby places</h2><span>{hasSearched ? `${orderedShops.length} results` : "Finding places…"}</span></div>
              <label>Sort <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="distance">Closest</option><option value="name">Name</option></select><ChevronDown size={13} /></label>
            </div>
            {loading ? <div className="places-state-card"><span className="places-spinner" /><strong>Finding vegetarian places nearby…</strong><span>This may take a few seconds.</span></div>
              : error ? <div className="places-state-card"><AlertCircle size={24} /><strong>We couldn’t load places</strong><span>{error}</span><button className="places-retry-button" onClick={() => location && searchNearby(location, dietaryMode, radiusMeters)}>Try again</button></div>
                : !location ? <div className="places-state-card"><div className="places-state-icon"><LocateFixed size={22} /></div><strong>Share your location to begin</strong><span>Allow location access, then nearby vegetarian and vegan restaurants will load automatically.</span><button className="places-retry-button" onClick={requestLocation}>Use my location</button></div>
                  : orderedShops.length === 0 ? <div className="places-state-card"><div className="places-state-icon"><MapPin size={22} /></div><strong>No places found within {radiusMeters / 1000} km</strong><span>Try a larger radius, or switch to vegan-only results if you prefer a narrower dietary category.</span></div>
                    : <div className="places-shop-list">{orderedShops.map((shop, index) => <ShopCard key={shop.placeId || `${shop.name}-${index}`} shop={shop} index={index} />)}</div>}
          </div>
        </section>

        {hasSearched && orderedShops.length > 0 && <div className="places-attribution-note"><Leaf size={15} /><span>Dietary categories are based on place data and may not reflect the current menu. Please confirm details directly with the restaurant.</span></div>}
      </div>
    </main>
  );
}

export default PlacesPage;
