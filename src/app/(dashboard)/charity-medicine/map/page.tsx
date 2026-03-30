"use client";

import { useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Activity, Pill, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const GEO_URL = "/vietnam-provinces.geojson";

// Mock data - sau này thay bằng API thật
const MOCK_STATS: Record<string, {
  tripCount: number;
  totalPatients: number;
  totalMedicineCost: number;
  districts: string[];
  trips: { tripCode: string; date: string; district: string; patients: number; cost: number }[];
}> = {
  "An Giang": {
    tripCount: 5,
    totalPatients: 420,
    totalMedicineCost: 28500000,
    districts: ["Long Xuyên", "Châu Đốc", "Thoại Sơn"],
    trips: [
      { tripCode: "CT-001", date: "12/01/2026", district: "Long Xuyên", patients: 90, cost: 6000000 },
      { tripCode: "CT-008", date: "05/03/2026", district: "Châu Đốc", patients: 85, cost: 5500000 },
      { tripCode: "CT-014", date: "20/02/2026", district: "Thoại Sơn", patients: 82, cost: 5800000 },
      { tripCode: "CT-021", date: "10/01/2026", district: "Long Xuyên", patients: 88, cost: 5700000 },
      { tripCode: "CT-027", date: "03/12/2025", district: "Châu Đốc", patients: 75, cost: 5500000 },
    ],
  },
  "Đồng Tháp": {
    tripCount: 3,
    totalPatients: 240,
    totalMedicineCost: 16000000,
    districts: ["Cao Lãnh", "Sa Đéc"],
    trips: [
      { tripCode: "CT-003", date: "15/02/2026", district: "Cao Lãnh", patients: 90, cost: 6000000 },
      { tripCode: "CT-011", date: "10/01/2026", district: "Sa Đéc", patients: 80, cost: 5000000 },
      { tripCode: "CT-019", date: "05/11/2025", district: "Cao Lãnh", patients: 70, cost: 5000000 },
    ],
  },
  "Cần Thơ": {
    tripCount: 4,
    totalPatients: 310,
    totalMedicineCost: 21000000,
    districts: ["Ninh Kiều", "Bình Thuỷ", "Cờ Đỏ"],
    trips: [
      { tripCode: "CT-002", date: "20/03/2026", district: "Ninh Kiều", patients: 85, cost: 5500000 },
      { tripCode: "CT-009", date: "12/02/2026", district: "Bình Thuỷ", patients: 80, cost: 5200000 },
      { tripCode: "CT-015", date: "08/01/2026", district: "Cờ Đỏ", patients: 75, cost: 5000000 },
      { tripCode: "CT-022", date: "14/12/2025", district: "Ninh Kiều", patients: 70, cost: 5300000 },
    ],
  },
  "Đắk Lắk": {
    tripCount: 2,
    totalPatients: 150,
    totalMedicineCost: 9500000,
    districts: ["Buôn Ma Thuột", "Krông Buk"],
    trips: [
      { tripCode: "CT-005", date: "18/02/2026", district: "Buôn Ma Thuột", patients: 80, cost: 5000000 },
      { tripCode: "CT-016", date: "22/01/2026", district: "Krông Buk", patients: 70, cost: 4500000 },
    ],
  },
  "Đồng Nai": {
    tripCount: 2,
    totalPatients: 180,
    totalMedicineCost: 11000000,
    districts: ["Biên Hoà", "Long Thành"],
    trips: [
      { tripCode: "CT-006", date: "25/03/2026", district: "Biên Hoà", patients: 95, cost: 6000000 },
      { tripCode: "CT-017", date: "14/02/2026", district: "Long Thành", patients: 85, cost: 5000000 },
    ],
  },
  "Gia Lai": {
    tripCount: 1,
    totalPatients: 80,
    totalMedicineCost: 4800000,
    districts: ["Pleiku"],
    trips: [
      { tripCode: "CT-007", date: "01/03/2026", district: "Pleiku", patients: 80, cost: 4800000 },
    ],
  },
};

function getTripColor(tripCount: number): string {
  if (tripCount === 0) return "#e5e7eb";
  if (tripCount === 1) return "#fca5a5";
  if (tripCount === 2) return "#f87171";
  if (tripCount <= 4) return "#ef4444";
  return "#b91c1c";
}

function getTripLabel(tripCount: number): string {
  if (tripCount === 0) return "Chưa đến";
  if (tripCount === 1) return "1 chuyến";
  if (tripCount === 2) return "2 chuyến";
  if (tripCount <= 4) return `${tripCount} chuyến`;
  return `${tripCount} chuyến (nhiều)`;
}

interface TooltipState {
  x: number;
  y: number;
  province: string;
}

export default function VietnamMapPage() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const top5 = Object.entries(MOCK_STATS)
    .sort((a, b) => b[1].tripCount - a[1].tripCount)
    .slice(0, 5);

  const selectedData = selected ? MOCK_STATS[selected] : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="h-6 w-6 text-red-500" />
        <div>
          <h1 className="text-2xl font-bold">Bản đồ hoạt động từ thiện</h1>
          <p className="text-muted-foreground text-sm">Phân bổ chuyến đi theo tỉnh thành</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Bản đồ Việt Nam — Tần suất chuyến đi
              </CardTitle>
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
            <CardContent className="relative p-0">
              <div className="relative">
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ center: [106, 16], scale: 2000 }}
                  width={600}
                  height={700}
                  style={{ width: "100%", height: "auto" }}
                >
                    <Geographies geography={GEO_URL}>
                      {({ geographies }: { geographies: any[] }) =>
                        geographies.map((geo: any) => {
                          const name = geo.properties.ten_tinh as string;
                          const stats = MOCK_STATS[name];
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
                                default: { outline: "none", cursor: count > 0 ? "pointer" : "default" },
                                hover: { outline: "none", opacity: 0.8, cursor: "pointer" },
                                pressed: { outline: "none" },
                              }}
                              onClick={() => setSelected(selected === name ? null : name)}
                              onMouseEnter={(e: React.MouseEvent<SVGPathElement>) => {
                                const rect = (e.target as SVGElement)
                                  .closest("svg")!
                                  .getBoundingClientRect();
                                setTooltip({
                                  x: e.clientX - rect.left,
                                  y: e.clientY - rect.top,
                                  province: name,
                                });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            />
                          );
                        })
                      }
                    </Geographies>
                </ComposableMap>

                {/* Tooltip */}
                {tooltip && (
                  <div
                    className="absolute z-10 bg-white border rounded-lg shadow-lg p-3 text-sm pointer-events-none min-w-[180px]"
                    style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
                  >
                    <p className="font-semibold text-gray-800">{tooltip.province}</p>
                    {MOCK_STATS[tooltip.province] ? (
                      <>
                        <p className="text-red-600 font-medium">
                          {getTripLabel(MOCK_STATS[tooltip.province].tripCount)}
                        </p>
                        <p className="text-gray-500">
                          {MOCK_STATS[tooltip.province].totalPatients} bệnh nhân
                        </p>
                        <p className="text-gray-500">
                          {formatCurrency(MOCK_STATS[tooltip.province].totalMedicineCost)}
                        </p>
                        <p className="text-xs text-blue-500 mt-1">Click để xem chi tiết</p>
                      </>
                    ) : (
                      <p className="text-gray-400">Chưa có chuyến đi</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Top 5 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top 5 tỉnh đi nhiều nhất</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {top5.map(([name, data], i) => (
                <div
                  key={name}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    selected === name ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelected(selected === name ? null : name)}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: getTripColor(data.tripCount) }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">{data.totalPatients} bệnh nhân</p>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {data.tripCount} chuyến
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Detail panel */}
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
                    <p className="text-xs text-muted-foreground">Bệnh nhân</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <Pill className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-blue-600">{formatCurrency(selectedData.totalMedicineCost)}</p>
                    <p className="text-xs text-muted-foreground">Chi phí thuốc</p>
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
    </div>
  );
}
