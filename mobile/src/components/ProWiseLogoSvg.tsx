import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Path,
  Circle,
} from 'react-native-svg';

type Props = {
  width?: number | string;
  height?: number | string;
};

/**
 * ProWiseLogoSvg - Replicated from web/public/pro-wise.svg
 * Represents the Exploded Product Core (Cube + Insight)
 */
export const ProWiseLogoSvg: React.FC<Props> = ({ width = 60, height = 74 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 130 160" fill="none">
      <Defs>
        <LinearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#c3c0ff"/>
          <Stop offset="100%" stopColor="#4f46e5"/>
        </LinearGradient>

        <LinearGradient id="cyanGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#6cd3f7"/>
          <Stop offset="100%" stopColor="#269dbe"/>
        </LinearGradient>

        <RadialGradient id="ambience" cx="65" cy="80" r="90" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#6cd3f7" stopOpacity="0.15"/>
          <Stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/>
        </RadialGradient>
      </Defs>

      {/* Ambient background glow */}
      <Circle cx="65" cy="80" r="90" fill="url(#ambience)"/>

      {/* Top Component Panel */}
      <Path 
        d="M 65 68 L 37 52 L 65 36 L 93 52 Z" 
        stroke="url(#cyanGrad)" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="url(#cyanGrad)" 
        fillOpacity="0.15"
      />

      {/* Left Component Panel */}
      <Path 
        d="M 55 86 L 55 118 L 27 102 L 27 70 Z" 
        stroke="url(#blueGrad)" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="url(#blueGrad)" 
        fillOpacity="0.1"
      />

      {/* Right Component Panel */}
      <Path 
        d="M 75 86 L 103 70 L 103 102 L 75 118 Z" 
        stroke="url(#blueGrad)" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="url(#blueGrad)" 
        fillOpacity="0.1"
      />
    </Svg>
  );
};
