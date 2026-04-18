import { useEffect, useState } from "react";

import type { BugModalMode, BugSummaryData } from "../types";
import { BugSummaryFields, type BugSummaryErrors } from "./BugSummaryFields";

type BugSummaryModalProps = {
  isOpen: boolean;
  mode: BugModalMode;
  bug: BugSummaryData | null;
  onClose: () => void;
  onConfirmSend: () => void;
  onRequestEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (bug: BugSummaryData) => void;
  onCheckBug: () => void;
};

export function BugSummaryModal({
  isOpen,
  mode,
  bug,
  onClose,
  onConfirmSend,
  onRequestEdit,
  onCancelEdit,
  onSaveEdit,
  onCheckBug,
}: BugSummaryModalProps) {
  const [draft, setDraft] = useState<BugSummaryData>(createEmptyBugSummary());
  const [errors, setErrors] = useState<BugSummaryErrors>({});

  useEffect(() => {
    if (!bug) {
      setDraft(createEmptyBugSummary());
      setErrors({});
      return;
    }
    setDraft(normalizeBugSummary(bug));
    setErrors({});
  }, [bug, mode, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !bug) {
    return null;
  }

  const title = getModalTitle(mode);
  const isEditMode = mode === "edit";

  function handleFieldChange(field: keyof Omit<BugSummaryData, "steps">, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (field === "description" && errors.description) {
      setErrors((current) => ({ ...current, description: undefined }));
    }
    if (field === "expected" && errors.expected) {
      setErrors((current) => ({ ...current, expected: undefined }));
    }
    if (field === "actual" && errors.actual) {
      setErrors((current) => ({ ...current, actual: undefined }));
    }
  }

  function handleStepChange(index: number, value: string) {
    setDraft((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) => (stepIndex === index ? value : step)),
    }));
    if (errors.steps) {
      setErrors((current) => ({ ...current, steps: undefined }));
    }
  }

  function handleAddStep() {
    setDraft((current) => ({ ...current, steps: [...current.steps, ""] }));
  }

  function handleRemoveStep(index: number) {
    setDraft((current) => {
      if (current.steps.length === 1) {
        return current;
      }
      return { ...current, steps: current.steps.filter((_, stepIndex) => stepIndex !== index) };
    });
  }

  function validateDraft() {
    const nextErrors: BugSummaryErrors = {};
    if (!draft.description.trim()) {
      nextErrors.description = "Заполните описание ошибки";
    }
    if (!draft.expected.trim()) {
      nextErrors.expected = "Заполните expected behavior";
    }
    if (!draft.actual.trim()) {
      nextErrors.actual = "Заполните actual behavior";
    }
    if (draft.steps.map((step) => step.trim()).filter(Boolean).length === 0) {
      nextErrors.steps = "Добавьте хотя бы один шаг";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSaveEdit() {
    if (!validateDraft()) {
      return;
    }
    onSaveEdit({
      description: draft.description.trim(),
      steps: draft.steps.map((step) => step.trim()).filter(Boolean),
      expected: draft.expected.trim(),
      actual: draft.actual.trim(),
      element: draft.element.trim(),
    });
  }

  const primaryActions =
    mode === "preview" ? (
      <div className="bug-modal-actions">
        <button className="secondary-button" type="button" onClick={onClose}>
          Отмена
        </button>
        <button className="primary-button" type="button" onClick={onConfirmSend}>
          Подтвердить отправку
        </button>
      </div>
    ) : mode === "view" ? (
      <div className="bug-modal-actions bug-modal-actions-wide">
        <button className="secondary-button" type="button" onClick={onRequestEdit}>
          Редактировать
        </button>
        <button className="secondary-button" type="button" onClick={onCheckBug}>
          Проверить баг
        </button>
        <button className="primary-button" type="button" onClick={onClose}>
          Закрыть
        </button>
      </div>
    ) : (
      <div className="bug-modal-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setDraft(normalizeBugSummary(bug));
            setErrors({});
            onCancelEdit();
          }}
        >
          Отмена
        </button>
        <button className="primary-button" type="button" onClick={handleSaveEdit}>
          Сохранить изменения
        </button>
      </div>
    );

  return (
    <div
      className="bug-modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="bug-summary-modal" role="dialog" aria-modal="true" aria-labelledby="bug-summary-title">
        <div className="bug-modal-header">
          <h2 id="bug-summary-title">{title}</h2>
          <button type="button" aria-label="Закрыть окно" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="bug-modal-body">
          <BugSummaryFields
            bug={isEditMode ? draft : normalizeBugSummary(bug)}
            editable={isEditMode}
            errors={errors}
            onFieldChange={handleFieldChange}
            onStepChange={handleStepChange}
            onAddStep={handleAddStep}
            onRemoveStep={handleRemoveStep}
          />
        </div>

        {primaryActions}
      </section>
    </div>
  );
}

function createEmptyBugSummary(): BugSummaryData {
  return {
    element: "",
    description: "",
    steps: [""],
    expected: "",
    actual: "",
  };
}

function normalizeBugSummary(bug: BugSummaryData): BugSummaryData {
  return {
    element: bug.element ?? "",
    description: bug.description ?? "",
    steps: bug.steps.length > 0 ? [...bug.steps] : [""],
    expected: bug.expected ?? "",
    actual: bug.actual ?? "",
  };
}

function getModalTitle(mode: BugModalMode) {
  if (mode === "preview") {
    return "Подтверждение отправки";
  }
  if (mode === "edit") {
    return "Редактирование бага";
  }
  return "Просмотр бага";
}
