import { useEffect, useState } from "react";

import {
  getVideoAnalysis,
  getVideoSubmission,
} from "../services/videoServices";

import { ANALYSIS_WAITING, SUBMISSION_WAITING } from "../utils/videoAnalysis";

export function useVideoAnalysis(submissionId) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);

  const requestKey = `${submissionId}:${revision}`;

  useEffect(() => {
    const controller = new AbortController();
    let timer;

    async function poll() {
      try {
        const options = {
          signal: controller.signal,
        };

        const submission = await getVideoSubmission(submissionId, options);

        let analysis = null;

        let waiting = SUBMISSION_WAITING.includes(submission.status);

        if (submission.analysisId) {
          analysis = await getVideoAnalysis(submission.analysisId, options);

          waiting = ANALYSIS_WAITING.includes(analysis.status);
        } else if (submission.status === "ACCEPTED") {
          throw new Error("Máy chủ chưa trả mã phiên phân tích. Hãy tải lại.");
        }

        if (controller.signal.aborted) {
          return;
        }

        setResult({
          key: requestKey,
          submission,
          analysis,
          waiting,
          error: null,
        });

        if (waiting) {
          timer = window.setTimeout(poll, 3000);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setResult((previous) => ({
          ...(previous?.key === requestKey ? previous : {}),

          key: requestKey,
          waiting: false,
          error,
        }));
      }
    }

    poll();

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [submissionId, requestKey]);

  const current = result?.key === requestKey ? result : null;

  return {
    submission: current?.submission ?? null,
    analysis: current?.analysis ?? null,
    loading: !current,
    waiting: current?.waiting ?? false,
    error: current?.error ?? null,

    reload: () => {
      setRevision((value) => value + 1);
    },
  };
}
