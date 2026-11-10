import { useCallback, useEffect, useState } from "react";

// Callers memoize load with useCallback. Aborting also guards against late
// responses when filters/routes change or React StrictMode restarts the effect.
export default function useAdminResource(load) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const retry = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setState({ data: null, loading: true, error: "", load, version });
      try {
        const data = await load(controller.signal);
        if (!controller.signal.aborted) setState({ data, loading: false, error: "", load, version });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ data: null, loading: false, error: error.message || "Unable to load data.", load, version });
        }
      }
    });
    return () => controller.abort();
  }, [load, version]);

  if (state.load !== load || state.version !== version) {
    return { data: null, loading: true, error: "", retry };
  }
  return { data: state.data, loading: state.loading, error: state.error, retry };
}
