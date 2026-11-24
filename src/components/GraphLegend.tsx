"use client";

type Item = { label: string; color: string };

type Props = {
  items: Item[];
};

export function GraphLegend({ items }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="graph-legend" aria-label="Topic legend">
      {items.slice(0, 8).map((item) => (
        <span key={item.label} className="graph-legend-item">
          <span className="graph-legend-swatch" style={{ background: item.color }} />
          <span>{item.label.length > 28 ? `${item.label.slice(0, 28)}…` : item.label}</span>
        </span>
      ))}
    </div>
  );
}