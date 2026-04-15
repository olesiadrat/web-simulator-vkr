import type { Scenario } from "../types";

type ScenarioListProps = {
  scenarios: Scenario[];
  onStartScenario: (scenario: Scenario) => void;
};

export function ScenarioList({ scenarios, onStartScenario }: ScenarioListProps) {
  if (scenarios.length === 0) {
    return <p className="muted">Пока нет доступных сценариев.</p>;
  }

  return (
    <section className="scenario-list">
      {scenarios.map((scenario) => (
        <article className="scenario-list-item" key={scenario.id}>
          <div>
            <h2>{scenario.title}</h2>
            <p>{scenario.description}</p>
          </div>
          <button className="primary-button" type="button" onClick={() => onStartScenario(scenario)}>
            Начать
          </button>
        </article>
      ))}
    </section>
  );
}

