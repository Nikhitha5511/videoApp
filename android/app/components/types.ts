export interface ImagePath {
    uri: string;
  }
  
  export interface VideoProcessingOptions {
    scale?: { width: number; height: number };
    zoomEffect?: boolean;
    fadeEffect?: boolean;
  }