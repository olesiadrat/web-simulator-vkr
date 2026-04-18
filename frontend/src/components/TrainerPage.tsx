import { useMemo, useState } from "react";

import { finishSession } from "../api";
import type { BugModalMode, LocalBugReport, Scenario, ScenarioElement, TrainerSession } from "../types";
import { BugReportForm, type LocalBugDraft } from "./BugReportForm";
import { BugReportList } from "./BugReportList";
import { BugSummaryModal } from "./BugSummaryModal";
import { ScenarioRenderer } from "./ScenarioRenderer";

type TrainerPageProps = {
  scenario: Scenario;
  session: TrainerSession;
};

export function TrainerPage({ scenario, session }: TrainerPageProps) {
  const [bugs, setBugs] = useState<LocalBugReport[]>([]);
  const [activeElement, setActiveElement] = useState<ScenarioElement | null>(null);
  const [finishedSession, setFinishedSession] = useState<TrainerSession | null>(null);
  const [previewBug, setPreviewBug] = useState<LocalBugDraft | null>(null);
  const [selectedBugId, setSelectedBugId] = useState<number | null>(null);
  const [bugModalMode, setBugModalMode] = useState<BugModalMode | null>(null);
  const [formResetSignal, setFormResetSignal] = useState(0);
  const [formSaveSignal, setFormSaveSignal] = useState(0);

  const elementOptions = useMemo(() => {
    return scenario.json_structure.pages.flatMap((page) => {
      const pageOptions = page.elements.flatMap((element) => {
        const baseOption = {
          id: element.id,
          label: getElementOptionLabel(element),
          pageTitle: page.title,
        };

        if (element.type !== "card") {
          if (element.type === "imageCarousel") {
            return [
              baseOption,
              { id: `${element.id}-counter`, label: "Счетчик галереи", pageTitle: page.title },
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
              { id: `${element.id}-guests`, label: "Количество гостей (бронирование)", pageTitle: page.title },
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
      });

      if (page.id === "results") {
        pageOptions.unshift({
          id: "results-search-summary",
          label: "Сводка поиска",
          pageTitle: page.title,
        });
      }

      if (page.id === "details") {
        pageOptions.push({
          id: "booking-modal-guests",
          label: "Количество гостей (модальное окно бронирования)",
          pageTitle: page.title,
        });
      }

      return pageOptions;
    });
  }, [scenario.json_structure.pages]);

  const selectedBug = useMemo(() => {
    if (selectedBugId === null) {
      return null;
    }
    return bugs.find((bug) => bug.id === selectedBugId) ?? null;
  }, [bugs, selectedBugId]);

  const modalBug = useMemo(() => {
    if (bugModalMode === "preview") {
      return previewBug;
    }
    return selectedBug;
  }, [bugModalMode, previewBug, selectedBug]);

  function showPreviewModal(form: LocalBugDraft) {
    setPreviewBug(form);
    setSelectedBugId(null);
    setBugModalMode("preview");
  }

  function closeBugModal() {
    setBugModalMode(null);
    setPreviewBug(null);
    setSelectedBugId(null);
  }

  function confirmPreviewSubmit() {
    if (!previewBug) {
      return;
    }

    const createdBug: LocalBugReport = {
      ...previewBug,
      id: Date.now(),
    };
    console.log("Saved local bug", createdBug);
    setBugs((current) => [createdBug, ...current]);
    setFormResetSignal((current) => current + 1);
    setFormSaveSignal((current) => current + 1);
    closeBugModal();
  }

  function openBugFromList(bug: LocalBugReport) {
    setSelectedBugId(bug.id);
    setPreviewBug(null);
    setBugModalMode("view");
  }

  function requestBugEdit() {
    if (!selectedBug) {
      return;
    }
    setBugModalMode("edit");
  }

  function cancelBugEdit() {
    if (!selectedBug) {
      closeBugModal();
      return;
    }
    setBugModalMode("view");
  }

  function saveBugEdit(updatedBug: LocalBugDraft) {
    if (selectedBugId === null) {
      return;
    }

    setBugs((current) =>
      current.map((bug) =>
        bug.id === selectedBugId
          ? {
              ...bug,
              ...updatedBug,
            }
          : bug,
      ),
    );
    setBugModalMode("view");
  }

  function checkBugStub() {
    if (!modalBug) {
      return;
    }
    console.log("check bug stub", modalBug);
  }

  function refreshBugs() {
    setBugs((current) => [...current]);
  }

  async function completeSession() {
    const nextSession = await finishSession(session.id);
    setFinishedSession(nextSession);
    refreshBugs();
  }

  return (
    <section className="trainer-shell">
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
            onPreview={showPreviewModal}
            resetSignal={formResetSignal}
            saveSignal={formSaveSignal}
          />
          <BugReportList bugs={bugs} onRefresh={refreshBugs} onSelectBug={openBugFromList} />
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

      <BugSummaryModal
        isOpen={bugModalMode !== null && modalBug !== null}
        mode={bugModalMode ?? "preview"}
        bug={modalBug}
        onClose={closeBugModal}
        onConfirmSend={confirmPreviewSubmit}
        onRequestEdit={requestBugEdit}
        onCancelEdit={cancelBugEdit}
        onSaveEdit={saveBugEdit}
        onCheckBug={checkBugStub}
      />
    </section>
  );
}

function getElementLabel(element: ScenarioElement) {
  return element.label ?? element.text ?? element.title ?? element.alt ?? element.id;
}

function getElementOptionLabel(element: ScenarioElement) {
  const isGuestElement =
    element.type === "guestPicker" ||
    element.id === "guests" ||
    element.id === "results-guests" ||
    element.id.endsWith("-guests");

  if (isGuestElement) {
    if (element.id === "results-guests") {
      return "Количество гостей (фильтры)";
    }
    if (element.id.endsWith("-guests")) {
      return "Количество гостей";
    }
    return "Количество гостей";
  }

  return getElementLabel(element);
}
