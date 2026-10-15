# 🦠 EpiCast: SEIRD+W Advanced Epidemiological & Healthcare Capacity Simulator

> A mathematical modeling engine and real-time dashboard predicting pathogen spread, waning antibody dynamics, and ICU bed exhaustion under dynamic public policy interventions.

---

## 🎯 The Problem
Standard SIR models fail during real outbreaks because they ignore viral incubation periods, antibody decay (which causes secondary waves), and ICU bed saturation. When hospitals run out of beds, the case fatality rate surges non-linearly.

## 💡 The Solution: EpiCast
**EpiCast** uses a non-linear, coupled **SEIRD+W Ordinary Differential Equation (ODE)** solver to model disease trajectories:
- **$S$ (Susceptible) $\to$ $E$ (Exposed/Incubating) $\to$ $I$ (Infectious) $\to$ $R$ (Recovered) $\to$ $D$ (Deceased)**
- **Waning Immunity ($R \to S$):** Simulates antibody loss over 90–180 days, producing realistic multi-wave endemic cycles.
- **Dynamic Transmission $\beta(t)$:** Allows policy makers to schedule mask mandates, school closures, or vaccines and instantly view the "flattened curve."
- **ICU Collapse Penalty:** Automatically spikes mortality when active critical cases breach available hospital bed capacity.

---

## 🔬 Governing Mathematics
The continuous-time state transitions are computed via numerical integration ($\Delta t = 0.05$ days):

$$\frac{dS}{dt} = -\frac{\beta(t) S I}{N} + \omega R - \nu(t) S$$

$$\frac{dE}{dt} = \frac{\beta(t) S I}{N} - \sigma E$$

$$\frac{dI}{dt} = \sigma E - \gamma I - \mu(I, C_{ICU}) I$$

$$\frac{dR}{dt} = \gamma I - \omega R + \nu(t) S$$

$$\frac{dD}{dt} = \mu(I, C_{ICU}) I$$

---

## 🛠️ System Architecture & Tech Stack
- **Engine Core:** Python, FastAPI, NumPy (Vectorized 4th-order Runge-Kutta & Euler ODE integration).
- **Analytical Frontend:** Next.js / React, Tailwind CSS, Recharts (Dark-mode responsive simulation dashboard).
- **Deployment:** Docker & Docker Compose.

---

## 🚀 Quickstart (Local Run)

```bash
docker compose up --build
