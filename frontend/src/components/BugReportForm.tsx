import { FormEvent, useEffect, useState } from "react";

import type { ScenarioElement } from "../types";

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

type BugReportFormProps = {
  activeElement: ScenarioElement | null;
  elementOptions: Array<{
    id: string;
    label: string;
    pageTitle: string;
  }>;
  onSubmit: (form: BugFormState) => Promise<void>;
};

export function BugReportForm({ activeElement, elementOptions, onSubmit }: BugReportFormProps) {
  const [form, setForm] = useState<BugFormState>(emptyBugForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeElement) {
      setForm((current) => ({ ...current, ui_element: activeElement.id }));
    }
  }, [activeElement]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(form);
      setForm(emptyBugForm);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h2>Баг-репорт</h2>
      <form className="bug-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="selected-element-note">
          {activeElement ? (
            <>
              <span>Сейчас выбран элемент:</span>
              <strong>{activeElement.id}</strong>
            </>
          ) : (
            <span>Выберите элемент в интерфейсе или укажите его вручную.</span>
          )}
        </div>

        <label className="field">
          <span>Описание ошибки</span>
          <textarea
            id="bug-description"
            name="description"
            required
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>Expected behavior</span>
          <textarea
            id="bug-expected"
            name="expected"
            required
            value={form.expected}
            onChange={(event) => setForm((current) => ({ ...current, expected: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>Actual behavior</span>
          <textarea
            id="bug-actual"
            name="actual"
            required
            value={form.actual}
            onChange={(event) => setForm((current) => ({ ...current, actual: event.target.value }))}
          />
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
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем..." : "Отправить баг"}
        </button>
      </form>
    </>
  );
}
