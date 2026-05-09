import json
import os
from urllib import error, request


OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
DEFAULT_OPENAI_MODEL = os.getenv("OPENAI_BUG_CHECK_MODEL", "gpt-4o-mini")


class BugCheckServiceError(Exception):
    pass


def check_bug_report(*, scenario, reference_bugs, bug_data):
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return run_fallback_bug_check(reference_bugs=reference_bugs, bug_data=bug_data)

    prompt = build_bug_check_prompt(
        scenario_title=scenario.title,
        scenario_description=scenario.description,
        reference_bugs=reference_bugs,
        bug_data=bug_data,
    )
    payload = {
        "model": DEFAULT_OPENAI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Ты проверяешь учебные баг-репорты в тренажере тестирования интерфейсов. "
                    "Оцени только качество и уместность баг-репорта. "
                    "Отвечай строго в JSON по заданной схеме."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "bug_check_result",
                "strict": True,
                "schema": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["valid", "partially_valid", "invalid"],
                        },
                        "score": {
                            "type": "integer",
                            "minimum": 1,
                            "maximum": 10,
                        },
                        "summary": {
                            "type": "string",
                        },
                        "strengths": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                        "issues": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                        "recommendation": {
                            "type": "string",
                        },
                        "matched_reference_bug": {
                            "type": "string",
                        },
                        "source": {
                            "type": "string",
                            "enum": ["ai", "fallback"],
                        },
                    },
                    "required": [
                        "status",
                        "score",
                        "summary",
                        "strengths",
                        "issues",
                        "recommendation",
                        "matched_reference_bug",
                        "source",
                    ],
                },
            },
        },
    }
    response_json = _post_openai_request(api_key=api_key, payload=payload)
    return extract_bug_check_result(response_json)


def build_bug_check_prompt(*, scenario_title, scenario_description, reference_bugs, bug_data):
    prompt_data = {
        "scenario": {
            "title": scenario_title,
            "description": scenario_description,
        },
        "reference_bugs": reference_bugs,
        "bug_report": {
            "element": bug_data["element"],
            "description": bug_data["description"],
            "steps": bug_data["steps"],
            "expected": bug_data["expected"],
            "actual": bug_data["actual"],
        },
        "evaluation_rules": [
            "Проверь, описывает ли баг-репорт понятный дефект интерфейса.",
            "Проверь, связаны ли описание и выбранный элемент интерфейса.",
            "Проверь, достаточно ли конкретны шаги воспроизведения.",
            "Проверь, не противоречат ли expected и actual behavior друг другу.",
            "Если найден похожий эталонный баг, кратко укажи его.",
            "Если баг оформлен слабо, объясни, чего не хватает.",
        ],
    }
    return (
        "Ниже даны данные учебного баг-репорта. "
        "Сформируй JSON-оценку его корректности и качества.\n\n"
        f"{json.dumps(prompt_data, ensure_ascii=False, indent=2)}"
    )


def extract_bug_check_result(response_json):
    choices = response_json.get("choices", [])
    if not choices:
        raise BugCheckServiceError("OpenAI не вернул choices в ответе.")

    message = choices[0].get("message", {})
    if message.get("refusal"):
        raise BugCheckServiceError("Модель отказалась выполнять проверку.")

    content = message.get("content")
    if not content:
        raise BugCheckServiceError("OpenAI не вернул content в ответе.")

    try:
        parsed_content = json.loads(content)
    except json.JSONDecodeError as exc:
        raise BugCheckServiceError("Не удалось разобрать JSON-ответ модели.") from exc

    parsed_content["source"] = "ai"
    return parsed_content


