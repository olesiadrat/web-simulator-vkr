import { useEffect, useState } from "react";

import { createSession, getScenarios } from "./api";
import { ScenarioList } from "./components/ScenarioList";
import { TrainerPage } from "./components/TrainerPage";
import type { Scenario, TrainerSession } from "./types";

export function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [session, setSession] = useState<TrainerSession | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getScenarios()
      .then(setScenarios)
      .catch(() => setError("Не удалось загрузить сценарии. Проверьте, что backend запущен."))
      .finally(() => setIsLoading(false));
  }, []);

  async function startScenario(scenario: Scenario) {
    setError("");
    const nextSession = await createSession(scenario.id);
    setSelectedScenario(scenario);
    setSession(nextSession);
  }

  function returnToScenarioList() {
    setSelectedScenario(null);
    setSession(null);
  }

  if (isLoading) {
    return <main className="page">Загрузка сценариев...</main>;
  }

  return (
    <main className="page">
      <header className="app-header">
        <div>
          <p className="eyebrow">ВКР MVP</p>
          <h1>Тренажер тестирования UI</h1>
        </div>
        {selectedScenario && (
          <button className="text-button" type="button" onClick={returnToScenarioList}>
            К списку сценариев
          </button>
        )}
      </header>

      {error && <p className="error">{error}</p>}

      {selectedScenario && session ? (
        <TrainerPage scenario={selectedScenario} session={session} />
      ) : (
        <ScenarioList scenarios={scenarios} onStartScenario={(scenario) => void startScenario(scenario)} />
      )}
    </main>
  );
}

