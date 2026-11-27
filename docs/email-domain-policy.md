# Переключение корпоративного домена email

По умолчанию разрешён только точный `geropharm.com`. Только **точная строка `false`** снимает доменное ограничение. `true`, отсутствие переменной, пустая строка, `False`, `0`, `off`, ` false ` и остальные некорректные значения сохраняют строгий режим.

| Переменная | Где задаётся | Действие |
| --- | --- | --- |
| `VITE_ENFORCE_CORPORATE_EMAIL` | `.env.local` при dev/build; Actions **Variable** при текущем workflow | Регистрация, вход/resend/verify, восстановление пользователя в store, форма благодарности и подсказки. В письме в будущее меняется подпись поля; получатель — подтверждённый email аккаунта, без редактирования. |
| `ENFORCE_CORPORATE_EMAIL` | Supabase Edge Functions → Secrets; локально env-файл функций | Автор/получатель благодарности; подписанные Before User Created и Custom Access Token Hooks. |

Флаги независимы: frontend=false и server=true не разрешают внешний адрес в Auth Hooks или send-gratitude. Флаги из тела запроса, headers и user metadata не управляют серверной политикой. Чтобы тестировать весь поток с любым доменом, задайте **оба** false. VITE применяется при сборке: нужен перезапуск dev/новый build. Отключение домена не отключает формат email, OTP, JWT, RLS, назначения/даты, rate limits и дедупликацию.

Единый валидатор принимает интернет-адреса с ASCII dot-atom local part ≤64 символов, адресом ≤254 символов и DNS-доменом с корректными метками. IDN поддерживается в punycode. Внешние пробелы обрезаются, регистр нормализуется. Пустые части, несколько `@`, пробелы внутри, CR/LF/NUL, двойные/крайние точки local part и некорректные DNS-метки запрещены. Quoted mailbox, display-name и `name@localhost` не поддерживаются формами. В строгом режиме поддомены и `geropharm.com.evil.org` не принимаются.

## Полный инвентарь ограничений

| Место | Найдено и изменено |
| --- | --- |
| `src/components/RegistrationForm.vue` | Regex корпоративного адреса заменён общей управляемой проверкой; подсказка соответствует режиму. ФИО, площадка и согласие обязательны. |
| `src/views/AuthView.vue` | Корпоративный текст входа переключается; native type=email сохранён. Проверка выполняется также в service. |
| `src/services/auth.service.ts` | Раньше только нормализовал email. Общая проверка теперь вызывается до register/login/resend/verify, затем прежние `signInWithOtp` / `verifyOtp`. |
| `src/stores/auth.ts` | Проверка возвращённого пользователя при initial getUser, Auth state event и verify; клиентская политика не подменяет серверную проверку. |
| `src/components/VerificationCodeForm.vue` | Только корпоративная подсказка зависит от режима. Шесть цифр, cooldown/resend и обработка ошибок сохранены. |
| `src/utils/gratitude.ts` | Собственный regex получателя заменён общей frontend-проверкой; длины имени/сообщения сохранены. |
| `src/components/EighthTaskScreen.vue` | Подсказки соответствуют режиму; анонимность, requestId и контракт отправки сохранены. |
| `supabase/functions/send-gratitude/handler.ts` | Regex получателя и домена автора из `/auth/v1/user` заменены общей проверкой с **серверным** флагом. Подтверждение почты/JWT/RLS/slug/дата/лимиты/журнал сохранены. |
| `src/components/SixteenthTaskScreen.vue` | Получатель только для чтения из подтверждённого аккаунта. Подпись поля зависит от режима. В `submit_future_letter` передаётся только `p_body`; расписание приходит из БД, старого payload с email больше нет. |
| Прочие Vue/composables/stores/утилиты/`TaskView`/`calendar.service` | Отдельных доменных проверок не найдено. Нормализация email и отображение адреса сами по себе домен не ограничивают. |
| SQL-миграции `001`–`013`, RPC/RLS/triggers в Git | Есть profiles.email и копирование Auth email; CHECK/regex домена и Auth Hooks отсутствовали. SQL/RLS не менялись. Полные определения некоторых действующих RPC не представлены в репозитории: см. ручной чек-лист. |
| Auth Hooks | Добавлен подписанный endpoint `auth-email-policy` для двух типов Hook, с отдельным signing secret каждого. Привязки Dashboard автоматически не создаются. |
| `send-gratitude/postbox.ts` | Фиксированный From/Reply-To `ded-moroz@geropharm-advent.ru` и проверенный домен отправителя не менялись; флаг относится к пользователям/получателям. |
| `supabase/migrations/functions/cleanup-attachments/index.ts` | Email/domain-ограничений нет; не менялся. |
| Seed task_type `email`/`future_email`, типы/модели, placeholders | Это не фильтры адреса. IDs/type задания не менялись; действующая форма письма в будущее — `task-16`, а не имя устаревшего task_type. |

