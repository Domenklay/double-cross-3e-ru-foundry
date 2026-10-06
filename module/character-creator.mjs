import { POWER_CATALOG, powerToItemData } from "./content/powers.mjs";
import { EQUIPMENT_CATALOG, equipmentToItemData } from "./content/equipment.mjs";
import { powerEffectText, powerRulesGridHtml, showPowerDetails, responsiveDialogPosition } from "./content/power-presentation.mjs";

const SYS = "double-cross-3e-ru";
const esc = v => foundry.utils.escapeHTML(String(v ?? ""));
const n = (v, d=0) => Number.isFinite(Number(v)) ? Number(v) : d;

export const SYNDROMES = Object.freeze({
  "Ангел Хало": [0,3,1,0], "Балор": [0,1,2,1], "Блэк Дог": [2,1,1,0], "Брэм Стокер": [1,2,1,0],
  "Химера": [3,0,0,1], "Экзайл": [2,1,0,1], "Хануман": [1,1,1,1], "Морфеус": [1,2,0,1],
  "Нойман": [0,0,3,1], "Оркус": [0,1,1,2], "Саламандра": [2,0,1,1], "Солярис": [0,0,1,3]
});

export const SYNDROME_INFO = Object.freeze({
  "Ангел Хало": { role:"Скорость, дальний бой, РК, восприятие", text:"Управляет светом и оптикой: лазеры, ослепление, маскировка, иллюзии и сверхчувства. Хорош для быстрых стрелков, РК-атак и персонажей, которые хотят действовать раньше противника." },
  "Балор": { role:"Контроль, РК, защита, пространство", text:"Управляет гравитацией, притяжением и отталкиванием, а на высоком уровне вмешивается в пространство и время. Хорош для контроля поля, мощных РК-эффектов и защитных трюков." },
  "Блэк Дог": { role:"Электричество, кибернетика, оружие", text:"Усиливает биоэлектрические импульсы, создаёт молнии и взаимодействует с машинами и имплантами. Подходит бойцам, стрелкам и технарям, которым нужна стабильная боевая мощь." },
  "Брэм Стокер": { role:"Кровь, слуги, восстановление, атака", text:"Управляет собственной кровью: превращает её в оружие, броню и слуг, а также ускоряет регенерацию. Сильный выбор для персонажей, готовых платить ОЗ ради мощных эффектов." },
  "Химера": { role:"Ближний бой, тело, звериная форма", text:"Преобразует тело в чудовищную форму, усиливая мышцы, органы чувств и природное оружие. Один из самых прямолинейных и понятных вариантов для сильного бойца ближнего боя." },
  "Экзайл": { role:"Гибкость тела, ближний бой, контроль", text:"Меняет форму плоти и костей, растягивает конечности и приспосабливает тело к опасности. Хорош для необычных атак, контроля дистанции и живучих бойцов." },
  "Хануман": { role:"Сверхскорость, звук, мобильность", text:"Ускоряет тело до сверхчеловеческих скоростей и управляет вибрациями, звуком и воздухом. Отлично подходит мобильным бойцам, уклонению и быстрым последовательным атакам." },
  "Морфеус": { role:"Создание оружия, предметы, универсальность", text:"Создаёт и преобразует материю, формируя оружие, броню, устройства и песок трансмутации. Удобен игрокам, которым нравится настраивать снаряжение под конкретную задачу." },
  "Нойман": { role:"Тактика, точность, поддержка", text:"Усиливает интеллект, память и расчёт. Позволяет точно атаковать, пользоваться несколькими видами оружия, анализировать противника и помогать союзникам тактическими решениями." },
  "Оркус": { role:"Домены, контроль поля, поддержка", text:"Создаёт область влияния и управляет факторами внутри неё: пространством, землёй, растениями и живыми существами. Особенно хорош для контроля поля и усиления действий союзников." },
  "Саламандра": { role:"Огонь, лёд, урон, защита", text:"Управляет температурой, огнём и льдом. Может наносить сильный прямой урон, создавать стены и барьеры, замораживать противников и укреплять собственное тело." },
  "Солярис": { role:"Поддержка, лечение, яды, контроль", text:"Создаёт химические и биологически активные вещества: лекарства, стимуляторы, токсины и психоактивные соединения. Один из лучших вариантов для поддержки, лечения и ослабления врагов." }
});

const work = (name, stat, skills={}, names={}) => ({name, stat, skills, names});
const N = {
  rumor:{info1:"Слухи"}, underworld:{info1:"Преступный мир"}, academics:{info1:"Академия"}, internet:{info1:"Интернет"},
  ugn:{info1:"UGN"}, military:{info1:"Военное дело"}, genericInfo:{info1:"Выберите"}
};

// Work Chart 1/2 + Renegade Being Work Chart from the core character-creation rules.
export const WORKS = [
  work("Ученик начальной школы","sense",{perception:2,will:1,rc:1,info1:1},N.rumor),
  work("Ученик средней школы","sense",{perception:1,will:1,rc:2,info1:1},N.rumor),
  work("Старшеклассник","body",{dodge:1,perception:1,rc:2,info1:1},N.rumor),
  work("Хулиган","body",{melee:1,ride1:2,perception:1,will:1,info1:1},{ride1:"Выберите",...N.underworld}),
  work("Студент","mind",{dodge:1,ride1:2,will:1,knowledge1:2,info1:1},{ride1:"Выберите",knowledge1:"Выберите",...N.academics}),
  work("Подработчик","body",{melee:1,ride1:2,will:1,knowledge1:2,info1:1},{ride1:"Выберите",knowledge1:"Выберите",...N.internet}),
  work("Учитель","mind",{ride1:2,knowledge1:2,negotiation:1,procure:1,info1:1},{ride1:"Выберите",knowledge1:"Выберите",...N.academics}),
  work("Домохозяин / домохозяйка","social",{art1:2,will:1,negotiation:2,info1:1},{art1:"Выберите",...N.rumor}),
  work("Ребёнок UGN A","body",{melee:2,dodge:1,rc:1,info1:1},N.ugn),
  work("Ребёнок UGN B","sense",{dodge:1,ride1:2,rc:1,info1:1},{ride1:"Выберите",...N.ugn}),
  work("Ребёнок UGN C","mind",{dodge:1,will:1,rc:2,info1:1},N.ugn),
  work("Агент UGN A","body",{melee:1,dodge:1,rc:1,procure:1,info1:1},N.ugn),
  work("Агент UGN B","sense",{ranged:1,perception:1,rc:1,procure:1,info1:1},N.ugn),
  work("Агент UGN C","mind",{will:1,rc:1,knowledge1:2,procure:1,info1:1},{knowledge1:"Выберите",...N.ugn}),
  work("Агент UGN D","social",{perception:1,negotiation:1,rc:1,procure:1,info1:1},N.ugn),
  work("Руководитель отделения UGN A","body",{melee:1,dodge:1,ride1:2,procure:1,info1:1},{ride1:"Выберите",...N.ugn}),
  work("Руководитель отделения UGN B","sense",{dodge:1,ranged:1,perception:1,procure:1,info1:1},N.ugn),
  work("Руководитель отделения UGN C","mind",{rc:1,will:1,knowledge1:2,procure:1,info1:1},{knowledge1:"Выберите",...N.ugn}),
  work("Руководитель отделения UGN D","social",{will:1,negotiation:1,procure:2,info1:1},N.ugn),
  work("Детектив","sense",{ride1:2,ranged:1,perception:1,procure:1,info1:1},{ride1:"Выберите",...N.underworld}),
  work("Криминалист","mind",{ride1:2,perception:1,procure:1,knowledge1:2,info1:1},{ride1:"Выберите",knowledge1:"Выберите",...N.underworld}),
  work("Адвокат","social",{ride1:2,will:1,knowledge1:2,negotiation:1,info1:1},{ride1:"Выберите",knowledge1:"Выберите",...N.underworld}),
  work("Военнослужащий","sense",{melee:1,dodge:1,ride1:2,ranged:1,info1:1},{ride1:"Выберите",...N.military}),
  work("Наёмник","body",{melee:1,ride1:2,ranged:1,perception:1,info1:1},{ride1:"Выберите",...N.military}),
  work("Исследователь","mind",{perception:1,knowledge1:4,procure:1,info1:1},{knowledge1:"Выберите",...N.academics}),
  work("Профессор","social",{ride1:2,will:1,knowledge1:2,negotiation:1,info1:1},{ride1:"Выберите",knowledge1:"Выберите",...N.academics}),
  work("Медсестра / медбрат","body",{perception:1,will:1,knowledge1:2,negotiation:1,info1:1},{knowledge1:"Выберите",...N.academics}),
  work("Врач","social",{rc:1,will:1,knowledge1:4,info1:1},{knowledge1:"Выберите",...N.academics}),

  work("Политик","social",{will:1,negotiation:2,procure:1,info1:1},N.underworld),
  work("Бизнесмен","mind",{ride1:2,will:1,negotiation:1,procure:1,info1:1},{ride1:"Выберите",...N.internet}),
  work("Руководитель компании","social",{ride1:2,will:1,procure:2,info1:1},{ride1:"Выберите",...N.internet}),
  work("Работник ночной индустрии","mind",{will:2,perception:1,negotiation:1,info1:1},N.rumor),
  work("Владелец магазина","social",{ride1:2,will:2,procure:1,info1:1},{ride1:"Выберите",...N.rumor}),
  work("Священнослужитель","social",{will:1,perception:1,negotiation:2,info1:1},N.rumor),
  work("Частный сыщик","mind",{ride1:2,perception:1,will:1,info1:3},{ride1:"Выберите",...N.genericInfo}),
  work("Телохранитель","body",{melee:1,dodge:1,ride1:2,perception:1,info1:1},{ride1:"Выберите",...N.underworld}),
  work("Водитель","body",{ride1:4,will:1,negotiation:1,info1:1},{ride1:"Выберите",...N.rumor}),
  work("Якудза","body",{melee:1,ride1:2,will:1,procure:1,info1:1},{ride1:"Выберите",...N.underworld}),
  work("Мафиози","sense",{ride1:2,ranged:1,procure:1,negotiation:1,info1:1},{ride1:"Выберите",...N.underworld}),
  work("Вор","sense",{dodge:1,ride1:2,perception:1,knowledge1:2,info1:1},{ride1:"Выберите",knowledge1:"Выберите",...N.underworld}),
  work("Переговорщик","social",{will:1,negotiation:1,procure:1,info1:3},N.genericInfo),
  work("Убийца","sense",{melee:1,ride1:2,ranged:1,knowledge1:2,info1:1},{ride1:"Выберите",knowledge1:"Выберите",...N.underworld}),
  work("Гадатель","mind",{perception:1,art1:2,will:1,negotiation:1,info1:1},{art1:"Выберите",...N.rumor}),
  work("Художник","mind",{perception:1,art1:2,will:2,info1:1},{art1:"Выберите",...N.internet}),
  work("Музыкант","sense",{art1:2,will:1,knowledge1:2,negotiation:1,info1:1},{art1:"Выберите",knowledge1:"Выберите",...N.internet}),
  work("Актёр","social",{art1:2,will:1,knowledge1:2,negotiation:1,info1:1},{art1:"Выберите",knowledge1:"Выберите",...N.internet}),
  work("Иллюзионист","sense",{dodge:1,perception:1,art1:2,knowledge1:2,info1:1},{art1:"Выберите",knowledge1:"Выберите",...N.rumor}),
  work("Спортсмен","body",{dodge:2,perception:1,will:1,info1:1},N.rumor),
  work("Мастер боевых искусств","body",{melee:2,dodge:1,perception:1,info1:1},N.rumor),
  work("Журналист","mind",{ride1:2,perception:1,knowledge1:2,negotiation:1,info1:1},{ride1:"Выберите",knowledge1:"Выберите",...N.internet}),
  work("Диктор","social",{art1:2,will:1,negotiation:2,info1:1},{art1:"Выберите",...N.internet}),
  work("Программист","social",{ride1:2,will:2,knowledge1:2,info1:1},{ride1:"Выберите",knowledge1:"Выберите",...N.internet}),
  work("Хакер","mind",{knowledge1:2,negotiation:1,procure:1,info1:2,info2:1},{knowledge1:"Выберите",info1:"Интернет",info2:"Преступный мир"}),
  work("Мастер на все руки","body",{melee:1,dodge:1,perception:1,procure:1,info1:1},N.rumor),
  work("Информатор","social",{dodge:1,perception:1,knowledge1:5},{knowledge1:"Выберите"}),
  work("Шпион","sense",{dodge:1,perception:1,negotiation:1,procure:1,info1:1},N.military),

  work("Ренегат-бытие A","body",{melee:1,dodge:1,ranged:1,will:1,info1:1},N.ugn),
  work("Ренегат-бытие B","sense",{melee:1,ranged:1,perception:1,will:1,info1:1},N.ugn),
  work("Ренегат-бытие C","mind",{perception:1,rc:1,will:1,negotiation:1,info1:1},N.ugn),
  work("Ренегат-бытие D","social",{dodge:1,rc:1,will:1,negotiation:1,info1:1},N.ugn)
];

