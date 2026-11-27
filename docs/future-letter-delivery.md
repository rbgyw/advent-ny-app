# Письмо в будущее: реализация и ручное подключение

Рабочая ветка: `feat/future-letter-delivery`, исходный HEAD `b094954` (ветка `work`). Production не изменялся; SQL, deploy, Cron и реальная отправка в ходе разработки не выполнялись. SQL-тесты работают только в PGlite и временном контейнере PostgreSQL 17 без сети и опубликованных портов.

## Текущее состояние перед объединением с main

По сообщению пользователя от 27.11.2026 в production уже созданы `future_letters` и `submit_future_letter`, применены 014/015, настроены секреты и Vault, развёрнута `send-future-letters`, Cron активен и возвращает HTTP 200. **016 ещё не применена.** Этот статус получен от пользователя; проверки кода и тестов выполняются локально, реальные RPC сохранения и отправки не вызываются.

Повторно применять 014/015, менять секреты, деплоить функцию и создавать Cron для объединения веток не нужно. Разделы ниже описывают первоначальное подключение и служат справкой. Актуальные результаты rebase, проверок и порядок объединения: [future-letter-merge-readiness.md](future-letter-merge-readiness.md).

## Контракт и доставка

Клиент вызывает только `submit_future_letter({ p_body })`. Получатель отображается из `auth.user.email`, если есть `email_confirmed_at`; сервер самостоятельно получает адрес из `auth.users`. Клиент не передаёт email, user_id, task_id или расписание. Оба production-ответа имеют `status: completed`, `letter_id`, `task_id`, `due_at`. Повторный ответ не обязан содержать `completed_at` и `response`. После подтверждения RPC клиент перечитывает назначение и безопасные метаданные, затем обновляет прогресс. При сетевой ошибке текст остаётся в форме, повторный вызов восстанавливает тот же результат. Текст письма не отправляется в `save_task_progress` и не сохраняется в localStorage.

`due_at` из RPC используется для показа расписания; после перезагрузки оно восстанавливается из production-метаданных `response.deliver_on`. Интерфейс показывает дату, время и МСК. Серверная задержка остаётся **15 минут**, независимо от часов клиента. Фактический запрос к провайдеру выполняется ближайшим запуском Cron после наступления срока, с учётом backoff.

`send-future-letters` принимает только POST с заголовком `x-future-letter-cron-secret`, проверяет его до запросов к БД и не предоставляет CORS для браузера. Запуск выполняет:

1. Обработку не более 100 просроченных блокировок.
2. Захват не более 10 писем (RPC допускает 1–20) через `FOR UPDATE SKIP LOCKED`, только когда наступили и `due_at`, и `next_attempt_at`. Lease — 2 минуты, для каждого письма новый `claim_token`.
3. Подпись запроса существующим Postbox-транспортом, затем атомарную проверку токена/lease и фиксацию `send_started_at` непосредственно перед HTTP-запросом. Счётчик попыток увеличивается при начале отправки.
4. Один HTTP-запрос Postbox с таймаутом 10 секунд, без HTTP-повторов. Пачка обрабатывается параллельно, обработчик дожидается всех результатов.
5. Сохранение результата только для актуального токена. Принятие Postbox означает `sent` с `provider_message_id` и `sent_at`, а не доказанную доставку в почтовый ящик.

Достоверный отказ по квоте/429 возвращает письмо в `pending`; backoff — 60, 120, 240, 480 секунд. Пятая неуспешная попытка завершает письмо как `failed`. Постоянный отказ также даёт `failed`. Потеря соединения, таймаут, HTTP 5xx/redirect, отсутствующий MessageId и некорректный успешный ответ дают `failed, delivery_uncertain=true`, без автоматической повторной отправки.

Просроченный lease до `send_started_at` можно захватить заново. Если отправка уже началась, истечение lease означает неопределённый результат и запрещает автоматический повтор. Ошибка сохранения результата после принятия провайдером обрабатывается таким же способом. Это сознательный выбор защиты от дубликатов: некоторые письма требуют ручной сверки с Postbox, даже если фактически не были отправлены. Сбрасывать `delivery_uncertain` или возвращать такие строки в `pending` без проверки провайдера нельзя.

Обработчик не логирует тела, адреса, секреты или сырые ответы провайдера/БД; HTTP-ответ содержит только счётчики или фиксированный код ошибки. HTML экранирует пользовательский текст; есть plain text альтернатива, обе части UTF-8.

## Совместимость с production и SQL