Поиск охватил исходники, SQL, Edge Functions, документацию и конфигурацию. Реальные Dashboard settings, дополнительные SQL-функции вне Git и SMTP/DNS не читались. Исторический предрелизный отчёт исходного коммита не изменялся.

## Подписанные серверные Auth Hooks

Сам VITE-флаг не защищает публичный Supabase Auth API. Для независимой серверной защиты подключите **оба** HTTP Hook:

1. **Before User Created** — проверка до создания нового аккаунта; разрешение возвращает `{}`. Email не помечается подтверждённым.
2. **Custom Access Token** — проверка при выдаче токена/refresh существующему или новому пользователю; возвращает исходные claims без изменения sub/role/session/aal/metadata. JWT/сессии самостоятельно не создаёт.

Для уже существующего внешнего аккаунта Auth может отправить OTP до вызова Token Hook, но строгий Hook не разрешит выдачу сессии. Это не замена SMTP-квотам и встроенным Auth rate limits; они должны оставаться включёнными.

`auth-email-policy` использует `standardwebhooks@1.0.0` для HMAC и проверки timestamp. Даже в false обязательна подпись; signing secret одного типа не принимается для другого. Отсутствующая/некорректная конфигурация и signing key короче 32 байт блокируют вызов. Ограничения: POST, тело ≤20 000 байт, никаких внешних запросов или отправки писем внутри Hook.

**Если Hooks уже подключены**, сохраните и изучите их перед изменением. Нельзя вслепую заменить Custom Access Token Hook, назначающий роли/claims: проверку email нужно объединить с существующей доверенной логикой. Новая функция сохраняет входные claims, но не воспроизводит неизвестную внешнюю логику.

## Настройка тестового проекта

Новых SQL-миграций нет. Существующая схема/RLS и журнал 013 должны быть установлены по прежней инструкции.

1. В Authentication → Hooks подготовьте два HTTP Hook: Before User Created и Custom Access Token. Endpoint обоих — `https://PROJECT_REF.supabase.co/functions/v1/auth-email-policy`. Сгенерируйте отдельный secret каждого типа.
2. В Edge Functions → Secrets задайте:

   ```dotenv
   ENFORCE_CORPORATE_EMAIL=false
   AUTH_EMAIL_SIGNUP_HOOK_SECRET=v1,whsec_<secret-before-user-created>
   AUTH_EMAIL_TOKEN_HOOK_SECRET=v1,whsec_<secret-custom-access-token>
   ```

   Поддерживается также `whsec_<base64>` без `v1,`. Пример без настоящих ключей — `supabase/functions/.env.example`. Реальные secrets не помещайте в Git или VITE.
3. Из корня репозитория вручную разверните:

   ```bash
   npx supabase@latest functions deploy auth-email-policy --project-ref "PROJECT_REF" --no-verify-jwt
   npx supabase@latest functions deploy send-gratitude --project-ref "PROJECT_REF" --no-verify-jwt
   ```

   Для Hook gateway JWT отключён, поскольку Auth вызывает его до выдачи JWT; внутри обязательна подпись. send-gratitude сохраняет свою проверку JWT через Auth.
4. В Dashboard проверьте endpoint, тип, secret и активность **обоих** Hooks. Deploy функции не подключает Hook автоматически. Если Dashboard при сохранении сразу активирует Hook, настройку делайте в контролируемом тестовом окне; не оставляйте production Hook на ещё не готовом endpoint/secrets.
5. Для frontend, подключённого к тому же тестовому проекту, задайте `VITE_ENFORCE_CORPORATE_EMAIL=false` и перезапустите dev/пересоберите. В Actions используется Repository/Environment → Variables → `VITE_ENFORCE_CORPORATE_EMAIL`, при отсутствии — true.
6. Сохраните прежние POSTBOX-параметры, подтверждённый sender/domain и точный `APP_ORIGIN`. SMTP для Supabase Auth — отдельная настройка, флаг не заменяет её.

## Ручная проверка вне репозитория

- Действующие Before User Created / Custom Access Token / Send Email Hooks, SQL hooks, triggers auth.users, allowlist доменов: внешний hardcoded regex не переключится от новой Edge env автоматически. Объедините политику там, где ограничение реально исполняется, сохранив права/проверки.
- Реальные RPC сверяются с production отдельно; предоставленные определения `save_task_progress` и `submit_future_letter` записаны в `tests/sql/production-*.sql` как тестовые снимки. **PostgreSQL не читает Deno env.** Task-16 использует только `submit_future_letter(p_body)`: адрес берётся из подтверждённой записи `auth.users`, клиент его не задаёт. Не удалять RLS для обхода внешнего фильтра. См. `docs/future-letter-delivery.md`.
- Authentication → Email: OTP/email confirmation включены, шаблон `{{ .Token }}`, длина/TTL кода, SMTP sender, ограничения получателей и квоты. Флаги не обходят ограничения провайдера.
- Возврат к строгому режиму не отзывает выданные access JWT мгновенно. Token Hook применяется при новой выдаче/refresh: отзовите тестовые refresh-сессии и учтите TTL существующего access token. Данные аккаунтов автоматически не удаляются. send-gratitude проверяет серверный флаг на каждом запросе.
- Отложенная доставка task-16 реализована отдельной `send-future-letters`. Она использует сохранённого при подтверждённом submit получателя; смена доменного флага сама по себе не меняет уже поставленные в очередь письма. Автоматические тесты работают локально без реальных отправок.