const STAT_KEYS = ["body","sense","mind","social"];
const SPECIAL_KEYS = new Set(["ride1","ride2","art1","art2","knowledge1","knowledge2","info1","info2"]);
const SKILL_KEYS = ["melee","dodge","ranged","perception","rc","will","negotiation","procure","ride1","ride2","art1","art2","knowledge1","knowledge2","info1","info2"];
const SKILL_LABELS = {
  melee:"Ближний бой",dodge:"Уклонение",ranged:"Дальний бой",perception:"Восприятие",rc:"РК",will:"Воля",negotiation:"Переговоры",procure:"Снабжение",
  ride1:"Вождение 1",ride2:"Вождение 2",art1:"Искусство 1",art2:"Искусство 2",knowledge1:"Знания 1",knowledge2:"Знания 2",info1:"Информация 1",info2:"Информация 2"
};
const SPECIAL_PREFIX = {ride1:"Вождение",ride2:"Вождение",art1:"Искусство",art2:"Искусство",knowledge1:"Знания",knowledge2:"Знания",info1:"Информация",info2:"Информация"};

const AWAKENINGS = [
  ["Смерть",18],["Гнев",17],["Эксперимент",16],["Заражение",14],["Желание",17],["Неизвестность",15],
  ["Жертва",16],["Приказ",15],["Забвение",17],["Самосовершенствование",14],["Раскаяние",18],["Рождение",17]
];
const AWAKENING_INFO = Object.freeze({
  "Смерть":"Ренегат пробудился, когда вы умерли или оказались на самой грани смерти. Ваше тело отказалось погибать и изменилось, чтобы выжить.",
  "Гнев":"Способности впервые вырвались наружу в момент сильнейшей ярости — обычно когда нужно было защитить себя или кого-то важного.",
  "Эксперимент":"Пробуждение было вызвано чужим вмешательством: исследованием, операцией, препаратом или экспериментом с Ренегатом.",
  "Заражение":"Вы получили вирус Ренегат извне — от заражённого человека, существа, вещества или аномального объекта.",
  "Желание":"Очень сильное желание стало спусковым крючком. В момент, когда обычных человеческих сил оказалось недостаточно, Ренегат ответил.",
  "Неизвестность":"Вы не знаете, что именно стало причиной пробуждения. Возможно, память стёрта, причина скрыта или способности проявлялись постепенно.",
  "Жертва":"Вы заплатили собой ради другого человека или важной цели. Пробуждение стало ценой, которая позволила пережить этот момент.",
  "Приказ":"Пробуждение было запущено намеренно по приказу организации, наставника или другого человека, имевшего над вами власть.",
  "Забвение":"Сам момент пробуждения потерян в памяти. Вы знаете последствия, но ключевое событие остаётся пустым местом.",
  "Самосовершенствование":"Вы стремились стать сильнее, быстрее или совершеннее — и это стремление буквально изменило ваше тело и Ренегат.",
  "Раскаяние":"Сильная вина или сожаление стали точкой перелома. Способности появились после события, которое вы отчаянно хотели бы исправить.",
  "Рождение":"Ренегат был с вами с самого начала. Ваше необычное состояние не результат одного события — вы таким родились или сформировались ещё до осознанной жизни."
});
const IMPULSES = [
  ["Освобождение",18],["Кровожадность",17],["Голод",14],["Резня",18],["Разрушение",16],["Пытки",15],
  ["Отвращение",15],["Жажда битвы",16],["Паранойя",14],["Саморазрушение",16],["Страх",17],["Ненависть",18]
];
const IMPULSE_INFO = Object.freeze({
  "Освобождение":"Внутри растёт желание сбросить все ограничения и делать то, что хочется, не считаясь с правилами и последствиями.",
  "Кровожадность":"Ренегат толкает к насилию и крови. В стрессовый момент появляется желание ранить или убить кого-то рядом.",
  "Голод":"Возникает мучительная потребность что-то получить, поглотить или присвоить. Чем сильнее Вторжение, тем труднее её игнорировать.",
  "Резня":"Импульс требует продолжать убивать и не останавливаться на одной цели. Это потеря меры, а не просто желание победить врага.",
  "Разрушение":"Хочется ломать и уничтожать — предметы, здания, планы, отношения или сам порядок вокруг себя.",
  "Пытки":"Появляется желание причинять боль, растягивать страдание и чувствовать контроль над беспомощной жертвой.",
  "Отвращение":"Мир или люди вокруг кажутся неправильными и мерзкими. Импульс требует оттолкнуть, изгнать или стереть источник отвращения.",
  "Жажда битвы":"Сам конфликт становится наградой. Хочется найти достойного противника и проверить себя в опасном бою.",
  "Паранойя":"Любое действие окружающих начинает казаться угрозой или предательством. Импульс толкает действовать первым и никому не доверять.",
  "Саморазрушение":"Ренегат подталкивает рисковать собой, принимать лишний урон и заходить туда, откуда нормальный человек отступил бы.",
  "Страх":"Главное желание — избежать угрозы любой ценой: убежать, спрятаться, уничтожить источник страха раньше, чем он доберётся до вас.",
  "Ненависть":"Всё внимание сужается до объекта ненависти. Импульс заставляет преследовать и уничтожать его, даже если это неразумно."
});

const BACKGROUND_PRESETS = Object.freeze({
  origin:[
    {id:"ordinary-family",name:"Обычная семья",text:"Я вырос в обычной семье и долго не знал о мире Овердов.",lois:{relationship:"Семья",name:"Родитель или близкий родственник",positive:"Доверие",negative:"Тревога"}},
    {id:"broken-family",name:"Разрушенная семья",text:"Моя семья распалась из-за потери, конфликта или опасного события.",lois:{relationship:"Семья",name:"Оставшийся близкий человек",positive:"Привязанность",negative:"Страх потери"}},
    {id:"adopted",name:"Приёмная семья",text:"Меня воспитали люди, которые не были моей родной семьёй, но стали ею по выбору.",lois:{relationship:"Приёмная семья",name:"Приёмный родитель",positive:"Благодарность",negative:"Отчуждение"}},
    {id:"orphan",name:"Сирота",text:"Я рано остался без семьи и привык рассчитывать прежде всего на себя.",lois:{relationship:"Замена семьи",name:"Человек, который меня поддержал",positive:"Благодарность",negative:"Зависимость"}},
    {id:"organization-child",name:"Ребёнок организации",text:"Значительную часть детства я провёл под наблюдением UGN или другой организации.",lois:{relationship:"Наставник",name:"Куратор или наставник",positive:"Уважение",negative:"Недоверие"}},
    {id:"laboratory",name:"Объект исследования",text:"Моё детство связано с лабораторией, наблюдением или экспериментами над Ренегатом.",lois:{relationship:"Исследователь",name:"Исследователь или спаситель",positive:"Благодарность",negative:"Страх"}},
    {id:"famous-family",name:"Известная семья",text:"Я вырос в семье, от имени и репутации которой невозможно просто отказаться.",lois:{relationship:"Семья",name:"Глава семьи",positive:"Уважение",negative:"Давление"}},
    {id:"isolated",name:"Изолированное детство",text:"Я рос вдали от обычной жизни и долго не умел строить нормальные отношения с людьми.",lois:{relationship:"Первый друг",name:"Первый настоящий друг",positive:"Доверие",negative:"Страх потери"}}
  ],
  experience:[
    {id:"school-life",name:"Обычная школьная жизнь",text:"До серьёзных событий я жил обычной жизнью ученика и дорожил своим привычным кругом общения.",lois:{relationship:"Друг",name:"Одноклассник или друг",positive:"Дружба",negative:"Беспокойство"}},
    {id:"loss",name:"Потеря близкого",text:"Я потерял важного для себя человека, и это до сих пор определяет многие мои решения.",lois:{relationship:"Утрата",name:"Погибший близкий",positive:"Любовь",negative:"Сожаление"}},
    {id:"betrayal",name:"Предательство",text:"Человек, которому я доверял, предал меня в момент, когда это было особенно важно.",lois:{relationship:"Бывший союзник",name:"Тот, кто предал меня",positive:"Ностальгия",negative:"Недоверие"}},
    {id:"ugn-duty",name:"Служба UGN",text:"Я уже участвовал в операциях UGN и привык работать в команде Овердов.",lois:{relationship:"Товарищ",name:"Сослуживец UGN",positive:"Доверие",negative:"Соперничество"}},
    {id:"underworld",name:"Преступный мир",text:"Я знаком с подпольем, нелегальными сделками и людьми, которые решают вопросы вне закона.",lois:{relationship:"Контакт",name:"Связной из преступного мира",positive:"Полезность",negative:"Подозрение"}},
    {id:"research",name:"Исследование Ренегата",text:"Я изучал Ренегат как исследователь, врач или технический специалист.",lois:{relationship:"Коллега",name:"Коллега-исследователь",positive:"Уважение",negative:"Разногласие"}},
    {id:"combat-training",name:"Боевая подготовка",text:"Меня специально учили выживать и сражаться ещё до нынешних событий.",lois:{relationship:"Наставник",name:"Инструктор или командир",positive:"Уважение",negative:"Страх разочаровать"}},
    {id:"public-life",name:"Публичная жизнь",text:"Я привык быть на виду: спорт, сцена, медиа или другая деятельность сделали моё имя известным.",lois:{relationship:"Соперник",name:"Профессиональный соперник",positive:"Признание",negative:"Ревность"}}
  ],
  encounter:[
    {id:"ugn-rescue",name:"Спасение агентом UGN",text:"В опасный момент меня спас агент UGN, после чего прежняя жизнь закончилась.",lois:{relationship:"Спаситель",name:"Агент UGN",positive:"Благодарность",negative:"Долг"}},
    {id:"jarm",name:"Столкновение с Джармом",text:"Я пережил встречу с Джармом и увидел, чем может закончиться потеря человечности.",lois:{relationship:"Свидетель",name:"Человек, переживший это вместе со мной",positive:"Солидарность",negative:"Страх"}},
    {id:"rival",name:"Встреча с соперником",text:"Я встретил человека, который постоянно заставляет меня становиться сильнее и доказывать свою ценность.",lois:{relationship:"Соперник",name:"Мой соперник",positive:"Признание",negative:"Раздражение"}},
    {id:"ally",name:"Неожиданный союзник",text:"Тот, кого я считал чужим или врагом, однажды оказался рядом в самый нужный момент.",lois:{relationship:"Союзник",name:"Неожиданный союзник",positive:"Доверие",negative:"Сомнение"}},
    {id:"protect",name:"Тот, кого нужно защитить",text:"Есть человек, ради безопасности которого я готов снова ввязаться в опасность.",lois:{relationship:"Подопечный",name:"Человек, которого я защищаю",positive:"Забота",negative:"Тревога"}},
    {id:"informant",name:"Опасный информатор",text:"Я получил важную информацию от человека, которому нельзя доверять полностью.",lois:{relationship:"Информатор",name:"Опасный источник",positive:"Интерес",negative:"Недоверие"}},
    {id:"nemesis",name:"Неостановленный враг",text:"У меня уже был шанс остановить этого человека, но он ушёл и теперь остаётся личной угрозой.",lois:{relationship:"Враг",name:"Личный противник",positive:"Одержимость",negative:"Ненависть"}},
    {id:"past-secret",name:"Тайна прошлого",text:"Недавняя встреча связала нынешние события с тайной из моего прошлого.",lois:{relationship:"Ключ к прошлому",name:"Человек, знающий правду",positive:"Интерес",negative:"Опасение"}}
  ]
});

