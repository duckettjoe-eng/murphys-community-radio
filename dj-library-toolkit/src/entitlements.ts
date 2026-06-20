export type ToolkitTier = "free" | "supporter" | "pro";

export type ToolkitFeature =
  | "library.scan"
  | "library.catalog"
  | "library.duplicates"
  | "library.export.basic"
  | "library.export.stationPackage"
  | "live365.plan"
  | "live365.upload.apply"
  | "live365.cues.apply"
  | "live365.playlists.apply"
  | "live365.schedule.apply"
  | "live365.quarantine.apply"
  | "archive.build.local"
  | "archive.publish"
  | "archive.sync.mixcloud"
  | "mobileBroadcast.checklist"
  | "mobileBroadcast.deviceProfile"
  | "mobileBroadcast.report"
  | "stationWebsite.exportPackage"
  | "stationWebsite.publishUpdates"
  | "stationWebsite.deployTemplate";

export const tierRank: Record<ToolkitTier, number> = {
  free: 0,
  supporter: 1,
  pro: 2,
};

export const featureMinimumTier: Record<ToolkitFeature, ToolkitTier> = {
  "library.scan": "free",
  "library.catalog": "free",
  "library.duplicates": "free",
  "library.export.basic": "free",
  "library.export.stationPackage": "free",
  "live365.plan": "free",
  "live365.upload.apply": "supporter",
  "live365.cues.apply": "supporter",
  "live365.playlists.apply": "supporter",
  "live365.schedule.apply": "supporter",
  "live365.quarantine.apply": "supporter",
  "archive.build.local": "free",
  "archive.publish": "supporter",
  "archive.sync.mixcloud": "supporter",
  "mobileBroadcast.checklist": "free",
  "mobileBroadcast.deviceProfile": "supporter",
  "mobileBroadcast.report": "supporter",
  "stationWebsite.exportPackage": "free",
  "stationWebsite.publishUpdates": "supporter",
  "stationWebsite.deployTemplate": "pro",
};

export function canUseFeature(tier: ToolkitTier, feature: ToolkitFeature) {
  return tierRank[tier] >= tierRank[featureMinimumTier[feature]];
}

export function getFeatureMinimumTier(feature: ToolkitFeature) {
  return featureMinimumTier[feature];
}
