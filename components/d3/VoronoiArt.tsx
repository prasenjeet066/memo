import React, { useRef, useState } from "react";
import * as d3 from "d3";
import { interpolatePath } from "d3-interpolate-path"; // Make sure to install this: npm install d3-interpolate-path

const VoronoiArt = () => {
  const svgRef = useRef();
  const inputRef = useRef();
  const imgRef = useRef();
  const [processing, setProcessing] = useState(false);
  const [exportEnabled, setExportEnabled] = useState(false);
  
  const width = 800;
  const height = 600;
  let points = [];
  const maxPoints = 100000;
  const animationStep = 500;
  let imageData = null;
  
  const clearSVG = () => {
    d3.select(svgRef.current).selectAll("*").remove();
  };
  
  const handleGenerate = () => {
    const url = inputRef.current.value.trim();
    if (!url) return alert("Enter a valid image URL.");
    
    setProcessing(true);
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Allow cross-origin images
    img.src = url;
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      imageData = ctx.getImageData(0, 0, width, height);
      
      points = [];
      let attempts = 60000;
      
      clearSVG();
      animatePoints(attempts);
    };
    
    img.onerror = () => {
      alert("Failed to load image.");
      setProcessing(false);
    };
  };
  
  const animatePoints = (attempts) => {
    if (points.length >= maxPoints || attempts <= 0) {
      setProcessing(false);
      setExportEnabled(true);
      return;
    }
    
    let added = 0;
    while (added < animationStep && attempts > 0) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      if (brightness > 0 && Math.random() > brightness) {
        points.push([x, y]);
        added++;
      }
      attempts--;
    }
    
    const delaunay = d3.Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);
    
    const paths = points
      .map((p, i) => {
        const cx = Math.floor(p[0]);
        const cy = Math.floor(p[1]);
        const idx = (cy * width + cx) * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        if (brightness < 0.5) return voronoi.renderCell(i);
      })
      .filter(Boolean);
    
    const svg = d3.select(svgRef.current);
    const selection = svg.selectAll("path").data(paths);
    
    selection
      .join("path")
      .transition()
      .duration(200)
      .attrTween("d", function(d) {
        const previous = d3.select(this).attr("d") || d;
        return interpolatePath(previous, d);
      })
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.9)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("opacity", 1);
    
    requestAnimationFrame(() => animatePoints(attempts));
  };
  
  const handleExport = () => {
    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    const svgBlob = new Blob([serializer.serializeToString(svgElement)], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      imgRef.current.src = canvas.toDataURL("image/png");
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };
  
  return (
    <div>
      <input ref={inputRef} type="text" placeholder="Enter image URL" />
      <button onClick={handleGenerate} disabled={processing}>
        {processing ? "Processing..." : "Generate"}
      </button>
      <button onClick={handleExport} disabled={!exportEnabled}>
        Save
      </button>
      <svg ref={svgRef} width={width} height={height}></svg>
      <img ref={imgRef} alt="Exported PNG" />
    </div>
  );
};

export default VoronoiArt;