const PURE_POWER_IDS = new Set([
  "core-015","core-030","core-045","core-060","core-075","core-090","core-105","core-120","core-135","core-150","core-165","core-180",
  "core-214","core-237","core-260","core-283","core-313","core-336","core-359","core-382","core-405","core-428","core-451","core-474"
]);
const POWER_PREREQUISITES = Object.freeze({
  "core-264":["core-261"],
  "core-265":["core-261"],
  "core-268":["core-261"],
  "core-269":["core-261"],
  "core-271":["core-261"],
  "core-272":["core-261"],
  "core-274":["core-261"],
  "core-276":["core-261"],
  "core-279":["core-261"],
  "core-281":["core-261","core-265"],
  "core-284":["core-261"],"core-285":["core-261"],"core-286":["core-261"],"core-287":["core-261"],
  "core-288":["core-261"],"core-289":["core-261"],"core-290":["core-261"]
});
const RB_ORIGIN_IDS = ["core-491","core-492","core-493","core-494","core-495","core-496","core-497"];

function baseStats(breed,s1,s2) {
  const a=SYNDROMES[s1]||[0,0,0,0], b=SYNDROMES[s2]||[0,0,0,0];
  const r=breed==="Чистокровный" ? a.map(v=>v*2) : a.map((v,i)=>v+(b[i]||0));
  return Object.fromEntries(STAT_KEYS.map((k,i)=>[k,r[i]||0]));
}
function applyWorkBase(stats, skills, w) {
  stats[w.stat]=(stats[w.stat]||0)+1;
  for (const [k,v] of Object.entries(w.skills||{})) skills[k]=(skills[k]||0)+v;
}
function initialSkillNames(w) {
  const out={ride1:"Выберите",ride2:"",art1:"Выберите",art2:"",knowledge1:"Выберите",knowledge2:"",info1:"Выберите",info2:""};
  Object.assign(out,w?.names||{});
  return out;
}
function skillCost(key, from, to) {
  let cost=0; const special=SPECIAL_KEYS.has(key);
  for(let level=from;level<to;level++) {
    const next=level+1;
    if(next<=10) cost+=special?1:2;
    else if(next<=20) cost+=3;
    else if(next<=30) cost+=5;
    else cost+=10;
  }
  return cost;
}
function statCost(from,to){let c=0;for(let level=from;level<to;level++){const next=level+1;c+=next<=10?10:next<=20?20:30;}return c;}
function isRenegadeWork(w){return String(w?.name||"").startsWith("Ренегат-бытие");}
function chosenSyndromes(cfg){return [cfg.s1,cfg.s2,cfg.breed==="Трибрид"?cfg.s3:null].filter(Boolean);}
function allowedPowers(cfg) {
  const set=new Set(chosenSyndromes(cfg));
  const rb=isRenegadeWork(WORKS[cfg.work]);
  return POWER_CATALOG.filter(p => {
    const syndromeAllowed=set.has(p.syndrome) || p.syndrome==="Общие" || (p.syndrome==="Слуги (Брэм Стокер)"&&set.has("Брэм Стокер")) || (rb&&p.syndrome==="Ренегат-бытие");
    if(!syndromeAllowed) return false;
    if(cfg.breed!=="Чистокровный" && isPurePower(p)) return false;
    if(cfg.breed==="Трибрид") {
      const r=String(p.restrict||"");
      if(r==="100%") return false;
      if(p.syndrome===cfg.s3 && r==="80%") return false;
    }
    return true;
  });
}
function maxPowerLevel(p,cfg) {
  const base=Math.max(1,n(p.maxLevel,1));
  if(p.syndrome==="Ренегат-бытие" || p.syndrome==="Общие" || p.syndrome.startsWith("Слуги")) return base;
  if(cfg.breed==="Чистокровный" && p.syndrome===cfg.s1) return base+2;
  if(cfg.breed==="Трибрид" && chosenSyndromes(cfg).includes(p.syndrome)) return base===1?1:Math.max(1,base-1);
  return base;
}
function constructionSkillPointCost(additions){
  let normal=0,specialLevels=0;
  for(const [k,v] of Object.entries(additions)){if(SPECIAL_KEYS.has(k))specialLevels+=n(v);else normal+=n(v);}
  return normal+Math.ceil(specialLevels/2);
}
function setDialogButton(dialog,action,disabled){const b=dialog.element?.querySelector(`button[data-action="${action}"]`);if(b)b.disabled=Boolean(disabled);}

const STAT_LABEL_RU = {body:"Тело",sense:"Чувства",mind:"Разум",social:"Социум"};
function workSkillLabel(key,w){
  if (SPECIAL_PREFIX[key]) {
    const chosen=String(w?.names?.[key]||"Выберите").trim();
    return chosen && chosen!=="Выберите" ? `${SPECIAL_PREFIX[key]}: ${chosen}` : `${SPECIAL_PREFIX[key]}: специализация`;
  }
  return SKILL_LABELS[key]||key;
}
function workPreviewHtml(w){
  if(!w) return "";
  const skills=Object.entries(w.skills||{}).map(([k,v])=>`${esc(workSkillLabel(k,w))} <b>+${n(v)}</b>`).join(" · ")||"нет фиксированных навыков";
  return `<div class="creator-work-head"><b>${esc(w.name)}</b><span>${esc(STAT_LABEL_RU[w.stat]||w.stat)} <b>+1</b></span></div><p><strong>Даёт при выборе:</strong> ${skills}</p>`;
}
function isPurePower(p){ return PURE_POWER_IDS.has(p?.id) || /чист/i.test(String(p?.restrict||"")); }
function powerPrerequisites(p){
  const explicit=POWER_PREREQUISITES[p?.id]||[];
  if(p?.syndrome==="Слуги (Брэм Стокер)" && !explicit.includes("core-261")) return ["core-261",...explicit];
  return [...explicit];
}
function powerName(id){ return POWER_CATALOG.find(p=>p.id===id)?.ruName || id; }
function playerPowerDescription(p){
  const notes=String(p?.notes||"").trim();
  const desc=String(p?.descriptionRu||p?.notes||"").trim();
  // Old generated cards used book-like category labels which were technically
  // correct but hard to understand while making a character. Translate those
  // labels into an immediate "what will this do for me?" explanation.
  const categoryText = text => {
    const t=String(text||"").toLocaleLowerCase("ru");
    if(t.includes("получение информации")) return "Помогает искать и анализировать информацию: замечать скрытое, распознавать важные детали или получать необычные сведения.";
    if(t.includes("контроль противника")) return "Мешает противнику действовать нормально: ослабляет его, ограничивает действия или накладывает неблагоприятный эффект.";
    if(t.includes("наступательное применение") || t.includes("нанесение урона")) return "Используется в атаке: наносит урон или делает ваш удар заметно сильнее.";
    if(t.includes("защита:")) return "Защищает вас или союзника: помогает избежать попадания, снизить урон или пережить опасную атаку.";
    if(t.includes("мобильность:")) return "Помогает быстро менять позицию, преодолевать препятствия или перемещаться необычным способом.";
    if(t.includes("поддержка:")) return "Усиливает вас или союзника: улучшает проверку, атаку, инициативу или общий темп действий.";
    if(t.includes("формирование или изменение")) return "Создаёт или изменяет оружие, тело либо предмет, чтобы получить нужный боевой или сюжетный инструмент.";
    if(t.includes("восстановление:")) return "Помогает восстанавливаться: возвращает ОЗ или уменьшает последствия ранений и отрицательных состояний.";
    return "";
  };
  const fromNotes=categoryText(notes);
  if(fromNotes) return fromNotes;
  // Configured/specially curated cards normally contain an actual mechanic and
  // are already written in plain Russian; prefer that over the older long prose.
  if(notes && !/универсальная или ситуационная техника/i.test(notes)) return notes;
  const fromDesc=categoryText(desc);
  if(fromDesc) return fromDesc;
  if(desc && !/способность направления|универсальная или ситуационная техника/i.test(desc)) return desc;
  if(desc) return desc;
  if(notes) return notes;
  return `«${p?.ruName || "Способность"}» — особая техника синдрома «${p?.syndrome || "Общие"}».`;
}
function creatorPowerGroups(list,cfg){
  const remaining=[...list];
  const groups=[];
  const take=(title,pred,kind,note="")=>{const picked=[];for(let i=remaining.length-1;i>=0;i--){if(pred(remaining[i]))picked.push(...remaining.splice(i,1));}picked.reverse();if(picked.length)groups.push({title,kind,note,powers:picked});};
  if(cfg.breed==="Чистокровный") take(`Чистокровные — ${cfg.s1}`,p=>isPurePower(p),"pure","Эти способности доступны только чистокровному персонажу этого синдрома.");
  take("Общие способности",p=>p.syndrome==="Общие","common","Доступны независимо от выбранного синдрома.");
  if(isRenegadeWork(WORKS[cfg.work])) take("Ренегат-бытие",p=>p.syndrome==="Ренегат-бытие","renegade","Способности происхождения Ренегата-бытия.");
  for(const syn of chosenSyndromes(cfg)){
    take(syn,p=>p.syndrome===syn,"syndrome",`Обычные способности синдрома «${syn}».`);
    if(syn==="Брэм Стокер") take("Брэм Стокер — способности слуг",p=>p.syndrome==="Слуги (Брэм Стокер)","servant","Эти способности предназначены для созданных слуг и требуют «Алого слугу».");
  }
  if(remaining.length)groups.push({title:"Прочие доступные",kind:"other",note:"",powers:remaining});
  return groups;
}