def run_fallback_bug_check(*, reference_bugs, bug_data):
    description = bug_data["description"].strip()
    expected = bug_data["expected"].strip()
    actual = bug_data["actual"].strip()
    element = bug_data["element"].strip()
    steps = [step.strip() for step in bug_data["steps"] if step.strip()]

    score = 4
    strengths = []
    issues = []

    if element:
        score += 1
        strengths.append("Выбран конкретный элемент интерфейса.")
    else:
        issues.append("Не указан элемент интерфейса, к которому относится дефект.")

    if len(description) >= 20:
        score += 1
        strengths.append("Описание ошибки достаточно конкретное.")
    else:
        issues.append("Описание ошибки слишком короткое и требует уточнения.")

    if steps:
        score += 1
        strengths.append("Добавлены шаги воспроизведения.")
        if len(steps) >= 2:
            score += 1
            strengths.append("Шаги воспроизведения достаточно детализированы.")
        else:
            issues.append("Желательно описать больше одного шага воспроизведения.")
    else:
        issues.append("Не добавлены шаги воспроизведения.")

    if expected and actual:
        score += 1
        strengths.append("Заполнены expected и actual behavior.")
        if expected.lower() != actual.lower():
            score += 1
            strengths.append("Expected и actual behavior логически разделены.")
        else:
            issues.append("Expected и actual behavior выглядят слишком похожими.")
    else:
        issues.append("Не заполнены expected и actual behavior.")

    matched_reference_bug = match_reference_bug(reference_bugs=reference_bugs, bug_data=bug_data)
    if matched_reference_bug:
        score += 1
        strengths.append("Баг-репорт похож на один из эталонных дефектов сценария.")
    else:
        issues.append("Не найдено явного совпадения с эталонными багами сценария.")

    score = max(1, min(score, 10))
    if score >= 8:
        status = "valid"
    elif score >= 5:
        status = "partially_valid"
    else:
        status = "invalid"

    if not issues:
        issues.append("Серьезных замечаний по структуре баг-репорта не найдено.")

    return {
        "status": status,
        "score": score,
        "summary": build_fallback_summary(status=status, matched_reference_bug=matched_reference_bug),
        "strengths": strengths,
        "issues": issues,
        "recommendation": build_fallback_recommendation(issues=issues),
        "matched_reference_bug": matched_reference_bug,
        "source": "fallback",
    }


def match_reference_bug(*, reference_bugs, bug_data):
    element = bug_data["element"].strip().lower()
    description = bug_data["description"].strip().lower()
    expected = bug_data["expected"].strip().lower()
    actual = bug_data["actual"].strip().lower()
    text_blob = " ".join([description, expected, actual])

    best_match = ""
    best_score = 0
    for reference_bug in reference_bugs:
        score = 0
        reference_element = (reference_bug.get("ui_element") or "").strip().lower()
        if element and reference_element and element == reference_element:
            score += 3

        for candidate in (
            reference_bug.get("description", ""),
            reference_bug.get("expected_behavior", ""),
        ):
            for token in tokenize(candidate):
                if token in text_blob:
                    score += 1

        if score > best_score:
            best_score = score
            best_match = reference_bug.get("description", "")

    return best_match if best_score >= 3 else ""


def tokenize(text):
    normalized = text.lower().replace(".", " ").replace(",", " ").replace(":", " ")
    return [token for token in normalized.split() if len(token) > 4]


def build_fallback_summary(*, status, matched_reference_bug):
    if status == "valid":
        if matched_reference_bug:
            return "Баг-репорт оформлен достаточно качественно и похож на эталонный дефект сценария."
        return "Баг-репорт оформлен достаточно качественно и выглядит осмысленным."
    if status == "partially_valid":
        return "Баг-репорт описывает возможный дефект, но его стоит доработать для более точной проверки."
    return "Баг-репорт пока выглядит слишком слабым или неполным для уверенной проверки."


def build_fallback_recommendation(*, issues):
    if any("шаг" in issue.lower() for issue in issues):
        return "Уточните последовательность действий пользователя и начальное состояние интерфейса."
    if any("элемент интерфейса" in issue.lower() for issue in issues):
        return "Привяжите баг к конкретному элементу интерфейса и уточните контекст."
    return "Сделайте описание конкретнее и проверьте, что expected и actual behavior явно различаются."


def _post_openai_request(*, api_key, payload):
    raw_body = json.dumps(payload).encode("utf-8")
    api_request = request.Request(
        OPENAI_API_URL,
        data=raw_body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(api_request, timeout=45) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        response_body = exc.read().decode("utf-8", errors="replace")
        raise BugCheckServiceError(f"OpenAI API вернул ошибку {exc.code}: {response_body}") from exc
    except error.URLError as exc:
        raise BugCheckServiceError(f"Не удалось подключиться к OpenAI API: {exc.reason}") from exc
