import { useMemo, useState } from "react";

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
  const [values, setValues] = useState<Record<string, string>>({});
  const [carouselIndexes, setCarouselIndexes] = useState<Record<string, number>>({});
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);
  const [selectedStay, setSelectedStay] = useState<StayData | null>(null);

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
    const fromState = Number(getElementValue(element));
    if (Number.isFinite(fromState) && fromState > 0) {
      return fromState;
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
      return (
        <label className={getElementClassName(element, "field")} key={element.id} id={element.id}>
          <span>{element.label}</span>
          <select
            value={getElementValue(element)}
            id={`${element.id}-select`}
            name={element.id}
            onFocus={() => onElementSelect(element)}
            onChange={(event) => setElementValue(element, event.target.value)}
          >
            <option value="">{element.placeholder ?? "Выберите значение"}</option>
            {element.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {element.helperText && <small>{element.helperText}</small>}
        </label>
      );
    }

    if (element.type === "dateInput") {
      const value = getElementValue(element);

      return (
        <label className={getElementClassName(element, "field")} key={element.id} id={element.id}>
          <span>{element.label}</span>
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
          {element.helperText && <small>{element.helperText}</small>}
        </label>
      );
    }

    if (element.type === "nightsSummary") {
      const startDate = values[element.startDateElementId ?? ""] ?? values[element.fallbackStartDateElementId ?? ""];
      const endDate = values[element.endDateElementId ?? ""] ?? values[element.fallbackEndDateElementId ?? ""];
      const nights = calculateNights(startDate, endDate);

      return (
        <div className={getElementClassName(element, "nights-summary")} key={element.id} id={element.id} onClick={() => onElementSelect(element)}>
          <span>{element.label}</span>
          <strong>{formatNights(nights)}</strong>
          <small>{nights > 0 ? "Расчет выполнен по выбранным датам." : "Выберите дату заезда и дату отъезда."}</small>
        </div>
      );
    }

    if (element.type === "guestPicker") {
      const guests = clampGuests(getGuestValue(element));

      const updateGuests = (nextValue: number) => {
        onElementSelect(element);
        setElementValue(element, String(clampGuests(nextValue)));
      };

      return (
        <div className={getElementClassName(element, "guest-picker")} key={element.id} id={element.id}>
          <span>{element.label}</span>
          <div className="guest-picker-control">
            <button type="button" onClick={() => updateGuests(guests - 1)}>
              -
            </button>
            <input
              type="number"
              min={1}
              max={20}
              step={1}
              value={guests}
              onFocus={() => onElementSelect(element)}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isFinite(value)) {
                  return;
                }
                updateGuests(value);
              }}
            />
            <button type="button" onClick={() => updateGuests(guests + 1)}>
              +
            </button>
          </div>
          <small>{formatGuests(guests)}</small>
        </div>
      );
    }

    if (element.type === "button") {
      return (
        <button
          className={getElementClassName(element, "primary-button")}
          key={element.id}
          id={element.id}
          type="button"
          onClick={() => runAction(element)}
        >
          {element.text}
        </button>
      );
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
              <span>{currentIndex + 1} / {images.length}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onElementSelect({ ...element, id: `${element.id}-next`, label: "Стрелка вправо галереи" });
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
          <button
            className="primary-button"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onElementSelect({ ...element, id: `${element.id}-submit`, label: "Кнопка бронирования" });
              setIsBookingModalOpen(true);
            }}
          >
            Забронировать
          </button>
        </section>
      );
    }

    return null;
  }

  if (!currentPage) {
    return <p className="error">Страница сценария не найдена.</p>;
  }

  const modalGuests = clampGuests(Number(values["booking-guests"] ?? values["guests"] ?? 2));
  const updateModalGuests = (nextValue: number) => {
    const normalizedValue = String(clampGuests(nextValue));
    setValues((current) => ({ ...current, "booking-guests": normalizedValue, guests: normalizedValue }));
  };
  const activeStay = currentPageId === "details" ? selectedStay ?? defaultStay : null;
  const pageTitle = activeStay ? activeStay.title : currentPage.title;
  const pageSubtitle = activeStay ? activeStay.location : currentPage.subtitle;
  const pageElements = currentPage.elements.map(getPageElement);

  return (
    <>
      <h2>{pageTitle}</h2>
      {pageSubtitle && <p className="scenario-subtitle">{pageSubtitle}</p>}
      <div className="scenario-surface">{pageElements.map(renderElement)}</div>
      {isBookingModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
            <div className="modal-header">
              <h2 id="booking-modal-title">Данные гостя</h2>
              <button type="button" aria-label="Закрыть окно" onClick={() => setIsBookingModalOpen(false)}>
                ×
              </button>
            </div>
            <label className="field">
              <span>ФИО гостя</span>
              <input id="guest-full-name" name="guestFullName" placeholder="Иванов Иван Иванович" />
            </label>
            <label className="field">
              <span>Количество гостей</span>
              <div className="guest-picker-control modal-guest-picker">
                <button type="button" onClick={() => updateModalGuests(modalGuests - 1)}>
                  -
                </button>
                <input
                  id="guest-count"
                  name="guestCount"
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={modalGuests}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (!Number.isFinite(value)) {
                      return;
                    }
                    updateModalGuests(value);
                  }}
                />
                <button type="button" onClick={() => updateModalGuests(modalGuests + 1)}>
                  +
                </button>
              </div>
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
                onClick={() => {
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

  return Math.min(20, Math.max(1, Math.round(guests)));
}
