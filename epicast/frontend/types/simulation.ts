export interface Intervention {
  name: string;
  start_day: number;
  end_day: number;
  efficacy: number;
}

export interface SimulationRequest {
  population: number;
  initial_infected: number;
  initial_exposed: number;
  r0: number;
  incubation_period: number;
  infectious_period: number;
  immunity_duration: number;
  icu_bed_capacity: number;
  severe_fraction: number;
  baseline_fatality_rate: number;
  surge_fatality_rate: number;
  vaccination_rate_per_day: number;
  vaccination_start_day: number;
  simulation_days: number;
  interventions: Intervention[];
}

export interface DataPoint {
  day: number;
  susceptible: number;
  exposed: number;
  infected: number;
  recovered: number;
  deceased: number;
  icu_demand: number;
  rt: number;
}

export interface SimulationMetrics {
  peak_infected_count: number;
  peak_infected_day: number;
  icu_collapse_day: number | null;
  total_deaths: number;
  final_attack_rate: number;
  cumulative_infections: number;
}

export interface SimulationResponse {
  status: string;
  metrics: SimulationMetrics;
  timeseries: DataPoint[];
  policy_brief: string;
}

export interface PresetScenario {
  id: string;
  title: string;
  description: string;
  params: Partial<SimulationRequest>;
}
