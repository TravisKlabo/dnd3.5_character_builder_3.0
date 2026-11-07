import type { ReactNode } from "react";
import { useClassFeatureProgression } from "../data/classFeatureProgression";

export function ClassFeatureProgressionBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const progression = useClassFeatureProgression();
  if (progression.status === "ready") return children;
  if (progression.status === "error") {
    return (
      <section className="panel status-message" role="alert">
        <p>Unable to load class progression rules: {progression.error}</p>
        <button type="button" onClick={progression.retry}>
          Retry loading class progression rules
        </button>
      </section>
    );
  }
  return (
    <section
      className="panel status-message"
      role="status"
      aria-busy="true"
    >
      Loading class progression rules...
    </section>
  );
}
