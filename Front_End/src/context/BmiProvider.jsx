import { useCallback, useEffect, useState } from "react";

import BmiContext from "./BmiContext";
import { useAuth } from "./useAuth";
import { createBmiRecord, getLatestBmi } from "../services/bmiServices";

const EMPTY_BMI = {
  height: "172",
  setHeight: () => {},
  weight: "65",
  setWeight: () => {},
  bmiRecord: null,
  loading: false,
  initialized: true,
  error: "",
  isLoggedIn: false,
  calculateBmi: async () => null,
};

function GuestBmiProvider({ children }) {
  const [height, setHeight] = useState("172");
  const [weight, setWeight] = useState("65");
  const [bmiRecord, setBmiRecord] = useState(null);
  const [error, setError] = useState("");

  const calculateBmi = useCallback(async () => {
    setError("");
    const heightValue = Number(height);
    const weightValue = Number(weight);

    if (!Number.isFinite(heightValue) || heightValue <= 0) {
      setError("Enter a valid height greater than zero.");
      return null;
    }
    if (!Number.isFinite(weightValue) || weightValue <= 0) {
      setError("Enter a valid weight greater than zero.");
      return null;
    }

    const bmi = Math.round((weightValue / (heightValue / 100) ** 2) * 100) / 100;
    const category =
      bmi < 18.5
        ? "UNDERWEIGHT"
        : bmi < 25
          ? "NORMAL"
          : bmi < 30
            ? "OVERWEIGHT"
            : "OBESE";
    const result = {
      height: heightValue,
      weight: weightValue,
      bmi,
      category,
      createdAt: new Date().toISOString(),
    };
    setBmiRecord(result);
    return result;
  }, [height, weight]);

  return (
    <BmiContext.Provider
      value={{
        height,
        setHeight,
        weight,
        setWeight,
        bmiRecord,
        loading: false,
        initialized: true,
        error,
        isLoggedIn: false,
        calculateBmi,
      }}
    >
      {children}
    </BmiContext.Provider>
  );
}

function AuthenticatedBmiProvider({ userId, children }) {
  const [height, setHeight] = useState("172");
  const [weight, setWeight] = useState("65");
  const [bmiRecord, setBmiRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getLatestBmi(userId, { signal: controller.signal })
      .then((record) => {
        setBmiRecord(record);
        setHeight(String(record.height));
        setWeight(String(record.weight));
      })
      .catch((requestError) => {
        if (controller.signal.aborted) {
          return;
        }

        if (requestError.status === 404) {
          setBmiRecord(null);
          return;
        }

        console.error("Failed to load the latest BMI:", requestError);
        setError(requestError.message || "Failed to load your BMI.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setInitialized(true);
        }
      });

    return () => controller.abort();
  }, [userId]);

  const calculateBmi = useCallback(async () => {
    setError("");

    const heightValue = Number(height);
    const weightValue = Number(weight);

    if (!Number.isFinite(heightValue) || heightValue <= 0) {
      setError("Enter a valid height greater than zero.");
      return null;
    }

    if (!Number.isFinite(weightValue) || weightValue <= 0) {
      setError("Enter a valid weight greater than zero.");
      return null;
    }

    setLoading(true);

    try {
      const record = await createBmiRecord({
        height: heightValue,
        weight: weightValue,
      });

      setBmiRecord(record);
      setHeight(String(record.height));
      setWeight(String(record.weight));
      return record;
    } catch (requestError) {
      console.error("Failed to save BMI:", requestError);
      setError(requestError.message || "Failed to save your BMI.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [height, weight]);

  return (
    <BmiContext.Provider
      value={{
        height,
        setHeight,
        weight,
        setWeight,
        bmiRecord,
        loading,
        initialized,
        error,
        isLoggedIn: true,
        calculateBmi,
      }}
    >
      {children}
    </BmiContext.Provider>
  );
}

function BmiProvider({ children }) {
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <BmiContext.Provider
        value={{ ...EMPTY_BMI, loading: true, initialized: false }}
      >
        {children}
      </BmiContext.Provider>
    );
  }

  if (!isLoggedIn || !user?.userId) {
    return <GuestBmiProvider>{children}</GuestBmiProvider>;
  }

  return (
    <AuthenticatedBmiProvider key={user.userId} userId={user.userId}>
      {children}
    </AuthenticatedBmiProvider>
  );
}

export default BmiProvider;
