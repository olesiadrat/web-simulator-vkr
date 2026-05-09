import { useEffect, useMemo, useState } from "react";

import { checkBugReport, createBugReport, finishSession, getBugReports, updateBugReport } from "../api";
import type { ApiBugReport, BugCheckResult, BugModalMode, LocalBugReport, Scenario, ScenarioElement, TrainerSession } from "../types";
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
  const [isCheckingBug, setIsCheckingBug] = useState(false);
  const [bugCheckError, setBugCheckError] = useState("");
  const [isSavingBug, setIsSavingBug] = useState(false);

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

  const currentCheckResult = selectedBug?.checkResult ?? null;

  useEffect(() => {
    void refreshBugs();
  }, [session.id]);

  function showPreviewModal(form: LocalBugDraft) {
    setPreviewBug(form);
    setSelectedBugId(null);
    setBugModalMode("preview");
  }

  function closeBugModal() {
    setBugModalMode(null);
    setPreviewBug(null);
    setSelectedBugId(null);
    setBugCheckError("");
    setIsCheckingBug(false);
  }

  async function confirmPreviewSubmit() {
    if (!previewBug) {
      return;
    }
    setIsSavingBug(true);
    try {
      const createdBug = await createBugReport({
        session: session.id,
        description: previewBug.description,
        reproduction_steps: previewBug.steps,
        expected: previewBug.expected,
        actual: previewBug.actual,
        ui_element: previewBug.element,
      });
      setBugs((current) => [normalizeBugReport(createdBug), ...current]);
    } finally {
      setIsSavingBug(false);
    }
    setFormResetSignal((current) => current + 1);
    setFormSaveSignal((current) => current + 1);
    closeBugModal();
  }

  function openBugFromList(bug: LocalBugReport) {
    setSelectedBugId(bug.id);
    setPreviewBug(null);
    setBugModalMode("view");
    setBugCheckError("");
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

  async function saveBugEdit(updatedBug: LocalBugDraft) {
    if (selectedBugId === null) {
      return;
    }
    const updated = await updateBugReport(selectedBugId, {
      description: updatedBug.description,
      reproduction_steps: updatedBug.steps,
      expected: updatedBug.expected,
      actual: updatedBug.actual,
      ui_element: updatedBug.element,
    });
    setBugs((current) => current.map((bug) => (bug.id === selectedBugId ? normalizeBugReport(updated) : bug)));
    setBugCheckError("");
    setBugModalMode("view");
  }

  async function checkBug() {
    if (!selectedBug) {
      return;
    }
    setIsCheckingBug(true);
    setBugCheckError("");

    try {
      const updatedBug = await checkBugReport(selectedBug.id);
      setBugs((current) => current.map((bug) => (bug.id === selectedBug.id ? normalizeBugReport(updatedBug) : bug)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось выполнить AI-проверку.";
      setBugCheckError(message);
    } finally {
      setIsCheckingBug(false);
    }
  }

  async function refreshBugs() {
    const nextBugs = await getBugReports(session.id);
    setBugs(nextBugs.map(normalizeBugReport));
  }

  async function completeSession() {
    const nextSession = await finishSession(session.id);
    setFinishedSession(nextSession);
    refreshBugs();
  }

  const checkedBugs = bugs.filter((bug) => bug.checkResult !== null);
  const validChecks = checkedBugs.filter((bug) => bug.checkResult?.status === "valid").length;
  const partialChecks = checkedBugs.filter((bug) => bug.checkResult?.status === "partially_valid").length;
  const invalidChecks = checkedBugs.filter((bug) => bug.checkResult?.status === "invalid").length;

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
            <div className="session-check-stats">
              <span>Проверено: <strong>{checkedBugs.length}</strong></span>
              <span>Корректно: <strong>{validChecks}</strong></span>
              <span>Частично: <strong>{partialChecks}</strong></span>
              <span>Некорректно: <strong>{invalidChecks}</strong></span>
            </div>
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
        checkResult={currentCheckResult}
        checkError={bugCheckError}
        isChecking={isCheckingBug}
        onClose={closeBugModal}
        onConfirmSend={() => void confirmPreviewSubmit()}
        onRequestEdit={requestBugEdit}
        onCancelEdit={cancelBugEdit}
        onSaveEdit={(bug) => void saveBugEdit(bug)}
        onCheckBug={() => void checkBug()}
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

function normalizeBugReport(bug: ApiBugReport): LocalBugReport {
  return {
    id: bug.id,
    sessionId: bug.session,
    description: bug.description,
    steps: bug.reproduction_steps ?? [],
    expected: bug.expected,
    actual: bug.actual,
    element: bug.ui_element,
    createdAt: bug.created_at,
    checkResult: bug.check_status
      ? {
          status: bug.check_status,
          score: bug.check_score ?? 0,
          summary: bug.check_summary,
          strengths: bug.check_strengths ?? [],
          issues: bug.check_issues ?? [],
          recommendation: bug.check_recommendation,
          matched_reference_bug: bug.matched_reference_bug,
          source: bug.check_source || "fallback",
        }
      : null,
  };
}
