"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchGlobalSearch } from "@/features/search/global-search";

export function useGlobalSearch(value: string) {
  const query = value.trim();
  return useQuery({
    queryKey: ["global-search", query],
    enabled: query.length >= 2,
    staleTime: 10_000,
    queryFn: () => fetchGlobalSearch(query),
  });
}
