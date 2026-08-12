import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = { stroke: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" };
const GRID = "var(--color-border)";

const tooltipStyle = {
  backgroundColor: "var(--color-surface-raised)",
  border: "1px solid var(--color-border-strong)",
  borderRadius: "4px",
  fontSize: "12px",
  fontFamily: "var(--font-mono)",
  color: "var(--color-foreground)",
};

function thinDates(count: number) {
  return (value: string, index: number) => (index % Math.ceil(count / 6) === 0 ? value.slice(0, 7) : "");
}

export function LineSeriesChart({
  data,
  xKey,
  series,
  height = 240,
  yTickFormatter,
  areaFirst = false,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; label: string; color: string }[];
  height?: number;
  yTickFormatter?: (v: number) => string;
  areaFirst?: boolean;
}) {
  const Chart = areaFirst ? AreaChart : LineChart;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickFormatter={thinDates(data.length)} minTickGap={8} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tick={AXIS} tickFormatter={yTickFormatter ?? ((v: number) => String(v))} axisLine={false} tickLine={false} width={56} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "var(--color-muted-foreground)" }} />
        {series.map((s, i) =>
          areaFirst && i === 0 ? (
            <Area isAnimationActive={false} key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} fill={s.color} fillOpacity={0.12} strokeWidth={1.6} dot={false} />
          ) : (
            <Line isAnimationActive={false} key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={1.4} dot={false} />
          ),
        )}
      </Chart>
    </ResponsiveContainer>
  );
}

export function DrawdownChart({ data, height = 180 }: { data: { timestamp: string; drawdown: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="timestamp" tick={AXIS} tickFormatter={thinDates(data.length)} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tick={AXIS} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} axisLine={false} tickLine={false} width={56} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${(v * 100).toFixed(2)}%`} />
        <Area isAnimationActive={false} type="monotone" dataKey="drawdown" stroke="var(--color-negative)" fill="var(--color-negative)" fillOpacity={0.18} strokeWidth={1.2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarChart({
  data,
  height = 320,
  color = "var(--color-primary)",
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" horizontal={false} />
        <XAxis type="number" tick={AXIS} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" tick={AXIS} width={140} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${(v * 100).toFixed(2)}%`} />
        <Bar isAnimationActive={false} dataKey="value" fill={color} radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeightsChart({ data, height = 260 }: { data: { label: string; value: number }[]; height?: number }) {
  const palette = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-primary)"];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tick={AXIS} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} axisLine={false} tickLine={false} width={48} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${(v * 100).toFixed(2)}%`} />
        <Bar isAnimationActive={false} dataKey="value" radius={[2, 2, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PredictionScatter({
  data,
  height = 280,
}: {
  data: { prediction: number; realised: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" />
        <XAxis
          type="number"
          dataKey="prediction"
          name="Predicted"
          tick={AXIS}
          tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="number"
          dataKey="realised"
          name="Realised"
          tick={AXIS}
          tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <ReferenceLine x={0} stroke={GRID} />
        <ReferenceLine y={0} stroke={GRID} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${(v * 100).toFixed(2)}%`} />
        <Scatter isAnimationActive={false} data={data} fill="var(--color-primary)" fillOpacity={0.55} shape="circle" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function CorrelationHeatmap({ symbols, matrix }: { symbols: string[]; matrix: number[][] }) {
  const cellColor = (v: number) => {
    const clamped = Math.max(-1, Math.min(1, v));
    const color = clamped >= 0 ? "var(--color-primary)" : "var(--color-negative)";
    return { backgroundColor: `color-mix(in oklab, ${color} ${Math.abs(clamped) * 70 + 8}%, transparent)` };
  };
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="min-w-[560px] border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="label-caps px-2 py-1 text-left font-normal" />
            {symbols.map((s) => (
              <th key={s} className="label-caps px-2 py-1 font-normal">
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {symbols.map((row, i) => (
            <tr key={row}>
              <th className="label-caps px-2 py-1 text-left font-normal">{row}</th>
              {symbols.map((_, j) => (
                <td key={j} className="num px-2 py-1.5 text-center" style={cellColor(matrix[i]?.[j] ?? 0)}>
                  {(matrix[i]?.[j] ?? 0).toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