function presetById(kind,id){ return (BACKGROUND_PRESETS[kind]||[]).find(x=>x.id===id)||null; }
function presetByText(kind,text){ const value=String(text||"").trim(); return (BACKGROUND_PRESETS[kind]||[]).find(x=>x.text===value)||null; }
function backgroundOptions(kind,selected){
  return (BACKGROUND_PRESETS[kind]||[]).map(x=>`<option value="${esc(x.id)}" ${x.id===selected?"selected":""}>${esc(x.name)}</option>`).join("")+`<option value="custom" ${selected==="custom"?"selected":""}>— свой вариант —</option>`;
}

const isBackResult = value => Boolean(value?._dx3Back);
const backResult = draft => ({_dx3Back:true,draft});

async function baseDialog(actor, initial=null) {
  const synList=Object.keys(SYNDROMES);
  const initialWork=Number.isInteger(initial?.work) ? initial.work : Math.max(0,WORKS.findIndex(w=>w.name==="Старшеклассник"));
  const initialMethod=initial?.method||"construction", initialBreed=initial?.breed||"Кроссбрид";
  const initialS1=initial?.s1||synList[0], initialS2=initial?.s2||synList[1], initialS3=initial?.s3||"";
  const synOpts=(selected, fallbackIndex=0, allowEmpty=false)=>`${allowEmpty?'<option value="">— не выбран —</option>':''}${synList.map((x,i)=>`<option value="${esc(x)}" ${(selected||synList[fallbackIndex])===x?"selected":""}>${esc(x)}</option>`).join("")}`;
  const synField=(slot,label,selected,index,{allowEmpty=false}={})=>`<label class="creator-syndrome-field" data-syn-field="${slot}"><span class="creator-field-title">${label}</span><select data-cc="${slot}">${synOpts(selected,index,allowEmpty)}</select><div class="creator-syndrome-preview" data-syn-preview="${slot}"></div></label>`;
  const normalWorks=WORKS.map((w,i)=>({w,i})).filter(x=>!isRenegadeWork(x.w));
  const rbWorks=WORKS.map((w,i)=>({w,i})).filter(x=>isRenegadeWork(x.w));
  const workOpt=({w,i})=>`<option value="${i}" ${i===initialWork?"selected":""}>${esc(w.name)}</option>`;
  const workOpts=`<optgroup label="Обычные персонажи">${normalWorks.map(workOpt).join("")}</optgroup><optgroup label="Ренегат-бытие">${rbWorks.map(workOpt).join("")}</optgroup>`;
  const initialOrigin=initial?.rbOrigin||RB_ORIGIN_IDS[0]||"";
  const originOpts=RB_ORIGIN_IDS.map(id=>POWER_CATALOG.find(p=>p.id===id)).filter(Boolean).map(p=>`<option value="${p.id}" ${p.id===initialOrigin?"selected":""}>${esc(p.ruName)}</option>`).join("");
  const content=`<div class="dx3-creator">
    <div class="creator-intro"><h3>Мастер создания персонажа</h3><p>Сначала выберите тип крови и синдромы. Под каждым синдромом сразу показано, что он умеет и какие характеристики даёт — не нужно угадывать по одному названию.</p></div>
    <div class="creator-grid creator-base-grid">
      <label>Метод создания<select data-cc="method"><option value="construction" ${initialMethod==="construction"?"selected":""}>Конструкция — проще и безопаснее</option><option value="full" ${initialMethod==="full"?"selected":""}>Полный скретч — 130 опыта</option></select></label>
      <label>Тип крови<select data-cc="breed"><option ${initialBreed==="Чистокровный"?"selected":""}>Чистокровный</option><option ${initialBreed==="Кроссбрид"?"selected":""}>Кроссбрид</option><option ${initialBreed==="Трибрид"?"selected":""}>Трибрид</option></select><small class="creator-inline-help" data-breed-help></small></label>
      ${synField("s1","Основной синдром 1",initialS1,0)}
      ${synField("s2","Основной синдром 2",initialS2,1)}
      ${synField("s3","Подсиндром — только для трибрида",initialS3,2,{allowEmpty:true})}
      <label class="creator-work-field">Профессия<select data-cc="work">${workOpts}</select><div class="creator-work-preview" data-work-preview></div></label>
      <label class="wide">Прикрытие<input data-cc="cover" value="${esc(initial?.cover ?? actor.system.details.cover ?? "")}" placeholder="Кем персонаж кажется окружающим"></label>
      <label class="wide creator-rb-origin" hidden>Происхождение Ренегата<select data-cc="rbOrigin">${originOpts}</select><small>Для Ренегата-бытия это обязательная способность 1 уровня.</small></label>
    </div>
    <div class="creator-help" data-cc-help></div><div class="creator-warning" data-cc-warning></div>
  </div>`;
  return foundry.applications.api.DialogV2.wait({
    window:{title:"Создание персонажа — шаг 1",icon:"fa-solid fa-user-plus",resizable:true},position:responsiveDialogPosition(900,820),content,
    buttons:[{action:"next",label:"Дальше",icon:"fa-solid fa-arrow-right",default:true,callback:async(ev,b,d)=>{const q=s=>d.element.querySelector(`[data-cc="${s}"]`)?.value??"";return {method:q("method"),breed:q("breed"),s1:q("s1"),s2:q("s2"),s3:q("s3"),work:Number(q("work")),cover:q("cover"),rbOrigin:q("rbOrigin")};}},{action:"cancel",label:"Отмена",callback:async()=>null}],rejectClose:false,
    render:(ev,d)=>{
      const root=d.element;
      const el=k=>root.querySelector(`[data-cc="${k}"]`);
      const s1el=el("s1"),s2el=el("s2"),s3el=el("s3"),breedEl=el("breed");
      const statsText=(name,mult=1)=>{const a=SYNDROMES[name]||[0,0,0,0];return `Тело +${a[0]*mult} · Чувства +${a[1]*mult} · Разум +${a[2]*mult} · Социум +${a[3]*mult}`;};
      const drawPreview=(slot,name,{disabled=false,pure=false}={})=>{
        const box=root.querySelector(`[data-syn-preview="${slot}"]`); if(!box)return;
        if(!name){box.innerHTML='<span class="creator-syndrome-empty">Синдром не выбран.</span>';return;}
        const info=SYNDROME_INFO[name]||{role:"",text:""};
        if(disabled){box.innerHTML=`<b>Не используется у чистокровного.</b><span>Модификаторы первого синдрома удваиваются автоматически.</span>`;return;}
        box.innerHTML=`<div class="creator-syndrome-head"><b>${esc(name)}</b><span>${esc(statsText(name,pure?2:1))}</span></div><strong>${esc(info.role)}</strong><p>${esc(info.text)}</p>${pure?'<em>Чистокровный: базовые модификаторы этого синдрома уже показаны в удвоенном виде.</em>':''}`;
      };
      const pickDifferent=(select,avoid)=>{const opt=[...select.options].find(o=>o.value && o.value!==avoid);if(opt)select.value=opt.value;};
      const update=()=>{
        const method=el("method").value,breed=breedEl.value;
        if(breed==="Чистокровный"){
          s2el.value=s1el.value;
          s2el.disabled=true;
        } else {
          const wasDisabled=s2el.disabled;
          s2el.disabled=false;
          if(wasDisabled && s2el.value===s1el.value) pickDifferent(s2el,s1el.value);
        }
        const tri=breed==="Трибрид";
        s3el.disabled=!tri;
        if(!tri) s3el.value="";
        root.querySelector('[data-syn-field="s2"]')?.classList.toggle("creator-disabled",breed==="Чистокровный");
        root.querySelector('[data-syn-field="s3"]')?.classList.toggle("creator-disabled",!tri);
        root.querySelector('[data-breed-help]').textContent=breed==="Чистокровный"?"Один синдром; второй выбор заблокирован, характеристики первого удваиваются.":breed==="Кроссбрид"?"Два разных синдрома.":"Два основных синдрома и третий отличный подсиндром.";
        drawPreview("s1",s1el.value,{pure:breed==="Чистокровный"});
        drawPreview("s2",s2el.value,{disabled:breed==="Чистокровный"});
        drawPreview("s3",s3el.value,{disabled:!tri});
        const workIdx=Number(el("work").value),work=WORKS[workIdx],rb=isRenegadeWork(work);
        const workPreview=root.querySelector('[data-work-preview]');
        if(workPreview) workPreview.innerHTML=workPreviewHtml(work);
        root.querySelector('.creator-rb-origin').hidden=!rb;
        let error="";
        if(breed!=="Чистокровный"&&s1el.value===s2el.value)error="У кроссбрида и трибрида два основных синдрома должны быть разными.";
        if(breed==="Трибрид"&&(!s3el.value||[s1el.value,s2el.value].includes(s3el.value)))error="Для трибрида выберите третий, отличный подсиндром.";
        root.querySelector('[data-cc-warning]').textContent=error;
        setDialogButton(d,"next",Boolean(error));
        root.querySelector('[data-cc-help]').innerHTML=method==="construction"?'<b>Конструкция:</b> 3 свободных пункта характеристик, 5 пунктов навыков, Воскрешение 1, Оберег 1, Концентрация 2, затем 4 разные способности и 2 дополнительных уровня.':'<b>Полный скретч:</b> без свободных пунктов; Воскрешение 1 и Оберег 1 выдаются бесплатно, затем 130 опыта на характеристики, навыки и способности.';
      };
      root.addEventListener("change",update);
      update();
    }
  });
}

