'use client';

import React from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Shield,
  Activity,
  Syringe,
  BookmarkCheck,
} from 'lucide-react';
import { SimulationRequest, Intervention, PresetScenario } from '@/types/simulation';

interface ControlsProps {
  params: SimulationRequest;
  onChange: (updated: SimulationRequest) => void;
  onSimulate: () => void;
  isLoading: boolean;
  onReset: () => void;
  onApplyPreset: (preset: PresetScenario) => void;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'unmitigated',
    title: 'Unmitigated Outbreak',
    description: 'Natural viral progression with R0 = 3.2 and zero interventions, resulting in rapid ICU saturation.',
    params: {
      r0: 3.2,
      simulation_days: 180,
      interventions: [],
      vaccination_rate_per_day: 0.0,
    },
  },
  {
    id: 'late_lockdown',
    title: 'Late Intervention Crisis',
    description: 'Intervention delayed until Day 45, demonstrating catastrophic overflow before containment takes hold.',
    params: {
      r0: 3.0,
      simulation_days: 200,
      interventions: [
        { name: 'Late Emergency Lockdown', start_day: 45, end_day: 110, efficacy: 0.70 },
      ],
      vaccination_rate_per_day: 0.001,
      vaccination_start_day: 60,
    },
  },
  {
    id: 'waning_wave',
    title: 'Waning Immunity Rebound',
    description: 'Strict early suppression followed by premature cessation, showing a massive secondary wave.',
    params: {
      r0: 2.8,
      immunity_duration: 120,
      simulation_days: 365,
      interventions: [
        { name: 'Early Lockdown', start_day: 15, end_day: 65, efficacy: 0.75 },
      ],
      vaccination_rate_per_day: 0.0005,
    },
  },
  {
    id: 'vaccine_race',
    title: 'Vaccine Race & Suppression',
    description: 'Moderate early social distancing combined with rapid vaccine campaign rollout.',
    params: {
      r0: 2.8,
      simulation_days: 250,
      vaccination_rate_per_day: 0.004,
      vaccination_start_day: 20,
      interventions: [
        { name: 'Targeted Distancing & Masks', start_day: 10, end_day: 90, efficacy: 0.40 },
      ],
    },
  },
];

