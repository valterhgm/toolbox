declare module "libheif-js/libheif-wasm/libheif-bundle.mjs" {
  export interface HeifImage {
    get_width(): number;
    get_height(): number;
    display(
      imageData: ImageData,
      callback: (result: ImageData | null) => void,
    ): void;
  }

  export interface LibheifModule {
    HeifDecoder: new () => {
      decode(buffer: Uint8Array): HeifImage[];
    };
  }

  export default function createLibheifModule(
    options?: Record<string, unknown>,
  ): Promise<LibheifModule>;
}
