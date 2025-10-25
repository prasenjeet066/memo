'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/**
 * GlassyVoronoi
 * - Fetches streamed SVG from /api/img/vor
 * - Uses D3 to apply blur + specular lighting filters
 * - Adds moving “shine” gradient overlay
 */
export default function GlassyVoronoi() {
  const svgRef = useRef();
  
  useEffect(() => {
    async function loadVoronoi() {
      // fetch the SVG from your streaming endpoint
      const res = await fetch('https://memoorg.vercel.app/api/img/vor');
      const svgText = await res.text();
      
      // inject SVG into container
      const container = d3.select(svgRef.current);
      container.html(svgText);
      
      // select the embedded SVG element
      const svg = container.select('svg');
      if (svg.empty()) return;
      
      const { width, height } = svg.node().getBBox();
      
      // clear existing defs if any
      svg.selectAll('defs').remove();
      
      const defs = svg.append('defs');
      
      // 🌫️ Glass filter: blur + specular lighting
      const filter = defs
        .append('filter')
        .attr('id', 'glass')
        .attr('x', '-20%')
        .attr('y', '-20%')
        .attr('width', '140%')
        .attr('height', '140%');
      
      filter
        .append('feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('stdDeviation', 1.2)
        .attr('result', 'blur');
      
      const lighting = filter
        .append('feSpecularLighting')
        .attr('in', 'blur')
        .attr('surfaceScale', 5)
        .attr('specularConstant', 0.8)
        .attr('specularExponent', 25)
        .attr('lighting-color', '#ffffff')
        .attr('result', 'specOut');
      lighting.append('fePointLight').attr('x', -200).attr('y', -200).attr('z', 300);
      
      filter
        .append('feComposite')
        .attr('in', 'specOut')
        .attr('in2', 'SourceAlpha')
        .attr('operator', 'in')
        .attr('result', 'specOut2');
      
      const merge = filter.append('feMerge');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');
      merge.append('feMergeNode').attr('in', 'specOut2');
      
      // ✨ Gradient overlay (shine)
      const gradient = defs
        .append('linearGradient')
        .attr('id', 'shine')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%');
      gradient.append('stop').attr('offset', '0%').attr('stop-color', '#fff').attr('stop-opacity', 0.35);
      gradient.append('stop').attr('offset', '100%').attr('stop-color', '#000').attr('stop-opacity', 0);
      
      // Apply glass filter to all Voronoi edges
      svg.selectAll('polyline')
        .attr('filter', 'url(#glass)')
        .attr('stroke-width', 1.2)
        .attr('opacity', 0.9);
      
      // Add moving gradient overlay
      const shineRect = svg
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'url(#shine)')
        .attr('opacity', 0.15)
        .attr('x', -width)
        .attr('y', height / 3);
      
      // 🌀 Animate shine sweep
      function animate() {
        shineRect
          .attr('x', -width)
          .transition()
          .duration(6000)
          .ease(d3.easeLinear)
          .attr('x', width * 1.5)
          .on('end', animate);
      }
      animate();
      
      // 💡 Optional: mousemove effect (light follows cursor)
      svg.on('mousemove', (event) => {
        const [x, y] = d3.pointer(event);
        lighting.select('fePointLight')
          .attr('x', x - width / 2)
          .attr('y', y - height / 2)
          .attr('z', 300);
      });
    }
    
    loadVoronoi();
  }, []);
  
  return (
    
      <div
        ref={svgRef}
        
      />
    
  );
}