Предоставленные пользователем production-определения записаны в `tests/sql/production-*.sql` как тестовые снимки. **Не применять эти снимки к production.** Миграция 014 требует уже установленную `submit_future_letter(text)` и не создаёт и не заменяет её. На новой тестовой БД эта RPC устанавливается из снимка до миграции.

SQL для ручного применения:

- `docs/sql/future-letter-preflight.sql` — чтение определений, структуры, ограничений, индексов, прав и обезличенных счётчиков очереди.
- `supabase/migrations/014_future_letters.sql` — baseline таблицы через `IF NOT EXISTS`, проверка типов и совместимости существующих данных, индексы, RLS и права. Существующие строки сохраняются; несовместимость останавливает транзакцию. Подтверждённая структура production проверяется вручную по preflight, особенно defaults, NOT NULL, unique `(user_id, task_id)` и ограничения.
- `supabase/migrations/015_future_letter_delivery.sql` — четыре внутренние RPC: `claim_future_letters`, `begin_future_letter_send`, `finish_future_letter_send`, `reap_future_letter_locks`. EXECUTE только для `service_role`; клиентским ролям и PUBLIC запрещён.
- `supabase/migrations/016_block_legacy_future_letter_save.sql` — **отдельный этап переключения фронтенда**. Сравнивает исходный текст текущей `save_task_progress` с предоставленным production-снимком, по контрольной сумме исходного текста (переводы CRLF нормализуются в LF). При расхождении останавливается. Затем заменяет ту же функцию той же production-логикой с единственным новым запретом `task-16`. Сигнатура, SECURITY DEFINER, search_path и действующие grants сохраняются. Никаких копий RPC с другим именем не создаётся.
- `docs/sql/future-letter-cron.sql` — отдельная заготовка ручного создания Cron; не является миграцией и не запускалась.

Не запускать слепой `supabase db push`: база уже содержит ручные объекты и другую историю миграций. Сначала сверить remote migration history, таблицу и определения функций. Миграции нумеруются 014–016, чтобы не пересекаться с 011–013 из `fix/advent-document-feedback`.

В исходной рабочей ветке благодарности ещё использовали Resend. Из указанного пользователем коммита `84617fe` перенесены **без изменений** `send-gratitude`, его `email-policy.ts`, миграция `013_gratitude_send_journal.sql` и тесты. Новый обработчик импортирует `send-gratitude/postbox.ts`: `aws4fetch@1.0.20`, AWS SigV4, `ru-central1`, фиксированный endpoint Postbox, timeout 10 секунд, retries 0. OTP-код и другие изменения той ветки не переносились. Миграция 013 относится к существующим благодарностям: не применять её повторно, если журнал уже установлен в production. Саму функцию `send-gratitude` для этой задачи заново деплоить не требуется.

## Секреты и ручной deploy

Нужны существующие `POSTBOX_ACCESS_KEY_ID`, `POSTBOX_SECRET_ACCESS_KEY` и отдельные:

- `FUTURE_LETTER_FROM` — подтверждённый в Postbox адрес отправителя, без display name. Значения по умолчанию нет; не менять `POSTBOX_FROM_EMAIL` благодарностей.
- `FUTURE_LETTER_CRON_SECRET` — новый случайный серверный секрет (например, `openssl rand -hex 32`). Не использовать anon key, service role key или JWT пользователя вместо него.

`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` предоставляются Edge runtime. Все секреты серверные; не добавлять их в VITE-переменные и репозиторий. Для ручной настройки можно создать защищённый временный env-файл вне репозитория со строками `FUTURE_LETTER_FROM=...`, `FUTURE_LETTER_CRON_SECRET=...` и выполнить:

```sh
supabase secrets set --project-ref <project-ref> --env-file /secure/path/future-letter.env
supabase functions deploy send-future-letters --project-ref <project-ref> --no-verify-jwt
```

`--no-verify-jwt` нужен для Cron с отдельным секретом; авторизацию выполняет обработчик. Общий Postbox-модуль включается в bundle нового обработчика, существующая функция благодарностей не перезаписывается. Удалить временный env-файл после настройки. Переиспользуемые Postbox-ключи не менять, если они уже настроены.

## Безопасный порядок подключения

