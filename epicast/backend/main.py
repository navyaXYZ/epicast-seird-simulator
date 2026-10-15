from datetime import datetime, timezone
import logging
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import SimulationRequest, SimulationResponse
from solver import SEIRDWEngine

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("epicast.backend")

app = FastAPI(
    title="Project EpiCast - SEIRD+W Simulation API",
    description=(
        "Production-grade, coupled non-linear ODE epidemiological forecasting and "
        "healthcare strain simulator with dynamic Rt feedback and ICU stress-induced mortality amplification."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration to allow local frontend access and cloud deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["System"])
def root_status() -> Dict[str, Any]:
    """
    API discovery and root status endpoint.
    """
    return {
        "service": "Project EpiCast API",
        "version": "1.0.0",
        "status": "operational",
        "documentation": "/docs",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health", tags=["System"])
def health_check() -> Dict[str, Any]:
    """
    High-availability health check probe for orchestrators and load balancers.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "engine": "SEIRDW-RK4-NumPy",
    }


@app.post(
    "/api/v1/simulate",
    response_model=SimulationResponse,
    status_code=status.HTTP_200_OK,
    tags=["Epidemiological Simulation"],
    summary="Execute SEIRD+W RK4 Simulation",
)
def run_simulation(request: SimulationRequest) -> SimulationResponse:
    """
    Executes a high-resolution epidemiological simulation across the requested time horizon.
    Solves coupled non-linear ODEs using RK4 integration, evaluates ICU capacity strain,
    and returns daily timeseries along with synthesized policy intelligence.
    """
    try:
        logger.info(
            f"Received simulation request: population={request.population}, R0={request.r0}, "
            f"days={request.simulation_days}, interventions_count={len(request.interventions)}"
        )

        engine = SEIRDWEngine(request)
        timeseries, metrics, policy_brief = engine.run()

        logger.info(
            f"Simulation completed successfully. Peak Infected: {metrics.peak_infected_count:.0f} "
            f"on Day {metrics.peak_infected_day}, Total Deaths: {metrics.total_deaths:.0f}"
        )

        return SimulationResponse(
            status="success",
            metrics=metrics,
            timeseries=timeseries,
            policy_brief=policy_brief,
        )

    except ValueError as ve:
        logger.warning(f"Validation or boundary condition error during simulation: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Mathematical or boundary specification error: {str(ve)}",
        )
    except Exception as exc:
        logger.error(f"Unexpected numerical engine exception: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation computation engine failure: {str(exc)}",
        )


@app.exception_handler(HTTPException)
def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "code": exc.status_code,
            "detail": exc.detail,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
