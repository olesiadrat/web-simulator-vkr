import type { BugSummaryData } from "../types";

export type BugSummaryErrors = {
  description?: string;
  steps?: string;
  expected?: string;
  actual?: string;
};

type BugSummaryFieldsProps = {
  bug: BugSummaryData;
  editable: boolean;
  errors?: BugSummaryErrors;
  onFieldChange?: (field: keyof Omit<BugSummaryData, "steps">, value: string) => void;
  onStepChange?: (index: number, value: string) => void;
  onAddStep?: () => void;
  onRemoveStep?: (index: number) => void;
};

export function BugSummaryFields({
  bug,
  editable,
  errors,
  onFieldChange,
  onStepChange,
  onAddStep,
  onRemoveStep,
}: BugSummaryFieldsProps) {
  if (!editable) {
    return (
      <div className="bug-summary-fields">
        <section className="bug-summary-row">
          <h3>Элемент интерфейса</h3>
          <p>{bug.element || "Не выбран"}</p>
        </section>
        <section className="bug-summary-row">
          <h3>Описание ошибки</h3>
          <p>{bug.description || "—"}</p>
        </section>
        <section className="bug-summary-row">
          <h3>Шаги воспроизведения</h3>
          {bug.steps.length > 0 ? (
            <ol className="bug-summary-steps">
              {bug.steps.map((step, index) => (
                <li key={`view-step-${index + 1}`}>{step || "—"}</li>
              ))}
            </ol>
          ) : (
            <p>—</p>
          )}
        </section>
        <section className="bug-summary-row">
          <h3>Expected behavior</h3>
          <p>{bug.expected || "—"}</p>
        </section>
        <section className="bug-summary-row">
          <h3>Actual behavior</h3>
          <p>{bug.actual || "—"}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="bug-summary-fields">
      <label className="field">
        <span>Элемент интерфейса</span>
        <input
          id="modal-element"
          value={bug.element}
          onChange={(event) => onFieldChange?.("element", event.target.value)}
        />
      </label>

      <label className="field">
        <span>Описание ошибки</span>
        <textarea
          id="modal-description"
          value={bug.description}
          onChange={(event) => onFieldChange?.("description", event.target.value)}
        />
        <small className={errors?.description ? "field-feedback field-error" : "field-feedback"}>{errors?.description || "\u00A0"}</small>
      </label>

      <div className="bug-steps bug-summary-edit-steps">
        <p className="bug-steps-title">Шаги воспроизведения</p>
        <div className="bug-steps-list">
          {bug.steps.map((step, index) => (
            <div className="bug-step-item" key={`edit-step-${index + 1}`}>
              <label className="field">
                <span>Шаг {index + 1}</span>
                <input
                  id={`modal-step-${index + 1}`}
                  value={step}
                  onChange={(event) => onStepChange?.(index, event.target.value)}
                />
              </label>
              <button
                className="step-remove-button"
                id={`modal-step-remove-${index + 1}`}
                type="button"
                disabled={bug.steps.length === 1}
                onClick={() => onRemoveStep?.(index)}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
        <button className="tertiary-button bug-add-step" type="button" onClick={onAddStep}>
          + Добавить шаг
        </button>
        <small className={errors?.steps ? "field-feedback field-error" : "field-feedback"}>{errors?.steps || "\u00A0"}</small>
      </div>

      <label className="field">
        <span>Expected behavior</span>
        <textarea
          id="modal-expected"
          value={bug.expected}
          onChange={(event) => onFieldChange?.("expected", event.target.value)}
        />
        <small className={errors?.expected ? "field-feedback field-error" : "field-feedback"}>{errors?.expected || "\u00A0"}</small>
      </label>

      <label className="field">
        <span>Actual behavior</span>
        <textarea
          id="modal-actual"
          value={bug.actual}
          onChange={(event) => onFieldChange?.("actual", event.target.value)}
        />
        <small className={errors?.actual ? "field-feedback field-error" : "field-feedback"}>{errors?.actual || "\u00A0"}</small>
      </label>
    </div>
  );
}
