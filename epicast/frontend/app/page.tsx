'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertCircle,
  Cpu,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { SimulationRequest, SimulationResponse, PresetScenario } from '@/types/simulation';
import { Controls, PRESET_SCENARIOS } from '@/components/Controls';
import { TrajectoryChart } from '@/components/TrajectoryChart';
import { MetricCards } from '@/components/MetricCards';
import { PolicyBrief } from '@/components/PolicyBrief';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const DEFAULT_PARAMS: SimulationRequest = {
  population: 1_000_000,
  initial_infected: 100,
  initial_exposed: 50,
  r0: 2.8,
  incubation_period: 5.2,
  infectious_period: 7.0,
  immunity_duration: 180.0,
  icu_bed_capacity: 2500,
  severe_fraction: 0.05,
  baseline_fatality_rate: 0.008,
  surge_fatality_rate: 0.035,
  vaccination_rate_per_day: 0.002,
  vaccination_start_day: 30.0,
  simulation_days: 200,
  interventions: [
    {
      name: 'Initial Mask & Distancing Mandate',
      start_day: 25,
      end_day: 85,
      efficacy: 0.45,
    },
  ],
};

export default function DashboardPage() {
  const [params, setParams] = useState<SimulationRequest>(DEFAULT_PARAMS);
  const [response, setResponse] = useState<SimulationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const executeSimulation = useCallback(async (currentParams: SimulationRequest) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentParams),
      });

      if (!res.ok) {
        let errDetail = `Server returned HTTP ${res.status}`;
        try {
          const errData = await res.json();
          errDetail = errData.detail || errDetail;
        } catch {
          // No json error
        }
        throw new Error(errDetail);
      }

      const data: SimulationResponse = await res.json();
      setResponse(data);
      setBackendOnline(true);
    } catch (err: unknown) {
      const errStr = err instanceof Error ? err.message : 'Unknown communication error';
      setErrorMessage(
        `Simulation API unreachable (${API_BASE_URL}): ${errStr}. Ensure the backend is running.`
      );
      setBackendOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load execution
  useEffect(() => {
    executeSimulation(DEFAULT_PARAMS);
  }, [executeSimulation]);

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    executeSimulation(DEFAULT_PARAMS);
  };

  const handleApplyPreset = (preset: PresetScenario) => {
    const updated = {
      ...DEFAULT_PARAMS,
      ...preset.params,
    };
    setParams(updated);
    executeSimulation(updated);
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wider text-base text-white font-mono">
                  PROJECT EPICAST
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                  SEIRD+W v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Coupled ODE Epidemiological Forecasting & ICU Stress Amplification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border bg-slate-900 border-slate-800">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Backend:</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline === true
                    ? 'bg-emerald-400 animate-pulse'
                    : backendOnline === false
                    ? 'bg-rose-500'
                    : 'bg-amber-400'
                }`}
              />
              <span
                className={
                  backendOnline === true
                    ? 'text-emerald-400 font-semibold'
                    : backendOnline === false
                    ? 'text-rose-400 font-semibold'
                    : 'text-amber-400 font-semibold'
                }
              >
                {backendOnline === true ? 'Online' : backendOnline === false ? 'Offline' : 'Connecting'}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border bg-slate-900/60 border-slate-800 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
              <span>RK4 Δt=0.05d</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs font-mono flex items-start justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-300">Connection or Simulation Notice</div>
                <div className="mt-1 text-slate-300">{errorMessage}</div>
                <div className="mt-2 text-slate-400 text-[11px]">
                  Ensure backend is active: run <code className="bg-slate-900 px-1.5 py-0.5 rounded text-teal-300">docker compose up --build</code> or <code className="bg-slate-900 px-1.5 py-0.5 rounded text-teal-300">uvicorn main:app --port 8000</code> in <code className="text-slate-200">backend/</code>.
                </div>
              </div>
            </div>
            <button
              onClick={() => executeSimulation(params)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/60 border border-red-700 text-red-200 shrink-0 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Controls */}
          <div className="lg:col-span-4 xl:col-span-4">
            <Controls
              params={params}
              onChange={setParams}
              onSimulate={() => executeSimulation(params)}
              isLoading={isLoading}
              onReset={handleReset}
              onApplyPreset={handleApplyPreset}
            />
          </div>

          {/* Right Column: Analytics, Charts & Policy Brief */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-6">
            {response ? (
              <>
                {/* 1. Executive KPIs */}
                <MetricCards
                  metrics={response.metrics}
                  lastDataPoint={response.timeseries[response.timeseries.length - 1]}
                  icuCapacity={params.icu_bed_capacity}
                  severeFraction={params.severe_fraction}
                />

                {/* 2. Trajectory Recharts Visualization */}
                <TrajectoryChart
                  timeseries={response.timeseries}
                  icuCapacity={params.icu_bed_capacity}
                />

                {/* 3. Automated Policy Intelligence Brief */}
                <PolicyBrief
                  brief={response.policy_brief}
                  isCollapsed={response.metrics.icu_collapse_day !== null}
                />
              </>
            ) : (
              <div className="glass-panel rounded-xl p-12 border border-slate-800 flex flex-col items-center justify-center text-center">
                {isLoading ? (
                  <>
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <div className="text-base font-bold text-white font-mono">
                      Integrating ODE Vectors...
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Executing 4th-Order Runge-Kutta numerical solver at Δt = 0.05 days.
                    </div>
                  </>
                ) : (
                  <>
                    <Zap className="w-10 h-10 text-teal-400 mb-3" />
                    <div className="text-base font-bold text-white font-mono">
                      Simulation Engine Ready
                    </div>
                    <div className="text-xs text-slate-400 mt-1 max-w-sm">
                      Adjust epidemic parameters or select a preset scenario from the left panel, then trigger the engine.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