## Возврат к корпоративному режиму

Верните `VITE_ENFORCE_CORPORATE_EMAIL=true` и пересоберите (или удалите Variable), а в Edge Secrets — `ENFORCE_CORPORATE_EMAIL=true` (или удалите только этот secret). Signing secrets и привязки Hooks сохраняются. Не отключайте сам Hook для возврата к защите.

Режим false **не является dry-run**: ручные действия приложения отправляют настоящие OTP/благодарности и ставят письма в будущее в настоящую очередь (сейчас с задержкой 15 минут). Все автоматические тесты используют моки и не отправляют письма.

## Тесты и перечень файлов

`npm test`, `npm run typecheck`, `VITE_ENFORCE_CORPORATE_EMAIL=true npm run build`, `VITE_ENFORCE_CORPORATE_EMAIL=false npm run build`. Последние две команды — bash; в PowerShell задайте `$env:VITE_ENFORCE_CORPORATE_EMAIL='false'` перед обычным build.

Проверяются оба режима, ошибочные значения env, синтаксис, формы/OTP/store, server/client mismatch, подпись/просрочка/подмена Hook, неизменность claims, rate limit, дедупликация, unknown и повтор только сохранения прогресса у Postbox. Случайный live fetch в почтовых тестах запрещён.

Результаты локальной проверки 25 ноября 2026 года:

| Проверка | Результат |
| --- | --- |
| `npm test` | 32 файла, 410 тестов — passed. |
| `npm run typecheck` | Frontend, send-gratitude и auth-email-policy — passed. |
| `npm run build`, VITE-флаг true / false | Обе сборки — passed; использованы локальные фиктивные Supabase URL/key. |
| Deno check двух Edge Functions с lock-файлами | Passed. |
| Связанные Playwright-сценарии на локальных preview | 6 passed в строгом режиме, 4 passed в разрешающем; Auth/RPC/почта замоканы. Полный browser suite этой проверкой не заявляется. |
| Поиск серверных секретов/Hook-библиотеки в frontend JS | Имен signing secrets, Postbox secret и standardwebhooks нет. |

Для повторения новых браузерных сценариев соберите нужный режим, запустите `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`, затем в другом терминале: `AUDIT_BASE_URL=http://127.0.0.1:4173 AUDIT_CORPORATE_EMAIL=false npm run test:browser -- tests/email-domain-policy.spec.ts`. Для строгой сборки используйте `AUDIT_CORPORATE_EMAIL=true`. Проверки выполняются только против локальной сборки с подменённым backend.

Полный список файлов этой правки:

- `.env.example`, `supabase/functions/.env.example`.
- `.github/workflows/deploy.yml`.
- `supabase/functions/_shared/email-policy.ts`, `src/utils/email-policy.ts`, `src/utils/gratitude.ts`.
- `src/components/RegistrationForm.vue`, `src/views/AuthView.vue`, `src/components/VerificationCodeForm.vue`.
- `src/services/auth.service.ts`, `src/stores/auth.ts`.
- `src/components/EighthTaskScreen.vue`, `src/components/SixteenthTaskScreen.vue`.
- `supabase/functions/send-gratitude/handler.ts`.
- `supabase/functions/auth-email-policy/handler.ts`, `index.ts`, `deno.json`, `deno.lock`, `tsconfig.json` (все пять в каталоге auth-email-policy).
- `tests/email-policy.test.ts`, `tests/email-policy-forms.test.ts`, `tests/auth-email-store-policy.test.ts`, `tests/auth-email-policy-hook.test.ts`, `tests/auth-email-code.test.ts`, `tests/send-gratitude.test.ts`.
- `tests/email-domain-policy.spec.ts` — браузерные сценарии обоих build-режимов. При локальном прогоне ожидаемый режим задаётся `AUDIT_CORPORATE_EMAIL=true|false`; это параметр теста, а не переменная приложения. Перед ним надо собрать соответствующее значение VITE-флага.
- `package.json`, `package-lock.json`: typecheck Hook и закреплённая dev-зависимость standardwebhooks для тестов; Deno использует import map/lock. Hook-библиотека и secrets не импортируются frontend.
- `README.md`, `supabase/functions/send-gratitude/README.md`, `docs/review-7-handoff.md`, `docs/email-domain-policy.md`.

Официальные контракты: [Before User Created](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook), [Custom Access Token](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook), [HTTP Hook signatures](https://supabase.com/docs/guides/auth/auth-hooks).
