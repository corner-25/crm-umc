"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { geoMercator, geoPath } from "d3-geo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Activity, Pill, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const GEO_PROVINCES = "/vietnam-provinces.geojson";
const WARDS_BY_PROVINCE = (province: string) => `/wards/${encodeURIComponent(province)}.json`;

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

interface TooltipState { x: number; y: number; province: string; ward?: string; tripCount?: number }

const WIDTH = 600;
const HEIGHT = 750;

function WardMap({
  province,
  selectedData,
  setTooltip,
}: {
  province: string;
  selectedData: ProvinceStats | null;
  setTooltip: (t: TooltipState | null) => void;
}) {
  const [wardsData, setWardsData] = useState<any>(null);

  useEffect(() => {
    setWardsData(null);
    fetch(WARDS_BY_PROVINCE(province))
      .then(r => r.ok ? r.json() : null)
      .then(setWardsData)
      .catch(() => setWardsData(null));
  }, [province]);

  const wardCount: Record<string, number> = {};
  (selectedData?.trips || []).forEach((t) => {
    if (t.ward) wardCount[t.ward] = (wardCount[t.ward] || 0) + 1;
  });

  const paths = useMemo(() => {
    if (!wardsData?.features?.length) return null;
    const collection = { type: "FeatureCollection", features: wardsData.features };
    const projection = geoMercator().fitExtent(
      [[20, 20], [WIDTH - 20, HEIGHT - 20]],
      collection as any
    );
    const pathGen = geoPath(projection);
    return wardsData.features.map((f: any, i: number) => ({
      d: pathGen(f) || "",
      ward: f.properties.ten_xa as string,
      key: `${f.properties.ma_xa || i}`,
    }));
  }, [wardsData]);

  if (!wardsData) {
    return (
      <div className="flex items-center justify-center" style={{ height: 500 }}>
        <p className="text-sm text-muted-foreground">Đang tải bản đồ phường xã...</p>
      </div>
    );
  }

  if (!paths || paths.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: 500 }}>
        <p className="text-sm text-muted-foreground">Không tìm thấy dữ liệu phường xã cho {province}</p>
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ height: "100%", width: "auto", maxWidth: "100%" }}
    >
      {paths.map((p: { d: string; ward: string; key: string }) => {
        const count = wardCount[p.ward] || 0;
        return (
          <path
            key={p.key}
            d={p.d}
            fill={getTripColor(count)}
            stroke="#fff"
            strokeWidth={0.3}
            style={{ cursor: "pointer", outline: "none" }}
            onMouseEnter={(e) => {
              const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
              setTooltip({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                province,
                ward: p.ward,
                tripCount: count,
              });
            }}
            onMouseLeave={() => setTooltip(null)}
            onMouseOver={(e) => { (e.target as SVGPathElement).style.opacity = "0.7"; }}
            onMouseOut={(e) => { (e.target as SVGPathElement).style.opacity = "1"; }}
          />
        );
      })}
    </svg>
  );
}

export default function VietnamMapWidget() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Map */}
      <div className="lg:col-span-2 min-h-0">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Bản đồ Việt Nam — Tần suất chuyến đi từ thiện
              </CardTitle>
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
            </div>
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
          </CardHeader>
          <CardContent className="relative p-0 flex-1 min-h-0 overflow-hidden">
            {selected && (
              <div className="absolute top-2 left-2 z-20">
                <button
                  onClick={() => setSelected(null)}
                  className="bg-white border rounded-md px-3 py-1.5 text-xs font-medium shadow hover:bg-gray-50"
                >
                  ← Quay lại bản đồ tỉnh
                </button>
              </div>
            )}
            <div className="relative h-full flex items-center justify-center">
              {selected ? (
                <WardMap
                  province={selected}
                  selectedData={selectedData}
                  setTooltip={setTooltip}
                />
              ) : (
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ center: [106, 16], scale: 2200 }}
                  width={600}
                  height={800}
                  style={{ height: "100%", width: "auto", maxWidth: "100%" }}
                >
                  <Geographies geography={GEO_PROVINCES}>
                    {({ geographies }: { geographies: any[] }) =>
                      geographies.map((geo: any) => {
                        const name = geo.properties.ten_tinh as string;
                        const stats = statsMap[name];
                        const count = stats?.tripCount ?? 0;
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={getTripColor(count)}
                            stroke="#fff"
                            strokeWidth={0.5}
                            style={{
                              default: { outline: "none", cursor: "pointer" },
                              hover: { outline: "none", opacity: 0.8, cursor: "pointer" },
                              pressed: { outline: "none" },
                            }}
                            onClick={() => setSelected(name)}
                            onMouseEnter={(e: React.MouseEvent<SVGPathElement>) => {
                              const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
                              setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, province: name });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ComposableMap>
              )}

              {tooltip && (
                <div
                  className="absolute z-10 bg-white border rounded-lg shadow-lg p-3 text-sm pointer-events-none min-w-[180px]"
                  style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
                >
                  {tooltip.ward ? (
                    <>
                      <p className="font-semibold text-gray-800">{tooltip.ward}</p>
                      <p className="text-xs text-muted-foreground">{tooltip.province}</p>
                      {(tooltip.tripCount || 0) > 0 ? (
                        <p className="text-red-600 font-medium mt-1">{tooltip.tripCount} chuyến đi</p>
                      ) : (
                        <p className="text-gray-400 mt-1">Chưa có chuyến đi</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-800">{tooltip.province}</p>
                      {statsMap[tooltip.province] ? (
                        <>
                          <p className="text-red-600 font-medium">{statsMap[tooltip.province].tripCount} chuyến đi</p>
                          <p className="text-gray-500">{statsMap[tooltip.province].totalPatients} người bệnh</p>
                          <p className="text-gray-500">{formatCurrency(statsMap[tooltip.province].totalMedicineCost)}</p>
                          <p className="text-xs text-blue-500 mt-1">Click để xem chi tiết</p>
                        </>
                      ) : (
                        <p className="text-gray-400">Chưa có chuyến đi</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right panel */}
      <div className="flex flex-col gap-3 min-h-0">
        <Card className="flex-shrink-0">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">Top 5 tỉnh đi nhiều nhất</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pb-3">
            {isLoading && <p className="text-xs text-muted-foreground text-center py-2">Đang tải...</p>}
            {!isLoading && top5.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Chưa có dữ liệu</p>}
            {top5.map((p, i) => (
              <div
                key={p.province}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  selected === p.province ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelected(selected === p.province ? null : p.province)}
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
          <Card className="border-blue-200 flex-1 min-h-0 flex flex-col">
            <CardHeader className="pb-2 pt-3 flex-shrink-0">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{selected}</span>
                <Badge style={{ backgroundColor: getTripColor(selectedData.tripCount) }} className="text-white border-0">
                  {selectedData.tripCount} chuyến
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 min-h-0 overflow-y-auto pb-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <p className="text-base font-bold text-red-600">{selectedData.totalPatients}</p>
                  <p className="text-[10px] text-muted-foreground">Người bệnh</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-xs font-bold text-blue-600">{formatCurrency(selectedData.totalMedicineCost)}</p>
                  <p className="text-[10px] text-muted-foreground">Chi phí thuốc</p>
                </div>
              </div>
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
                <div className="space-y-1">
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
          <Card className="border-dashed flex-1 min-h-0">
            <CardContent className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Click vào tỉnh trên bản đồ<br />để xem chi tiết</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
