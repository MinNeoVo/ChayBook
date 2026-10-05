import BmiCalculator from "../components/bmi/BmiCalculator";

function BmiPage() {
  return (
    <div className="min-h-screen w-full bg-chaybook-container px-4 py-10 text-[#181c1b] sm:px-6 sm:py-14 lg:px-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-chaybook-primary">
            Health tools
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">BMI Calculator</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#3e4a3d]">
            Calculate your BMI here. When signed in, the result is saved and
            shared with the home page and meal planning page.
          </p>
        </header>

        <BmiCalculator />
      </div>
    </div>
  );
}

export default BmiPage;
