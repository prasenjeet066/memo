import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";
import world from "@/lib/countries-110m.json";

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name: string }>;

type GlobeChartProps = {
  width?: number;
  rotationSpeed?: number; // degrees per second
};

const GlobeChart: React.FC<GlobeChartProps> = ({ width = 928, rotationSpeed = 0.3  }) => {
  const ref = useRef<SVGSVGElement | null>(null);

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

    // Projection setup
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

    const path = d3.geoPath(projection);

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto; display: block; background: #e6f2ff;");

    // Draw sphere (ocean)
    svg
      .append("path")
      .datum({ type: "Sphere" })
      .attr("fill", "#a8d0e6") // ocean blue
      .attr("stroke", "#333")
      .attr("stroke-width", 0.2)
      .attr("d", path as any);

    // Color scale: subtle greens for land
    const color = d3
      .scaleSequential(d3.interpolateYlGn)
      .domain([0, countries.features.length]);

    // Draw countries
    const landGroup = svg
      .append("g")
      .selectAll("path")
      .data(countries.features)
      .join("path")
      .attr("fill", (_, i) => color(i))
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
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.6)
      .attr("opacity", 0.7)
      .attr("d", path as any);

    // Animation
    const velocity = rotationSpeed; // degrees per second
    const timer = d3.timer((elapsed) => {
      const rotation = projection.rotate();
      rotation[0] = (rotation[0] + (velocity * elapsed) / 1000) % 360;
      projection.rotate(rotation);

      svg.selectAll("path").attr("d", path as any);
    });

    return () => timer.stop();
  }, [width, rotationSpeed]);

  return <svg ref={ref} />;
};

export default GlobeChart;