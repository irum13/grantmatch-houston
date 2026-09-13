"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getDemoScenario } from "@/data/demo-scenarios";
import { FounderProfile, FundingOpportunity } from "@/lib/types";

interface GrantMatchContextValue {
  profile: FounderProfile | null;
  mode: "demo" | "real";
  setProfile: (profile: FounderProfile) => void;
  loadDemo: (slug: string) => FounderProfile | undefined;
  updateProfile: (changes: Partial<FounderProfile>) => void;
  setMode: (mode: "demo" | "real") => void;
  liveOpportunities: FundingOpportunity[];
  setLiveOpportunities: (opportunities: FundingOpportunity[]) => void;
  reset: () => void;
  hydrated: boolean;
}

const GrantMatchContext = createContext<GrantMatchContextValue | null>(null);
const STORAGE_KEY = "grantmatch-session";

export function GrantMatchProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<FounderProfile | null>(null);
  const [mode, setModeState] = useState<"demo" | "real">("demo");
  const [liveOpportunities, setLiveOpportunities] = useState<
    FundingOpportunity[]
  >([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let restored: {
      profile: FounderProfile | null;
      mode: "demo" | "real";
      liveOpportunities?: FundingOpportunity[];
    } | null = null;

    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        restored = JSON.parse(saved) as {
          profile: FounderProfile | null;
          mode: "demo" | "real";
          liveOpportunities?: FundingOpportunity[];
        };
      }
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }

    queueMicrotask(() => {
      if (restored) {
        setProfileState(restored.profile);
        setModeState(restored.mode);
        setLiveOpportunities(restored.liveOpportunities ?? []);
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ profile, mode, liveOpportunities }),
    );
  }, [profile, mode, liveOpportunities, hydrated]);

  const value = useMemo<GrantMatchContextValue>(
    () => ({
      profile,
      mode,
      hydrated,
      liveOpportunities,
      setLiveOpportunities,
      setProfile: setProfileState,
      loadDemo: (slug) => {
        const scenario = getDemoScenario(slug);
        if (!scenario) return undefined;
        const cloned = structuredClone(scenario);
        setModeState("demo");
        setProfileState(cloned);
        return cloned;
      },
      updateProfile: (changes) => {
        setProfileState((current) =>
          current ? { ...current, ...changes } : current,
        );
      },
      setMode: setModeState,
      reset: () => {
        setProfileState(null);
        setModeState("demo");
        setLiveOpportunities([]);
        window.sessionStorage.removeItem(STORAGE_KEY);
      },
    }),
    [profile, mode, liveOpportunities, hydrated],
  );

  return (
    <GrantMatchContext.Provider value={value}>
      {children}
    </GrantMatchContext.Provider>
  );
}

export function useGrantMatch() {
  const context = useContext(GrantMatchContext);
  if (!context) {
    throw new Error("useGrantMatch must be used inside GrantMatchProvider");
  }
  return context;
}
