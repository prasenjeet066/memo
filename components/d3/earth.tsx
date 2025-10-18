import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";
import world from "@/lib/countries-110m.json";

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name: string }>;

type GlobeChartProps = {
  width?: number;
  rotationSpeed?: number; // degrees per second
  SearchCountry?: string;
};

const GlobeChart: React.FC<GlobeChartProps> = ({
  width = 928,
  rotationSpeed = 0.3,
  SearchCountry,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const timerRef = useRef<d3.Timer | null>(null);

  useEffect(() => {
    const marginTop = 46;
    const height = width / 2 + marginTop;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const countries = feature(world as any, (world as any).objects.countries) as {
      type: "FeatureCollection";
      features: CountryFeature[];
    };

    const countrymesh = mesh(world as any, (world as any).objects.countries, (a, b) => a !== b);

    // Setup projection
    const projection = d3
      .geoOrthographic()
      .fitExtent(
        [
          [2, marginTop + 2],
          [width - 2, height],
        ],
        { type: "Sphere" }
      )
      .rotate([0, -10]);

    projectionRef.current = projection;

    const path = d3.geoPath(projection);

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto; display: block;");

    // Sphere (globe outline)
    svg
      .append("path")
      .datum({ type: "Sphere" })
      .attr("fill", "none")
      .attr("stroke", "#333")
      .attr("stroke-width", 0.2)
      .attr("d", path as any);

    // Countries
    svg
      .append("g")
      .selectAll("path")
      .data(countries.features)
      .join("path")
      .attr("fill", "#333")
      .attr("stroke", "white")
      .attr("stroke-width", 0.4)
      .attr("d", path as any)
      .append("title")
      .text((d) => d.properties.name);

    // Borders
    svg
      .append("path")
      .datum(countrymesh)
      .attr("fill", "none")
      .attr("stroke", "none")
      .attr("stroke-width", 0.6)
      .attr("opacity", 0.9)
      .attr("d", path as any);

    // Continuous rotation
    const velocity = rotationSpeed; // degrees per second
    const timer = d3.timer((elapsed) => {
      const rotation = projection.rotate();
      rotation[0] = (rotation[0] + (velocity * elapsed) / 1000) % 360;
      projection.rotate(rotation);
      svg.selectAll("path").attr("d", path as any);
    });

    timerRef.current = timer;

    return () => timer.stop();
  }, [width, rotationSpeed]);

  // Focus on searched country
  useEffect(() => {
    const svg = d3.select(ref.current);
    const projection = projectionRef.current;
    const path = d3.geoPath(projection!);

    if (!SearchCountry || !projection) {
      // Resume normal rotation if cleared
      timerRef.current?.restart(() => {}, 0);
      return;
    }

    import("@/lib/countries-110m.json").then((worldData) => {
      const countries = feature(worldData as any, (worldData as any).objects.countries)
        .features as CountryFeature[];

      const match = countries.find(
        (d) => d.properties.name.toLowerCase() === SearchCountry.toLowerCase()
      );

      if (!match) return;

      // Compute the centroid of the selected country
      const centroid = d3.geoCentroid(match);

      // Stop rotation while focusing
      timerRef.current?.stop();

      // Animate rotation to focus on the country
      d3.transition()
        .duration(2000)
        .tween("rotate", () => {
          const currentRotate = projection.rotate();
          const targetRotate: [number, number, number] = [
            -centroid[0],
            -centroid[1],
            0,
          ];

          const r = d3.interpolate(currentRotate, targetRotate);

          return (t) => {
            projection.rotate(r(t));
            svg.selectAll("path").attr("d", path as any);
          };
        });
    });
  }, [SearchCountry]);

  return <svg ref={ref} />;
};

export default GlobeChart;