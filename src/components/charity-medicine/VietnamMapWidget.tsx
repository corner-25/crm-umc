"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { geoMercator, geoPath } from "d3-geo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Activity, Pill, Users, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const GEO_URL = "/vietnam-provinces.geojson";

interface ProvinceStats {
  province: string;
  tripCount: number;
  totalPatients: number;
  totalMedicineCost: number;
  districts: string[];
  wards: string[];
  lastVisit: string | null;
  trips: { tripCode: string; date: string; district: string; ward: string; patients: number; cost: number }[];
}

function getTripColor(count: number) {
  if (count === 0) return "#e5e7eb";
  if (count === 1) return "#fca5a5";
  if (count === 2) return "#f87171";
  if (count <= 4) return "#ef4444";
  return "#b91c1c";
}

function getWardColor(count: number) {
  if (count === 0) return "#e5e7eb";
  if (count === 1) return "#bfdbfe";
  if (count === 2) return "#93c5fd";
  if (count <= 4) return "#3b82f6";
  return "#1d4ed8";
}


const WARD_MAP_W = 600;
const WARD_MAP_H = 700;

function WardDrillDown({
  province,
  stats,
  onBack,
}: {
  province: string;
  stats: ProvinceStats | undefined;
  onBack: () => void;
}) {
  const [wardGeo, setWardGeo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch("/wards/index.json")
      .then((r) => r.json())
      .then((index: Record<string, { file: string }>) => {
        const entry = index[province];
        if (!entry) throw new Error("No ward file");
        return fetch(`/wards/${entry.file}`);
      })
      .then((r) => r.json())
      .then((geo) => { setWardGeo(geo); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [province]);

  const wardTripCount = useMemo(() => {
    const m: Record<string, number> = {};
    (stats?.trips || []).forEach((t) => {
      if (t.ward) m[t.ward] = (m[t.ward] || 0) + 1;
    });
    return m;
  }, [stats]);

  const paths = useMemo(() => {
    if (!wardGeo?.features?.length) return null;
    const features = wardGeo.features.map((f: any) => {
      const clone = JSON.parse(JSON.stringify(f));
      const g = clone.geometry;
      if (g.type === "Polygon") {
        g.coordinates[0] = [...g.coordinates[0]].reverse();
      } else if (g.type === "MultiPolygon") {
        g.coordinates = g.coordinates.map((poly: number[][][]) => {
          const r = [...poly];
          r[0] = [...r[0]].reverse();
          return r;
        });
      }
      return clone;
    });
    const fc = { type: "FeatureCollection", features } as any;
    const projection = geoMercator().fitExtent(
      [[10, 10], [WARD_MAP_W - 10, WARD_MAP_H - 10]],
      fc
    );
    const pathGen = geoPath(projection);
    return features.map((f: any, i: number) => ({
      d: pathGen(f) || "",
      name: f.properties.ten_xa as string,
      key: f.properties.ma_xa || i,
    }));
  }, [wardGeo]);

  if (loading) return <div className="flex items-center justify-center h-[600px] text-sm text-muted-foreground">Đang tải bản đồ phường xã...</div>;
  if (error || !paths) return <div className="flex items-center justify-center h-[600px] text-sm text-red-500">Không có dữ liệu bản đồ cho tỉnh này</div>;

  return (
    <div className="relative">
      <button onClick={onBack} className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-white border rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-gray-50 shadow-sm">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>
      <div className="text-center pt-2 pb-1">
        <p className="text-sm font-semibold text-gray-700">{province} — Bản đồ phường xã</p>
      </div>
      <div className="relative" id="ward-map-container" style={{ width: "100%", maxWidth: WARD_MAP_W, margin: "0 auto" }}>
        <svg width="100%" viewBox={`0 0 ${WARD_MAP_W} ${WARD_MAP_H}`} style={{ display: "block" }}>
          {paths.map((p: any) => {
            const count = wardTripCount[p.name] || 0;
            return (
              <path
                key={p.key}
                d={p.d}
                fill={getWardColor(count)}
                stroke="#fff"
                strokeWidth={0.5}
                style={{ cursor: "default" }}
              />
            );
          })}
        </svg>
      </div>
      <div className="flex gap-3 flex-wrap justify-center pt-2 pb-1">
        {[
          { color: "#e5e7eb", label: "Chưa đến" },
          { color: "#bfdbfe", label: "1 chuyến" },
          { color: "#93c5fd", label: "2 chuyến" },
          { color: "#3b82f6", label: "3–4 chuyến" },
          { color: "#1d4ed8", label: "5+ chuyến" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VietnamMapWidget() {
  const [selected, setSelected] = useState<string | null>(null);
  const [drillProvince, setDrillProvince] = useState<string | null>(null);
  const [year, setYear] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["charity-medicine-by-province", year],
    queryFn: async () => {
      const params = year !== "all" ? `?year=${year}` : "";
      const res = await fetch(`/api/charity-medicine/stats/by-province${params}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data as ProvinceStats[];
    },
  });

  const statsMap: Record<string, ProvinceStats> = {};
  (data || []).forEach(p => { statsMap[p.province] = p; });

  const top5 = (data || []).slice(0, 5);
  const selectedData = selected ? statsMap[selected] : null;

  const handleProvinceClick = useCallback((name: string) => {
    setDrillProvince(name);
    setSelected(name);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Bản đồ Việt Nam — Tần suất chuyến đi từ thiện
              </CardTitle>
              {!drillProvince && (
                <div className="flex gap-1">
                  {["all", "2024", "2025", "2026"].map((y) => (
                    <button
                      key={y}
                      onClick={() => setYear(y)}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        year === y
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {y === "all" ? "Tất cả" : y}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!drillProvince && (
              <div className="flex gap-3 flex-wrap pt-1">
                {[
                  { color: "#e5e7eb", label: "Chưa đến" },
                  { color: "#fca5a5", label: "1 chuyến" },
                  { color: "#f87171", label: "2 chuyến" },
                  { color: "#ef4444", label: "3–4 chuyến" },
                  { color: "#b91c1c", label: "5+ chuyến" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="relative p-0">
            {drillProvince ? (
              <WardDrillDown
                province={drillProvince}
                stats={statsMap[drillProvince]}
                onBack={() => setDrillProvince(null)}
              />
            ) : (
              <div className="relative">
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ center: [106, 16], scale: 2200 }}
                  width={600}
                  height={750}
                  style={{ width: "100%", height: "auto" }}
                >
                  <Geographies geography={GEO_URL}>
                    {({ geographies }: { geographies: any[] }) =>
                      geographies.map((geo: any) => {
                        const name = geo.properties.ten_tinh as string;
                        const stats = statsMap[name];
                        const count = stats?.tripCount ?? 0;
                        const isSelected = selected === name;
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={isSelected ? "#1d4ed8" : getTripColor(count)}
                            stroke="#fff"
                            strokeWidth={0.5}
                            style={{
                              default: { outline: "none", cursor: "pointer" },
                              hover: { outline: "none", opacity: 0.8, cursor: "pointer" },
                              pressed: { outline: "none" },
                            }}
                            onClick={() => handleProvinceClick(name)}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ComposableMap>

              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 5 tỉnh đi nhiều nhất</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && <p className="text-xs text-muted-foreground text-center py-2">Đang tải...</p>}
            {!isLoading && top5.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Chưa có dữ liệu</p>}
            {top5.map((p, i) => (
              <div
                key={p.province}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  selected === p.province ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                }`}
                onClick={() => { setSelected(selected === p.province ? null : p.province); setDrillProvince(null); }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: getTripColor(p.tripCount) }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.province}</p>
                  <p className="text-xs text-muted-foreground">{p.totalPatients} người bệnh</p>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {p.tripCount} chuyến
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {selected && selectedData ? (
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{selected}</span>
                <Badge style={{ backgroundColor: getTripColor(selectedData.tripCount) }} className="text-white border-0">
                  {selectedData.tripCount} chuyến
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <Users className="h-4 w-4 text-red-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-red-600">{selectedData.totalPatients}</p>
                  <p className="text-xs text-muted-foreground">Người bệnh</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <Pill className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-blue-600">{formatCurrency(selectedData.totalMedicineCost)}</p>
                  <p className="text-xs text-muted-foreground">Chi phí thuốc</p>
                </div>
              </div>
              {!drillProvince && (
                <button
                  onClick={() => setDrillProvince(selected)}
                  className="w-full py-2 px-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Xem bản đồ phường xã →
                </button>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">HUYỆN ĐÃ ĐẾN</p>
                <div className="flex flex-wrap gap-1">
                  {selectedData.districts.map((d) => (
                    <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">LỊCH SỬ CHUYẾN ĐI</p>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {selectedData.trips.map((t) => (
                    <div key={t.tripCode} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                      <div>
                        <span className="font-medium text-blue-600">{t.tripCode}</span>
                        <span className="text-muted-foreground ml-2">{t.district}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-600">{t.date}</p>
                        <p className="text-muted-foreground">{t.patients} BN</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Click vào tỉnh trên bản đồ<br />để xem chi tiết</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