function collectAllocation(d, cfg, stats, skills, skillNames) {
  const construction=cfg.method==="construction",root=d.element,sa={},sk={},names={...skillNames};
  for(const el of root.querySelectorAll("[data-stat-add]"))sa[el.dataset.statAdd]=Math.max(0,n(el.value));
  for(const el of root.querySelectorAll("[data-skill-add]"))sk[el.dataset.skillAdd]=Math.max(0,n(el.value));
  for(const el of root.querySelectorAll("[data-skill-name]"))names[el.dataset.skillName]=String(el.value||"").trim();
  let xp=0;
  if(!construction){for(const [k,v] of Object.entries(sa))xp+=statCost(stats[k],stats[k]+v);for(const [k,v] of Object.entries(sk))xp+=skillCost(k,skills[k]||0,(skills[k]||0)+v);}
  return {statAdd:sa,skillAdd:sk,skillNames:names,xpSpent:xp};
}

async function allocationDialog(cfg, stats, skills, skillNames, initial=null) {
  const construction=cfg.method==="construction";
  const statLabels={body:"Тело",sense:"Чувства",mind:"Разум",social:"Социум"};
  const statInputs=STAT_KEYS.map(k=>{const value=Math.max(0,n(initial?.statAdd?.[k]));return `<label>${statLabels[k]}<span>база ${stats[k]}</span><input type="number" min="0" max="${construction?3:20}" value="${value}" data-stat-add="${k}"></label>`;}).join("");
  const skillInputs=SKILL_KEYS.map(k=>{const base=n(skills[k]);const maxAdd=Math.max(0,4-base);const special=SPECIAL_KEYS.has(k);const value=Math.min(maxAdd,Math.max(0,n(initial?.skillAdd?.[k])));const savedName=initial?.skillNames?.[k] ?? skillNames[k] ?? "";const nameInput=special?`<input type="text" data-skill-name="${k}" value="${esc(savedName)}" placeholder="Специализация">`:"";return `<label class="${special?"creator-special-skill":""}"><span>${SKILL_LABELS[k]} · база ${base}${special?" · спец.":""}</span>${nameInput}<input type="number" min="0" max="${maxAdd}" value="${value}" data-skill-add="${k}" ${maxAdd===0?"disabled":""}></label>`;}).join("");
  const content=`<div class="dx3-creator"><div class="creator-progress"><b>Шаг 2. Характеристики и навыки</b><span data-budget></span></div><p class="hint">${construction?"Распределите до 3 пунктов характеристик и до 5 свободных пунктов навыков. Для Вождения/Искусства/Знаний/Информации один свободный пункт даёт два уровня и может быть разделён между двумя строками.":"Укажите повышения сверх базы. Мастер считает стоимость по таблице развития; общий бюджет Полного скретча — 130 опыта."} Все характеристики в конце должны быть не ниже 1.</p><h4>Характеристики</h4><div class="creator-four">${statInputs}</div><h4>Навыки</h4><div class="creator-skills">${skillInputs}</div><div class="creator-warning" data-warning></div></div>`;
  return foundry.applications.api.DialogV2.wait({
    window:{title:"Создание персонажа — характеристики и навыки",resizable:true},position:responsiveDialogPosition(940,780),content,
    buttons:[
      {action:"back",label:"Назад",icon:"fa-solid fa-arrow-left",callback:async(ev,b,d)=>backResult(collectAllocation(d,cfg,stats,skills,skillNames))},
      {action:"next",label:"Дальше к способностям",icon:"fa-solid fa-arrow-right",default:true,callback:async(ev,b,d)=>collectAllocation(d,cfg,stats,skills,skillNames)},
      {action:"cancel",label:"Отмена",callback:async()=>null}
    ],rejectClose:false,
    render:(ev,d)=>{const root=d.element;const upd=()=>{const sa=[...root.querySelectorAll("[data-stat-add]")],sk=[...root.querySelectorAll("[data-skill-add]")];const finalStats=Object.fromEntries(STAT_KEYS.map(k=>[k,stats[k]+n(root.querySelector(`[data-stat-add="${k}"]`)?.value)]));let invalid=Object.values(finalStats).some(v=>v<1),msg=invalid?"Каждая характеристика должна быть не ниже 1. ":"";if(construction){const sp=sa.reduce((z,e)=>z+n(e.value),0),adds=Object.fromEntries(sk.map(e=>[e.dataset.skillAdd,n(e.value)])),kp=constructionSkillPointCost(adds);if(sp>3||kp>5){invalid=true;msg+="Превышен бюджет свободных пунктов.";}root.querySelector("[data-budget]").textContent=`Характеристики ${sp}/3 · навыки ${kp}/5`;}else{let xp=0;for(const e of sa){const k=e.dataset.statAdd;xp+=statCost(stats[k],stats[k]+n(e.value));}for(const e of sk){const k=e.dataset.skillAdd;xp+=skillCost(k,skills[k]||0,(skills[k]||0)+n(e.value));}if(xp>130){invalid=true;msg+=`Превышен бюджет опыта (${xp}/130).`;}root.querySelector("[data-budget]").textContent=`Опыт: ${xp}/130 · осталось ${Math.max(0,130-xp)}`;}root.querySelector("[data-warning]").textContent=msg;setDialogButton(d,"next",invalid);};root.addEventListener("input",upd);upd();}
  });
}

