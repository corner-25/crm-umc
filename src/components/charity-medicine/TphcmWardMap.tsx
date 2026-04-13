"use client";

import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";

const W = 900;
const H = 800;

function reverseWinding(feature: any) {
  const g = feature.geometry;
  const reversed = (coords: number[][]) => [...coords].reverse();
  if (g.type === "Polygon") {
    g.coordinates = g.coordinates.map((ring: number[][], i: number) =>
      i === 0 ? reversed(ring) : ring
    );
  } else if (g.type === "MultiPolygon") {
    g.coordinates = g.coordinates.map((poly: number[][][]) =>
      poly.map((ring: number[][], i: number) =>
        i === 0 ? reversed(ring) : ring
      )
    );
  }
  return feature;
}

export default function TphcmWardMap() {
  const [geo, setGeo] = useState<any>(null);
  const [hover, setHover] = useState<{ x: number; y: number; name: string } | null>(null);

  useEffect(() => {
    fetch("/wards/tphcm.json")
      .then(r => r.json())
      .then(setGeo);
  }, []);

  const paths = useMemo(() => {
    if (!geo?.features?.length) return null;
    const features = geo.features
      .filter((f: any) => {
        let sy = 0, n = 0;
        const walk = (c: any) => typeof c[0] === "number" ? (sy += c[1], n++) : c.forEach(walk);
        walk(f.geometry.coordinates);
        return sy / n > 10;
      })
      .map((f: any) => reverseWinding(structuredClone(f)));

    const fc = { type: "FeatureCollection", features };
    const projection = geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], fc as any);
    const pathGen = geoPath(projection);
    return features.map((f: any, i: number) => ({
      d: pathGen(f) || "",
      name: f.properties.ten_xa as string,
      key: f.properties.ma_xa || i,
    }));
  }, [geo]);

  if (!paths) return <p>Đang tải...</p>;

  return (
    <div style={{ position: "relative", width: W, height: H, border: "1px solid #ccc" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {paths.map((p: any) => (
          <path
            key={p.key}
            d={p.d}
            fill="#dbeafe"
            stroke="#2563eb"
            strokeWidth={0.5}
            style={{ cursor: "pointer" }}
            onMouseEnter={(e) => {
              const rect = (e.target as SVGElement).closest("div")!.getBoundingClientRect();
              setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, name: p.name });
            }}
            onMouseMove={(e) => {
              const rect = (e.target as SVGElement).closest("div")!.getBoundingClientRect();
              setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, name: p.name });
            }}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {hover && (
        <div
          className="absolute z-10 bg-white border rounded shadow px-2 py-1 text-xs pointer-events-none"
          style={{ left: hover.x + 10, top: hover.y + 10 }}
        >
          {hover.name}
        </div>
      )}
    </div>
  );
}
