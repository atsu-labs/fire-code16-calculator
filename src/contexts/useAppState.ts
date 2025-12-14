import { useContext } from "react";
import { AppStateContext, type AppStateContextValue } from "./AppStateContext";

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