async function powerDialog(cfg, xpAlready=0, initial=null) {
  const construction=cfg.method==="construction";
  const excluded=new Set(["core-181","core-182","core-183",...RB_ORIGIN_IDS,"core-490"]);
  const list=allowedPowers(cfg).filter(p=>!excluded.has(p.id)&&!p.id.startsWith("conc-"));
  const groups=creatorPowerGroups(list,cfg);
  let draft=initial;
  while(true){
    const initialLevels=new Map((draft?.entries||[]).map(x=>[x.p?.id||x.id,Math.max(1,n(x.level,1))]));
    const powerRow=p=>{
      const cap=maxPowerLevel(p,cfg),desc=powerEffectText(p),saved=Math.min(cap,initialLevels.get(p.id)||1),checked=initialLevels.has(p.id);
      const prereq=powerPrerequisites(p), prereqText=prereq.length?`<span class="creator-prereq"><i class="fa-solid fa-link"></i> Требует: ${prereq.map(id=>esc(powerName(id))).join(" + ")}</span>`:"";
      const pure=isPurePower(p)?'<span class="creator-tag pure">Только чистокровный</span>':'';
      const configured=p.configured?'<span class="creator-tag ready">Авто</span>':'<span class="creator-tag manual">Вручную</span>';
      return `<label class="creator-power" data-restrict="${esc(p.restrict||"-")}" data-prereq="${esc(prereq.join(","))}" data-search="${esc(`${p.ruName} ${p.syndrome} ${p.source} ${desc} ${prereq.map(powerName).join(" ")}`.toLocaleLowerCase('ru'))}">
        <input type="checkbox" data-power-id="${p.id}" ${checked?"checked":""}>
        <span class="creator-power-main">
          <span class="creator-power-title"><b>${esc(p.ruName)}</b><span class="creator-tags">${pure}${configured}</span></span>
          <small class="creator-power-source">${esc(p.syndrome)} · ${esc(p.source)}</small>
          ${powerRulesGridHtml(p,{maxLevel:cap})}
          <span class="creator-power-desc">${esc(desc)}</span>
          ${prereqText}
          <button type="button" class="creator-power-details" data-power-details="${p.id}"><i class="fa-solid fa-book-open"></i> Подробнее</button>
        </span>
        <input type="number" class="power-level" min="1" max="${cap}" value="${saved}" data-power-level="${p.id}" ${construction?'disabled':''}>
      </label>`;
    };
    const groupedRows=groups.map(g=>`<section class="creator-power-group kind-${esc(g.kind)}" data-power-group><header><span>${esc(g.title)}${g.note?`<small>${esc(g.note)}</small>`:""}</span><b>${g.powers.length}</b></header><div>${g.powers.map(powerRow).join("")}</div></section>`).join("");
    const content=`<div class="dx3-creator power-step"><div class="creator-progress"><b>Шаг 3. Способности</b><span data-power-budget></span></div><div class="creator-filter"><input type="search" data-search placeholder="Поиск способности, эффекта или зависимости…"><span>Чистокровные, общие и синдромные способности разделены по отдельным блокам. Зависимости подставляются автоматически.</span></div>${construction?'<p class="hint">Выберите ровно 4 разные способности. Если выбранная способность требует другую (например, улучшение слуги требует «Алого слугу»), мастер автоматически добавит обязательную способность. Затем распределите 2 дополнительных уровня.</p>':`<p class="hint">Новая способность стоит 15 опыта, каждый уровень сверх первого — 5. Уже потрачено ${xpAlready} опыта. Обязательные зависимости добавляются автоматически и тоже входят в стоимость.</p>`}<div class="creator-warning" data-warning></div><div class="creator-power-list grouped">${groupedRows}</div></div>`;
    const collect=(d)=>{const chosen=[...d.element.querySelectorAll("[data-power-id]:checked")].map(e=>e.dataset.powerId);const entries=chosen.map(id=>{const p=list.find(x=>x.id===id);const cap=maxPowerLevel(p,cfg);const level=construction?Math.min(cap,Math.max(1,initialLevels.get(id)||1)):Math.min(cap,Math.max(1,n(d.element.querySelector(`[data-power-level="${id}"]`)?.value,1)));return {p,level,cap};}).filter(x=>x.p);const xp=construction?0:entries.reduce((z,x)=>z+15+Math.max(0,x.level-1)*5,0);return {entries,xp};};
    const selected=await foundry.applications.api.DialogV2.wait({
      window:{title:"Создание персонажа — способности",resizable:true},position:responsiveDialogPosition(1040,820),content,
      buttons:[
        {action:"back",label:"Назад",icon:"fa-solid fa-arrow-left",callback:async(ev,b,d)=>backResult(collect(d))},
        {action:"next",label:construction?"Выбрать уровни":"Дальше к снаряжению",icon:"fa-solid fa-arrow-right",default:true,callback:async(ev,b,d)=>collect(d)},
        {action:"cancel",label:"Отмена",callback:async()=>null}
      ],rejectClose:false,
      render:(ev,d)=>{
        const root=d.element,search=root.querySelector("[data-search]");
        let depMessage="";
        const cbFor=id=>root.querySelector(`[data-power-id="${id}"]`);
        const enforceDependencies=(changed=null)=>{
          depMessage="";
          if(changed?.checked){
            const row=changed.closest(".creator-power");
            const prereq=String(row?.dataset.prereq||"").split(",").filter(Boolean);
            const added=[];
            for(const id of prereq){const cb=cbFor(id);if(cb&&!cb.checked){cb.checked=true;added.push(powerName(id));}}
            if(added.length) depMessage=`Автоматически добавлено: ${added.join(", ")} — это обязательная зависимость.`;
          }
          if(changed && !changed.checked){
            const removed=[];
            for(const row of root.querySelectorAll('.creator-power[data-prereq]')){
              const req=String(row.dataset.prereq||"").split(",").filter(Boolean);
              const cb=row.querySelector('[data-power-id]');
              if(cb?.checked && req.includes(changed.dataset.powerId)){cb.checked=false;removed.push(row.querySelector('b')?.textContent||cb.dataset.powerId);}
            }
            if(removed.length) depMessage=`Сняты зависимые способности: ${removed.join(", ")}.`;
          }
        };
        const upd=()=>{
          const q=String(search.value||"").trim().toLocaleLowerCase("ru");
          for(const row of root.querySelectorAll(".creator-power")) row.hidden=Boolean(q&&!row.dataset.search.includes(q));
          for(const group of root.querySelectorAll("[data-power-group]")) group.hidden=![...group.querySelectorAll(".creator-power")].some(row=>!row.hidden);
          const checked=[...root.querySelectorAll("[data-power-id]:checked")];let invalid=false,msg=depMessage;
          const missing=[];
          for(const cb of checked){const row=cb.closest('.creator-power');for(const id of String(row?.dataset.prereq||"").split(',').filter(Boolean)){if(!cbFor(id)?.checked)missing.push(`${cb.closest('.creator-power')?.querySelector('b')?.textContent||cb.dataset.powerId} → ${powerName(id)}`);}}
          if(missing.length){invalid=true;msg=`Не хватает обязательных зависимостей: ${missing.join('; ')}.`;}
          if(construction){invalid=invalid||checked.length!==4;root.querySelector("[data-power-budget]").textContent=`Выбрано ${checked.length}/4`;const high=checked.map(cb=>cb.closest(".creator-power")?.dataset.restrict).filter(r=>["80%","100%","120%"].includes(r));if(!msg&&high.length>1)msg="Подсказка: в правилах не рекомендуется брать больше одной способности с порогом 80/100/120% при Конструкции.";}else{let xp=0;for(const cb of checked){const id=cb.dataset.powerId,lv=Math.max(1,n(root.querySelector(`[data-power-level="${id}"]`)?.value,1));xp+=15+(lv-1)*5;}invalid=invalid||xpAlready+xp>130;root.querySelector("[data-power-budget]").textContent=`Опыт: ${xpAlready+xp}/130 · осталось ${Math.max(0,130-xpAlready-xp)}`;if(!msg&&xpAlready+xp>130)msg="Превышен общий бюджет 130 опыта.";}
          root.querySelector("[data-warning]").textContent=msg;setDialogButton(d,"next",invalid);
        };
        root.addEventListener("click", async e=>{
          const btn=e.target.closest("[data-power-details]");
          if(!btn)return;
          e.preventDefault();
          e.stopPropagation();
          const pwr=list.find(x=>x.id===btn.dataset.powerDetails);
          if(!pwr)return;
          const prereqNames=powerPrerequisites(pwr).map(powerName);
          await showPowerDetails(pwr,{maxLevel:maxPowerLevel(pwr,cfg),prerequisiteNames:prereqNames});
        });
        root.addEventListener("input",upd);
        root.addEventListener("change",e=>{if(e.target.matches("[data-power-id]")){enforceDependencies(e.target);const lv=root.querySelector(`[data-power-level="${e.target.dataset.powerId}"]`);if(lv&&!construction)lv.disabled=!e.target.checked;}upd();});
        for(const lv of root.querySelectorAll("[data-power-level]"))if(!construction)lv.disabled=!cbFor(lv.dataset.powerLevel)?.checked;
        upd();
      }
    });
    if(!selected||isBackResult(selected)||!construction)return selected;

    const savedLevels=new Map(selected.entries.map(x=>[x.p.id,Math.max(0,x.level-1)]));
    const levelContent=`<div class="dx3-creator"><div class="creator-progress"><b>Дополнительные уровни</b><span data-level-total></span></div><p class="hint">Распределите до 2 уровней между выбранными способностями. Лимиты Чистокровного/Кроссбрида/Трибрида уже учтены.</p>${selected.entries.map(x=>`<label class="creator-level-row"><span>${esc(x.p.ruName)} <small>текущий 1 · максимум ${x.cap}</small></span><input type="number" data-level-bonus="${x.p.id}" min="0" max="${Math.max(0,x.cap-1)}" value="${Math.min(Math.max(0,x.cap-1),savedLevels.get(x.p.id)||0)}"></label>`).join("")}<div class="creator-warning" data-warning></div></div>`;
    const leveled=await foundry.applications.api.DialogV2.wait({window:{title:"Дополнительные уровни способностей",resizable:true},position:responsiveDialogPosition(760,620),content:levelContent,buttons:[
      {action:"back",label:"Назад к выбору",icon:"fa-solid fa-arrow-left",callback:async(ev,b,d)=>({backToSelection:true,draft:{entries:selected.entries.map(x=>({...x,level:1+n(d.element.querySelector(`[data-level-bonus="${x.p.id}"]`)?.value)})),xp:0}})},
      {action:"ok",label:"Дальше к снаряжению",icon:"fa-solid fa-arrow-right",default:true,callback:async(ev,b,d)=>({entries:selected.entries.map(x=>({...x,level:1+n(d.element.querySelector(`[data-level-bonus="${x.p.id}"]`)?.value)})),xp:0})},
      {action:"cancel",label:"Отмена",callback:async()=>null}
    ],rejectClose:false,render:(ev,d)=>{const upd=()=>{const t=[...d.element.querySelectorAll("[data-level-bonus]")].reduce((z,e)=>z+n(e.value),0);d.element.querySelector("[data-level-total]").textContent=`Распределено ${t}/2`;d.element.querySelector("[data-warning]").textContent=t>2?"Можно распределить не больше 2 уровней.":"";setDialogButton(d,"ok",t>2);};d.element.addEventListener("input",upd);upd();}});
    if(!leveled)return null;
    if(leveled.backToSelection){draft=leveled.draft;continue;}
    return leveled;
  }
}

async function gearDialog(stockBudget, initial=[]) {
  const selected=new Set(Array.isArray(initial)?initial:[]);
  const rows=EQUIPMENT_CATALOG.filter(x=>x.id!=="gear-w001").map(x=>`<label class="creator-gear" data-type="${x.type}" data-search="${esc(`${x.name} ${x.category}`.toLocaleLowerCase('ru'))}"><input type="checkbox" data-gear-id="${x.id}" ${selected.has(x.id)?"checked":""}><span><b>${esc(x.name)}</b><small>${esc(x.category)} · запас ${Number(x.system.stock||0)}</small></span></label>`).join("");
  const content=`<div class="dx3-creator"><div class="creator-progress"><b>Шаг 4. Снаряжение</b><span data-gear-total></span></div><p class="hint">Выберите вещи в пределах максимального Запаса. Кулаки добавляются бесплатно. Неиспользованный Запас будет записан в Сбережения.</p><div class="creator-filter"><input type="search" data-search placeholder="Поиск снаряжения…"><select data-type><option value="">Всё</option><option value="weapon">Оружие</option><option value="armor">Броня</option><option value="misc">Предметы, связи и транспорт</option></select></div><div class="creator-warning" data-warning></div><div class="creator-gear-list">${rows}</div></div>`;
  const collect=d=>[...d.element.querySelectorAll("[data-gear-id]:checked")].map(e=>e.dataset.gearId);
  return foundry.applications.api.DialogV2.wait({window:{title:"Создание персонажа — снаряжение",resizable:true},position:responsiveDialogPosition(840,740),content,buttons:[
    {action:"back",label:"Назад",icon:"fa-solid fa-arrow-left",callback:async(ev,b,d)=>backResult(collect(d))},
    {action:"finish",label:"Дальше",icon:"fa-solid fa-arrow-right",default:true,callback:async(ev,b,d)=>collect(d)},
    {action:"skip",label:"Без покупок",callback:async()=>[]},
    {action:"cancel",label:"Отмена",callback:async()=>null}
  ],rejectClose:false,render:(ev,d)=>{const root=d.element,s=root.querySelector("[data-search]"),t=root.querySelector("[data-type]");const upd=()=>{const q=String(s.value||"").trim().toLocaleLowerCase("ru");for(const row of root.querySelectorAll(".creator-gear"))row.hidden=(q&&!row.dataset.search.includes(q))||(t.value&&row.dataset.type!==t.value);const ids=collect(d),total=ids.reduce((z,id)=>z+n(EQUIPMENT_CATALOG.find(x=>x.id===id)?.system.stock),0),invalid=total>stockBudget;root.querySelector("[data-gear-total]").innerHTML=`Запас: <b>${total}/${stockBudget}</b> · в Сбережения ${Math.max(0,stockBudget-total)}`;root.querySelector("[data-warning]").textContent=invalid?`Превышен Запас на ${total-stockBudget}.`:"";setDialogButton(d,"finish",invalid);};root.addEventListener("input",upd);root.addEventListener("change",upd);upd();}});
}

function collectPersonal(d, includeLois=true) {
  const get=k=>d.element.querySelector(`[data-personal="${k}"]`)?.value??"";
  const parse=v=>{const [enc,...name]=String(v).split("|");return {enc:n(enc),name:name.join("|")};};
  const aw=parse(get("awakening")),im=parse(get("impulse")),loises=[];
  if(includeLois){
    for(let i=1;i<=3;i++){
      const v={};
      for(const key of ["relationship","name","positive","negative"]) v[key]=d.element.querySelector(`[data-lois="${i}:${key}"]`)?.value??"";
      v.positiveActive=Boolean(d.element.querySelector(`[data-lois="${i}:positiveActive"]`)?.checked);
      loises.push(v);
    }
  }
  return {
    origin:get("origin"),experience:get("experience"),encounter:get("encounter"),
    originPreset:get("originPreset"),experiencePreset:get("experiencePreset"),encounterPreset:get("encounterPreset"),
    awakening:aw.name,impulse:im.name,baseEnc:aw.enc+im.enc,loises
  };
}

