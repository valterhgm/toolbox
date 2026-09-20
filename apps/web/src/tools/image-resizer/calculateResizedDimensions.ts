export type ResizeInput = {
  originalWidth: number;
  originalHeight: number;
  targetWidth?: number;
  targetHeight?: number;
  maintainAspectRatio: boolean;
};

export type Dimensions = { width: number; height: number };

export function calculateResizedDimensions(input: ResizeInput): Dimensions {
  const { originalWidth, originalHeight, targetWidth, targetHeight, maintainAspectRatio } =
    input;

  if (!maintainAspectRatio) {
    return {
      width: targetWidth ?? originalWidth,
      height: targetHeight ?? originalHeight,
    };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (targetWidth != null) {
    return { width: targetWidth, height: Math.round(targetWidth / aspectRatio) };
  }
  if (targetHeight != null) {
    return { width: Math.round(targetHeight * aspectRatio), height: targetHeight };
  }
  return { width: originalWidth, height: originalHeight };
}
