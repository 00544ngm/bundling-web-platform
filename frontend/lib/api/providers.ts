import { apiFetch } from "./client";
import type {
  ProviderConfiguration,
  ProviderDraftPayload,
  ProviderModelVerifyResult,
  ProviderModelSelectionResult,
  ProviderSlug,
  ProviderTestResult,
  ProviderUpdatePayload,
} from "./types";

const RETIRED_PROVIDER_SLUGS = new Set(["cattoken", "cattoken_claude"]);

export async function listProviders(): Promise<ProviderConfiguration[]> {
  const providers = await apiFetch<Array<ProviderConfiguration & { slug: string }>>(
    "/settings/providers"
  );
  return providers.filter(
    (provider): provider is ProviderConfiguration =>
      !RETIRED_PROVIDER_SLUGS.has(provider.slug)
  );
}

export function verifyProviderModel(
  slug: ProviderSlug,
  model: string,
  setDefault = false,
  isAutomatic = false
): Promise<ProviderModelVerifyResult> {
  return apiFetch<ProviderModelVerifyResult>(`/settings/providers/${slug}/models/verify`, {
    method: "POST",
    body: {
      model,
      set_default: setDefault,
      ...(isAutomatic ? { is_automatic: true } : {}),
    },
  });
}

export function selectProviderModel(
  slug: ProviderSlug,
  model: string,
  isSelected: boolean
): Promise<ProviderModelSelectionResult> {
  return apiFetch<ProviderModelSelectionResult>(
    `/settings/providers/${slug}/models/${encodeURIComponent(model)}/selection`,
    { method: "PATCH", body: { is_selected: isSelected } }
  );
}

export function testProvider(
  slug: ProviderSlug,
  payload: ProviderDraftPayload
): Promise<ProviderTestResult> {
  return apiFetch<ProviderTestResult>(`/settings/providers/${slug}/test`, {
    method: "POST",
    body: payload,
  });
}

export function updateProvider(
  slug: ProviderSlug,
  payload: ProviderUpdatePayload
): Promise<ProviderConfiguration> {
  return apiFetch<ProviderConfiguration>(`/settings/providers/${slug}`, {
    method: "PUT",
    body: payload,
  });
}