async function personalDialog(actor, initial=null) {
  const details=actor.system.details||{};
  const selectedAw=initial?.awakening ?? details.awakening ?? AWAKENINGS[0][0];
  const selectedIm=initial?.impulse ?? details.impulse ?? IMPULSES[0][0];
  const opts=(arr,selected="")=>arr.map(([name,enc])=>`<option value="${enc}|${esc(name)}" ${selected===name?"selected":""}>${esc(name)} — ${enc}%</option>`).join("");
  const existing={
    origin:initial?.origin ?? details.origin ?? "",
    experience:initial?.experience ?? details.experience ?? "",
    encounter:initial?.encounter ?? details.encounter ?? ""
  };
  const presetIds={
    origin:initial?.originPreset || presetByText("origin",existing.origin)?.id || (existing.origin?"custom":BACKGROUND_PRESETS.origin[0].id),
    experience:initial?.experiencePreset || presetByText("experience",existing.experience)?.id || (existing.experience?"custom":BACKGROUND_PRESETS.experience[0].id),
    encounter:initial?.encounterPreset || presetByText("encounter",existing.encounter)?.id || (existing.encounter?"custom":BACKGROUND_PRESETS.encounter[0].id)
  };
  const presetText=kind=>existing[kind] || presetById(kind,presetIds[kind])?.text || "";
  const actorLoises=Object.values(actor.system.loises||{}).slice(0,3);
  const presetLoises=[presetById("origin",presetIds.origin)?.lois,presetById("experience",presetIds.experience)?.lois,presetById("encounter",presetIds.encounter)?.lois];
  const loisRows=[1,2,3].map(i=>{
    const fromActor=actorLoises[i-1]||{};
    const hasActor=Boolean(fromActor.name||fromActor.relationship||fromActor.positive||fromActor.negative);
    const l=initial?.loises?.[i-1] ?? (hasActor?fromActor:null) ?? presetLoises[i-1] ?? {};
    const source=["Происхождение","Опыт","Встреча"][i-1];
    return `<fieldset class="creator-lois"><legend>Лоис ${i} · ${source}</legend><input type="text" data-lois="${i}:relationship" value="${esc(l.relationship||"")}" placeholder="Отношение"><input type="text" data-lois="${i}:name" value="${esc(l.name||"")}" placeholder="Имя / кто это"><input type="text" data-lois="${i}:positive" value="${esc(l.positive||"")}" placeholder="Положительная эмоция"><input type="text" data-lois="${i}:negative" value="${esc(l.negative||"")}" placeholder="Отрицательная эмоция"><label><input type="checkbox" data-lois="${i}:positiveActive" ${l.positiveActive===false?"":"checked"}> Положительная эмоция сознательная</label></fieldset>`;
  }).join("");
  const historyField=(kind,label,value,presetId)=>`<section class="creator-history-card" data-history-kind="${kind}"><label><strong>${label}</strong><select data-personal="${kind}Preset">${backgroundOptions(kind,presetId)}</select></label><p class="creator-history-preview" data-history-preview="${kind}"></p><textarea data-personal="${kind}" rows="2" placeholder="Можно переписать под своего персонажа">${esc(value)}</textarea></section>`;
  const content=`<div class="dx3-creator personal-step">
    <div class="creator-progress"><b>Шаг 5. История, Вторжение и Лоис</b><span data-base-enc></span></div>
    <p class="hint">Выберите готовый вариант или перепишите его под персонажа. Три Лоис ниже автоматически предлагаются из Происхождения, Опыта и Встречи — это стартовые заготовки, их можно полностью изменить.</p>
    <div class="creator-history-grid">
      ${historyField("origin","Происхождение",presetText("origin"),presetIds.origin)}
      ${historyField("experience","Опыт",presetText("experience"),presetIds.experience)}
      ${historyField("encounter","Встреча",presetText("encounter"),presetIds.encounter)}
    </div>
    <div class="creator-awakening-grid">
      <section class="creator-choice-card"><label><strong>Пробуждение</strong><select data-personal="awakening">${opts(AWAKENINGS,selectedAw)}</select></label><p data-awakening-preview></p></section>
      <section class="creator-choice-card"><label><strong>Импульс</strong><select data-personal="impulse">${opts(IMPULSES,selectedIm)}</select></label><p data-impulse-preview></p></section>
    </div>
    <div class="creator-lois-title"><h4>Постоянные Лоис</h4><button type="button" data-apply-lois><i class="fa-solid fa-wand-magic-sparkles"></i> Подставить из предыстории</button></div>
    <div class="creator-lois-grid">${loisRows}</div>
  </div>`;
  return foundry.applications.api.DialogV2.wait({window:{title:"Создание персонажа — история и Лоис",resizable:true},position:responsiveDialogPosition(1020,820),content,buttons:[
    {action:"back",label:"Назад",icon:"fa-solid fa-arrow-left",callback:async(ev,b,d)=>backResult(collectPersonal(d,true))},
    {action:"finish",label:"Завершить создание",icon:"fa-solid fa-check",default:true,callback:async(ev,b,d)=>collectPersonal(d,true)},
    {action:"skip",label:"Заполнить Лоис позже",callback:async(ev,b,d)=>collectPersonal(d,false)},
    {action:"cancel",label:"Отмена",callback:async()=>null}
  ],rejectClose:false,render:(ev,d)=>{
    const root=d.element;
    const get=k=>root.querySelector(`[data-personal="${k}"]`);
    const loisEmpty=i=>["relationship","name","positive","negative"].every(k=>!String(root.querySelector(`[data-lois="${i}:${k}"]`)?.value||"").trim());
    const applyLois=(i,lois,force=false)=>{
      if(!lois||(!force&&!loisEmpty(i)))return;
      for(const k of ["relationship","name","positive","negative"]){const el=root.querySelector(`[data-lois="${i}:${k}"]`);if(el)el.value=lois[k]||"";}
      const pa=root.querySelector(`[data-lois="${i}:positiveActive"]`);if(pa)pa.checked=true;
    };
    const updateHistory=(kind,index,{fillText=false,fillLois=false,forceLois=false}={})=>{
      const id=get(`${kind}Preset`)?.value,p=presetById(kind,id),preview=root.querySelector(`[data-history-preview="${kind}"]`),text=get(kind);
      if(preview) preview.textContent=p?p.text:"Свой вариант — напишите любую подходящую предысторию.";
      if(fillText&&p&&text) text.value=p.text;
      if(fillLois&&p) applyLois(index,p.lois,forceLois);
    };
    const update=()=>{
      const aw=String(get("awakening")?.value||"").split("|");const im=String(get("impulse")?.value||"").split("|");
      root.querySelector("[data-base-enc]").textContent=`Базовое Вторжение: ${n(aw[0])+n(im[0])}%`;
      const awName=aw.slice(1).join("|"),imName=im.slice(1).join("|");
      root.querySelector("[data-awakening-preview]").textContent=AWAKENING_INFO[awName]||"";
      root.querySelector("[data-impulse-preview]").textContent=IMPULSE_INFO[imName]||"";
      updateHistory("origin",1);updateHistory("experience",2);updateHistory("encounter",3);
    };
    for(const [kind,index] of [["origin",1],["experience",2],["encounter",3]]){
      get(`${kind}Preset`)?.addEventListener("change",()=>{updateHistory(kind,index,{fillText:true,fillLois:true});update();});
    }
    root.querySelector("[data-apply-lois]")?.addEventListener("click",()=>{
      applyLois(1,presetById("origin",get("originPreset")?.value)?.lois,true);
      applyLois(2,presetById("experience",get("experiencePreset")?.value)?.lois,true);
      applyLois(3,presetById("encounter",get("encounterPreset")?.value)?.lois,true);
    });
    root.addEventListener("change",e=>{if(e.target.matches('[data-personal="awakening"],[data-personal="impulse"]'))update();});
    // For a brand-new character, populate blank Lois fields from the default presets once.
    updateHistory("origin",1,{fillLois:true});updateHistory("experience",2,{fillLois:true});updateHistory("encounter",3,{fillLois:true});
    update();
  }});
}

function skillSystemData(skills, names) {
  const d={};
  for(const k of ["melee","dodge","ranged","perception","rc","will","negotiation","procure"]) d[`system.skills.${k}`]=skills[k]||0;
  for(const k of SPECIAL_KEYS){d[`system.skills.${k}.value`]=skills[k]||0;d[`system.skills.${k}.name`]=names[k]||"";}
  return d;
}

async function replaceCreatorItems(actor, newItems) {
  const mandatoryIds=new Set(["core-181","core-182","core-490",...RB_ORIGIN_IDS]);
  const old=actor.items.filter(i=>i.getFlag(SYS,"creatorGenerated") || mandatoryIds.has(i.getFlag(SYS,"libraryId"))).map(i=>i.id);
  if(old.length) await actor.deleteEmbeddedDocuments("Item",old);
  for(const it of newItems) foundry.utils.setProperty(it,`flags.${SYS}.creatorGenerated`,true);
  return actor.createEmbeddedDocuments("Item",newItems);
}

function applySelectedEquipment(entry, state){
  const data=equipmentToItemData(entry);
  if(entry.type==="weapon" && !state.weapon){data.system.equipped=true;state.weapon=true;}
  if(entry.type==="armor" && !state.armor){data.system.equipped=true;state.armor=true;}
  return data;
}

