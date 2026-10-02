import type { CSSProperties } from "react";

export type DonutItem = {
  id: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
};

export function DonutChart({
  chartId,
  centerLabel,
  centerValue,
  description,
  emptyLabel,
  items,
  title,
}: {
  chartId: string;
  centerLabel: string;
  centerValue: number;
  description: string;
  emptyLabel: string;
  items: DonutItem[];
  title: string;
}) {
  let offset = 0;
  const segments = items.map((item) => {
    const size = centerValue > 0 ? (item.count / centerValue) * 100 : 0;
    const segment = { ...item, offset, size };
    offset += size;
    return segment;
  });
  const titleId = `donut-${chartId}`;

  return (
    <figure className="panel donut-card" aria-labelledby={titleId}>
      <div className="donut-heading">
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="donut-layout">
        <div className="donut-visual">
          <svg
            aria-label={`${title}: ${centerValue} ${centerLabel}`}
            role="img"
            viewBox="0 0 42 42"
          >
            <circle className="donut-track" cx="21" cy="21" r="15.9155" />
            {centerValue > 0 &&
              segments.map((item) => (
                <circle
                  className="donut-segment"
                  cx="21"
                  cy="21"
                  key={item.id}
                  pathLength="100"
                  r="15.9155"
                  style={
                    {
                      "--donut-color": item.color,
                      "--donut-dash": `${item.size} ${100 - item.size}`,
                      "--donut-offset": -item.offset,
                    } as CSSProperties
                  }
                />
              ))}
          </svg>
          <div className="donut-center" aria-hidden="true">
            <strong>{centerValue}</strong>
            <span>{centerLabel}</span>
          </div>
        </div>
        {centerValue === 0 ? (
          <p className="admin-empty donut-empty">{emptyLabel}</p>
        ) : (
          <ul className="donut-legend" aria-label={description}>
            {items.map((item) => (
              <li key={item.id}>
                <span
                  className="donut-swatch"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
                <strong>{item.count}</strong>
                <span>{item.percentage.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </figure>
  );
}
