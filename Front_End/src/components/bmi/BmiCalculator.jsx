import { useAuth } from "../../context/useAuth";
import { useBmi } from "../../context/useBmi";
import { formatBmiValue, getBmiCategoryLabel } from "../../utils/bmi";
import { Calculator, ChevronRight, Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "../common/Button";
import Input from "../common/Input";

function BmiCalculator() {
  const { loading: authLoading } = useAuth();
  const {
    height,
    setHeight,
    weight,
    setWeight,
    bmiRecord,
    loading,
    initialized,
    error,
    isLoggedIn,
    calculateBmi,
  } = useBmi();

  const isBusy = authLoading || loading || !initialized;

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-md md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chaybook-secondary-container text-chaybook-primary">
            <Dumbbell className="h-5 w-5" />
          </div>

          <h4 className="text-lg font-bold text-gray-900">
            Quick BMI Calculator
          </h4>
        </div>

        <span className="text-xs text-gray-500">WHO Standard</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Height (cm)"
          type="number"
          value={height}
          onChange={(event) => setHeight(event.target.value)}
          min="100"
          max="240"
          disabled={isBusy}
        />

        <Input
          label="Weight (kg)"
          type="number"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          min="30"
          max="250"
          disabled={isBusy}
        />
      </div>

      <Button
        type="button"
        onClick={calculateBmi}
        disabled={isBusy}
        className="flex h-11 items-center justify-center gap-2"
      >
        <Calculator className="h-[18px] w-[18px]" />
        {loading ? "Saving BMI..." : "Calculate Health Status"}
      </Button>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {!isLoggedIn && !authLoading && (
        <p className="text-sm text-gray-600">
          <Link
            to="/login"
            className="font-semibold text-chaybook-primary hover:underline"
          >
            Log in
          </Link>{" "}
          to save and sync your BMI.
        </p>
      )}

      <div className="flex items-center justify-between rounded-xl bg-chaybook-container p-4">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Your BMI Result</span>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-chaybook-primary">
              {loading && !bmiRecord
                ? "Loading..."
                : formatBmiValue(bmiRecord?.bmi)}
            </span>

            <span className="text-sm font-semibold text-chaybook-primary">
              {getBmiCategoryLabel(bmiRecord?.category)}
            </span>
          </div>
        </div>

        <Link
          to="/bmi"
          className="flex items-center gap-1 text-xs font-semibold text-chaybook-primary hover:underline"
        >
          Full Analysis
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default BmiCalculator;
