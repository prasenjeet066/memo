import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";
import world from "@/lib/countries-110m.json";

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name: string }>;

type GlobeChartProps = {
  width?: number;
  rotationSpeed?: number;
  SearchCountry?: string;
};

const GlobeChart: React.FC<GlobeChartProps> = ({
  width = 928,
  rotationSpeed = 0.3,
  SearchCountry,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const pathRef = useRef<d3.GeoPath<any, d3.GeoPermissibleObjects> | null>(null);
  const timerRef = useRef<d3.Timer | null>(null);
  const currentCountryRef = useRef<string | null>(null);

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

    const projection = d3
      .geoOrthographic()
      .fitExtent(
        [
          [2, marginTop + 2],
          [width - 2, height],
        ],
        { type: "Sphere" }
      )
      .rotate([0, -10])
      .scale(width / 3.3);

    projectionRef.current = projection;
    const path = d3.geoPath(projection);
    pathRef.current = path;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto; display: block;");

    // Grouping layers
    const globeGroup = svg.append("g").attr("class", "globe-group");
    const countriesGroup = globeGroup.append("g").attr("class", "countries");

    // Sphere (the Earth outline)
    globeGroup
      .append("path")
      .datum({ type: "Sphere" })
      .attr("class", "earth")
      .attr("fill", "#00111a")
      .attr("stroke", "#222")
      .attr("stroke-width", 0.2)
      .attr("d", path as any);

    // Countries
    countriesGroup
      .selectAll("path")
      .data(countries.features)
      .join("path")
      .attr("class", "country")
      .attr("fill", "#444")
      .attr("stroke", "white")
      .attr("stroke-width", 0.4)
      .attr("d", path as any)
      .append("title")
      .text((d) => d.properties.name);

    // Borders
    globeGroup
      .append("path")
      .datum(countrymesh)
      .attr("fill", "none")
      .attr("stroke", "#333")
      .attr("stroke-width", 0.3)
      .attr("d", path as any);

    // Continuous rotation
    const velocity = rotationSpeed;
    const timer = d3.timer((elapsed) => {
      const rotation = projection.rotate();
      rotation[0] = (rotation[0] + (velocity * elapsed) / 1000) % 360;
      projection.rotate(rotation);
      svg.selectAll("path").attr("d", path as any);
    });
    timerRef.current = timer;

    return () => timer.stop();
  }, [width, rotationSpeed]);

  // Search & zoom logic
  useEffect(() => {
    const svg = d3.select(ref.current);
    const projection = projectionRef.current;
    const path = pathRef.current;
    if (!projection || !path) return;

    const baseScale = width / 3.3;
    const earth = svg.select(".earth");
    const countries = svg.selectAll<SVGPathElement, CountryFeature>(".country");

    const resumeRotation = () => {
      timerRef.current?.restart((elapsed) => {
        const rotation = projection.rotate();
        rotation[0] = (rotation[0] + (rotationSpeed * elapsed) / 1000) % 360;
        projection.rotate(rotation);
        svg.selectAll("path").attr("d", path as any);
      });
    };

    // Reset to normal globe
    if (!SearchCountry) {
      currentCountryRef.current = null;
      d3.transition()
        .duration(1500)
        .tween("zoomOut", () => {
          const interpScale = d3.interpolate(projection.scale(), baseScale);
          return (t) => {
            projection.scale(interpScale(t));
            svg.selectAll("path").attr("d", path as any);
          };
        })
        .on("start", () => {
          earth.transition().duration(1000).attr("opacity", 1);
          countries
            .transition()
            .duration(1000)
            .attr("opacity", 1)
            .attr("fill", "#444");
        })
        .on("end", resumeRotation);
      return;
    }

    // Stop rotation
    timerRef.current?.stop();

    import("@/lib/countries-110m.json").then((worldData) => {
      const countryData = feature(worldData as any, (worldData as any).objects.countries)
        .features as CountryFeature[];

      const match = countryData.find(
        (d) => d.properties.name.toLowerCase() === SearchCountry.toLowerCase()
      );
      if (!match) return;

      const centroid = d3.geoCentroid(match);
      const currentRotate = projection.rotate();
      const targetRotate: [number, number, number] = [-centroid[0], -centroid[1], 0];
      const r = d3.interpolate(currentRotate, targetRotate);

      // Step 1: fade out everything
      earth.transition().duration(800).attr("opacity", 0);
      countries
        .transition()
        .duration(800)
        .attr("opacity", (d) =>
          d.properties.name.toLowerCase() === SearchCountry.toLowerCase() ? 1 : 0
        )
        .attr("fill", (d) =>
          d.properties.name.toLowerCase() === SearchCountry.toLowerCase() ? "#00bfff" : "#444"
        );

      // Step 2: rotate and zoom in on selected country
      const zoomIn = d3.interpolate(projection.scale(), baseScale * 2.4); // much closer zoom
      d3.transition()
        .duration(2000)
        .tween("focus", () => {
          return (t) => {
            projection.rotate(r(t)).scale(zoomIn(t));
            svg.selectAll("path").attr("d", path as any);
          };
        });

      currentCountryRef.current = SearchCountry.toLowerCase();
    });
  }, [SearchCountry, width, rotationSpeed]);

  return <svg ref={ref} />;
};

export default GlobeChart;