import type { BugReport } from "../types";

type BugReportListProps = {
  bugs: BugReport[];
  onRefresh: () => void;
};

export function BugReportList({ bugs, onRefresh }: BugReportListProps) {
  return (
    <>
      <div className="bugs-header">
        <h2>Найденные баги</h2>
        <button className="text-button" type="button" onClick={onRefresh}>
          Обновить
        </button>
      </div>
      <div className="bug-list">
        {bugs.length === 0 ? (
          <p className="muted">Пока нет сохраненных баг-репортов.</p>
        ) : (
          bugs.map((bug) => (
            <article className="bug-item" key={bug.id}>
              <div className="bug-item-header">
                <strong>{bug.ui_element || "Без элемента"}</strong>
                <time dateTime={bug.created_at}>
                  {new Intl.DateTimeFormat("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  }).format(new Date(bug.created_at))}
                </time>
              </div>
              <p>{bug.description}</p>
            </article>
          ))
        )}
      </div>
    </>
  );
}
