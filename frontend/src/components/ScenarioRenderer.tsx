import { useEffect, useMemo, useState } from "react";

import type { Scenario, ScenarioElement } from "../types";

type ScenarioRendererProps = {
  scenario: Scenario;
  selectedElementId?: string;
  onElementSelect: (element: ScenarioElement) => void;
};

type StayData = {
  title: string;
  location: string;
  detailsDescription: string;
  images: string[];
  amenities: string[];
  price: string;
  pricePerNight?: number;
  total?: string;
  guests?: number;
};

export function ScenarioRenderer({ scenario, selectedElementId, onElementSelect }: ScenarioRendererProps) {
  const [currentPageId, setCurrentPageId] = useState(scenario.json_structure.startPageId);
  const [values, setValues] = useState<Record<string, string>>({
    guests: "2",
  });
  const [carouselIndexes, setCarouselIndexes] = useState<Record<string, number>>({});
  const [openSelectId, setOpenSelectId] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingGuestName, setBookingGuestName] = useState("");
  const [bookingGuestCountInput, setBookingGuestCountInput] = useState("2");
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);
  const [selectedStay, setSelectedStay] = useState<StayData | null>(null);

  useEffect(() => {
    if (!isBookingModalOpen) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsBookingModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isBookingModalOpen]);

  const defaultStay = useMemo(() => {
    const resultsPage = scenario.json_structure.pages.find((page) => page.id === "results");
    const defaultCard = resultsPage?.elements.find((element) => element.type === "card");
    return defaultCard ? buildStayData(defaultCard) : null;
  }, [scenario.json_structure.pages]);

  const currentPage = useMemo(() => {
    return scenario.json_structure.pages.find((page) => page.id === currentPageId) ?? null;
  }, [currentPageId, scenario.json_structure.pages]);

  function runAction(element: ScenarioElement) {
    onElementSelect(element);

    if (element.type === "card") {
      setSelectedStay(buildStayData(element));
      setCarouselIndexes((current) => ({ ...current, "details-gallery": 0 }));
    }

    if (element.action?.type === "navigate") {
      setCurrentPageId(element.action.targetPageId);
    }
  }

  function getElementClassName(element: ScenarioElement, baseClassName = "") {
    const isSelected = selectedElementId === element.id;
    return [baseClassName, "inspectable", isSelected ? "inspectable-selected" : ""].filter(Boolean).join(" ");
  }

  function getElementValue(element: ScenarioElement) {
    return values[element.id] ?? (element.defaultValueFrom ? values[element.defaultValueFrom] : "") ?? "";
  }

  function getGuestValue(element: ScenarioElement) {
    const rawValue = getElementValue(element).trim();
    if (rawValue.length > 0) {
      const fromState = Number(rawValue);
      if (Number.isFinite(fromState)) {
        return fromState;
      }
    }

    return Number(element.guests ?? 2);
  }

  function setElementValue(element: ScenarioElement, nextValue: string) {
    setValues((current) => {
      const nextValues = { ...current, [element.id]: nextValue };
      if (element.defaultValueFrom) {
        nextValues[element.defaultValueFrom] = nextValue;
      }
      return nextValues;
    });
  }

  function getLocationError(value: string) {
    const hasInvalidSymbols = !/^[A-Za-zА-Яа-яЁё\s-]*$/.test(value);
    if (value.length > 0 && hasInvalidSymbols) {
      return "Допустимы только буквы, пробел и дефис.";
    }
    return "";
  }

  function getDateInputError(element: ScenarioElement, value: string) {
    const isCheckInField =
      element.id === "check-in" ||
      element.id === "results-check-in" ||
      element.id.endsWith("-check-in");
    const isCheckOutField =
      element.id === "check-out" ||
      element.id === "results-check-out" ||
      element.id.endsWith("-check-out");

    if ((!isCheckInField && !isCheckOutField) || !value) {
      return "";
    }

    const parsedDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      return "Введите корректную дату в формате дд.мм.гггг.";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) {
      return isCheckInField
        ? "Дата заезда не может быть раньше текущей даты."
        : "Дата отъезда не может быть раньше текущей даты.";
    }

    return "";
  }

  function getGuestError(value: string) {
    if (!value) {
      return "";
    }

    if (!/^\d+$/.test(value)) {
      return "Допустимы только цифры.";
    }

    if (Number(value) <= 0) {
      return "Количество гостей должно быть больше 0.";
    }

    return "";
  }

  function getRequiredGuestError(value: string) {
    if (!value.trim()) {
      return "Поле «Количество гостей» не может быть пустым.";
    }

    return getGuestError(value);
  }

  function getFullNameError(value: string) {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return "Поле «ФИО гостя» не может быть пустым.";
    }

    if (!/^[A-Za-zА-Яа-яЁё\s-]+$/.test(normalizedValue)) {
      return "Допустимы только буквы, пробел и дефис.";
    }

    if (normalizedValue.split(/\s+/).length < 2) {
      return "Укажите минимум имя и фамилию.";
    }

    return "";
  }

  function getFieldRequirements(element: ScenarioElement) {
    const isLocationField = element.id === "location" || element.id === "results-location";
    const isCheckInField =
      element.id === "check-in" ||
      element.id === "results-check-in" ||
      element.id.endsWith("-check-in");
    const isCheckOutField =
      element.id === "check-out" ||
      element.id === "results-check-out" ||
      element.id.endsWith("-check-out");
    const isGuestField =
      element.id === "guests" ||
      element.id === "results-guests" ||
      element.id.endsWith("-guests");
    const isNightsField = element.type === "nightsSummary" || element.id === "nights" || element.id.endsWith("-nights");
    const isSearchButton = element.id === "search" || element.id === "results-search";
    const isBookingSubmit = element.id.endsWith("-submit");

    if (isLocationField) {
      return [
        "Допустимы буквы, пробел и дефис; цифры и спецсимволы не допускаются.",
        "Поле обязательно для поиска: при пустом значении кнопка «Найти» должна быть неактивна.",
        "При пустом значении под полем должна отображаться ошибка «Поле не может быть пустым».",
      ];
    }

    if (isCheckInField) {
      return [
        "Формат даты: дд.мм.гггг.",
        "Дата заезда не может быть раньше текущей даты.",
        "Дата заезда должна быть раньше даты отъезда.",
      ];
    }

    if (isCheckOutField) {
      return [
        "Формат даты: дд.мм.гггг.",
        "Дата отъезда не может быть раньше текущей даты.",
        "Дата отъезда должна быть позже даты заезда.",
      ];
    }

    if (isGuestField) {
      return [
        "Допустимы только цифры.",
        "Количество гостей должно быть числовым значением больше 0.",
        "Количество гостей должно быть меньше 20.",
        "Поле можно очистить и ввести значение заново.",
        "Количество гостей можно менять кнопками «-» и «+».",
      ];
    }

    if (isNightsField) {
      return [
        "Поле автоматически вычисляет количество ночей как разницу между датой отъезда и датой заезда.",
        "Если одна из дат не заполнена или интервал некорректный, должно отображаться значение 0.",
      ];
    }

    if (isSearchButton) {
      return [
        "Кнопка активна только при заполненных полях: локация, дата заезда, дата отъезда.",
        "Кнопка неактивна при любой ошибке валидации в полях дат и количества гостей.",
        "По нажатию выполняется поиск по заданным параметрам и открывается/обновляется страница результатов.",
      ];
    }

    if (isBookingSubmit) {
      return [
        "Кнопка активна при заполненных и валидных полях: дата заезда, дата отъезда, количество гостей.",
        "При невалидных значениях кнопка должна быть неактивна.",
        "По нажатию открывается форма ввода данных гостя.",
      ];
    }

    if (element.requirements && element.requirements.length > 0) {
      return element.requirements;
    }

    return [];
  }

  function isSearchButtonDisabled(element: ScenarioElement) {
    const isSearchButton = element.id === "search" || element.id === "results-search";
    if (!isSearchButton) {
      return false;
    }

    const checkInId = element.id === "results-search" ? "results-check-in" : "check-in";
    const checkOutId = element.id === "results-search" ? "results-check-out" : "check-out";
    const guestsId = element.id === "results-search" ? "results-guests" : "guests";
    const checkIn = values[checkInId] ?? values["check-in"] ?? "";
    const checkOut = values[checkOutId] ?? values["check-out"] ?? "";
    const guests = values[guestsId] ?? values["guests"] ?? "";
    const dateCheckInError = getDateInputError({ id: checkInId, type: "dateInput" }, checkIn);
    const dateCheckOutError = getDateInputError({ id: checkOutId, type: "dateInput" }, checkOut);
    const guestError = getGuestError(guests);

    if (dateCheckInError || dateCheckOutError || guestError) {
      return true;
    }

    return !(checkIn && checkOut);
  }

  function renderFieldLabel(element: ScenarioElement) {
    const requirements = getFieldRequirements(element);

    return (
      <span className="field-label-wrapper">
        <span>{element.label}</span>
        {requirements.length > 0 && (
          <>
            <span className="field-tooltip-trigger" aria-hidden="true">
              i
            </span>
            <div className="field-tooltip" role="note">
              <strong>Требования</strong>
              <ul>
                {requirements.map((requirement) => (
                  <li key={`${element.id}-${requirement}`}>{requirement}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </span>
    );
  }

  function getPageElement(element: ScenarioElement): ScenarioElement {
    if (currentPageId !== "details") {
      return element;
    }

    const activeStay = selectedStay ?? defaultStay;
    if (!activeStay) {
      return element;
    }

    if (element.id === "details-gallery") {
      return {
        ...element,
        alt: `Фотографии: ${activeStay.title}`,
        images: activeStay.images,
      };
    }

    if (element.id === "details-description") {
      return {
        ...element,
        text: activeStay.detailsDescription,
      };
    }

    if (element.id === "amenities") {
      return {
        ...element,
        amenities: activeStay.amenities,
      };
    }

    if (element.id === "booking") {
      return {
        ...element,
        price: activeStay.price,
        pricePerNight: activeStay.pricePerNight ?? element.pricePerNight,
        total: activeStay.total ?? element.total,
        guests: activeStay.guests ?? element.guests,
      };
    }

    return element;
  }

  function renderElement(element: ScenarioElement) {
    if (element.type === "text") {
      return (
        <p
          className={getElementClassName(element, "scenario-text")}
          key={element.id}
          id={element.id}
          onClick={() => onElementSelect(element)}
        >
          {element.text}
        </p>
      );
    }

    if (element.type === "input") {
      return (
        <label className={getElementClassName(element, "field")} key={element.id} id={element.id}>
          <span>{element.label}</span>
          <input
            value={getElementValue(element)}
            id={`${element.id}-input`}
            name={element.id}
            placeholder={element.placeholder}
            onFocus={() => onElementSelect(element)}
            onChange={(event) => setElementValue(element, event.target.value)}
          />
        </label>
      );
    }

    if (element.type === "select") {
      const value = getElementValue(element);
      const options = element.options ?? [];
      const filteredOptions = options.filter((option) => option.toLowerCase().includes(value.toLowerCase()));
      const isLocationField = element.id === "location" || element.id === "results-location";
      const locationError = isLocationField ? getLocationError(value) : "";
      const showDropdown = openSelectId === element.id && !locationError;

      return (
        <label
          className={getElementClassName(element, ["field", "searchable-select", locationError ? "field-invalid" : ""].join(" "))}
          key={element.id}
          id={element.id}
        >
          {renderFieldLabel(element)}
          <div className="select-control">
            <input
              value={value}
              id={`${element.id}-select`}
              name={element.id}
              autoComplete="off"
              placeholder={element.placeholder ?? "Выберите значение"}
              onFocus={() => {
                onElementSelect(element);
                setOpenSelectId(element.id);
              }}
              onClick={() => setOpenSelectId(element.id)}
              onBlur={() => {
                window.setTimeout(() => {
                  setOpenSelectId((current) => (current === element.id ? null : current));
                }, 80);
              }}
              onChange={(event) => {
                setElementValue(element, event.target.value);
                setOpenSelectId(element.id);
              }}
            />
            <button
              type="button"
              aria-label="Открыть список локаций"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onElementSelect(element);
                setOpenSelectId((current) => (current === element.id ? null : element.id));
              }}
            >
              ▾
            </button>
          </div>
          {showDropdown && (
            <ul className="select-options" role="listbox">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <li
                    key={`${element.id}-${option}`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setElementValue(element, option);
                      setOpenSelectId(null);
                      onElementSelect(element);
                    }}
                    role="option"
                    aria-selected={option === value}
                  >
                    {option}
                  </li>
                ))
              ) : (
                <li className="select-options-empty">Нет подходящих вариантов</li>
              )}
            </ul>
          )}
          {locationError && <small className="field-error">{locationError}</small>}
          {element.helperText && <small>{element.helperText}</small>}
        </label>
      );
    }

    if (element.type === "dateInput") {
      const value = getElementValue(element);
      const dateError = getDateInputError(element, value);

      return (
        <label className={getElementClassName(element, ["field", dateError ? "field-invalid" : ""].join(" "))} key={element.id} id={element.id}>
          {renderFieldLabel(element)}
          <input
            type="date"
            value={value}
            onFocus={() => onElementSelect(element)}
            id={`${element.id}-input`}
            name={element.id}
            onInput={(event) => {
              const value = event.currentTarget.value;
              setElementValue(element, value);
            }}
            onChange={(event) => {
              const value = event.target.value;
              setElementValue(element, value);
            }}
          />
          <small className={dateError ? "field-feedback field-error" : "field-feedback"}>{dateError || "\u00A0"}</small>
        </label>
      );
    }

    if (element.type === "nightsSummary") {
      const startDate = values[element.startDateElementId ?? ""] ?? values[element.fallbackStartDateElementId ?? ""];
      const endDate = values[element.endDateElementId ?? ""] ?? values[element.fallbackEndDateElementId ?? ""];
      const nights = calculateNights(startDate, endDate);

      return (
        <div className={getElementClassName(element, "nights-summary")} key={element.id} id={element.id} onClick={() => onElementSelect(element)}>
          {renderFieldLabel(element)}
          <strong>{formatNights(nights)}</strong>
          <small>{nights > 0 ? "Расчет выполнен по выбранным датам." : "Выберите дату заезда и дату отъезда."}</small>
        </div>
      );
    }

    if (element.type === "guestPicker") {
      const guestValue = getElementValue(element);
      const guestError = getGuestError(guestValue);
      const guests = clampGuests(getGuestValue(element));
      const shouldHideGuestsSummary = element.id === "results-guests";
      const guestsSummary = shouldHideGuestsSummary ? "\u00A0" : guestValue ? formatGuests(guests) : "\u00A0";

      const updateGuests = (nextValue: number) => {
        onElementSelect(element);
        setElementValue(element, String(clampGuests(nextValue)));
      };

      return (
        <div
          className={getElementClassName(element, ["guest-picker", guestError ? "field-invalid" : ""].join(" "))}
          key={element.id}
          id={element.id}
          onClick={() => onElementSelect(element)}
        >
          {renderFieldLabel(element)}
          <div className="guest-picker-control">
            <button type="button" onClick={() => updateGuests(guests - 1)}>
              -
            </button>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={guestValue}
              onFocus={() => onElementSelect(element)}
              onChange={(event) => {
                const value = event.target.value;
                setElementValue(element, value);
              }}
              onBlur={() => {
                if (!guestValue || guestError) {
                  return;
                }
                setElementValue(element, String(clampGuests(Number(guestValue))));
              }}
            />
            <button type="button" onClick={() => updateGuests(guests + 1)}>
              +
            </button>
          </div>
          <small className={guestError ? "field-feedback field-error" : "field-feedback"}>{guestError || guestsSummary}</small>
        </div>
      );
    }

    if (element.type === "button") {
      const isDisabled = isSearchButtonDisabled(element);
      const requirements = getFieldRequirements(element);
      const isResultsSearchButton = element.id === "results-search";

      const buttonContent = (
        <button
          className={getElementClassName(element, "primary-button")}
          key={element.id}
          id={isResultsSearchButton ? `${element.id}-button` : element.id}
          type="button"
          disabled={isDisabled}
          onClick={() => {
            if (isDisabled) {
              return;
            }
            runAction(element);
          }}
        >
          <span>{element.text}</span>
          {requirements.length > 0 && (
            <>
              <span className="field-tooltip-trigger button-tooltip-trigger" aria-hidden="true">
                i
              </span>
              <div className="field-tooltip button-tooltip" role="note">
                <strong>Требования</strong>
                <ul>
                  {requirements.map((requirement) => (
                    <li key={`${element.id}-${requirement}`}>{requirement}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </button>
      );

      if (isResultsSearchButton) {
        return (
          <div className={getElementClassName(element, "button-field")} key={element.id} id={element.id}>
            <span className="button-field-spacer" aria-hidden="true">
              {'\u00A0'}
            </span>
            {buttonContent}
            <small className="field-feedback">{'\u00A0'}</small>
          </div>
        );
      }

      return buttonContent;
    }

    if (element.type === "link") {
      return (
        <button
          className={getElementClassName(element, "text-button")}
          key={element.id}
          id={element.id}
          type="button"
          onClick={() => runAction(element)}
        >
          {element.text}
        </button>
      );
    }

    if (element.type === "card") {
      const images = element.images ?? (element.imageSrc ? [element.imageSrc] : []);
      const mainImage = images[0];
      const selectCardPart = (part: string, label: string) => {
        onElementSelect({
          ...element,
          id: `${element.id}-${part}`,
          label,
        });
      };

      return (
        <article
          className={getElementClassName(element, "scenario-card")}
          key={element.id}
          id={element.id}
        >
          {mainImage && (
            <img
              className="card-cover"
              src={mainImage}
              alt=""
              onClick={() => selectCardPart("gallery", "Главное фото карточки")}
            />
          )}
          <div className="scenario-card-body">
            <a
              className="card-title-link"
              href="#details"
              onClick={(event) => {
                event.preventDefault();
                selectCardPart("title", "Название карточки");
                runAction(element);
              }}
            >
              {element.title}
            </a>
            <span onClick={(event) => {
              event.stopPropagation();
              selectCardPart("description", "Описание карточки");
            }}>{element.description}</span>
            <span className="scenario-card-footer">
              {element.rating && (
                <span onClick={(event) => {
                  event.stopPropagation();
                  selectCardPart("rating", "Рейтинг карточки");
                }}>★ {element.rating}</span>
              )}
              <em onClick={(event) => {
                event.stopPropagation();
                selectCardPart("price", "Цена карточки");
              }}>{element.meta}</em>
            </span>
          </div>
        </article>
      );
    }

    if (element.type === "imageCarousel") {
      const images = element.images ?? [];
      if (images.length === 0) {
        return null;
      }

      const currentIndex = Math.min(carouselIndexes[element.id] ?? 0, images.length - 1);
      const currentImage = images[currentIndex];
      const carouselRequirements = [
        "Кнопка «влево» листает на предыдущее изображение, кнопка «вправо» — на следующее.",
        "Счетчик должен показывать текущую страницу и общее количество изображений (например, 1/4).",
        "На первой и последней странице соответствующая стрелка должна быть неактивной.",
      ];

      const showNextImage = (direction: number) => {
        setCarouselIndexes((current) => {
          const index = current[element.id] ?? currentIndex;
          const nextIndex = (index + direction + images.length) % images.length;
          return { ...current, [element.id]: nextIndex };
        });
      };

      return (
        <section
          className={getElementClassName(element, "image-carousel")}
          key={element.id}
          id={element.id}
          onClick={() => onElementSelect(element)}
        >
          <img className="scenario-image" src={currentImage} alt={element.alt ?? ""} />
          {images.length > 1 && (
            <div className="carousel-controls">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onElementSelect({ ...element, id: `${element.id}-prev`, label: "Стрелка влево галереи" });
                  showNextImage(-1);
                }}
              >
                ←
              </button>
              <span
                className="field-label-wrapper carousel-counter"
                onClick={(event) => {
                  event.stopPropagation();
                  onElementSelect({ ...element, id: `${element.id}-counter`, label: "Счетчик галереи" });
                }}
              >
                <span>{currentIndex + 1} / {images.length}</span>
                <span className="field-tooltip-trigger" aria-hidden="true">
                  i
                </span>
                <div className="field-tooltip carousel-tooltip" role="note">
                  <strong>Требования</strong>
                  <ul>
                    {carouselRequirements.map((requirement) => (
                      <li key={`${element.id}-${requirement}`}>{requirement}</li>
                    ))}
                  </ul>
                </div>
              </span>
              <button
                type="button"
                disabled={currentIndex === images.length - 1}
                onClick={(event) => {
                  event.stopPropagation();
                  onElementSelect({ ...element, id: `${element.id}-next`, label: "Стрелка вправо галереи" });
                  if (currentIndex === images.length - 1) {
                    return;
                  }
                  showNextImage(1);
                }}
              >
                →
              </button>
            </div>
          )}
        </section>
      );
    }

    if (element.type === "image") {
      return (
        <img
          className={getElementClassName(element, "scenario-image")}
          key={element.id}
          id={element.id}
          src={element.src}
          alt={element.alt ?? ""}
          onClick={() => onElementSelect(element)}
        />
      );
    }

    if (element.type === "amenities") {
      return (
        <ul
          className={getElementClassName(element, "amenities-list")}
          key={element.id}
          id={element.id}
          onClick={() => onElementSelect(element)}
        >
          {element.amenities?.map((amenity) => <li key={amenity}>{amenity}</li>)}
        </ul>
      );
    }

    if (element.type === "bookingSummary") {
      return (
        <section
          className={getElementClassName(element, "booking-summary")}
          key={element.id}
          id={element.id}
          onClick={() => onElementSelect(element)}
        >
          <p className="booking-price">{element.price}</p>
          <div className="date-range">
            {renderElement({
              ...element,
              id: `${element.id}-check-in`,
              type: "dateInput",
              label: "Дата заезда",
              defaultValueFrom: "check-in",
            })}
            {renderElement({
              ...element,
              id: `${element.id}-check-out`,
              type: "dateInput",
              label: "Дата отъезда",
              defaultValueFrom: "check-out",
            })}
          </div>
          <div className="booking-counters">
            {renderElement({
              ...element,
              id: `${element.id}-nights`,
              type: "nightsSummary",
              label: "Количество ночей",
              startDateElementId: `${element.id}-check-in`,
              endDateElementId: `${element.id}-check-out`,
              fallbackStartDateElementId: "check-in",
              fallbackEndDateElementId: "check-out",
            })}
            {renderElement({
              ...element,
              id: `${element.id}-guests`,
              type: "guestPicker",
              label: "Количество гостей",
              defaultValueFrom: "guests",
              guests: element.guests,
            })}
          </div>
          <div
            className={getElementClassName({ ...element, id: `${element.id}-total`, label: "Итоговая стоимость" }, "booking-total")}
            id={`${element.id}-total`}
            onClick={(event) => {
              event.stopPropagation();
              onElementSelect({ ...element, id: `${element.id}-total`, label: "Итоговая стоимость" });
            }}
          >
            <span>Итого:</span>
            <strong>
              {formatTotal(
                calculateNights(
                  values[`${element.id}-check-in`] ?? values["check-in"],
                  values[`${element.id}-check-out`] ?? values["check-out"],
                ),
                element.pricePerNight,
                element.total,
              )}
            </strong>
          </div>
          {(() => {
            const submitElement: ScenarioElement = { ...element, id: `${element.id}-submit`, type: "button", text: "Забронировать" };
            const submitRequirements = getFieldRequirements(submitElement);
            const bookingCheckIn = values[`${element.id}-check-in`] ?? values["check-in"] ?? "";
            const bookingCheckOut = values[`${element.id}-check-out`] ?? values["check-out"] ?? "";
            const bookingGuests = values[`${element.id}-guests`] ?? values["guests"] ?? "";
            const bookingIsDisabled =
              !bookingCheckIn ||
              !bookingCheckOut ||
              !bookingGuests ||
              !!getDateInputError({ id: `${element.id}-check-in`, type: "dateInput" }, bookingCheckIn) ||
              !!getDateInputError({ id: `${element.id}-check-out`, type: "dateInput" }, bookingCheckOut) ||
              !!getGuestError(bookingGuests);

            return (
              <button
                className={getElementClassName(submitElement, "primary-button")}
                id={`${element.id}-submit`}
                type="button"
                disabled={bookingIsDisabled}
                onClick={(event) => {
                  event.stopPropagation();
                  onElementSelect(submitElement);
                  if (bookingIsDisabled) {
                    return;
                  }
                  setBookingGuestName("");
                  setBookingGuestCountInput(bookingGuests || "2");
                  setIsBookingModalOpen(true);
                }}
              >
                <span>Забронировать</span>
                {submitRequirements.length > 0 && (
                  <>
                    <span className="field-tooltip-trigger button-tooltip-trigger" aria-hidden="true">
                      i
                    </span>
                    <div className="field-tooltip button-tooltip" role="note">
                      <strong>Требования</strong>
                      <ul>
                        {submitRequirements.map((requirement) => (
                          <li key={`${element.id}-${requirement}`}>{requirement}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </button>
            );
          })()}
        </section>
      );
    }

    return null;
  }

  if (!currentPage) {
    return <p className="error">Страница сценария не найдена.</p>;
  }

  const modalGuests = clampGuests(Number(bookingGuestCountInput || "0"));
  const bookingGuestNameError = getFullNameError(bookingGuestName);
  const bookingGuestCountError = getRequiredGuestError(bookingGuestCountInput);
  const isBookingFormInvalid = !!bookingGuestNameError || !!bookingGuestCountError;
  const updateModalGuests = (nextValue: number) => {
    const normalizedValue = String(clampGuests(nextValue));
    setBookingGuestCountInput(normalizedValue);
    setValues((current) => ({ ...current, "booking-guests": normalizedValue, guests: normalizedValue }));
  };
  const activeStay = currentPageId === "details" ? selectedStay ?? defaultStay : null;
  const pageTitle = activeStay ? activeStay.title : currentPage.title;
  const pageSubtitle = activeStay ? activeStay.location : currentPage.subtitle;
  const pageElements = currentPage.elements.map(getPageElement);
  const resultsSummaryElement: ScenarioElement = {
    id: "results-search-summary",
    type: "text",
    label: "Сводка поиска",
    requirements: [
      "Сводка должна отображать выбранную локацию и рассчитанное количество ночей.",
      "Значения в сводке должны обновляться после изменения фильтров поиска.",
      "Данные сводки должны совпадать с параметрами, по которым выполняется поиск.",
    ],
  };
  const resultsSummaryLocation = "Карелия";
  const resultsSummaryNightsRaw = calculateNights(
    values["results-check-in"] ?? values["check-in"],
    values["results-check-out"] ?? values["check-out"],
  );
  const resultsSummaryNights = Math.max(0, resultsSummaryNightsRaw - 1);
  const resultsSummaryText = `${resultsSummaryLocation || "Локация не выбрана"} · ${formatNights(resultsSummaryNights)}`;
  const shouldShowPageSubtitle = Boolean(pageSubtitle) && currentPageId !== "results";
  const bookingModalGuestsElement: ScenarioElement = {
    id: "booking-modal-guests",
    type: "guestPicker",
    label: "Количество гостей (модальное окно бронирования)",
  };

  return (
      <>
      <h2>{pageTitle}</h2>
      {shouldShowPageSubtitle && <p className="scenario-subtitle">{pageSubtitle}</p>}
      {currentPageId === "results" && (
        <section
          id="results-search-summary"
          className={getElementClassName(resultsSummaryElement, "results-search-summary")}
          onClick={() => onElementSelect(resultsSummaryElement)}
        >
          {renderFieldLabel(resultsSummaryElement)}
          <strong>{resultsSummaryText}</strong>
        </section>
      )}
      <div className="scenario-surface">{pageElements.map(renderElement)}</div>
      {isBookingModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsBookingModalOpen(false);
            }
          }}
        >
          <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
            <div className="modal-header">
              <h2 id="booking-modal-title">Данные гостя</h2>
              <button type="button" aria-label="Закрыть окно" onClick={() => setIsBookingModalOpen(false)}>
                ×
              </button>
            </div>
            <label className={bookingGuestNameError ? "field field-invalid" : "field"}>
              <span>ФИО гостя</span>
              <input
                id="guest-full-name"
                name="guestFullName"
                placeholder="Иванов Иван Иванович"
                value={bookingGuestName}
                onChange={(event) => setBookingGuestName(event.target.value)}
              />
              <small className={bookingGuestNameError ? "field-feedback field-error" : "field-feedback"}>
                {bookingGuestNameError || "\u00A0"}
              </small>
            </label>
            <label className={bookingGuestCountError ? "field field-invalid" : "field"}>
              <span>Количество гостей</span>
              <div
                className={getElementClassName(bookingModalGuestsElement, "guest-picker-control modal-guest-picker")}
                id={bookingModalGuestsElement.id}
                onClick={() => onElementSelect(bookingModalGuestsElement)}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onElementSelect(bookingModalGuestsElement);
                    updateModalGuests(modalGuests - 1);
                  }}
                >
                  -
                </button>
                <input
                  id="guest-count"
                  name="guestCount"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={bookingGuestCountInput}
                  onFocus={() => onElementSelect(bookingModalGuestsElement)}
                  onChange={(event) => {
                    setBookingGuestCountInput(event.target.value);
                  }}
                  onBlur={() => {
                    if (!bookingGuestCountInput || bookingGuestCountError) {
                      return;
                    }
                    const normalizedValue = String(clampGuests(Number(bookingGuestCountInput)));
                    setBookingGuestCountInput(normalizedValue);
                    setValues((current) => ({ ...current, "booking-guests": normalizedValue, guests: normalizedValue }));
                  }}
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onElementSelect(bookingModalGuestsElement);
                    updateModalGuests(modalGuests + 1);
                  }}
                >
                  +
                </button>
              </div>
              <small className={bookingGuestCountError ? "field-feedback field-error" : "field-feedback"}>
                {bookingGuestCountError || "\u00A0"}
              </small>
            </label>
            <label className="field">
              <span>Комментарий</span>
              <textarea id="guest-comment" name="guestComment" placeholder="Пожелания к заезду" />
            </label>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => setIsBookingModalOpen(false)}>
                Закрыть
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={isBookingFormInvalid}
                onClick={() => {
                  if (isBookingFormInvalid) {
                    return;
                  }
                  setValues((current) => ({ ...current, "booking-guests": bookingGuestCountInput, guests: bookingGuestCountInput }));
                  setIsBookingModalOpen(false);
                  setBookingNotice("Заявка на бронирование успешно отправлена.");
                }}
              >
                Отправить заявку
              </button>
            </div>
          </section>
        </div>
      )}
      {bookingNotice && (
        <div className="booking-notice" role="status" aria-live="polite">
          <span>{bookingNotice}</span>
          <button type="button" onClick={() => setBookingNotice(null)}>
            Закрыть
          </button>
        </div>
      )}
    </>
  );
}

