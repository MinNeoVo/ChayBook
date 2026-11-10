import { useEffect, useState } from "react";
import { getCategories } from "../services/categoryServices";

export function useCategoryOptions(type) {
  const [revision, setRevision] = useState(0);

  const [result, setResult] = useState({
    key: null,
    data: [],
    error: null,
  });

  const requestKey = JSON.stringify([type, revision]);

  useEffect(() => {
    const controller = new AbortController();

    getCategories(type, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            data,
            error: null,
          });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            data: [],
            error,
          });
        }
      });

    return () => controller.abort();
  }, [type, requestKey]);

  const isLoading = result.key !== requestKey;

  return {
    categories: isLoading ? [] : result.data,
    isLoading,
    error: isLoading ? null : result.error,
    reload: () => setRevision((value) => value + 1),
  };
}
