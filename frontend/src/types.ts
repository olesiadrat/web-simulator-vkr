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

export type BugReport = {
  id: number;
  session: number;
  description: string;
  expected: string;
  actual: string;
  ui_element: string;
  created_at: string;
};

export type BugSummaryData = {
  description: string;
  steps: string[];
  expected: string;
  actual: string;
  element: string;
};

export type LocalBugReport = {
  id: number;
} & BugSummaryData;

export type BugModalMode = "preview" | "view" | "edit";
