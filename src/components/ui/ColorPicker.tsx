"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * ColorPicker component
 * ---------------------
 * Props:
 * - color: current color value (string)
 * - onChange: callback (value: string) => void
 */

export default function ColorPicker({
  color,
  onChange,
  label = "Color",
  presets = ["#ffffff", "#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa"],
}: {
  color: string;
  onChange: (color: string) => void;
  label ? : string;
  presets ? : string[];
}) {
  const [internalColor, setInternalColor] = React.useState(color || "#ffffff");
  
  React.useEffect(() => {
    setInternalColor(color || "#ffffff");
  }, [color]);
  
  const handleChange = (val: string) => {
    setInternalColor(val);
    onChange(val);
  };
  
  return (
    <div className="flex flex-col gap-4">
      <Label className="text-sm font-medium">{label}</Label>

      {/* Main color input */}
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={internalColor}
          onChange={(e) => handleChange(e.target.value)}
          className="h-10 w-10 p-1 rounded-md cursor-pointer"
        />
        <Input
          type="text"
          value={internalColor}
          onChange={(e) => handleChange(e.target.value)}
          className="w-28 text-center font-mono"
        />
      </div>

      {/* Preset swatches */}
      <div className="grid grid-cols-6 gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => handleChange(preset)}
            className={cn(
              "h-8 w-8 rounded-md border transition hover:scale-105",
              preset === internalColor ? "ring-2 ring-offset-2 ring-primary" : ""
            )}
            style={{ backgroundColor: preset }}
            aria-label={`Select color ${preset}`}
          />
        ))}
      </div>

      {/* Reset button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleChange("#ffffff")}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}