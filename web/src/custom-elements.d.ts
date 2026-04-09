import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': any;
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'ion-icon': any;
      }
    }
  }
}

export {};
