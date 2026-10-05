import { useContext } from "react";

import BmiContext from "./BmiContext";

export function useBmi() {
  const context = useContext(BmiContext);

  if (!context) {
    throw new Error("useBmi must be used within a BmiProvider.");
  }

  return context;
}
