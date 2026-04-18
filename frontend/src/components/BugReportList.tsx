import type { LocalBugReport } from "../types";

type BugReportListProps = {
  bugs: LocalBugReport[];
  onRefresh: () => void;
  onSelectBug: (bug: LocalBugReport) => void;
};

export function BugReportList({ bugs, onRefresh, onSelectBug }: BugReportListProps) {
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
          <p className="muted">Пока нет сохранённых баг-репортов.</p>
        ) : (
          bugs.map((bug) => (
            <button className="bug-item bug-item-button" key={bug.id} type="button" onClick={() => onSelectBug(bug)}>
              <div className="bug-item-header">
                <strong>{bug.element || "Без элемента"}</strong>
                <span>#{bug.id}</span>
              </div>
              <p>{truncateBugDescription(bug.description)}</p>
            </button>
          ))
        )}
      </div>
    </>
  );
}

function truncateBugDescription(text: string) {
  const normalizedText = text.trim().replace(/\s+/g, " ");
  if (normalizedText.length <= 60) {
    return normalizedText;
  }

  return normalizedText.slice(0, 57) + "...";
}
