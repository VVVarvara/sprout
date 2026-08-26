"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";

export type TrendPoint = {
  date: string;
  weightKg: number | null;
  sleepHours: number | null;
  energy: number | null;
  mood: number | null;
  stress: number | null;
};

const ink = "#55614f";
const grid = "#e3e2d4";

function shortDate(d: string) {
  return d.slice(5); // MM-DD
}

export function WeightChart({ data }: { data: TrendPoint[] }) {
  const points = data.filter((p) => p.weightKg != null);
  if (points.length < 2) return <p className="muted">Log weight on a few check-ins to see the trend.</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={points} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: ink }} />
        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: ink }} />
        <Tooltip />
        <Line type="monotone" dataKey="weightKg" name="Weight (kg)" stroke="#3e7247" strokeWidth={2.5} dot={{ r: 2.5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SleepChart({ data }: { data: TrendPoint[] }) {
  const points = data.filter((p) => p.sleepHours != null);
  if (points.length < 2) return <p className="muted">Log sleep on a few check-ins to see the trend.</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={points} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: ink }} />
        <YAxis domain={[0, 12]} tick={{ fontSize: 11, fill: ink }} />
        <Tooltip />
        <Line type="monotone" dataKey="sleepHours" name="Sleep (h)" stroke="#8a3b5c" strokeWidth={2.5} dot={{ r: 2.5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WellbeingChart({ data }: { data: TrendPoint[] }) {
  const points = data.filter((p) => p.energy != null || p.mood != null || p.stress != null);
  if (points.length < 2) return <p className="muted">Log energy, mood and stress to see the trend.</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={points} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: ink }} />
        <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: ink }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="energy" name="Energy" stroke="#3e7247" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="mood" name="Mood" stroke="#b97f2a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="stress" name="Stress" stroke="#a33c2f" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
