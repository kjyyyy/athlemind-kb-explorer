"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { KbClient, KbClientConfig } from "./client";

const ClientCtx = createContext<KbClient | null>(null);
const ConfigCtx = createContext<KbClientConfig>({});

export function KbClientProvider({
  client,
  config,
  children,
}: {
  client: KbClient;
  config?: KbClientConfig;
  children: ReactNode;
}) {
  return (
    <ClientCtx.Provider value={client}>
      <ConfigCtx.Provider value={config ?? {}}>{children}</ConfigCtx.Provider>
    </ClientCtx.Provider>
  );
}

export function useKbClient(): KbClient {
  const client = useContext(ClientCtx);
  if (!client) throw new Error("useKbClient requires KbClientProvider");
  return client;
}

export function useKbClientConfig(): KbClientConfig {
  return useContext(ConfigCtx);
}