function buildStayData(card: ScenarioElement): StayData {
  const images = card.images ?? (card.imageSrc ? [card.imageSrc] : []);
  const price = card.meta ?? card.price ?? "0 ₽ / ночь";

  return {
    title: card.title ?? "Вариант размещения",
    location: card.location ?? "Ленинградская область",
    detailsDescription: card.detailsDescription ?? card.description ?? "",
    images,
    amenities: card.amenities ?? ["Wi‑Fi", "Кухня", "Парковка"],
    price,
    pricePerNight: card.pricePerNight ?? extractPricePerNight(price),
    total: card.total,
    guests: card.guests,
  };
}

function extractPricePerNight(priceText: string) {
  const digits = priceText.replace(/[^\d]/g, "");
  if (!digits) {
    return undefined;
  }

  return Number(digits);
}

function calculateNights(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = end.getTime() - start.getTime();

  if (Number.isNaN(diff) || diff <= 0) {
    return 0;
  }

  return Math.round(diff / 86_400_000);
}

function formatNights(nights: number) {
  if (nights === 0) {
    return "0 ночей";
  }

  if (nights === 1) {
    return "1 ночь";
  }

  if (nights >= 2 && nights <= 4) {
    return `${nights} ночи`;
  }

  return `${nights} ночей`;
}

function formatTotal(nights: number, pricePerNight?: number, fallbackTotal?: string) {
  if (!nights || !pricePerNight) {
    return fallbackTotal ?? "0 ₽";
  }

  return new Intl.NumberFormat("ru-RU").format(nights * pricePerNight) + " ₽";
}

function formatGuests(guests: number) {
  if (guests === 1) {
    return "1 гость";
  }

  if (guests >= 2 && guests <= 4) {
    return `${guests} гостя`;
  }

  return `${guests} гостей`;
}

function clampGuests(guests: number) {
  if (!Number.isFinite(guests)) {
    return 1;
  }

  return Math.max(1, Math.round(guests));
}
