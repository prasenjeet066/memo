import React from "react";

interface SpinnerProps {
  size ? : "sm" | "md" | "lg";
  fullScreen ? : boolean;
  className ? : string;
}

export default function Spinner({
  size = "md",
  fullScreen = true,
  className = ""
}: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };
  
  const containerClasses = fullScreen ?
    "min-h-screen w-full flex items-center justify-center bg-red-500" :
    "flex items-center justify-center p-4";
  
  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <style jsx>{`
          @keyframes spin {
            0%, 100% {
              box-shadow: 
                0em -2.6em 0em 0em currentColor,
                1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2),
                2.5em 0em 0 0em rgba(255, 255, 255, 0.2),
                1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2),
                0em 2.5em 0 0em rgba(255, 255, 255, 0.2),
                -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2),
                -2.6em 0em 0 0em rgba(255, 255, 255, 0.5),
                -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7);
            }
            12.5% {
              box-shadow: 
                0em -2.6em 0em 0em rgba(255, 255, 255, 0.7),
                1.8em -1.8em 0 0em currentColor,
                2.5em 0em 0 0em rgba(255, 255, 255, 0.2),
                1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2),
                0em 2.5em 0 0em rgba(255, 255, 255, 0.2),
                -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2),
                -2.6em 0em 0 0em rgba(255, 255, 255, 0.2),
                -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.5);
            }
            25% {
              box-shadow: 
                0em -2.6em 0em 0em rgba(255, 255, 255, 0.5),
                1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7),
                2.5em 0em 0 0em currentColor,
                1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2),
                0em 2.5em 0 0em rgba(255, 255, 255, 0.2),
                -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2),
                -2.6em 0em 0 0em rgba(255, 255, 255, 0.2),
                -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);
            }
            37.5% {
              box-shadow: 
                0em -2.6em 0em 0em rgba(255, 255, 255, 0.2),
                1.8em -1.8em 0 0em rgba(255, 255, 255, 0.5),
                2.5em 0em 0 0em rgba(255, 255, 255, 0.7),
                1.75em 1.75em 0 0em currentColor,
                0em 2.5em 0 0em rgba(255, 255, 255, 0.2),
                -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2),
                -2.6em 0em 0 0em rgba(255, 255, 255, 0.2),
                -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);
            }
            50% {
              box-shadow: 
                0em -2.6em 0em 0em rgba(255, 255, 255, 0.2),
                1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2),
                2.5em 0em 0 0em rgba(255, 255, 255, 0.5),
                1.75em 1.75em 0 0em rgba(255, 255, 255, 0.7),
                0em 2.5em 0 0em currentColor,
                -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2),
                -2.6em 0em 0 0em rgba(255, 255, 255, 0.2),
                -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);
            }
            62.5% {
              box-shadow: 
                0em -2.6em 0em 0em rgba(255, 255, 255, 0.2),
                1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2),
                2.5em 0em 0 0em rgba(255, 255, 255, 0.2),
                1.75em 1.75em 0 0em rgba(255, 255, 255, 0.5),
                0em 2.5em 0 0em rgba(255, 255, 255, 0.7),
                -1.8em 1.8em 0 0em currentColor,
                -2.6em 0em 0 0em rgba(255, 255, 255, 0.2),
                -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);
            }
            75% {
              box-shadow: 
                0em -2.6em 0em 0em rgba(255, 255, 255, 0.2),
                1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2),
                2.5em 0em 0 0em rgba(255, 255, 255, 0.2),
                1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2),
                0em 2.5em 0 0em rgba(255, 255, 255, 0.5),
                -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.7),
                -2.6em 0em 0 0em currentColor,
                -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);
            }
            87.5% {
              box-shadow: 
                0em -2.6em 0em 0em rgba(255, 255, 255, 0.2),
                1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2),
                2.5em 0em 0 0em rgba(255, 255, 255, 0.2),
                1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2),
                0em 2.5em 0 0em rgba(255, 255, 255, 0.2),
                -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.5),
                -2.6em 0em 0 0em rgba(255, 255, 255, 0.7),
                -1.8em -1.8em 0 0em currentColor;
            }
          }
          
          .spinner-element {
            border-radius: 50%;
            width: 1em;
            height: 1em;
            font-size: 10px;
            position: relative;
            text-indent: -9999em;
            animation: spin 1.1s infinite ease;
            transform: translateZ(0);
            color: #ffffff;
          }
        `}</style>
        <span className="spinner-element" />
      </div>
    </div>
  );
}