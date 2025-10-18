import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";
import world from "@/lib/countries-110m.json";

type CountryFeature = GeoJSON.Feature < GeoJSON.Geometry, { name: string } > ;

type GlobeChartProps = {
  width ? : number;
  rotationSpeed ? : number; // degrees per second
  SearchCountry ? : string;
};

const GlobeChart: React.FC < GlobeChartProps > = ({
  width = 928,
  rotationSpeed = 0.3,
  SearchCountry,
}) => {
  const ref = useRef < SVGSVGElement | null > (null);
  const projectionRef = useRef < d3.GeoProjection | null > (null);
  const timerRef = useRef < d3.Timer | null > (null);
  const pathRef = useRef < d3.GeoPath < any,
    d3.GeoPermissibleObjects > | null > (null);
  
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
        ], { type: "Sphere" }
      )
      .rotate([0, -10])
      .scale(width / 3.3); // base scale
    
    projectionRef.current = projection;
    
    const path = d3.geoPath(projection);
    pathRef.current = path;
    
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
      .attr("stroke-width", 0.3)
      .attr("d", path as any);
    
    // Countries
    svg
      .append("g")
      .selectAll("path")
      .data(countries.features)
      .join("path")
      .attr("fill", "#444")
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
  
  // Handle focus/zoom when searching
  useEffect(() => {
    const svg = d3.select(ref.current);
    const projection = projectionRef.current;
    const path = pathRef.current;
    if (!projection || !path) return;
    
    const baseScale = width / 3.3;
    
    const resetView = () => {
      // Resume rotation
      timerRef.current?.restart((elapsed) => {
        const rotation = projection.rotate();
        rotation[0] = (rotation[0] + (rotationSpeed * elapsed) / 1000) % 360;
        projection.rotate(rotation);
        svg.selectAll("path").attr("d", path as any);
      });
    };
    
    if (!SearchCountry) {
      // Smoothly zoom out to default
      d3.transition()
        .duration(1500)
        .tween("zoomOut", () => {
          const interpScale = d3.interpolate(projection.scale(), baseScale);
          return (t) => {
            projection.scale(interpScale(t));
            svg.selectAll("path").attr("d", path as any);
          };
        })
        .on("end", resetView);
      return;
    }
    
    // Stop rotation
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
      const targetRotate: [number, number, number] = [
        -centroid[0],
        -centroid[1],
        0,
      ];
      
      const r = d3.interpolate(currentRotate, targetRotate);
      const zoomIn = d3.interpolate(projection.scale(), baseScale * 1.4); // zoom factor
      
      d3.transition()
        .duration(2000)
        .tween("focus", () => {
          return (t) => {
            projection.rotate(r(t)).scale(zoomIn(t));
            svg.selectAll("path").attr("d", path as any);
          };
        });
    });
  }, [SearchCountry, width, rotationSpeed]);
  
  return <svg ref={ref} />;
};

export default GlobeChart;