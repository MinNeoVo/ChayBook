import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./PlacesMap.css";

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY?.trim();
const DEFAULT_CENTER = [16.0471, 108.2068];

function createShopPopup(shop) {
  const popup = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = shop.name || "Địa điểm";
  popup.append(title);

  if (shop.address) {
    const address = document.createElement("div");
    address.textContent = shop.address;
    popup.append(address);
  }

  return popup;
}

function PlacesMap({ location, shops, radiusMeters }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    if (!GEOAPIFY_API_KEY || !containerRef.current) return undefined;

    const map = L.map(containerRef.current, { scrollWheelZoom: false })
      .setView(DEFAULT_CENTER, 5);
    const markers = L.layerGroup().addTo(map);
    const tiles = L.tileLayer(
      `https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(GEOAPIFY_API_KEY)}`,
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · <a href="https://www.geoapify.com/">Geoapify</a>',
        maxZoom: 20,
      },
    ).addTo(map);

    const failedTiles = new Set();
    const getTileKey = ({ coords }) => {
      if (!coords) return null;
      return `${coords.z}:${coords.x}:${coords.y}`;
    };
    const clearTileErrors = () => {
      failedTiles.clear();
      setMapError("");
    };
    const handleTileError = (event) => {
      const key = getTileKey(event);
      if (!key || !event.tile?.isConnected || event.coords.z !== map.getZoom()) return;

      failedTiles.add(key);
      setMapError("Một số ô bản đồ chưa tải được. Hãy thử di chuyển hoặc thay đổi mức thu phóng.");
    };
    const handleTileLoad = (event) => {
      const key = getTileKey(event);
      if (!key || !failedTiles.delete(key)) return;

      if (failedTiles.size === 0) setMapError("");
    };
    const handleMapMoveStart = () => {
      clearTileErrors();
    };
    tiles.on("tileerror", handleTileError);
    tiles.on("tileload", handleTileLoad);
    map.on("movestart", handleMapMoveStart);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });

    mapRef.current = map;
    markersRef.current = markers;
    setMapError("");

    resizeObserver.observe(containerRef.current);
    requestAnimationFrame(() => map.invalidateSize({ pan: false }));

    return () => {
      resizeObserver.disconnect();
      tiles.off("tileerror", handleTileError);
      tiles.off("tileload", handleTileLoad);
      map.off("movestart", handleMapMoveStart);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();
    const points = [];

    if (location) {
      const userPoint = [location.latitude, location.longitude];
      points.push(userPoint);
      L.circle(userPoint, {
        radius: radiusMeters,
        color: "#168448",
        fillColor: "#16a34a",
        fillOpacity: 0.08,
        weight: 1,
      }).addTo(markers);
      L.circleMarker(userPoint, {
        radius: 8,
        color: "#fff",
        weight: 3,
        fillColor: "#087c3d",
        fillOpacity: 1,
      })
        .bindPopup("Vị trí của bạn")
        .addTo(markers);
    }

    shops.forEach((shop) => {
      if (!Number.isFinite(shop.latitude) || !Number.isFinite(shop.longitude)) return;

      const point = [shop.latitude, shop.longitude];
      points.push(point);
      L.circleMarker(point, {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: "#e97728",
        fillOpacity: 1,
      })
        .bindPopup(createShopPopup(shop))
        .addTo(markers);
    });

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 });
    } else if (location) {
      map.setView([location.latitude, location.longitude], 14);
    } else {
      map.setView(DEFAULT_CENTER, 5);
    }
  }, [location, radiusMeters, shops]);

  if (!GEOAPIFY_API_KEY) {
    return (
      <div className="places-map-wrapper places-map-error" role="status">
        <div>
          <strong>Chưa cấu hình Geoapify API key cho frontend</strong>
          <span>Thêm VITE_GEOAPIFY_API_KEY vào Front_End/.env.local rồi khởi động lại Vite.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="places-map-wrapper">
      <div
        ref={containerRef}
        className="places-interactive-map"
        aria-label="Bản đồ các địa điểm ăn chay gần bạn"
      />
      {mapError && <div className="places-map-error" role="alert">{mapError}</div>}
    </div>
  );
}

export default PlacesMap;
