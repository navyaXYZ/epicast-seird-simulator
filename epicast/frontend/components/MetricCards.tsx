'use client';

import React from 'react';
import { Activity, AlertTriangle, ShieldCheck, Skull, Users, Zap } from 'lucide-react';
import { SimulationMetrics, DataPoint } from '@/types/simulation';

interface MetricCardsProps {
  metrics: SimulationMetrics;
  lastDataPoint?: DataPoint;
  icuCapacity: number;
  severeFraction: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  metrics,
  lastDataPoint,
  icuCapacity,
  severeFraction,
}) => {
  const peakIcuDemand = metrics.peak_infected_count * severeFraction;
  const isCollapsed = metrics.icu_collapse_day !== null;
  const bedDeficit = isCollapsed ? Math.round(peakIcuDemand - icuCapacity) : 0;
  const terminalRt = lastDataPoint ? lastDataPoint.rt : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Peak Infectious Burden */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Peak Burden</span>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-white">
          {Math.round(metrics.peak_infected_count).toLocaleString()}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
          <span>Peak occurred on</span>
          <span className="text-rose-400 font-semibold font-mono">Day {metrics.peak_infected_day.toFixed(1)}</span>
        </div>
      </div>

      {/* 2. Healthcare Infrastructure Status */}
      <div className={`glass-panel rounded-xl p-5 border transition-all ${
        isCollapsed
          ? 'border-red-900/50 bg-red-950/20 hover:border-red-700/60'
          : 'border-emerald-900/50 bg-emerald-950/20 hover:border-emerald-700/60'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">ICU Stress Status</span>
          <div className={`p-2 rounded-lg ${
            isCollapsed ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            {isCollapsed ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
        </div>
        <div className="text-xl font-bold font-mono flex items-center gap-2">
          {isCollapsed ? (
            <span className="text-red-400">COLLAPSED</span>
          ) : (
            <span className="text-emerald-400">PRESERVED</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
          {isCollapsed ? (
            <span className="text-red-300">
              Exhausted Day {metrics.icu_collapse_day?.toFixed(1)} ({bedDeficit.toLocaleString()} bed deficit)
            </span>
          ) : (
            <span className="text-emerald-300">
              Within capacity ({Math.round(icuCapacity - peakIcuDemand).toLocaleString()} buffer)
            </span>
          )}
        </div>
      </div>

      {/* 3. Cumulative Fatalities & Attack Rate */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Cumulative Mortality</span>
          <div className="p-2 rounded-lg bg-slate-500/10 text-slate-400">
            <Skull className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-white">
          {Math.round(metrics.total_deaths).toLocaleString()}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
          <span>Attack Rate:</span>
          <span className="text-teal-400 font-semibold font-mono">{metrics.final_attack_rate.toFixed(1)}%</span>
        </div>
      </div>

      {/* 4. Instantaneous Reproduction Number (Rt) */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Terminal R(t)</span>
          <div className={`p-2 rounded-lg ${
            terminalRt < 1.0 ? 'bg-teal-500/10 text-teal-400' : 'bg-amber-500/10 text-amber-400'
          }`}>
            <Zap className="w-5 h-5" />
          </div>
        </div>
        <div className={`text-2xl font-bold font-mono ${
          terminalRt < 1.0 ? 'text-teal-400' : 'text-amber-400'
        }`}>
          {terminalRt.toFixed(2)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
          <span>Dynamics:</span>
          <span className={terminalRt < 1.0 ? 'text-teal-400' : 'text-amber-400'}>
            {terminalRt < 1.0 ? 'Epidemic Contained (< 1.0)' : 'Active Transmission (≥ 1.0)'}
          </span>
        </div>
      </div>
    </div>
  );
};
