"use client";

import { useState, useEffect } from "react";

export interface SharedAppState {
  activeModuleId: string;
  theme: "dark" | "glass" | "midnight";
  sharedMemory: Record<string, any>;
  notifications: Array<{
    id: string;
    timestamp: number;
    moduleId: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
  }>;
}

const STORAGE_KEY = "unified_hub_shared_state_v1";

const initialHubState: SharedAppState = {
  activeModuleId: "dashboard",
  theme: "glass",
  sharedMemory: {},
  notifications: [
    {
      id: "init-1",
      timestamp: Date.now(),
      moduleId: "system",
      message: "Workspace initialized. Ready to ingest and merge 5 application modules.",
      type: "info",
    },
  ],
};

export function getSharedHubState(): SharedAppState {
  if (typeof window === "undefined") return initialHubState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialHubState;
    return { ...initialHubState, ...JSON.parse(raw) };
  } catch {
    return initialHubState;
  }
}

export function setSharedHubState(state: Partial<SharedAppState>) {
  if (typeof window === "undefined") return;
  try {
    const current = getSharedHubState();
    const updated = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("shared_hub_state_change", { detail: updated }));
  } catch (e) {
    console.error("Failed to save shared state", e);
  }
}

export function useSharedHub() {
  const [state, setState] = useState<SharedAppState>(initialHubState);

  useEffect(() => {
    setState(getSharedHubState());

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setState(e.detail);
      } else {
        setState(getSharedHubState());
      }
    };

    window.addEventListener("shared_hub_state_change", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("shared_hub_state_change", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const setModule = (moduleId: string) => {
    setSharedHubState({ activeModuleId: moduleId });
  };

  const setSharedKey = (key: string, value: any) => {
    const current = getSharedHubState();
    setSharedHubState({
      sharedMemory: {
        ...current.sharedMemory,
        [key]: value,
      },
    });
  };

  const addNotification = (moduleId: string, message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const current = getSharedHubState();
    const newNotif = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      moduleId,
      message,
      type,
    };
    setSharedHubState({
      notifications: [newNotif, ...current.notifications].slice(0, 30),
    });
  };

  return {
    state,
    setModule,
    setSharedKey,
    addNotification,
  };
}
