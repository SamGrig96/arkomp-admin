import { createContext, useContext } from "react";

/**
 * The language the panel itself speaks — separate from the languages the
 * catalogue is written in. Someone editing the Russian copy may well want the
 * buttons in Armenian, and the other way round.
 */
export const UI_LOCALES = ["hy", "ru"] as const;

export type UiLocale = (typeof UI_LOCALES)[number];

/** Shown in the switcher, each in its own language. */
export const UI_LOCALE_LABELS: Record<UiLocale, string> = {
  hy: "ՀԱՅ",
  ru: "РУС",
};

/** Where the chosen panel language is remembered. */
export const LOCALE_STORAGE_KEY = "arkomp.admin.locale";

const hy = {
  app: {
    brand: "ԱՐԿՈՄՊ",
    subtitle: "կառավարում",
    catalogue: "Տեսականի",
    site: "Կայք ↗",
    password: "Գաղտնաբառ",
    signOut: "Ելք",
    languageAria: "Ինտերֆեյսի լեզուն",
    checking: "Ստուգվում է…",
    loading: "Բեռնվում է…",
    sessionExpired: "Մուտքի ժամկետը լրացել է։ Մուտք գործեք նորից։",
    familiesFailed: "Ուղղությունները չբեռնվեցին։",
    seedWarning: "Դու դեռ օգտագործում ես սկզբնական գաղտնաբառը։",
    seedWarningLink: "Փոխիր այն",
  },
  login: {
    title: "ԱՐԿՈՄՊ · կառավարում",
    lead: "Տեսականու խմբագրման վահանակ",
    username: "Օգտանուն",
    password: "Գաղտնաբառ",
    submit: "Մուտք",
    submitting: "Մուտք…",
    failed: "Մուտքը չհաջողվեց։",
  },
  password: {
    title: "Գաղտնաբառ",
    lead: "Փոխիր քո մուտքի գաղտնաբառը։",
    current: "Ընթացիկ գաղտնաբառ",
    next: "Նոր գաղտնաբառ",
    repeat: "Կրկնիր նոր գաղտնաբառը",
    minHint: (n: number) => `նվազագույնը ${n} նիշ`,
    tooShort: (n: number) => `Առնվազն ${n} նիշ։`,
    mismatch: "Գաղտնաբառերը չեն համընկնում։",
    submit: "Փոխել գաղտնաբառը",
    submitting: "Պահվում է…",
    failed: "Չհաջողվեց փոխել գաղտնաբառը։",
    changed: "Գաղտնաբառը փոխվեց։",
  },
  list: {
    title: "Տեսականի",
    summary: (products: number, families: number) =>
      `${products} ապրանքախումբ · ${families} ուղղություն`,
    allFamilies: "Բոլոր ուղղությունները",
    create: "+ Նոր ապրանքախումբ",
    orderChanged: "Հերթականությունը փոխվել է։",
    cancel: "Չեղարկել",
    saveOrder: "Պահել հերթականությունը",
    savingOrder: "Պահվում է…",
    colImage: "Նկար",
    colName: "Անվանում",
    colFamily: "Ուղղություն",
    colStatus: "Կարգավիճակ",
    colOrder: "Հերթ.",
    hidden: "Թաքցված",
    featured: "Գլխավոր",
    imageCount: (n: number) => `${n} նկար`,
    noImage: "Նկար չկա",
    reorderHint: "Հերթականությունը փոխելու համար ընտրիր «Բոլոր ուղղությունները»։",
    loadFailed: "Չհաջողվեց բեռնել տեսականին։",
    orderFailed: "Հերթականությունը չպահվեց։",
  },
  editor: {
    newTitle: "Նոր ապրանքախումբ",
    noSlug: "slug դեռ լրացված չէ",
    viewOnSite: "Տեսնել կայքում ↗",
    back: "← Ցուցակ",

    settingsTitle: "Կարգավորումներ",
    settingsLead: "Slug-ը կայքի հասցեն է — փոխելը փոխում է էջի URL-ը։",
    slug: "Slug",
    slugHint: "լատինատառ, առանց բացատների",
    family: "Ուղղություն",
    published: "Հրապարակված է կայքում",
    featured: "Ցույց տալ գլխավոր էջում",

    photosLeadNew: "Նախ պահիր ապրանքախումբը — հետո նկար ավելացնելը հասանելի կլինի։",

    copyTitle: "Տեքստեր",
    copyLead: "Դատարկ վերնագրով լեզուն կայք չի ուղարկվում։",
    fieldTitle: "Վերնագիր",
    fieldShort: "Կարճ նկարագրություն",
    fieldShortHint: "քարտի տեքստը՝ 1–2 նախադասություն",
    fieldBenefit: "Քարտի ներքևի տողը",
    fieldBenefitHint: "ընտրության հուշում, օր․՝ «Ընտրություն ըստ բեռնվածության»",
    fieldLead: "Ապրանքի էջի ներածական",
    fieldText: "Տեքստ",
    fieldNumber: "Համար",

    overview: "Ամփոփում",
    overviewHint: "«Ի՞նչ է լուծում», «Ո՞ւմ համար է», «Ինչպե՞ս ընտրել»",
    overviewAdd: "Ավելացնել տող",
    features: "Առավելություններ",
    featuresHint: "համարակալված քարտեր ապրանքի էջում",
    featuresAdd: "Ավելացնել առավելություն",
    specs: "Բնութագրերի տողերը",
    specsHint: "միայն անվանումները — արժեքները լրացնում է ընկերությունը",
    specsAdd: "Ավելացնել բնութագիր",
    specsPlaceholder: "Տրամագիծ, մմ",
    variants: "Մոդելներ",
    variantsHint: "կոնկրետ տեսակները, եթե կան",
    variantsAdd: "Ավելացնել մոդել",
    variantsPlaceholder: "ՓՈԽԱՆՑՄԱՆ ՓՈԿ - A",

    dirty: "Չպահված փոփոխություններ կան։",
    clean: "Ամեն ինչ պահված է։",
    save: "Պահել",
    saving: "Պահվում է…",
    create: "Ստեղծել",
    delete: "Ջնջել",

    needTitle: "Առնվազն մեկ լեզվով վերնագիր պետք է լինի։",
    loadFailed: "Չհաջողվեց բեռնել ապրանքը։",
    saveFailed: "Չհաջողվեց պահել։",
    deleteFailed: "Չհաջողվեց ջնջել։",
    confirmDelete: (name: string) =>
      `Ջնջե՞լ «${name}» ապրանքախումբը իր բոլոր նկարներով։ Գործողությունն անշրջելի է։`,
    created: "Ապրանքախումբը ստեղծվեց։",
    saved: "Պահպանվեց։",
    deleted: "Ջնջվեց։",
  },
  photos: {
    title: "Լուսանկարներ",
    lead: "Առաջին նկարը քարտի շապիկն է։ Մնացածը երևում են ապրանքի էջի պատկերասրահում։",
    drop: "Քաշիր նկարները այստեղ, կամ սեղմիր՝ ընտրելու համար",
    uploading: (progress: string) => `Վերբեռնվում է… ${progress}`,
    formats: "JPEG, PNG, WebP, AVIF կամ GIF · մինչև 8 ՄԲ",
    altFor: (language: string) => `Alt՝ ${language}`,
    cover: "Շապիկ",
    moveBack: "Առաջ",
    moveForward: "Հետ",
    notImages: "Ընտրված ֆայլերը նկար չեն։",
    uploadFailed: "Վերբեռնումը չհաջողվեց։",
    orderFailed: "Հերթականությունը չպահվեց։",
    deleteFailed: "Չհաջողվեց ջնջել։",
    altFailed: "Alt տեքստը չպահվեց։",
    confirmDelete: "Ջնջե՞լ այս նկարը։ Գործողությունն անշրջելի է։",
  },
  common: {
    up: "Վերև",
    down: "Ներքև",
    remove: "Ջնջել",
  },
  api: {
    offline: (url: string) => `API-ն հասանելի չէ (${url})։ Ստուգեք՝ գործարկվա՞ծ է։`,
    status: (status: number) => `Սխալ ${status}`,
  },
};

