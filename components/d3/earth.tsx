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
  const pathRef = useRef<d3.GeoPath<any, d3.GeoPermissibleObjects> | null>(null);
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

    // Add subtle glow filter for highlight
    const defs = svg.append("defs");
    const glow = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    glow
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    const feMerge = glow.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Globe outline
    svg
      .append("path")
      .datum({ type: "Sphere" })
      .attr("fill", "none")
      .attr("stroke", "#333")
      .attr("stroke-width", 0.3)
      .attr("d", path as any);

    // Countries
    svg
      .append("g")
      .attr("class", "countries")
      .selectAll("path")
      .data(countries.features)
      .join("path")
      .attr("fill", "#444")
      .attr("stroke", "white")
      .attr("stroke-width", 0.4)
      .attr("class", "country")
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

  // Handle search & animation
  useEffect(() => {
    const svg = d3.select(ref.current);
    const projection = projectionRef.current;
    const path = pathRef.current;
    if (!projection || !path) return;

    const baseScale = width / 3.3;
    const highlightColor = "#00bfff";

    const allCountries = svg.selectAll<SVGPathElement, CountryFeature>(".countries path");

    const resetRotation = () => {
      timerRef.current?.restart((elapsed) => {
        const rotation = projection.rotate();
        rotation[0] = (rotation[0] + (rotationSpeed * elapsed) / 1000) % 360;
        projection.rotate(rotation);
        svg.selectAll("path").attr("d", path as any);
      });
    };

    // If no search, zoom out and resume rotation
    if (!SearchCountry) {
      currentCountryRef.current = null;
      d3.transition()
        .duration(1500)
        .tween("zoomOut", () => {
          const interp = d3.interpolate(projection.scale(), baseScale);
          return (t) => {
            projection.scale(interp(t));
            svg.selectAll("path").attr("d", path as any);
          };
        })
        .on("end", () => {
          allCountries
            .attr("filter", null)
            .transition()
            .duration(500)
            .attr("opacity", 1)
            .attr("fill", "#444");
          resetRotation();
        });
      return;
    }

    // If new country is same as current, do nothing
    if (currentCountryRef.current === SearchCountry.toLowerCase()) return;

    // Stop rotation while focusing
    timerRef.current?.stop();

    import("@/lib/countries-110m.json").then((worldData) => {
      const countries = feature(worldData as any, (worldData as any).objects.countries)
        .features as CountryFeature[];

      const match = countries.find(
        (d) => d.properties.name.toLowerCase() === SearchCountry.toLowerCase()
      );

      if (!match) return;

      const centroid = d3.geoCentroid(match);
      const currentRotate = projection.rotate();
      const targetRotate: [number, number, number] = [-centroid[0], -centroid[1], 0];
      const r = d3.interpolate(currentRotate, targetRotate);

      // Step 1: Zoom out before rotating to next country
      d3.transition()
        .duration(800)
        .tween("zoomOutBeforeSwitch", () => {
          const interpScale = d3.interpolate(projection.scale(), baseScale);
          return (t) => {
            projection.scale(interpScale(t));
            svg.selectAll("path").attr("d", path as any);
          };
        })
        .on("end", () => {
          // Step 2: Rotate + zoom into target country
          const zoomIn = d3.interpolate(projection.scale(), baseScale * 1.4);
          d3.transition()
            .duration(2000)
            .tween("focus", () => {
              return (t) => {
                projection.rotate(r(t)).scale(zoomIn(t));
                svg.selectAll("path").attr("d", path as any);
              };
            })
            .on("start", () => {
              // Highlight effect
              allCountries
                .transition()
                .duration(600)
                .attr("opacity", (d) =>
                  d.properties.name.toLowerCase() === SearchCountry.toLowerCase() ? 1 : 0.3
                )
                .attr("fill", (d) =>
                  d.properties.name.toLowerCase() === SearchCountry.toLowerCase()
                    ? highlightColor
                    : "#444"
                )
                .attr("filter", (d) =>
                  d.properties.name.toLowerCase() === SearchCountry.toLowerCase()
                    ? "url(#glow)"
                    : null
                );
            })
            .on("end", () => {
              currentCountryRef.current = SearchCountry.toLowerCase();
            });
        });
    });
  }, [SearchCountry, width, rotationSpeed]);

  return <svg ref={ref} />;
};

export default GlobeChart;