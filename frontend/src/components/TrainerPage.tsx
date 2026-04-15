import { useMemo, useState } from "react";

import { createBugReport, finishSession, getBugReports } from "../api";
import type { BugReport, Scenario, ScenarioElement, TrainerSession } from "../types";
import { BugReportForm, type BugFormState } from "./BugReportForm";
import { BugReportList } from "./BugReportList";
import { ScenarioRenderer } from "./ScenarioRenderer";

type TrainerPageProps = {
  scenario: Scenario;
  session: TrainerSession;
};

export function TrainerPage({ scenario, session }: TrainerPageProps) {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [activeElement, setActiveElement] = useState<ScenarioElement | null>(null);
  const [finishedSession, setFinishedSession] = useState<TrainerSession | null>(null);

  const elementOptions = useMemo(() => {
    return scenario.json_structure.pages.flatMap((page) =>
      page.elements.flatMap((element) => {
        const baseOption = {
          id: element.id,
          label: getElementLabel(element),
          pageTitle: page.title,
        };

        if (element.type !== "card") {
          if (element.type === "imageCarousel") {
            return [
              baseOption,
              { id: `${element.id}-prev`, label: "Стрелка влево галереи", pageTitle: page.title },
              { id: `${element.id}-next`, label: "Стрелка вправо галереи", pageTitle: page.title },
            ];
          }

          if (element.type === "bookingSummary") {
            return [
              baseOption,
              { id: `${element.id}-check-in`, label: "Дата заезда в бронировании", pageTitle: page.title },
              { id: `${element.id}-check-out`, label: "Дата отъезда в бронировании", pageTitle: page.title },
              { id: `${element.id}-nights`, label: "Расчет ночей в бронировании", pageTitle: page.title },
              { id: `${element.id}-guests`, label: "Количество гостей в бронировании", pageTitle: page.title },
              { id: `${element.id}-total`, label: "Итоговая стоимость", pageTitle: page.title },
              { id: `${element.id}-submit`, label: "Кнопка бронирования", pageTitle: page.title },
            ];
          }

          return [baseOption];
        }

        return [
          baseOption,
          { id: `${element.id}-gallery`, label: "Главное фото карточки", pageTitle: page.title },
          { id: `${element.id}-title`, label: "Название карточки", pageTitle: page.title },
          { id: `${element.id}-description`, label: "Описание карточки", pageTitle: page.title },
          { id: `${element.id}-rating`, label: "Рейтинг карточки", pageTitle: page.title },
          { id: `${element.id}-price`, label: "Цена карточки", pageTitle: page.title },
        ];
      }),
    );
  }, [scenario.json_structure.pages]);

  async function submitBug(form: BugFormState) {
    const createdBug = await createBugReport({
      session: session.id,
      ...form,
    });

    setBugs((current) => [createdBug, ...current]);
  }

  async function refreshBugs() {
    setBugs(await getBugReports(session.id));
  }

  async function completeSession() {
    const nextSession = await finishSession(session.id);
    setFinishedSession(nextSession);
    await refreshBugs();
  }

  return (
    <>
      <section className="trainer-intro">
        <div>
          <p className="eyebrow">Сессия #{session.id}</p>
          <h2>{scenario.title}</h2>
          <p>{scenario.description}</p>
        </div>
        <div className="trainer-steps" aria-label="Порядок работы">
          <span>1. Исследуй интерфейс</span>
          <span>2. Найди дефект</span>
          <span>3. Оформи баг-репорт</span>
        </div>
      </section>

      <div className="trainer-layout">
        <section className="simulator">
          <div className="simulator-header">
            <div>
              <p className="eyebrow">Тестируемый интерфейс</p>
              <p className="muted">Кликайте по элементам, проверяйте поведение и фиксируйте найденные проблемы.</p>
            </div>
            {activeElement && (
              <div className="active-element">
                <span>Выбран элемент</span>
                <strong>{activeElement.id}</strong>
              </div>
            )}
          </div>
          <ScenarioRenderer scenario={scenario} onElementSelect={setActiveElement} selectedElementId={activeElement?.id} />
        </section>

        <aside className="tester-panel">
          <BugReportForm
            activeElement={activeElement}
            elementOptions={elementOptions}
            onSubmit={submitBug}
          />
          <BugReportList bugs={bugs} onRefresh={() => void refreshBugs()} />
          <section className="session-result">
            <h2>Результат сессии</h2>
            <p className="muted">
              Сохранено баг-репортов: <strong>{bugs.length}</strong>
            </p>
            {finishedSession ? (
              <p className="success">Сессия завершена. Можно перейти к анализу результатов.</p>
            ) : (
              <button className="secondary-button" type="button" onClick={() => void completeSession()}>
                Завершить сессию
              </button>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

function getElementLabel(element: ScenarioElement) {
  return element.label ?? element.text ?? element.title ?? element.alt ?? element.id;
}
