import { MotionValue, motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

interface NumberProps {
  mv: MotionValue < number > ;
  number: number;
  height: number;
}

function Number({ mv, number, height }: NumberProps) {
  let y = useTransform(mv, (latest) => {
    let placeValue = latest % 10;
    let offset = (10 + number - placeValue) % 10;
    let memo = offset * height;
    if (offset > 5) {
      memo -= 10 * height;
    }
    return memo;
  });
  
  return (
    <motion.span
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        y,
      }}
    >
      {number}
    </motion.span>
  );
}

interface DigitProps {
  place: number;
  value: number;
  height: number;
  digitStyle ? : React.CSSProperties;
}

function Digit({ place, value, height, digitStyle }: DigitProps) {
  let valueRoundedToPlace = Math.floor(value / place);
  let animatedValue = useSpring(valueRoundedToPlace);
  
  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);
  
  return (
    <div
      style={{
        height,
        position: "relative",
        width: "1ch",
        fontVariantNumeric: "tabular-nums",
        ...digitStyle,
      }}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </div>
  );
}

interface CounterProps {
  value: number;
  padding ? : number;
  places ? : number[];
  gap ? : number;
  borderRadius ? : number;
  horizontalPadding ? : number;
  containerClassName ? : string;
  counterClassName ? : string; // className for font size, color, etc.
  digitStyle ? : React.CSSProperties;
  gradientHeight ? : number;
  gradientFrom ? : string;
  gradientTo ? : string;
  topGradientStyle ? : React.CSSProperties;
  bottomGradientStyle ? : React.CSSProperties;
}

export default function Counter({
  value,
  padding = 0,
  places = [100, 10, 1],
  gap = 8,
  borderRadius = 4,
  horizontalPadding = 0,
  containerClassName,
  counterClassName,
  digitStyle,
  gradientHeight = 16,
  gradientFrom = "black",
  gradientTo = "transparent",
  topGradientStyle,
  bottomGradientStyle,
}: CounterProps) {
  // Height is now derived from font-size via className — here we only use padding
  const height = (parseInt(getComputedStyle(document.documentElement).fontSize) || 16) + padding;
  
  const defaultContainerStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
  };
  
  const defaultCounterStyle: React.CSSProperties = {
    display: "flex",
    gap: gap,
    overflow: "hidden",
    borderRadius: borderRadius,
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
    lineHeight: 1,
  };
  
  const gradientContainerStyle: React.CSSProperties = {
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
  
  const defaultTopGradientStyle: React.CSSProperties = {
    height: gradientHeight,
    background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
  };
  
  const defaultBottomGradientStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: gradientHeight,
    background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
  };
  
  return (
    <div style={defaultContainerStyle} className={containerClassName}>
      <div style={defaultCounterStyle} className={counterClassName}>
        {places.map((place) => (
          <Digit
            key={place}
            place={place}
            value={value}
            height={height}
            digitStyle={digitStyle}
          />
        ))}
      </div>
      <div>
        <div/>
        <div />
      </div>
    </div>
  );
}