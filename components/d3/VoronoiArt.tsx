import React, { useRef, useState } from "react";
import * as d3 from "d3";

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
  let imageData = null;
  
  const clearSVG = () => {
    d3.select(svgRef.current).selectAll("*").remove();
  };
  
  const handleGenerate = () => {
    const url = inputRef.current.value.trim();
    if (!url) return alert("Enter a valid image URL.");
    
    setProcessing(true);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      imageData = ctx.getImageData(0, 0, width, height);
      
      points = [];
      const attempts = 60000;
      
      // Generate all points at once
      let added = 0;
      let tries = attempts;
      while (added < maxPoints && tries > 0) {
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
        tries--;
      }
      
      clearSVG();
      
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
      svg.selectAll("path")
        .data(paths)
        .join("path")
        .attr("d", d => d)
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 0.9)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("opacity", 1);
      
      setProcessing(false);
      setExportEnabled(true);
    };
    
    img.onerror = () => {
      alert("Failed to load image.");
      setProcessing(false);
    };
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