/** The Russian panel. Same shape as hy — TypeScript enforces it below. */
const ru: typeof hy = {
  app: {
    brand: "АРКОМП",
    subtitle: "управление",
    catalogue: "Каталог",
    site: "Сайт ↗",
    password: "Пароль",
    signOut: "Выйти",
    languageAria: "Язык интерфейса",
    checking: "Проверяем…",
    loading: "Загрузка…",
    sessionExpired: "Сессия истекла. Войдите заново.",
    familiesFailed: "Не удалось загрузить направления.",
    seedWarning: "Вы всё ещё пользуетесь начальным паролем.",
    seedWarningLink: "Смените его",
  },
  login: {
    title: "АРКОМП · управление",
    lead: "Панель редактирования каталога",
    username: "Логин",
    password: "Пароль",
    submit: "Войти",
    submitting: "Входим…",
    failed: "Войти не удалось.",
  },
  password: {
    title: "Пароль",
    lead: "Смените пароль для входа.",
    current: "Текущий пароль",
    next: "Новый пароль",
    repeat: "Повторите новый пароль",
    minHint: (n: number) => `минимум ${n} символов`,
    tooShort: (n: number) => `Не менее ${n} символов.`,
    mismatch: "Пароли не совпадают.",
    submit: "Сменить пароль",
    submitting: "Сохраняем…",
    failed: "Не удалось сменить пароль.",
    changed: "Пароль изменён.",
  },
  list: {
    title: "Каталог",
    summary: (products: number, families: number) =>
      `${products} товарных групп · ${families} направлений`,
    allFamilies: "Все направления",
    create: "+ Новая товарная группа",
    orderChanged: "Порядок изменён.",
    cancel: "Отменить",
    saveOrder: "Сохранить порядок",
    savingOrder: "Сохраняем…",
    colImage: "Фото",
    colName: "Название",
    colFamily: "Направление",
    colStatus: "Статус",
    colOrder: "Пор.",
    hidden: "Скрыто",
    featured: "На главной",
    imageCount: (n: number) => `${n} фото`,
    noImage: "Фото нет",
    reorderHint: "Чтобы менять порядок, выберите «Все направления».",
    loadFailed: "Не удалось загрузить каталог.",
    orderFailed: "Порядок не сохранился.",
  },
  editor: {
    newTitle: "Новая товарная группа",
    noSlug: "slug ещё не заполнен",
    viewOnSite: "Открыть на сайте ↗",
    back: "← К списку",

    settingsTitle: "Настройки",
    settingsLead: "Slug — это адрес страницы на сайте; меняя его, вы меняете URL.",
    slug: "Slug",
    slugHint: "латиницей, без пробелов",
    family: "Направление",
    published: "Опубликовано на сайте",
    featured: "Показывать на главной",

    photosLeadNew: "Сначала сохраните группу — потом можно будет добавить фото.",

    copyTitle: "Тексты",
    copyLead: "Язык с пустым названием на сайт не отправляется.",
    fieldTitle: "Название",
    fieldShort: "Краткое описание",
    fieldShortHint: "текст карточки — 1–2 предложения",
    fieldBenefit: "Нижняя строка карточки",
    fieldBenefitHint: "подсказка для выбора, напр. «Подбор по нагрузке»",
    fieldLead: "Вступление на странице товара",
    fieldText: "Текст",
    fieldNumber: "Номер",

    overview: "Обзор",
    overviewHint: "«Что решает», «Кому подходит», «Как выбрать»",
    overviewAdd: "Добавить строку",
    features: "Преимущества",
    featuresHint: "нумерованные карточки на странице товара",
    featuresAdd: "Добавить преимущество",
    specs: "Строки характеристик",
    specsHint: "только названия — значения заполняет компания",
    specsAdd: "Добавить характеристику",
    specsPlaceholder: "Диаметр, мм",
    variants: "Модели",
    variantsHint: "конкретные типы, если есть",
    variantsAdd: "Добавить модель",
    variantsPlaceholder: "РЕМЕНЬ ПРИВОДНОЙ - A",

    dirty: "Есть несохранённые изменения.",
    clean: "Всё сохранено.",
    save: "Сохранить",
    saving: "Сохраняем…",
    create: "Создать",
    delete: "Удалить",

    needTitle: "Название нужно хотя бы на одном языке.",
    loadFailed: "Не удалось загрузить товар.",
    saveFailed: "Не удалось сохранить.",
    deleteFailed: "Не удалось удалить.",
    confirmDelete: (name: string) =>
      `Удалить группу «${name}» вместе со всеми фото? Действие необратимо.`,
    created: "Товарная группа создана.",
    saved: "Сохранено.",
    deleted: "Удалено.",
  },
  photos: {
    title: "Фотографии",
    lead: "Первое фото — обложка карточки. Остальные попадают в галерею на странице товара.",
    drop: "Перетащите фото сюда или нажмите, чтобы выбрать",
    uploading: (progress: string) => `Загружаем… ${progress}`,
    formats: "JPEG, PNG, WebP, AVIF или GIF · до 8 МБ",
    altFor: (language: string) => `Alt: ${language}`,
    cover: "Обложка",
    moveBack: "Раньше",
    moveForward: "Позже",
    notImages: "Выбранные файлы не являются изображениями.",
    uploadFailed: "Загрузить не удалось.",
    orderFailed: "Порядок не сохранился.",
    deleteFailed: "Не удалось удалить.",
    altFailed: "Alt-текст не сохранился.",
    confirmDelete: "Удалить это фото? Действие необратимо.",
  },
  common: {
    up: "Вверх",
    down: "Вниз",
    remove: "Удалить",
  },
  api: {
    offline: (url: string) => `API недоступен (${url}). Проверьте, запущен ли он.`,
    status: (status: number) => `Ошибка ${status}`,
  },
};

export type Strings = typeof hy;

export const dictionaries: Record<UiLocale, Strings> = { hy, ru };

const isUiLocale = (value: string | null): value is UiLocale =>
  value !== null && (UI_LOCALES as readonly string[]).includes(value);

/** Stored choice first, then the browser's own language. */
export function initialLocale(): UiLocale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isUiLocale(stored)) return stored;
  } catch {
    // Private browsing and blocked storage both land here; the default is fine.
  }
  return navigator.language.startsWith("ru") ? "ru" : "hy";
}

export type I18n = {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
  t: Strings;
};

export const I18nContext = createContext<I18n | null>(null);

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n used outside I18nProvider");
  return value;
}

/** Shorthand for the common case of only needing the strings. */
export const useT = (): Strings => useI18n().t;
