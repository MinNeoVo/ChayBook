import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { getActiveVideoSubmission } from "../services/videoServices";

export function useActiveVideoSubmission() {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const requestKey = `${user?.userId}:${revision}`;

  useEffect(() => {
    const controller = new AbortController();
    let timer;

    async function load() {
      try {
        const submission = await getActiveVideoSubmission({ signal: controller.signal });
        if (controller.signal.aborted) return;
        setResult({ key: requestKey, submission, error: null });
        if (submission) timer = window.setTimeout(load, 3000);
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ key: requestKey, submission: null, error });
        }
      }
    }

    load();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [requestKey]);

  const current = result?.key === requestKey ? result : null;
  return {
    submission: current?.submission ?? null,
    loading: !current,
    error: current?.error ?? null,
    reload: () => setRevision((value) => value + 1),
  };
}
