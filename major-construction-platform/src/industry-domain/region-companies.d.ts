export {}

interface RegionCompany {
  name: string
  province?: string
  city?: string
  district?: string
  address?: string
  creditCode?: string
}

declare global {
  var IndustryRegionCompanies: {
    inProvince<T extends RegionCompany>(companies: readonly T[], province: string): T[]
    open(input: { province: string; chain: string; companies: readonly RegionCompany[] }, opener?: EventTarget | null): void
  }
}
