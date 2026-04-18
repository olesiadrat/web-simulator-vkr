import { FormEvent, useEffect, useRef, useState } from "react";

import type { BugSummaryData, ScenarioElement } from "../types";

export type BugFormState = {
  description: string;
  expected: string;
  actual: string;
  ui_element: string;
};

const emptyBugForm: BugFormState = {
  description: "",
  expected: "",
  actual: "",
  ui_element: "",
};

type BugFormErrors = {
  description?: string;
  steps?: string;
  expected?: string;
  actual?: string;
};

export type LocalBugDraft = BugSummaryData;

type BugReportFormProps = {
  activeElement: ScenarioElement | null;
  elementOptions: Array<{
    id: string;
    label: string;
    pageTitle: string;
  }>;
  onPreview: (form: LocalBugDraft) => void;
  resetSignal: number;
  saveSignal: number;
};

export function BugReportForm({
  activeElement,
  elementOptions,
  onPreview,
  resetSignal,
  saveSignal,
}: BugReportFormProps) {
  const [form, setForm] = useState<BugFormState>(emptyBugForm);
  const [reproductionSteps, setReproductionSteps] = useState([""]);
  const [errors, setErrors] = useState<BugFormErrors>({});
  const [saveNotice, setSaveNotice] = useState("");
  const stepInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const shouldFocusLastStepRef = useRef(false);

  useEffect(() => {
    if (activeElement) {
      setForm((current) => ({ ...current, ui_element: activeElement.id }));
    }
  }, [activeElement]);

  useEffect(() => {
    setForm(emptyBugForm);
    setReproductionSteps([""]);
    setErrors({});
  }, [resetSignal]);

  useEffect(() => {
    if (saveSignal <= 0) {
      return;
    }
    setSaveNotice("Баг сохранён");
  }, [saveSignal]);

  useEffect(() => {
    if (!saveNotice) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setSaveNotice(""), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [saveNotice]);

  useEffect(() => {
    if (!shouldFocusLastStepRef.current) {
      return;
    }

    const input = stepInputRefs.current[reproductionSteps.length - 1];
    if (input) {
      input.focus();
    }
    shouldFocusLastStepRef.current = false;
  }, [reproductionSteps.length]);

  function validateForm(): LocalBugDraft | null {
    const nextErrors: BugFormErrors = {};
    const description = form.description.trim();
    const expected = form.expected.trim();
    const actual = form.actual.trim();
    const filledSteps = reproductionSteps.map((step) => step.trim()).filter(Boolean);

    if (!description) {
      nextErrors.description = "Заполните описание ошибки";
    }
    if (filledSteps.length === 0) {
      nextErrors.steps = "Добавьте хотя бы один шаг";
    }
    if (!expected) {
      nextErrors.expected = "Заполните expected behavior";
    }
    if (!actual) {
      nextErrors.actual = "Заполните actual behavior";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return null;
    }

    return {
      description,
      steps: filledSteps,
      expected,
      actual,
      element: (form.ui_element || activeElement?.id || "search").trim(),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = validateForm();
    if (!payload) {
      return;
    }
    onPreview(payload);
  }

  function updateStep(index: number, value: string) {
    setReproductionSteps((current) => current.map((step, stepIndex) => (stepIndex === index ? value : step)));
    if (errors.steps) {
      setErrors((current) => ({ ...current, steps: undefined }));
    }
  }

  function addStepField() {
    shouldFocusLastStepRef.current = true;
    setReproductionSteps((current) => [...current, ""]);
  }

  function removeStepField(index: number) {
    setReproductionSteps((current) => {
      if (current.length === 1) {
        return current;
      }
      return current.filter((_, stepIndex) => stepIndex !== index);
    });
  }

  function fillDemoExample() {
    setForm((current) => ({
      ...current,
      description: "Поиск не работает",
      expected: "Появляются результаты поиска",
      actual: "Ничего не происходит",
    }));
    setReproductionSteps(["Ввести текст в search", "Нажать Enter"]);
    setErrors({});
    setSaveNotice("");
  }

  const selectedElementName = activeElement?.id || "search";

  return (
    <>
      <h2>Баг-репорт</h2>
      <form className="bug-form" onSubmit={handleSubmit}>
        <div className="selected-element-note">
          <span>Сейчас выбран элемент:</span>
          <strong>{selectedElementName}</strong>
        </div>

        <label className="field">
          <span>Описание ошибки</span>
          <textarea
            id="bug-description"
            name="description"
            placeholder="Что произошло? В чем проблема?"
            value={form.description}
            onChange={(event) => {
              setForm((current) => ({ ...current, description: event.target.value }));
              if (errors.description) {
                setErrors((current) => ({ ...current, description: undefined }));
              }
            }}
          />
          <small className={errors.description ? "field-feedback field-error" : "field-feedback"}>{errors.description || "\u00A0"}</small>
        </label>

        <div className="bug-steps">
          <p className="bug-steps-title">Шаги воспроизведения</p>
          <div className="bug-steps-list">
            {reproductionSteps.map((step, index) => (
              <div className="bug-step-item" key={`bug-step-${index + 1}`}>
                <label className="field">
                  <span>Шаг {index + 1}</span>
                  <input
                    id={`bug-step-${index + 1}`}
                    name={`step-${index + 1}`}
                    placeholder="Опишите шаг"
                    value={step}
                    ref={(node) => {
                      stepInputRefs.current[index] = node;
                    }}
                    onChange={(event) => updateStep(index, event.target.value)}
                  />
                </label>
                <button
                  className="step-remove-button"
                  id={`bug-step-remove-${index + 1}`}
                  type="button"
                  disabled={reproductionSteps.length === 1}
                  onClick={() => removeStepField(index)}
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
          <button className="tertiary-button bug-add-step" type="button" onClick={addStepField}>
            + Добавить шаг
          </button>
          <small className={errors.steps ? "field-feedback field-error" : "field-feedback"}>{errors.steps || "\u00A0"}</small>
        </div>

        <label className="field">
          <span>Expected behavior</span>
          <textarea
            id="bug-expected"
            name="expected"
            placeholder="Как должно было работать?"
            value={form.expected}
            onChange={(event) => {
              setForm((current) => ({ ...current, expected: event.target.value }));
              if (errors.expected) {
                setErrors((current) => ({ ...current, expected: undefined }));
              }
            }}
          />
          <small className={errors.expected ? "field-feedback field-error" : "field-feedback"}>{errors.expected || "\u00A0"}</small>
        </label>
        <label className="field">
          <span>Actual behavior</span>
          <textarea
            id="bug-actual"
            name="actual"
            placeholder="Что произошло на самом деле?"
            value={form.actual}
            onChange={(event) => {
              setForm((current) => ({ ...current, actual: event.target.value }));
              if (errors.actual) {
                setErrors((current) => ({ ...current, actual: undefined }));
              }
            }}
          />
          <small className={errors.actual ? "field-feedback field-error" : "field-feedback"}>{errors.actual || "\u00A0"}</small>
        </label>
        <label className="field">
          <span>Элемент интерфейса</span>
          <select
            id="bug-ui-element"
            name="ui_element"
            value={form.ui_element}
            onChange={(event) => setForm((current) => ({ ...current, ui_element: event.target.value }))}
          >
            <option value="">Не выбран</option>
            {elementOptions.map((element) => (
              <option key={`${element.pageTitle}-${element.id}`} value={element.id}>
                {element.label} · {element.id}
              </option>
            ))}
          </select>
        </label>
        <button className="text-button bug-fill-example" type="button" onClick={fillDemoExample}>
          Заполнить пример
        </button>
        <button className="primary-button" type="submit">
          Отправить баг
        </button>
        <p className={saveNotice ? "bug-save-notice bug-save-notice-visible" : "bug-save-notice"}>{saveNotice || "\u00A0"}</p>
      </form>
    </>
  );
}
