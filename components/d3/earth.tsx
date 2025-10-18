import React, { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";

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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const pathRef = useRef<d3.GeoPath<any, d3.GeoPermissibleObjects> | null>(null);
  const timerRef = useRef<d3.Timer | null>(null);
  const currentCountryRef = useRef<string | null>(null);
  const worldDataRef = useRef<any>(null);

  const MARGIN_TOP = 46;
  const BASE_SCALE_FACTOR = 3.3;
  const ZOOM_SCALE_FACTOR = 2.8;

  const COLORS = {
    border: "#4a7a9a",
    highlight: "#00d4ff",
  };

  // --- Rotation Controls ---
  const stopRotation = useCallback(() => {
    if (timerRef.current) {
      timerRef.current.stop();
      timerRef.current = null;
    }
  }, []);

  const startRotation = useCallback(
    (
      projection: d3.GeoProjection,
      svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
      path: d3.GeoPath
    ) => {
      stopRotation();
      timerRef.current = d3.timer((elapsed) => {
        const rotation = projection.rotate();
        rotation[0] = (rotation[0] + (rotationSpeed * elapsed) / 1000) % 360;
        projection.rotate(rotation);
        svg.selectAll("path").attr("d", path as any);
      });
    },
    [rotationSpeed, stopRotation]
  );

  // --- Reset Globe View Helper ---
  const resetGlobeView = useCallback(() => {
    if (!projectionRef.current || !pathRef.current) return;

    const projection = projectionRef.current;
    const path = pathRef.current;
    const svg = d3.select(svgRef.current);
    const baseScale = width / BASE_SCALE_FACTOR;

    const sphere = svg.select(".sphere");
    const borders = svg.select(".borders");
    const countries = svg.selectAll<SVGPathElement, CountryFeature>(".country");

    stopRotation();

    const currentScale = projection.scale();
    const scaleInterpolator = d3.interpolate(currentScale, baseScale);

    d3.transition()
      .duration(1500)
      .ease(d3.easeCubicInOut)
      .tween("reset", () => {
        return (t) => {
          projection.scale(scaleInterpolator(t)).rotate([0, -10, 0]);
          svg.selectAll("path").attr("d", path as any);
        };
      })
      .on("start", () => {
        sphere.transition().duration(800).attr("opacity", 1);
        borders.transition().duration(800).attr("opacity", 1);
        countries.transition().duration(800).attr("opacity", 1).attr("stroke", COLORS.border);
      })
      .on("end", () => {
        startRotation(projection, svg, path);
      });

    currentCountryRef.current = null;
  }, [width, startRotation, stopRotation, COLORS.border]);

  // --- Initialize Globe ---
  useEffect(() => {
    const height = width / 2 + MARGIN_TOP;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((res) => res.json())
      .then((world) => {
        worldDataRef.current = world;
        const countries = feature(world, world.objects.countries) as {
          type: "FeatureCollection";
          features: CountryFeature[];
        };
        const countrymesh = mesh(world, world.objects.countries, (a, b) => a !== b);

        const projection = d3
          .geoOrthographic()
          .fitExtent(
            [
              [2, MARGIN_TOP + 2],
              [width - 2, height - 2],
            ],
            { type: "Sphere" }
          )
          .rotate([0, -10])
          .scale(width / BASE_SCALE_FACTOR)
          .translate([width / 2, height / 2]);

        projectionRef.current = projection;
        const path = d3.geoPath(projection);
        pathRef.current = path;

        svg
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", `0 0 ${width} ${height}`)
          .style("max-width", "100%")
          .style("height", "auto")
          .style("display", "block")
          .style("overflow", "visible");

        const globeGroup = svg.append("g").attr("class", "globe-group");

        // Sphere (ocean) with no fill
        globeGroup
          .append("path")
          .datum({ type: "Sphere" })
          .attr("class", "sphere")
          .attr("fill", "none")
          .attr("stroke", COLORS.border)
          .attr("stroke-width", 1.5)
          .attr("d", path as any);

        // Countries
        const countriesGroup = globeGroup.append("g").attr("class", "countries");
        countriesGroup
          .selectAll("path")
          .data(countries.features)
          .join("path")
          .attr("class", "country")
          .attr("fill", "none")
          .attr("stroke", COLORS.border)
          .attr("stroke-width", 0.5)
          .attr("d", path as any)
          .style("cursor", "pointer")
          .append("title")
          .text((d) => d.properties.name);

        // Country mesh/borders
        globeGroup
          .append("path")
          .datum(countrymesh)
          .attr("class", "borders")
          .attr("fill", "none")
          .attr("stroke", COLORS.border)
          .attr("stroke-width", 0.5)
          .attr("stroke-opacity", 0.5)
          .attr("d", path as any);

        // Start rotation
        startRotation(projection, svg, path);
      })
      .catch((err) => {
        console.error("Failed to load world data:", err);
      });

    return () => {
      stopRotation();
    };
  }, [width, startRotation, stopRotation, COLORS.border]);

  // --- Handle Country Search ---
  useEffect(() => {
    if (!worldDataRef.current || !projectionRef.current || !pathRef.current) return;

    const svg = d3.select(svgRef.current);
    const projection = projectionRef.current;
    const path = pathRef.current;
    const baseScale = width / BASE_SCALE_FACTOR;

    if (!SearchCountry) {
      resetGlobeView();
      return;
    }

    const countryData = feature(worldDataRef.current, worldDataRef.current.objects.countries)
      .features as CountryFeature[];
    const match = countryData.find(
      (d) => d.properties.name.toLowerCase() === SearchCountry.toLowerCase()
    );

    if (!match) {
      console.warn(`"${SearchCountry}" not found. Resetting view.`);
      resetGlobeView();
      return;
    }

    if (currentCountryRef.current === SearchCountry.toLowerCase()) return;
    currentCountryRef.current = SearchCountry.toLowerCase();

    stopRotation();

    const centroid = d3.geoCentroid(match);
    const currentRotate = projection.rotate();
    const targetRotate: [number, number, number] = [-centroid[0], -centroid[1], 0];
    const rotateInterpolator = d3.interpolate(currentRotate, targetRotate);
    const scaleInterpolator = d3.interpolate(projection.scale(), baseScale * ZOOM_SCALE_FACTOR);

    const sphere = svg.select(".sphere");
    const borders = svg.select(".borders");
    const countries = svg.selectAll<SVGPathElement, CountryFeature>(".country");

    // Fade and zoom animation
    sphere.transition().duration(800).ease(d3.easeCubicOut).attr("opacity", 1);
    borders.transition().duration(800).ease(d3.easeCubicOut).attr("opacity", 1);

    countries
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr("opacity", (d) =>
        d.properties.name.toLowerCase() === SearchCountry.toLowerCase() ? 1 : 0.3
      )
      .attr("stroke", (d) =>
        d.properties.name.toLowerCase() === SearchCountry.toLowerCase() ? COLORS.highlight : COLORS.border
      );

    // Rotate and zoom to selected country
    d3.transition()
      .duration(2000)
      .ease(d3.easeCubicInOut)
      .tween("focus", () => {
        return (t) => {
          projection.rotate(rotateInterpolator(t)).scale(scaleInterpolator(t));
          svg.selectAll("path").attr("d", path as any);
        };
      });
  }, [SearchCountry, width, resetGlobeView, startRotation, stopRotation, COLORS.border, COLORS.highlight]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: `${width}px`,
        margin: "0 auto",
        overflow: "visible",
      }}
    >
      <svg ref={svgRef} />
    </div>
  );
};

export default GlobeChart;