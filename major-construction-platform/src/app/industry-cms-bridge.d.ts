export {};
declare global {
  var IndustryCmsBridge: {
    read(): any;
    write(state: unknown): any;
    consume(): any;
    reset(): void;
    cmsUrl(majorName?: string): string;
    legacyRedirectUrl(): string | null;
  };
}