function readActorSkill(actor,key){
  const value=actor.system?.skills?.[key];
  return SPECIAL_KEYS.has(key)?n(value?.value):n(value);
}
function hydrateCreatorPowers(raw,cfg){
  if(!raw?.entries?.length||!cfg)return raw?.entries?{entries:[],xp:n(raw.xp)}:null;
  const entries=raw.entries.map(x=>{
    const id=x.p?.id||x.id,p=POWER_CATALOG.find(v=>v.id===id);if(!p)return null;
    const cap=maxPowerLevel(p,cfg);return {p,cap,level:Math.min(cap,Math.max(1,n(x.level,1)))};
  }).filter(Boolean);
  return {entries,xp:n(raw.xp)};
}
function inferCreatorState(actor){
  const saved=actor.getFlag(SYS,"creatorState");
  if(saved?.cfg){
    const cfg={...saved.cfg};
    if(cfg.breed==="Чистокровный")cfg.s2=cfg.s1;
    if(cfg.breed!=="Трибрид")cfg.s3="";
    return {cfg,alloc:saved.alloc||null,powers:hydrateCreatorPowers(saved.powers,cfg),gearIds:[...(saved.gearIds||[])],personal:saved.personal||null};
  }
  const details=actor.system?.details||{},parts=String(details.syndromes||"").split("/").map(x=>x.trim()).filter(Boolean);
  const breed=details.breed||"Кроссбрид";
  const s1=parts[0]&&SYNDROMES[parts[0]]?parts[0]:Object.keys(SYNDROMES)[0];
  let s2=breed==="Чистокровный"?s1:(parts[1]&&SYNDROMES[parts[1]]?parts[1]:Object.keys(SYNDROMES).find(x=>x!==s1));
  const s3=breed==="Трибрид"?(details.subSyndrome||parts[2]||""):"";
  let workIndex=WORKS.findIndex(w=>w.name===details.work);if(workIndex<0)workIndex=Math.max(0,WORKS.findIndex(w=>w.name==="Старшеклассник"));
  const rbOrigin=actor.items.find(i=>RB_ORIGIN_IDS.includes(i.getFlag(SYS,"libraryId")))?.getFlag(SYS,"libraryId")||RB_ORIGIN_IDS[0];
  const cfg={method:details.creationMethod||"construction",breed,s1,s2,s3,work:workIndex,cover:details.cover||"",rbOrigin};
  const w=WORKS[workIndex]||WORKS[0],base=baseStats(breed,s1,s2),baseSkills={},baseNames=initialSkillNames(w);applyWorkBase(base,baseSkills,w);
  const statAdd=Object.fromEntries(STAT_KEYS.map(k=>[k,Math.max(0,n(actor.system?.stats?.[k])-n(base[k]))]));
  const skillAdd={},skillNames={...baseNames};
  for(const k of SKILL_KEYS){skillAdd[k]=Math.max(0,readActorSkill(actor,k)-n(baseSkills[k]));if(SPECIAL_KEYS.has(k))skillNames[k]=actor.system?.skills?.[k]?.name||skillNames[k]||"";}
  const alloc={statAdd,skillAdd,skillNames,xpSpent:0};
  if(cfg.method==="full"){
    alloc.xpSpent=Object.entries(statAdd).reduce((z,[k,v])=>z+statCost(base[k],base[k]+n(v)),0)+Object.entries(skillAdd).reduce((z,[k,v])=>z+skillCost(k,baseSkills[k]||0,(baseSkills[k]||0)+n(v)),0);
  }
  const mandatory=new Set(["core-181","core-182","core-490",...RB_ORIGIN_IDS]);
  const pEntries=[];const gearIds=[];
  for(const item of actor.items){const id=item.getFlag(SYS,"libraryId");if(!id)continue;if(item.type==="power"&&!mandatory.has(id)&&!String(id).startsWith("conc-")){const p=POWER_CATALOG.find(x=>x.id===id);if(p){const cap=maxPowerLevel(p,cfg);pEntries.push({p,cap,level:Math.min(cap,Math.max(1,n(item.system?.level,1)))});}}if(String(id).startsWith("gear-")&&id!=="gear-w001")gearIds.push(id);}
  const powers=pEntries.length?{entries:pEntries,xp:cfg.method==="full"?pEntries.reduce((z,x)=>z+15+Math.max(0,x.level-1)*5,0):0}:null;
  const actorLoises=Object.values(actor.system?.loises||{}).slice(0,3).map(l=>({relationship:l.relationship||"",name:l.name||"",positive:l.positive||"",negative:l.negative||"",positiveActive:l.positiveActive!==false}));
  const personal={origin:details.origin||"",experience:details.experience||"",encounter:details.encounter||"",awakening:details.awakening||AWAKENINGS[0][0],impulse:details.impulse||IMPULSES[0][0],baseEnc:n(actor.system?.encroachment?.base),loises:actorLoises};
  return {cfg,alloc,powers,gearIds,personal};
}
function serializeCreatorState(cfg,alloc,powers,gearIds,personal){
  return {version:2,cfg:{...cfg},alloc:foundry.utils.deepClone(alloc||null),powers:powers?{xp:n(powers.xp),entries:(powers.entries||[]).map(x=>({id:x.p?.id||x.id,level:n(x.level,1)}))}:null,gearIds:[...(gearIds||[])],personal:foundry.utils.deepClone(personal||null)};
}

export async function runCharacterCreator(actor) {
  if(!actor?.isOwner || actor.type!=="character") return ui.notifications.warn("Мастер создания доступен только для редактируемого персонажа игрока.");

  let stage=0;

  const normalizeCfg=value=>{
    const next={...value};
    if(next.breed==="Чистокровный") next.s2=next.s1;
    if(next.breed!=="Трибрид") next.s3="";
    return next;
  };
  const previous=inferCreatorState(actor);
  let cfg=previous.cfg?normalizeCfg(previous.cfg):null;
  let alloc=previous.alloc||null,powers=hydrateCreatorPowers(previous.powers,cfg),gearIds=previous.gearIds||[],personal=previous.personal||null;
  const derive=(applyAllocation=true)=>{
    const w=WORKS[cfg.work]||WORKS[0];
    const stats=baseStats(cfg.breed,cfg.s1,cfg.s2),skills={},skillNames=initialSkillNames(w);
    applyWorkBase(stats,skills,w);
    if(applyAllocation && alloc){
      for(const [k,v] of Object.entries(alloc.statAdd||{}))stats[k]=(stats[k]||0)+n(v);
      for(const [k,v] of Object.entries(alloc.skillAdd||{}))skills[k]=(skills[k]||0)+n(v);
      Object.assign(skillNames,alloc.skillNames||{});
    } else if(alloc) {
      // Names are part of the saved draft too, but the numeric bonuses must not be
      // counted twice when the player re-opens the allocation step.
      Object.assign(skillNames,alloc.skillNames||{});
    }
    const procure=skills.procure||0,stockMax=Math.max(0,stats.social*2+procure*2);
    return {w,stats,skills,skillNames,stockMax};
  };

  while(stage<5){
    if(stage===0){
      const result=await baseDialog(actor,cfg);
      if(result==null)return null;
      cfg=normalizeCfg(result);
      stage=1;
      continue;
    }

    if(stage===1){
      // Show the original base values and put the previous choices back into the
      // editable fields. Passing already-modified values here would double-count
      // saved allocations on a second wizard run or after pressing Back.
      const {w,stats,skills,skillNames}=derive(false);
      const result=await allocationDialog(cfg,stats,skills,skillNames,alloc);
      if(result==null)return null;
      if(isBackResult(result)){
        alloc=result.draft;
        stage=0;
        continue;
      }
      alloc=result;
      stage=2;
      continue;
    }

    if(stage===2){
      const {stats,skills}=derive();
      if(Object.values(stats).some(v=>v<1)){
        ui.notifications.warn("После создания каждая характеристика должна быть не меньше 1.");
        stage=1;
        continue;
      }
      const result=await powerDialog(cfg,alloc?.xpSpent||0,powers);
      if(result==null)return null;
      if(isBackResult(result)){
        powers=result.draft;
        stage=1;
        continue;
      }
      powers=result;
      stage=3;
      continue;
    }

    if(stage===3){
      const {stockMax}=derive();
      const result=await gearDialog(stockMax,gearIds);
      if(result==null)return null;
      if(isBackResult(result)){
        gearIds=result.draft||[];
        stage=2;
        continue;
      }
      gearIds=result;
      stage=4;
      continue;
    }

    if(stage===4){
      const result=await personalDialog(actor,personal);
      if(result==null)return null;
      if(isBackResult(result)){
        personal=result.draft;
        stage=3;
        continue;
      }
      personal=result;
      stage=5;
    }
  }

  const {w,stats,skills,stockMax}=derive();
  const xpTotal=(alloc?.xpSpent||0)+n(powers?.xp),gearCost=(gearIds||[]).reduce((z,id)=>z+n(EQUIPMENT_CATALOG.find(x=>x.id===id)?.system.stock),0);
  const syndromeText=cfg.breed==="Трибрид"?`${cfg.s1} / ${cfg.s2} / ${cfg.s3}`:cfg.breed==="Чистокровный"?cfg.s1:`${cfg.s1} / ${cfg.s2}`;
  const updates={
    "system.details.breed":cfg.breed,"system.details.syndromes":syndromeText,"system.details.subSyndrome":cfg.s3||"","system.details.work":w.name,"system.details.cover":cfg.cover,
    "system.details.spentXp":cfg.method==="full"?xpTotal:0,"system.details.creationMethod":cfg.method,
    "system.details.origin":personal.origin,"system.details.experience":personal.experience,"system.details.encounter":personal.encounter,"system.details.awakening":personal.awakening,"system.details.impulse":personal.impulse,
    "system.stats.body":stats.body,"system.stats.sense":stats.sense,"system.stats.mind":stats.mind,"system.stats.social":stats.social,
    "system.encroachment.base":personal.baseEnc,"system.encroachment.value":personal.baseEnc,"system.savings":Math.max(0,stockMax-gearCost),
    ...skillSystemData(skills,alloc.skillNames)
  };
  for(let i=0;i<personal.loises.length;i++){const l=personal.loises[i],key=`l${i+1}`;updates[`system.loises.${key}.relationship`]=l.relationship;updates[`system.loises.${key}.name`]=l.name;updates[`system.loises.${key}.positive`]=l.positive;updates[`system.loises.${key}.negative`]=l.negative;updates[`system.loises.${key}.positiveActive`]=l.positiveActive;updates[`system.loises.${key}.titus`]=false;updates[`system.loises.${key}.discarded`]=false;updates[`system.loises.${key}.special`]=false;}
  await actor.update(updates);

  const itemData=[];
  for(const id of ["core-181","core-182"]){const p=POWER_CATALOG.find(x=>x.id===id);if(p)itemData.push(powerToItemData(p));}
  if(cfg.method==="construction"){
    const conc=POWER_CATALOG.find(p=>p.id.startsWith("conc-")&&p.syndrome===cfg.s1);if(conc){const d=powerToItemData(conc);d.system.level=2;itemData.push(d);}
  }
  if(isRenegadeWork(w)){
    const human=POWER_CATALOG.find(p=>p.id==="core-490"),origin=POWER_CATALOG.find(p=>p.id===cfg.rbOrigin);if(human)itemData.push(powerToItemData(human));if(origin)itemData.push(powerToItemData(origin));
  }
  for(const {p,level,cap} of powers.entries){const d=powerToItemData(p);d.system.maxLevel=cap;d.system.level=Math.min(cap,level);itemData.push(d);}
  const state={weapon:false,armor:false};
  const selectedEntries=gearIds.map(id=>EQUIPMENT_CATALOG.find(x=>x.id===id)).filter(Boolean);
  for(const e of selectedEntries)itemData.push(applySelectedEquipment(e,state));
  const fists=EQUIPMENT_CATALOG.find(x=>x.id==="gear-w001");if(fists){const d=equipmentToItemData(fists);d.system.equipped=!state.weapon;itemData.push(d);}
  await replaceCreatorItems(actor,itemData);
  const hpMax=Math.max(1,stats.body*2+stats.mind+20+n(actor.system.hp?.bonus)),finalStockMax=Math.max(0,stockMax+n(actor.system.stock?.bonus));
  await actor.update({"system.hp.value":hpMax,"system.stock.value":finalStockMax,"system.encroachment.value":personal.baseEnc});
  await actor.setFlag(SYS,"creatorState",serializeCreatorState(cfg,alloc,powers,gearIds,personal));
  ui.notifications.info(`Персонаж создан: ${cfg.method==="construction"?"Конструкция":`Полный скретч, ${xpTotal}/130 опыта`} · базовое Вторжение ${personal.baseEnc}% · Сбережения ${Math.max(0,stockMax-gearCost)}.`);
  return {cfg,stats,skills,powers,gearIds,xpTotal,personal};
}
