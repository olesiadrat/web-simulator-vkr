export type ScenarioElementAction =
  | {
      type: "navigate";
      targetPageId: string;
    }
  | {
      type: "none";
    };

export type ScenarioElement = {
  id: string;
  type:
    | "text"
    | "input"
    | "select"
    | "dateInput"
    | "nightsSummary"
    | "guestPicker"
    | "imageCarousel"
    | "button"
    | "link"
    | "card"
    | "image"
    | "amenities"
    | "bookingSummary";
  text?: string;
  title?: string;
  description?: string;
  label?: string;
  placeholder?: string;
  meta?: string;
  src?: string;
  imageSrc?: string;
  images?: string[];
  alt?: string;
  rating?: string;
  price?: string;
  helperText?: string;
  requirements?: string[];
  detailsDescription?: string;
  location?: string;
  options?: string[];
  amenities?: string[];
  nights?: number;
  guests?: number;
  total?: string;
  startDateElementId?: string;
  endDateElementId?: string;
  defaultValueFrom?: string;
  fallbackStartDateElementId?: string;
  fallbackEndDateElementId?: string;
  pricePerNight?: number;
  action?: ScenarioElementAction;
};

export type ScenarioPage = {
  id: string;
  title: string;
  subtitle?: string;
  elements: ScenarioElement[];
};

export type ScenarioStructure = {
  startPageId: string;
  pages: ScenarioPage[];
};

export type Scenario = {
  id: number;
  title: string;
  description: string;
  json_structure: ScenarioStructure;
  created_at: string;
};

export type TrainerSession = {
  id: number;
  scenario: number;
  start_time: string;
  end_time: string | null;
};

export type ApiBugReport = {
  id: number;
  session: number;
  description: string;
  reproduction_steps: string[];
  expected: string;
  actual: string;
  ui_element: string;
  check_status: "" | "valid" | "partially_valid" | "invalid";
  check_score: number | null;
  check_summary: string;
  check_strengths: string[];
  check_issues: string[];
  check_recommendation: string;
  matched_reference_bug: string;
  check_source: "" | "ai" | "fallback";
  checked_at: string | null;
  created_at: string;
};

export type BugSummaryData = {
  description: string;
  steps: string[];
  expected: string;
  actual: string;
  element: string;
};

export type BugCheckResult = {
  status: "valid" | "partially_valid" | "invalid";
  score: number;
  summary: string;
  strengths: string[];
  issues: string[];
  recommendation: string;
  matched_reference_bug: string;
  source: "ai" | "fallback";
};

export type LocalBugReport = {
  id: number;
  sessionId: number;
  createdAt: string;
  checkResult: BugCheckResult | null;
} & BugSummaryData;

export type BugModalMode = "preview" | "view" | "edit";
