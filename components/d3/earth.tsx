import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";
import world from "@/lib/countries-110m.json"; // TopoJSON file

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name: string }>;

type GlobeChartProps = {
  width?: number;
};

const GlobeChart: React.FC<GlobeChartProps> = ({ width = 928 }) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const marginTop = 46;
    const height = width / 2 + marginTop;

    // Clear previous render
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    // Convert TopoJSON → GeoJSON
    const countries = feature(world as any, (world as any).objects.countries) as {
      type: "FeatureCollection";
      features: CountryFeature[];
    };

    const countrymesh = mesh(world as any, (world as any).objects.countries, (a, b) => a !== b);

    // Projection and path
    const projection = d3
      .geoOrthographic()
      .fitExtent(
        [
          [2, marginTop + 2],
          [width - 2, height],
        ],
        { type: "Sphere" }
      );

    const path = d3.geoPath(projection);

    // SVG setup
    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto; display: block;");

    // Base sphere
    svg
      .append("path")
      .datum({ type: "Sphere" })
      .attr("fill", "#f1f1f1")
      .attr("stroke", "currentColor")
      .attr("d", path as any);

    // Countries (neutral fill)
    svg
      .append("g")
      .selectAll("path")
      .data(countries.features)
      .join("path")
      .attr("fill", "#e0e0e0")
      .attr("stroke", "#999")
      .attr("stroke-width", 0.3)
      .attr("d", path as any)
      .append("title")
      .text((d) => d.properties.name);

    // Country borders (mesh)
    svg
      .append("path")
      .datum(countrymesh)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .attr("d", path as any);
  }, [width]);

  return <svg ref={ref} />;
};

export default GlobeChart;