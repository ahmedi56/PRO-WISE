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

export const ProWiseLogoSvg: React.FC<Props> = ({ width = 60, height = 60 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 130 160" fill="none">
      <Defs>
        <LinearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3B82F6"/>
          <Stop offset="100%" stopColor="#1D4ED8"/>
        </LinearGradient>

        <LinearGradient id="cyanGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#22D3EE"/>
          <Stop offset="100%" stopColor="#0891B2"/>
        </LinearGradient>

        <RadialGradient id="ambience" cx="65" cy="80" r="90" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#22D3EE" stopOpacity="0.15"/>
          <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
        </RadialGradient>
      </Defs>

      <Circle cx="65" cy="80" r="90" fill="url(#ambience)"/>

      <Path d="M 65 68 L 37 52 L 65 36 L 93 52 Z" 
            stroke="url(#cyanGrad)" 
            strokeWidth="10" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="url(#cyanGrad)" fillOpacity="0.15" />

      <Path d="M 55 86 L 55 118 L 27 102 L 27 70 Z" 
            stroke="url(#blueGrad)" 
            strokeWidth="10" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="url(#blueGrad)" fillOpacity="0.1" />

      <Path d="M 75 86 L 103 70 L 103 102 L 75 118 Z" 
            stroke="url(#blueGrad)" 
            strokeWidth="10" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="url(#blueGrad)" fillOpacity="0.1" />

      <Path d="M 65 74 L 65 68" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
      <Path d="M 59 82 L 55 86" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
      <Path d="M 71 82 L 75 86" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>

      <Circle cx="65" cy="80" r="8" fill="#FFFFFF" />
      <Circle cx="65" cy="80" r="4" fill="#22D3EE" />

    </Svg>
  );
};
