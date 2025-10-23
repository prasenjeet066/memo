import React, { useRef, useState } from "react";
import * as d3 from "d3";

const VoronoiArt = () => {
  const svgRef = useRef();
  const inputRef = useRef();
  const imgRef = useRef();
  const pointsRef = useRef([]);
  const imageDataRef = useRef(null);
  
  const [processing, setProcessing] = useState(false);
  const [exportEnabled, setExportEnabled] = useState(false);
  
  const width = 800;
  const height = 600;
  const maxPoints = 50000; // you can adjust this for performance
  const batchSize = 5000; // process in batches to prevent freezing
  
  const clearSVG = () => {
    d3.select(svgRef.current).selectAll("*").remove();
  };
  
  const getColorAtPoint = (x, y) => {
    const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
    const r = imageDataRef.current.data[idx];
    const g = imageDataRef.current.data[idx + 1];
    const b = imageDataRef.current.data[idx + 2];
    return `rgb(${r},${g},${b})`;
  };
  
  const generatePointsBatch = (resolve) => {
    let added = pointsRef.current.length;
    let tries = 60000;
    
    while (added < maxPoints && tries > 0 && added < pointsRef.current.length + batchSize) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
      const r = imageDataRef.current.data[idx];
      const g = imageDataRef.current.data[idx + 1];
      const b = imageDataRef.current.data[idx + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      if (brightness > 0 && Math.random() > brightness) {
        pointsRef.current.push([x, y]);
        added++;
      }
      tries--;
    }
    
    if (added < maxPoints && tries > 0) {
      setTimeout(() => generatePointsBatch(resolve), 0);
    } else {
      resolve();
    }
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
      imageDataRef.current = ctx.getImageData(0, 0, width, height);
      pointsRef.current = [];
      clearSVG();
      
      // generate points in batches
      new Promise(generatePointsBatch).then(() => {
        const delaunay = d3.Delaunay.from(pointsRef.current);
        const voronoi = delaunay.voronoi([0, 0, width, height]);
        
        const paths = pointsRef.current
          .map((p, i) => {
            const cell = voronoi.renderCell(i);
            if (!cell) return null;
            const fillColor = getColorAtPoint(p[0], p[1]);
            return { d: cell, fill: fillColor };
          })
          .filter(Boolean);
        
        const svg = d3.select(svgRef.current);
        svg.selectAll("path")
          .data(paths)
          .join("path")
          .attr("d", d => d.d)
          .attr("fill", d => d.fill)
          .attr("stroke", "none");
        
        setProcessing(false);
        setExportEnabled(true);
      });
    };
    
    img.onerror = () => {
      alert("Failed to load image.");
      setProcessing(false);
    };
  };
  
  const handleExport = () => {
    const serializer = new XMLSerializer();
    const svgBlob = new Blob([serializer.serializeToString(svgRef.current)], {
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