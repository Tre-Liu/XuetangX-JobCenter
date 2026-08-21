export const namedRegionFeatures = (features, getName) => (
  features.filter((feature) => Boolean(getName(feature)))
)