1. Прочитать preflight SQL; сверить со снимками и текущей remote migration history. Сделать резервную копию определений RPC и схемы. Посчитать уже просроченные `pending`, `processing`, `failed/delivery_uncertain`: включение Cron обработает все подходящие существующие письма. Отдельно проверить подтверждение будущего отправителя в Postbox.
2. Сначала проверить 014/015/016 в изолированной staging-БД с копией структуры и обезличенными данными. Затем вручную применить только 014 и 015 к production. Не переустанавливать `submit_future_letter` и не применять повторно существующие миграции благодарностей.
3. Установить отдельные секреты и вручную задеплоить только `send-future-letters`. **Пока не вызывать обработчик с правильным cron-секретом**: это отправит уже созревшие письма. Проверка с неверным секретом должна вернуть 401 без обращения к БД.
4. Подготовить сборку фронтенда и вручную применить 016 при его переключении. Старые открытые вкладки получат ошибку старой RPC вместо сохранения приватного текста. Проверить новый RPC, повторный запрос после ошибки и восстановление даты по `deliver_on` сначала в staging. В production успешное сохранение создаёт настоящее письмо через 15 минут, это уже отдельное осознанное тестовое действие оператора.
5. Только после проверки очереди и готовности к реальным письмам вручную создать два Vault-секрета `future_letter_function_url` и `future_letter_cron_secret` (второй совпадает с Edge secret). Проверить отсутствие дублирующей Cron-задачи. Затем использовать заготовку `docs/sql/future-letter-cron.sql` для расписания каждую минуту.
6. Наблюдать обезличенные счётчики статусов, `last_error` (фиксированные коды), просроченные lease и ошибки Cron/HTTP. При проблеме приостановить Cron; не сбрасывать состояния неопределённых отправок. Для отката фронтенда к старому сохранению письма нужно согласованное серверное изменение: простой откат клиента будет получать отказ 016. Предпочтительнее временно закрыть форму, сохранив очередь и защиту от дубликатов.

## Проверки и файлы

```sh
npm run typecheck
npm run typecheck:mail
npm test
npm run test:future-letters:postgres  # Docker, временный PostgreSQL 17
npm run build
# Для браузерных тестов: запустить dev-сервер с тестовыми VITE_SUPABASE_URL=http://127.0.0.1:54321
# и VITE_SUPABASE_ANON_KEY=local-audit-key; затем в другом терминале:
npm run test:browser -- tests/future-letter.spec.ts
```

Первоначальные результаты до обновления базы ветки: `npm run typecheck`, `npm run typecheck:mail`, production build — успешно; полный Vitest — **333/333**, Playwright для task-16 — **2/2** (сохранение и потерянный ответ, оба с перезагрузкой); PostgreSQL 17 — успешно, проверены три сценария конкуренции. Lint в проекте не настроен. Новые тесты: RPC success/replay/error и malformed ответы; форма/read-only email/реальная дата; календарный прогресс после подтверждения; потерянный ответ и выход из аккаунта; авторизация обработчика; параллельные вызовы; срок и backoff; постоянный/временный/неопределённый результат; просроченные токены; безопасное восстановление lease; лимит попыток; права внутренних RPC; сохранение production-функции и существующих строк; запрет старого пути без регрессии благодарностей/Таро. Отдельный PostgreSQL-тест использует независимые соединения для настоящих блокировок, а сетевые тесты используют только mock fetch.

Файлы первоначальной реализации (после rebase стек благодарностей уже находится в main; актуальная проверка diff описана в `future-letter-merge-readiness.md`):

- Frontend: `src/components/SixteenthTaskScreen.vue`, `src/views/TaskView.vue`, `src/stores/calendar.ts`, `src/services/calendar.service.ts`, `src/types/models.ts`.
- Новая функция: `supabase/functions/send-future-letters/{index.ts,handler.ts,template.ts,deno.json,deno.lock,tsconfig.json}`.
- Существующий production-стек из 84617fe: `supabase/functions/send-gratitude/{index.ts,handler.ts,postbox.ts,email-template.ts,README.md,deno.json,deno.lock,tsconfig.json}`, `supabase/functions/_shared/email-policy.ts`, `supabase/migrations/013_gratitude_send_journal.sql`.
- SQL доставки: `supabase/migrations/014_future_letters.sql`, `015_future_letter_delivery.sql`, `016_block_legacy_future_letter_save.sql`.
- Тесты: `tests/calendar-service.test.ts`, `tests/future-letter.test.ts`, `tests/future-letter-sql.test.ts`, `tests/send-future-letters.test.ts`, браузерный `tests/future-letter.spec.ts`, перенесённые `tests/send-gratitude.test.ts`, `tests/gratitude-sql.test.ts`, снимки `tests/sql/production-save-task-progress.sql`, `tests/sql/production-submit-future-letter.sql`, `scripts/test-future-letters-postgres.mjs`.
- Настройка и документация: `package.json`, `package-lock.json`, `README.md`, этот документ и `docs/sql/{future-letter-preflight.sql,future-letter-cron.sql}`.
