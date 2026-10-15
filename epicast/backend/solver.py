import math
from typing import List, Optional, Tuple
import numpy as np

from models import DataPoint, SimulationMetrics, SimulationRequest


class SEIRDWEngine:
    """
    High-resolution, coupled non-linear ODE solver for the SEIRD+W epidemiological model.
    Utilizes 4th-Order Runge-Kutta (RK4) integration with Delta_t = 0.05 days.
    Guarantees strict numerical mass conservation (S + E + I + R + D == N) and non-negativity.
    """

    def __init__(self, request: SimulationRequest) -> None:
        self.req = request
        self.dt = 0.05  # Time step in days (20 steps per day)
        self.n = float(request.population)

        # Baseline kinetic parameters
        self.sigma = 1.0 / float(request.incubation_period)
        self.gamma = 1.0 / float(request.infectious_period)
        self.omega = 1.0 / float(request.immunity_duration)
        self.beta0 = float(request.r0) * self.gamma

        # Clinical parameters
        self.c_icu = float(request.icu_bed_capacity)
        self.alpha = float(request.severe_fraction)
        self.mu_base = float(request.baseline_fatality_rate)
        self.mu_surge = float(request.surge_fatality_rate)

        # Vaccination parameters
        self.v_rate = float(request.vaccination_rate_per_day)
        self.v_start = float(request.vaccination_start_day)

        # Interventions cache for fast lookup
        self.interventions = [
            {
                "name": it.name,
                "start": float(it.start_day),
                "end": float(it.end_day),
                "efficacy": float(it.efficacy),
            }
            for it in request.interventions
        ]

    def _compute_beta(self, t: float) -> float:
        """
        Calculates time-varying transmission rate beta(t) accounting for active interventions.
        beta(t) = beta0 * prod_{k}(1 - eta_k * Theta(t - t_start) * (1 - Theta(t - t_end)))
        """
        transmission_factor = 1.0
        for it in self.interventions:
            if it["start"] <= t <= it["end"]:
                transmission_factor *= max(0.0, 1.0 - it["efficacy"])
        return max(0.0, self.beta0 * transmission_factor)

    def _compute_nu(self, t: float, r: float, d: float) -> float:
        """
        Calculates vaccination flux rate nu(t) targeting remaining susceptible individuals.
        nu(t) = V_rate * Theta(t - t_v_start) * max(0, 1 - (D + R) / N)
        """
        if t < self.v_start:
            return 0.0
        available_susceptible_fraction = max(0.0, 1.0 - (d + r) / self.n)
        return self.v_rate * available_susceptible_fraction

    def _compute_mortality(self, i: float) -> float:
        """
        Evaluates non-linear ICU-saturated mortality function mu(I(t), C_ICU).
        Mortality spikes when severe cases (alpha * I(t)) exceed ICU capacity C_ICU.
        """
        icu_demand = self.alpha * max(0.0, i)
        if icu_demand <= self.c_icu or icu_demand <= 1e-9:
            return self.mu_base
        
        # Saturated surge mortality penalty
        saturation_ratio = 1.0 - (self.c_icu / icu_demand)
        surge_penalty = (self.mu_surge - self.mu_base) * saturation_ratio
        return self.mu_base + max(0.0, surge_penalty)

    def _derivatives(self, t: float, state: np.ndarray) -> np.ndarray:
        """
        Evaluates the system of coupled ODEs dY/dt at time t:
        State vector Y = [S, E, I, R, D, Cumulative_Infections]
        """
        s, e, i, r, d, _ = state

        # Clamp numerical noise for rate calculations
        s = max(0.0, s)
        e = max(0.0, e)
        i = max(0.0, i)
        r = max(0.0, r)
        d = max(0.0, d)

        beta_t = self._compute_beta(t)
        nu_t = self._compute_nu(t, r, d)
        mu_t = self._compute_mortality(i)

        # Transmission flux: new infections
        force_of_infection = (beta_t * s * i) / self.n if self.n > 0 else 0.0

        # Coupled SEIRD+W equations
        ds_dt = -force_of_infection + (self.omega * r) - (nu_t * s)
        de_dt = force_of_infection - (self.sigma * e)
        di_dt = (self.sigma * e) - (self.gamma * i) - (mu_t * i)
        dr_dt = (self.gamma * i) - (self.omega * r) + (nu_t * s)
        dd_dt = mu_t * i
        dcum_dt = force_of_infection

        return np.array([ds_dt, de_dt, di_dt, dr_dt, dd_dt, dcum_dt], dtype=np.float64)

    def run(self) -> Tuple[List[DataPoint], SimulationMetrics, str]:
        """
        Executes the 4th-Order Runge-Kutta simulation, generates timeseries data downsampled
        to daily resolution, computes executive metrics, and produces a structured policy brief.
        """
        total_days = self.req.simulation_days
        total_steps = int(round(total_days / self.dt))

        # Initial conditions
        i0 = float(self.req.initial_infected)
        e0 = float(self.req.initial_exposed)
        r0_init = 0.0
        d0_init = 0.0
        s0 = self.n - (i0 + e0 + r0_init + d0_init)
        cum_inf0 = i0 + e0

        state = np.array([s0, e0, i0, r0_init, d0_init, cum_inf0], dtype=np.float64)

        timeseries: List[DataPoint] = []

        # Peak and collapse trackers
        peak_i = i0
        peak_i_day = 0.0
        icu_collapse_day: Optional[float] = None
        first_collapse_recorded = False

        # Precompute integer sampling targets
        sampling_interval = int(round(1.0 / self.dt))

        for step in range(total_steps + 1):
            current_time = step * self.dt

            s_curr, e_curr, i_curr, r_curr, d_curr, cum_curr = state

            # Track peak infections
            if i_curr > peak_i:
                peak_i = i_curr
                peak_i_day = round(current_time, 2)

            # Track ICU collapse
            current_icu_demand = self.alpha * max(0.0, i_curr)
            if not first_collapse_recorded and current_icu_demand > self.c_icu:
                icu_collapse_day = round(current_time, 2)
                first_collapse_recorded = True

            # Record state at daily boundaries
            if step % sampling_interval == 0 or step == total_steps:
                day_num = round(current_time, 2)

                # Compute instantaneous Rt
                beta_t = self._compute_beta(current_time)
                mu_t = self._compute_mortality(i_curr)
                denominator = self.gamma + mu_t
                if denominator > 1e-9 and self.n > 0:
                    rt = (beta_t / denominator) * (max(0.0, s_curr) / self.n)
                else:
                    rt = 0.0

                timeseries.append(
                    DataPoint(
                        day=float(day_num),
                        susceptible=round(max(0.0, float(s_curr)), 2),
                        exposed=round(max(0.0, float(e_curr)), 2),
                        infected=round(max(0.0, float(i_curr)), 2),
                        recovered=round(max(0.0, float(r_curr)), 2),
                        deceased=round(max(0.0, float(d_curr)), 2),
                        icu_demand=round(max(0.0, float(current_icu_demand)), 2),
                        rt=round(max(0.0, float(rt)), 4),
                    )
                )

            if step == total_steps:
                break

            # Runge-Kutta 4th Order Numerical Step
            k1 = self._derivatives(current_time, state)
            k2 = self._derivatives(current_time + 0.5 * self.dt, state + 0.5 * self.dt * k1)
            k3 = self._derivatives(current_time + 0.5 * self.dt, state + 0.5 * self.dt * k2)
            k4 = self._derivatives(current_time + self.dt, state + self.dt * k3)

            delta = (self.dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)
            next_state = state + delta

            # Enforcement of Non-Negativity and Strict Mass Conservation
            s_next = max(0.0, next_state[0])
            e_next = max(0.0, next_state[1])
            i_next = max(0.0, next_state[2])
            r_next = max(0.0, next_state[3])
            d_next = max(0.0, next_state[4])
            cum_next = max(cum_curr, next_state[5])  # Cumulative infections monotonically non-decreasing

            # Calculate numerical mass conservation residual
            living_sum = s_next + e_next + i_next + r_next + d_next
            residual = self.n - living_sum

            # Distribute residual smoothly back into susceptible population if floating-point drift occurs
            s_next += residual
            if s_next < 0.0:
                s_next = 0.0

            state = np.array([s_next, e_next, i_next, r_next, d_next, cum_next], dtype=np.float64)

        # Final metrics aggregation
        final_deaths = state[4]
        final_cum_inf = state[5]
        attack_rate = (final_cum_inf / self.n) * 100.0 if self.n > 0 else 0.0

        metrics = SimulationMetrics(
            peak_infected_count=round(peak_i, 2),
            peak_infected_day=peak_i_day,
            icu_collapse_day=icu_collapse_day,
            total_deaths=round(final_deaths, 2),
            final_attack_rate=round(attack_rate, 2),
            cumulative_infections=round(final_cum_inf, 2),
        )

        policy_brief = self._generate_policy_brief(metrics, timeseries)

        return timeseries, metrics, policy_brief

    def _generate_policy_brief(
        self, metrics: SimulationMetrics, timeseries: List[DataPoint]
    ) -> str:
        """
        Synthesizes an executive epidemiological policy brief detailing critical timestamps,
        healthcare capacity strain, intervention performance, and recommended strategic actions.
        """
        peak_icu_demand = metrics.peak_infected_count * self.alpha
        bed_deficit = max(0.0, peak_icu_demand - self.c_icu)
        capacity_utilization = (peak_icu_demand / self.c_icu) * 100.0 if self.c_icu > 0 else 0.0
        final_rt = timeseries[-1].rt if timeseries else 0.0

        lines: List[str] = [
            "### EXECUTIVE EPIDEMIOLOGICAL INTELLIGENCE BRIEF",
            f"**Population Horizon:** {int(self.n):,} individuals over {self.req.simulation_days} days.",
            "",
            "#### 1. Healthcare Capacity & Critical Care Assessment",
        ]

        if metrics.icu_collapse_day is not None:
            lines.extend([
                f"- **STATUS:** ⚠️ **HEALTHCARE INFRASTRUCTURE COLLAPSE DETECTED**",
                f"- **Collapse Trigger:** Day {metrics.icu_collapse_day:.1f}",
                f"- **Peak ICU Demand:** {int(round(peak_icu_demand)):,} beds against {int(self.c_icu):,} available.",
                f"- **Peak ICU Saturation:** {capacity_utilization:.1f}% capacity ({int(round(bed_deficit)):,} bed deficit).",
                f"- **Surge Mortality Impact:** Elevated mortality (up to {self.mu_surge * 100:.1f}%) directly accounted for excess preventable deaths.",
            ])
        else:
            lines.extend([
                f"- **STATUS:** 🟢 **HEALTHCARE INFRASTRUCTURE PRESERVED**",
                f"- **Peak ICU Demand:** {int(round(peak_icu_demand)):,} beds against {int(self.c_icu):,} available.",
                f"- **Maximum Capacity Utilization:** {capacity_utilization:.1f}%.",
                f"- **Safety Margin:** {int(round(self.c_icu - peak_icu_demand)):,} unutilized ICU beds remained at peak burden.",
            ])

        lines.extend([
            "",
            "#### 2. Epidemiological Trajectory & Key Milestones",
            f"- **Peak Infectious Day:** Day {metrics.peak_infected_day:.1f} with {int(round(metrics.peak_infected_count)):,} simultaneous active infections.",
            f"- **Total Pathogen-Attributable Mortality:** {int(round(metrics.total_deaths)):,} fatalities ({(metrics.total_deaths / self.n) * 100:.2f}% of total population).",
            f"- **Cumulative Attack Rate:** {metrics.final_attack_rate:.1f}% ({int(round(metrics.cumulative_infections)):,} total infections).",
            f"- **Terminal Reproduction Number (Rt at Day {self.req.simulation_days}):** {final_rt:.2f} "
            + ("(Suppression Achieved, Rt < 1.0)" if final_rt < 1.0 else "(Ongoing Transmission, Rt >= 1.0)"),
        ])

        # Intervention analysis
        lines.extend(["", "#### 3. Intervention Efficacy & Waning Immunity Dynamics"])
        if self.interventions:
            lines.append("- **Scheduled Interventions Evaluated:**")
            for it in self.interventions:
                lines.append(
                    f"  * **{it['name']}:** Active Days {it['start']:.0f} - {it['end']:.0f} (Efficacy: {it['efficacy'] * 100:.0f}% transmission reduction)."
                )
        else:
            lines.append("- **Interventions:** None scheduled (pure unmitigated transmission dynamics observed).")

        if self.req.immunity_duration < 365:
            lines.append(
                f"- **Immunity Waning Alert:** Mean antibody duration is {self.req.immunity_duration:.0f} days. "
                "The R -> S feedback loop sustains secondary waves unless suppressed by sustained booster campaigns or active mitigations."
            )

        # Quantitative Recommendations
        lines.extend(["", "#### 4. Actionable Public Health Recommendations"])
        if metrics.icu_collapse_day is not None:
            recommended_shift = max(1.0, metrics.icu_collapse_day - 14.0)
            lines.extend([
                f"1. **Preemptive Intervention Timing:** Implement transmission suppression controls by Day {recommended_shift:.0f} at latest (at least 14 days prior to Day {metrics.icu_collapse_day:.1f} collapse point).",
                f"2. **Critical Care Expansion:** Scale ICU bed capacity from {int(self.c_icu):,} to at least {int(math.ceil(peak_icu_demand * 1.15)):,} beds (including 15% operational buffer).",
                "3. **Targeted Transmission Reduction:** Increase cumulative intervention efficacy by an additional 25-35% to compress peak active infections below the clinical threshold.",
            ])
        else:
            lines.extend([
                "1. **Maintenance of Safe Buffers:** Maintain current mitigation scheduling; peak burden remains within clinical resilience bounds.",
                "2. **Step-Down Trigger Criteria:** Do not ease mitigations until instantaneous Rt remains below 0.85 for 14 consecutive days.",
            ])

        if self.v_rate > 0.0:
            lines.append(
                f"3. **Vaccination Acceleration:** Current rollout of {self.v_rate * 100:.2f}% population/day reduces susceptible pool; "
                "prioritize early cohorts to preempt waning-induced endemic re-emergence."
            )

        return "\n".join(lines)
