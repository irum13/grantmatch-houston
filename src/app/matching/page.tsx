"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Radar } from "lucide-react";
import { useGrantMatch } from "@/components/grantmatch-provider";

const steps = [
  "Understanding your business",
  "Checking Houston programs",
  "Checking Texas programs",
  "Searching federal opportunities",
  "Testing basic eligibility",
  "Evaluating funding fit",
  "Checking application readiness",
];

export default function MatchingPage() {
  const router = useRouter();
  const { profile, hydrated } = useGrantMatch();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    if (!profile) {
      router.replace("/demo");
      return;
    }

    const timer = window.setInterval(() => {
      setActiveStep((current) => {
        if (current >= steps.length - 1) {
          window.clearInterval(timer);
          window.setTimeout(() => router.push("/matches"), 450);
          return current;
        }
        return current + 1;
      });
    }, 380);

    return () => window.clearInterval(timer);
  }, [hydrated, profile, router]);

  return (
    <div className="page-shell">
      <section className="progress-shell" aria-live="polite">
        <div className="progress-visual">
          <Radar size={36} />
        </div>
        <h1>Finding funding that fits.</h1>
        <p>
          We&apos;re comparing {profile?.name ?? "your business"} against
          location, eligibility, funding-use, and readiness requirements.
        </p>
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div
              className={`progress-step ${
                index < activeStep
                  ? "complete"
                  : index === activeStep
                    ? "active"
                    : ""
              }`}
              key={step}
            >
              {index < activeStep ? (
                <Check size={17} />
              ) : (
                <span style={{ width: 17, textAlign: "center" }}>
                  {index + 1}
                </span>
              )}
              {step}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
