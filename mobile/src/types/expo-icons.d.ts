import { ComponentProps } from 'react';
import { Ionicons as OriginalIonicons } from '@expo/vector-icons';

declare module '@expo/vector-icons' {
  import { ReactNode } from 'react';
  import { TextProps } from 'react-native';
  
  export interface IconProps<T extends string> extends TextProps {
    name: T;
    size?: number;
    color?: string;
    children?: ReactNode;
  }

  export class Ionicons extends React.Component<IconProps<keyof typeof OriginalIonicons.glyphMap>> {}
}
