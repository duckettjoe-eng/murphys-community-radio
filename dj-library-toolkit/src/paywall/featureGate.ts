import {
  canUseFeature,
  getFeatureMinimumTier,
  type ToolkitFeature,
  type ToolkitTier,
} from "../entitlements.js";

export type FeatureGateResult =
  | {
      allowed: true;
      feature: ToolkitFeature;
      tier: ToolkitTier;
    }
  | {
      allowed: false;
      feature: ToolkitFeature;
      tier: ToolkitTier;
      requiredTier: ToolkitTier;
      unlockMessage: string;
    };

export function checkFeature(tier: ToolkitTier, feature: ToolkitFeature): FeatureGateResult {
  if (canUseFeature(tier, feature)) {
    return { allowed: true, feature, tier };
  }

  const requiredTier = getFeatureMinimumTier(feature);
  return {
    allowed: false,
    feature,
    tier,
    requiredTier,
    unlockMessage: `${feature} requires the ${requiredTier} tier.`,
  };
}

export function requireFeature(tier: ToolkitTier, feature: ToolkitFeature) {
  const result = checkFeature(tier, feature);
  if (!result.allowed) {
    throw new Error(result.unlockMessage);
  }
}
