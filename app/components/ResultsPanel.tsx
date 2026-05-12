import type { ReactNode } from "react";

// Card shell shared by the Starting Grid and Race Results panels: a constant
// title, a subtitle (the selected race), and either the row list or an
// empty-state message.
type Props = {
  title: string;
  subtitle: string;
  empty?: string; // when set, shown instead of the list
  children?: ReactNode; // <ResultRow> items
};

export default function ResultsPanel({ title, subtitle, empty, children }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
        {title}
      </h3>
      <p className="text-xs text-muted">{subtitle}</p>
      {empty ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ol className="mt-4 max-h-96 space-y-2 overflow-auto pr-1">{children}</ol>
      )}
    </section>
  );
}
