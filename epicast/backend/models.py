from typing import List, Optional
from pydantic import BaseModel, Field, model_validator


class InterventionSchema(BaseModel):
    """
    Scheduled non-pharmaceutical or behavioral intervention.
    Reduces the baseline transmission rate beta by a factor of (1 - efficacy).
    """
    name: str = Field(..., min_length=1, max_length=100, description="Intervention descriptor (e.g., 'Mask Mandate')")
    start_day: float = Field(..., ge=0.0, le=730.0, description="Simulation day when the intervention activates")
    end_day: float = Field(..., ge=0.0, le=730.0, description="Simulation day when the intervention concludes")
    efficacy: float = Field(..., ge=0.0, le=1.0, description="Transmission reduction coefficient eta in range [0, 1]")

    @model_validator(mode="after")
    def validate_temporal_order(self) -> "InterventionSchema":
        if self.end_day < self.start_day:
            raise ValueError(f"Intervention '{self.name}': end_day ({self.end_day}) cannot precede start_day ({self.start_day}).")
        return self


class SimulationRequest(BaseModel):
    """
    Comprehensive parameter specification for the SEIRD+W epidemiological simulation engine.
    """
    population: int = Field(
        default=1_000_000,
        ge=1_000,
        le=500_000_000,
        description="Total closed population size N"
    )
    initial_infected: int = Field(
        default=100,
        ge=1,
        description="Initial infectious active population I(0)"
    )
    initial_exposed: int = Field(
        default=50,
        ge=0,
        description="Initial incubating population E(0)"
    )
    r0: float = Field(
        default=2.8,
        ge=0.5,
        le=15.0,
        description="Basic reproduction number R0 in an unmitigated, fully susceptible population"
    )
    incubation_period: float = Field(
        default=5.2,
        ge=1.0,
        le=30.0,
        description="Mean latency incubation duration tau_incubation in days (sigma = 1 / tau_incubation)"
    )
    infectious_period: float = Field(
        default=7.0,
        ge=1.0,
        le=45.0,
        description="Mean infectiousness duration tau_recovery in days (gamma = 1 / tau_recovery)"
    )
    immunity_duration: float = Field(
        default=180.0,
        ge=30.0,
        le=1000.0,
        description="Mean waning immunity duration tau_immunity in days (omega = 1 / tau_immunity)"
    )
    icu_bed_capacity: int = Field(
        default=2500,
        ge=1,
        description="Total dedicated ICU bed capacity C_ICU"
    )
    severe_fraction: float = Field(
        default=0.05,
        ge=0.01,
        le=0.5,
        description="Fraction alpha of active infections requiring critical ICU care"
    )
    baseline_fatality_rate: float = Field(
        default=0.008,
        ge=0.0001,
        le=0.1,
        description="Base infection fatality rate mu_base when ICU demand <= capacity"
    )
    surge_fatality_rate: float = Field(
        default=0.035,
        ge=0.001,
        le=0.5,
        description="Elevated infection fatality rate mu_surge during healthcare system collapse"
    )
    vaccination_rate_per_day: float = Field(
        default=0.002,
        ge=0.0,
        le=0.05,
        description="Daily fraction of susceptible population vaccinated (nu)"
    )
    vaccination_start_day: float = Field(
        default=30.0,
        ge=0.0,
        le=365.0,
        description="Simulation day when vaccine rollout campaign initiates"
    )
    simulation_days: int = Field(
        default=200,
        ge=30,
        le=730,
        description="Total time horizon for the simulation in days"
    )
    interventions: List[InterventionSchema] = Field(
        default_factory=list,
        description="List of active non-pharmaceutical interventions"
    )

    @model_validator(mode="after")
    def validate_population_and_rates(self) -> "SimulationRequest":
        initial_cases = self.initial_infected + self.initial_exposed
        if initial_cases >= self.population:
            raise ValueError(
                f"Combined initial infected ({self.initial_infected}) and exposed ({self.initial_exposed}) "
                f"exceeds or equals total population ({self.population})."
            )
        if self.surge_fatality_rate < self.baseline_fatality_rate:
            raise ValueError(
                f"Surge fatality rate ({self.surge_fatality_rate}) cannot be less than "
                f"baseline fatality rate ({self.baseline_fatality_rate})."
            )
        for intervention in self.interventions:
            if intervention.start_day > self.simulation_days:
                continue
            if intervention.end_day > self.simulation_days:
                intervention.end_day = float(self.simulation_days)
        return self


class DataPoint(BaseModel):
    """
    Discrete daily epidemiological snapshot emitted by the simulation solver.
    """
    day: float = Field(..., description="Simulation day timestamp")
    susceptible: float = Field(..., description="Count of susceptible individuals S(t)")
    exposed: float = Field(..., description="Count of exposed/incubating individuals E(t)")
    infected: float = Field(..., description="Count of actively infectious individuals I(t)")
    recovered: float = Field(..., description="Count of immune/recovered individuals R(t)")
    deceased: float = Field(..., description="Count of cumulative pathogen-attributed deaths D(t)")
    icu_demand: float = Field(..., description="Current critical care demand (alpha * I(t))")
    rt: float = Field(..., description="Instantaneous effective reproduction number R_t")


class SimulationMetrics(BaseModel):
    """
    Aggregated epidemiological KPIs and healthcare strain indicators.
    """
    peak_infected_count: float = Field(..., description="Maximum simultaneous infectious individuals max(I(t))")
    peak_infected_day: float = Field(..., description="Simulation day on which peak infectiousness occurs")
    icu_collapse_day: Optional[float] = Field(None, description="First simulation day where ICU demand exceeds capacity")
    total_deaths: float = Field(..., description="Total cumulative mortality at end of simulation D(T)")
    final_attack_rate: float = Field(..., description="Final attack rate percentage (Cumulative Infections / N * 100)")
    cumulative_infections: float = Field(..., description="Total cumulative individuals that transitioned through infected state")


class SimulationResponse(BaseModel):
    """
    Top-level API response payload containing metrics, full daily timeseries, and policy brief.
    """
    status: str = Field(default="success", description="Execution status ('success' or 'error')")
    metrics: SimulationMetrics = Field(..., description="Summary epidemiological indicators")
    timeseries: List[DataPoint] = Field(..., description="Daily discretized trajectory curves")
    policy_brief: str = Field(..., description="Synthesized epidemiological analysis and policy guidance")
