"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listProviders } from "@/lib/api/providers";
import type { ProviderConfiguration } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";
import { isFreshVerifiedModel } from "@/lib/provider-model-status";

export function usePrimaryProviders() {
  const query = useQuery({
    queryKey: queryKeys.providers.all,
    queryFn: listProviders,
  });
  const providers = (query.data ?? []).filter(
    (provider) =>
      provider.role === "primary" &&
      provider.is_enabled &&
      provider.configured &&
      (provider.model_options?.some(
        (option) => isFreshVerifiedModel(option) && option.is_selected === true
      ) ?? false)
  );
  return { ...query, providers } as typeof query & { providers: ProviderConfiguration[] };
}

export function ProviderSetupNotice() {
  return (
    <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
      没有可用的主模型配置。
      <Link href="/settings/api" className="ml-2 font-medium text-primary hover:underline">
        前往 API 设置
      </Link>
    </p>
  );
}