export const Controls: React.FC<ControlsProps> = ({
  params,
  onChange,
  onSimulate,
  isLoading,
  onReset,
  onApplyPreset,
}) => {
  const handleNumericChange = (key: keyof SimulationRequest, value: number) => {
    onChange({ ...params, [key]: value });
  };

  const handleAddIntervention = () => {
    const newIntervention: Intervention = {
      name: `Intervention ${params.interventions.length + 1}`,
      start_day: 20,
      end_day: 70,
      efficacy: 0.5,
    };
    onChange({
      ...params,
      interventions: [...params.interventions, newIntervention],
    });
  };

  const handleUpdateIntervention = (
    index: number,
    field: keyof Intervention,
    value: string | number
  ) => {
    const updated = [...params.interventions];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...params, interventions: updated });
  };

  const handleRemoveIntervention = (index: number) => {
    const updated = params.interventions.filter((_, idx) => idx !== index);
    onChange({ ...params, interventions: updated });
  };

  return (
    <div className="space-y-6">
      {/* Scenario Presets Selector */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <BookmarkCheck className="w-5 h-5 text-teal-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Preset Scenarios</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className="text-left p-3 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-teal-500/40 transition-all group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-teal-300">
                {preset.title}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Parameters Panel */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Epidemic Parameters</h3>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="space-y-4">
          {/* Basic Reproduction Number R0 */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300">Basic Reproduction Number (R₀)</span>
              <span className="text-teal-400 font-bold">{params.r0.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="6.0"
              step="0.05"
              value={params.r0}
              onChange={(e) => handleNumericChange('r0', parseFloat(e.target.value))}
              className="w-full accent-teal-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Population Size */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300">Population Size (N)</span>
              <span className="text-teal-400 font-bold">{params.population.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="5000000"
              step="50000"
              value={params.population}
              onChange={(e) => handleNumericChange('population', parseInt(e.target.value, 10))}
              className="w-full accent-teal-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Incubation Period */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300">Incubation Period (τ_incubation)</span>
              <span className="text-teal-400 font-bold">{params.incubation_period.toFixed(1)} days</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="14.0"
              step="0.1"
              value={params.incubation_period}
              onChange={(e) => handleNumericChange('incubation_period', parseFloat(e.target.value))}
              className="w-full accent-teal-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Infectious Period */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300">Infectious Period (τ_recovery)</span>
              <span className="text-teal-400 font-bold">{params.infectious_period.toFixed(1)} days</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="21.0"
              step="0.5"
              value={params.infectious_period}
              onChange={(e) => handleNumericChange('infectious_period', parseFloat(e.target.value))}
              className="w-full accent-teal-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Immunity Duration */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300">Immunity Waning Duration (τ_immunity)</span>
              <span className="text-teal-400 font-bold">{Math.round(params.immunity_duration)} days</span>
            </div>
            <input
              type="range"
              min="45"
              max="730"
              step="15"
              value={params.immunity_duration}
              onChange={(e) => handleNumericChange('immunity_duration', parseFloat(e.target.value))}
              className="w-full accent-teal-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Simulation Time Horizon */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300">Simulation Horizon</span>
              <span className="text-teal-400 font-bold">{params.simulation_days} days</span>
            </div>
            <input
              type="range"
              min="30"
              max="730"
              step="10"
              value={params.simulation_days}
              onChange={(e) => handleNumericChange('simulation_days', parseInt(e.target.value, 10))}
              className="w-full accent-teal-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>
        </div>

        {/* Healthcare & Clinical Stress */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Healthcare System Capacity</h4>
          </div>

          {/* ICU Bed Capacity */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300">ICU Bed Capacity (C_ICU)</span>
              <span className="text-purple-400 font-bold">{params.icu_bed_capacity.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="100"
              max="15000"
              step="100"
              value={params.icu_bed_capacity}
              onChange={(e) => handleNumericChange('icu_bed_capacity', parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Severe Fraction */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300">Severe Case Fraction (α requiring ICU)</span>
              <span className="text-purple-400 font-bold">{(params.severe_fraction * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.20"
              step="0.005"
              value={params.severe_fraction}
              onChange={(e) => handleNumericChange('severe_fraction', parseFloat(e.target.value))}
              className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Baseline vs Surge Fatality */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] text-slate-400 mb-1 font-mono">Base Fatality Rate</div>
              <div className="text-xs font-bold text-slate-200 mb-1">{(params.baseline_fatality_rate * 100).toFixed(2)}%</div>
              <input
                type="range"
                min="0.001"
                max="0.03"
                step="0.001"
                value={params.baseline_fatality_rate}
                onChange={(e) => handleNumericChange('baseline_fatality_rate', parseFloat(e.target.value))}
                className="w-full accent-teal-500 bg-slate-800 rounded-lg cursor-pointer h-1"
              />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-1 font-mono">Surge Fatality Rate</div>
              <div className="text-xs font-bold text-rose-400 mb-1">{(params.surge_fatality_rate * 100).toFixed(2)}%</div>
              <input
                type="range"
                min="0.005"
                max="0.10"
                step="0.002"
                value={params.surge_fatality_rate}
                onChange={(e) => handleNumericChange('surge_fatality_rate', parseFloat(e.target.value))}
                className="w-full accent-rose-500 bg-slate-800 rounded-lg cursor-pointer h-1"
              />
            </div>
          </div>
        </div>

        {/* Vaccination Rollout */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Syringe className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Vaccination Campaign</h4>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300">Daily Vaccination Rate (% pop / day)</span>
              <span className="text-emerald-400 font-bold">{(params.vaccination_rate_per_day * 100).toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.01"
              step="0.0005"
              value={params.vaccination_rate_per_day}
              onChange={(e) => handleNumericChange('vaccination_rate_per_day', parseFloat(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300">Vaccine Rollout Start Day</span>
              <span className="text-emerald-400 font-bold">Day {params.vaccination_start_day}</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="5"
              value={params.vaccination_start_day}
              onChange={(e) => handleNumericChange('vaccination_start_day', parseFloat(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>
        </div>

        {/* Multi-Intervention Scheduler */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Intervention Scheduler</h4>
            </div>
            <button
              onClick={handleAddIntervention}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-mono border border-teal-500/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {params.interventions.length === 0 ? (
            <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/40 text-center text-xs text-slate-400">
              No active interventions scheduled. Unmitigated epidemic spread.
            </div>
          ) : (
            <div className="space-y-3">
              {params.interventions.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-800 bg-slate-900/70 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={it.name}
                      onChange={(e) => handleUpdateIntervention(idx, 'name', e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs font-semibold w-full focus:outline-none focus:border-teal-500"
                    />
                    <button
                      onClick={() => handleRemoveIntervention(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove intervention"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-400">Start: Day {it.start_day}</span>
                      <input
                        type="range"
                        min="0"
                        max={params.simulation_days}
                        step="1"
                        value={it.start_day}
                        onChange={(e) =>
                          handleUpdateIntervention(idx, 'start_day', parseFloat(e.target.value))
                        }
                        className="w-full accent-amber-500 bg-slate-800 rounded h-1 cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400">End: Day {it.end_day}</span>
                      <input
                        type="range"
                        min={it.start_day}
                        max={params.simulation_days}
                        step="1"
                        value={it.end_day}
                        onChange={(e) =>
                          handleUpdateIntervention(idx, 'end_day', parseFloat(e.target.value))
                        }
                        className="w-full accent-amber-500 bg-slate-800 rounded h-1 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Efficacy (Transmission Reduction)</span>
                      <span className="text-amber-400 font-bold">{Math.round(it.efficacy * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={it.efficacy}
                      onChange={(e) =>
                        handleUpdateIntervention(idx, 'efficacy', parseFloat(e.target.value))
                      }
                      className="w-full accent-amber-500 bg-slate-800 rounded h-1 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trigger Execute Button */}
        <button
          onClick={onSimulate}
          disabled={isLoading}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold font-mono tracking-wide bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Integrating RK4 ODEs...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Execute EpiCast Engine</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
