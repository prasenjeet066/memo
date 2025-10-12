import React from 'react';

/**
 * FontAwesome Icon Component
 * 
 * @param {string} icon - Icon name (e.g., "home", "user", "heart")
 * @param {string} style - Icon style: "solid" (fas), "regular" (far), "light" (fal), "duotone" (fad), "brands" (fab)
 * @param {string} size - Size: "xs", "sm", "lg", "xl", "2xl", or custom like "2x", "3x", "4x", etc.
 * @param {string} color - Text color (any valid CSS color)
 * @param {string} className - Additional CSS classes
 * @param {boolean} spin - Whether the icon should spin
 * @param {boolean} pulse - Whether the icon should pulse
 * @param {boolean} beat - Whether the icon should beat
 * @param {boolean} fade - Whether the icon should fade
 * @param {boolean} flip - Flip animation
 * @param {string} rotation - Rotate icon: "90", "180", "270"
 * @param {boolean} fixedWidth - Fixed width for icon alignment
 */
const FontAwesomeIcon = ({
  icon,
  style = 'solid',
  size,
  color,
  className = '',
  spin = false,
  pulse = false,
  beat = false,
  fade = false,
  flip = false,
  rotation,
  fixedWidth = false,
  ...props
}) => {
  // Map style prop to FA prefix
  const styleMap = {
    solid: 'fas',
    regular: 'far',
    light: 'fal',
    duotone: 'fad',
    brands: 'fab',
    thin: 'fat'
  };
  
  const prefix = styleMap[style] || 'fas';
  
  // Build class names
  const classes = [
    prefix,
    `fa-${icon}`,
    size && `fa-${size}`,
    spin && 'fa-spin',
    pulse && 'fa-pulse',
    beat && 'fa-beat',
    fade && 'fa-fade',
    flip && 'fa-flip',
    rotation && `fa-rotate-${rotation}`,
    fixedWidth && 'fa-fw',
    className
  ].filter(Boolean).join(' ');
  
  const styles = color ? { color } : {};
  
  return <i className={classes} style={styles} {...props} />;
};

// Demo component showcasing the FontAwesomeIcon


export { Fai };