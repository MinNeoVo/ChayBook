import { useEffect, useRef, useState } from "react";
import { adminIngredientService } from "../services/adminIngredientServices";

export function useAdminIngredients(filters, service = adminIngredientService) {
  const { q, status = "", page, size } = filters;

  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({
    key: null,
    data: null,
    error: null,
  });
  const [isMutating, setIsMutating] = useState(false);

  const mutationLock = useRef(false);
  const requestKey = JSON.stringify([q, status, page, size, revision]);

  useEffect(() => {
    const controller = new AbortController();

    service
      .list({ q, status, page, size }, { signal: controller.signal })
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
            data: null,
            error,
          });
        }
      });

    return () => controller.abort();
  }, [q, status, page, size, requestKey, service]);

  function reload() {
    setRevision((current) => current + 1);
  }

  async function mutate(operation) {
    if (mutationLock.current) {
      throw new Error(
        "Một thao tác đang được thực hiện. Vui lòng thử lại sau.",
      );
    }

    mutationLock.current = true;
    setIsMutating(true);

    try {
      const data = await operation();
      reload();
      return data;
    } finally {
      mutationLock.current = false;
      setIsMutating(false);
    }
  }

  function saveIngredient(ingredientId, payload) {
    return mutate(() =>
      ingredientId == null
        ? service.create(payload)
        : service.update(ingredientId, payload),
    );
  }

  function deleteIngredient(ingredientId) {
    return mutate(() => service.remove(ingredientId));
  }

  function restoreIngredient(ingredientId) {
    return mutate(() => service.restore(ingredientId));
  }

  const isLoading = result.key !== requestKey;

  return {
    pageData: isLoading ? null : result.data,
    error: isLoading ? null : result.error,
    isLoading,
    isMutating,
    reload,
    saveIngredient,
    deleteIngredient,
    restoreIngredient,
  };
}
