'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  TooltipProps,
} from 'recharts';
import { DataPoint } from '@/types/simulation';
import { Layers, Activity, Eye, EyeOff } from 'lucide-react';

interface TrajectoryChartProps {
  timeseries: DataPoint[];
  icuCapacity: number;
}

interface SeriesVisibility {
  susceptible: boolean;
  exposed: boolean;
  infected: boolean;
  recovered: boolean;
  deceased: boolean;
  icu_demand: boolean;
}

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({
  timeseries,
  icuCapacity,
}) => {
  const [visibility, setVisibility] = useState<SeriesVisibility>({
    susceptible: false, // Default hidden to keep infectious/ICU curves readable
    exposed: true,
    infected: true,
    recovered: true,
    deceased: true,
    icu_demand: true,
  });

  const [activeTab, setActiveTab] = useState<'trajectories' | 'rt'>('trajectories');

  const toggleSeries = (key: keyof SeriesVisibility) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as DataPoint;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-lg p-3.5 shadow-2xl backdrop-blur-md text-xs font-mono">
          <div className="text-slate-300 font-bold mb-2 pb-1 border-b border-slate-800 flex justify-between">
            <span>Simulation Day: {label}</span>
            <span className="text-teal-400">R(t): {dataPoint.rt?.toFixed(2)}</span>
          </div>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={`item-${index}`} className="flex justify-between items-center gap-4">
                <span style={{ color: entry.color }} className="capitalize flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                  {entry.name?.replace('_', ' ')}:
                </span>
                <span className="font-semibold text-slate-100">
                  {Math.round(entry.value ?? 0).toLocaleString()}
                </span>
              </div>
            ))}
            <div className="pt-1 mt-1 border-t border-slate-800 flex justify-between text-slate-400">
              <span>ICU Capacity:</span>
              <span className="text-purple-400">{Math.round(icuCapacity).toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">
            {activeTab === 'trajectories' ? 'Coupled Population Trajectories' : 'Instantaneous Reproduction Rate R(t)'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('trajectories')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'trajectories'
                  ? 'bg-teal-500/20 text-teal-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SEIRD Dynamics
            </button>
            <button
              onClick={() => setActiveTab('rt')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'rt'
                  ? 'bg-teal-500/20 text-teal-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              R(t) & Stress
            </button>
          </div>
        </div>
      </div>

      {/* Series Toggles (Only in trajectories tab) */}
      {activeTab === 'trajectories' && (
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-mono">
          <span className="text-slate-500 text-[11px] uppercase mr-1">Visible Curves:</span>
          
          <button
            onClick={() => toggleSeries('susceptible')}
            className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
              visibility.susceptible
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-900/40 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {visibility.susceptible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Susceptible (S)
          </button>

          <button
            onClick={() => toggleSeries('exposed')}
            className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
              visibility.exposed
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900/40 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {visibility.exposed ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Exposed (E)
          </button>

          <button
            onClick={() => toggleSeries('infected')}
            className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
              visibility.infected
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-900/40 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {visibility.infected ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Infectious (I)
          </button>

          <button
            onClick={() => toggleSeries('recovered')}
            className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
              visibility.recovered
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900/40 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {visibility.recovered ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Recovered (R)
          </button>

          <button
            onClick={() => toggleSeries('deceased')}
            className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
              visibility.deceased
                ? 'bg-slate-400/20 text-slate-300 border-slate-500/40'
                : 'bg-slate-900/40 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {visibility.deceased ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Deceased (D)
          </button>

          <button
            onClick={() => toggleSeries('icu_demand')}
            className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
              visibility.icu_demand
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-slate-900/40 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {visibility.icu_demand ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            ICU Demand
          </button>
        </div>
      )}

      {/* Main Chart Canvas */}
      <div className="w-full h-[400px] sm:h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'trajectories' ? (
            <LineChart data={timeseries} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="day"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                label={{ value: 'Simulation Time (Days)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                tickFormatter={(val: number) => {
                  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
                  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
                  return val.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* ICU Capacity Reference Line */}
              <ReferenceLine
                y={icuCapacity}
                stroke="#a855f7"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `ICU Capacity: ${icuCapacity.toLocaleString()}`,
                  fill: '#c084fc',
                  fontSize: 11,
                  position: 'top',
                }}
              />

              {visibility.susceptible && (
                <Line
                  type="monotone"
                  dataKey="susceptible"
                  name="Susceptible"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {visibility.exposed && (
                <Line
                  type="monotone"
                  dataKey="exposed"
                  name="Exposed"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {visibility.infected && (
                <Line
                  type="monotone"
                  dataKey="infected"
                  name="Infectious"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {visibility.recovered && (
                <Line
                  type="monotone"
                  dataKey="recovered"
                  name="Recovered"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {visibility.deceased && (
                <Line
                  type="monotone"
                  dataKey="deceased"
                  name="Deceased"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {visibility.icu_demand && (
                <Line
                  type="monotone"
                  dataKey="icu_demand"
                  name="ICU Demand"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          ) : (
            <LineChart data={timeseries} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="day"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                label={{ value: 'Simulation Time (Days)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                domain={[0, 'auto']}
                label={{ value: 'Effective R(t)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={1.0}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{ value: 'Critical Epidemic Threshold (Rt = 1.0)', fill: '#f87171', fontSize: 11, position: 'top' }}
              />
              <Line
                type="monotone"
                dataKey="rt"
                name="Effective Rt"
                stroke="#14b8a6"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
