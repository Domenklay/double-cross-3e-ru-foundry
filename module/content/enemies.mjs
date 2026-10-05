function numericCost(value) { const x = Number(value); return Number.isFinite(x) ? x : 0; }

function power(name, {syndrome="Ренегат", level=1, timing="Основное", skill="-", skillKey="none", target="-", range="-", encroach=0, dice=0, critical=10, attack=0, notes=""}={}) {
  return {
    name, type: "power", img: "icons/svg/aura.svg",
    system: {
      syndrome, originalName: "", source: "Оригинальный бестиарий модуля", maxLevel: Math.max(1, level), level,
      timing, skill, skillKey, difficulty: skillKey === "none" ? "Авто" : "Противостояние", target, range,
      encroach: numericCost(encroach), encroachFormula: String(encroach), restrict: "NPC", configured: true, automation: skillKey === "none" ? "card" : "attack",
      diceBonus: dice, dicePerLevel: 0, critical, criticalPerLevel: 0, scoreBonus: 0, scorePerLevel: 0,
      attackPower: String(attack), attackPerLevel: 0, uses: 0, maxUses: 0, notes,
      description: `<p>${notes}</p>`
    }
  };
}

function weapon(name, {skillKey="melee", skill="Ближний бой", accuracy=0, attack=5, guard=0, range="Вплотную"}={}) {
  return {
    name, type: "weapon", img: "icons/svg/sword.svg",
    system: { description:"", notes:"", weaponType: range === "Вплотную" ? "Ближнее" : "Дальнее", skill, skillKey, accuracy, attackPower:String(attack), guard, range, stock:0, equipped:true }
  };
}

function combo(name, {skillKey="melee", skill="Ближний бой", diceUnder=0, critUnder=10, attackUnder=0, diceOver=2, critOver=9, attackOver=3, encroach=0, notes=""}={}) {
  return {
    name, type:"combo", img:"icons/svg/burst.svg",
    system:{ description:`<p>${notes}</p>`,notes:"",condition:"",combination:"",timing:"Основное",skill,skillKey,difficulty:"Противостояние",target:"Один",range:"Оружие",encroach:numericCost(encroach),encroachFormula:String(encroach),diceUnder,criticalUnder:critUnder,attackUnder:String(attackUnder),notesUnder:notes,diceOver,criticalOver:critOver,attackOver:String(attackOver),notesOver:notes }
  };
}

function enemy({id,name,syndromes,stats,skills={},hpBonus=0,enc=80,notes="",items=[]}) {
  return {
    name,
    type:"enemy",
    img:"icons/svg/mystery-man.svg",
    flags:{"double-cross-3e-ru":{libraryId:id}},
    system:{
      details:{ playerName:"",codename:"",spentXp:0,age:"",gender:"",zodiac:"",height:"",weight:"",bloodType:"",breed:"NPC",syndromes,subSyndrome:"",work:"Противник",cover:"",origin:"Ренегат",experience:"",encounter:"",awakening:"",impulse:"",notes:`<p>${notes}</p>` },
      stats:{body:stats[0],sense:stats[1],mind:stats[2],social:stats[3]},
      skills:{ melee:skills.melee||0,dodge:skills.dodge||0,ranged:skills.ranged||0,perception:skills.perception||0,rc:skills.rc||0,will:skills.will||0,negotiation:skills.negotiation||0,procure:0,
        ride1:{name:"",value:0},ride2:{name:"",value:0},art1:{name:"",value:0},art2:{name:"",value:0},knowledge1:{name:"",value:0},knowledge2:{name:"",value:0},info1:{name:"",value:0},info2:{name:"",value:0}},
      hp:{value:99,max:99,bonus:hpBonus},stock:{value:0,max:0,bonus:0},savings:0,initiative:0,initiativeBonus:0,move:5,moveBonus:0,dash:10,armorTotal:0,dodgeItemMod:0,
      encroachment:{base:enc,value:enc,max:100,diceBonus:0,powerLevelBonus:0},
      loises:{l1:{relationship:"",name:"",positive:"",negative:"",positiveActive:true,titus:false,discarded:false,special:false},l2:{relationship:"",name:"",positive:"",negative:"",positiveActive:true,titus:false,discarded:false,special:false},l3:{relationship:"",name:"",positive:"",negative:"",positiveActive:true,titus:false,discarded:false,special:false},l4:{relationship:"",name:"",positive:"",negative:"",positiveActive:true,titus:false,discarded:false,special:false},l5:{relationship:"",name:"",positive:"",negative:"",positiveActive:true,titus:false,discarded:false,special:false},l6:{relationship:"",name:"",positive:"",negative:"",positiveActive:true,titus:false,discarded:false,special:false},l7:{relationship:"",name:"",positive:"",negative:"",positiveActive:true,titus:false,discarded:false,special:false}}
    },
    items
  };
}

const BASE_ENEMIES = [
  enemy({id:"enemy-renegade-claw",name:"Ренегатный Коготь",syndromes:"Химера",stats:[7,2,2,1],skills:{melee:4,dodge:2,will:2},hpBonus:18,enc:85,notes:"Быстрый звероподобный Оверд. Простая ближняя угроза для первой встречи.",items:[weapon("Костяные когти",{accuracy:1,attack:9,guard:2}),power("Звериный рывок",{syndrome:"Химера",timing:"Малое",notes:"Перемещается к ближайшей цели, игнорируя помехи обычного перемещения."}),combo("Разрывающий наскок",{diceUnder:2,critUnder:10,attackUnder:4,diceOver:4,critOver:9,attackOver:7,encroach:3,notes:"Ближняя атака с усилением после рывка."})]}),
  enemy({id:"enemy-electric-hound",name:"Электрический гончий",syndromes:"Блэк Дог / Химера",stats:[6,4,2,1],skills:{melee:3,dodge:3,perception:2},hpBonus:14,enc:90,notes:"Кибернетический ренегатный зверь, способный парализовать добычу разрядом.",items:[weapon("Электроклыки",{attack:8}),power("Статический разряд",{syndrome:"Блэк Дог",skill:"РК",skillKey:"rc",range:"В поле зрения",encroach:2,dice:1,attack:5,notes:"Электрическая атака; при попадании ГМ может наложить краткий дебафф."}),combo("Грозовой укус",{diceUnder:2,attackUnder:5,diceOver:4,critOver:9,attackOver:8,encroach:4})]}),
  enemy({id:"enemy-blood-servant",name:"Кровавый слуга",syndromes:"Брэм Стокер",stats:[5,3,3,2],skills:{melee:3,rc:3,will:2},hpBonus:22,enc:95,notes:"Гуманоид, собранный из сгустившейся крови. Устойчив, но предсказуем.",items:[weapon("Багровый клинок",{attack:8,guard:3}),power("Кровавый шип",{syndrome:"Брэм Стокер",skill:"РК",skillKey:"rc",range:"В поле зрения",encroach:2,attack:6}),power("Сгуститься заново",{syndrome:"Брэм Стокер",timing:"Авто",notes:"Раз за сцену ГМ может восстановить слуге 10 ОЗ."})]}),
  enemy({id:"enemy-optical-hunter",name:"Оптический охотник",syndromes:"Ангел Хало",stats:[2,7,3,2],skills:{ranged:5,dodge:3,perception:4},hpBonus:8,enc:88,notes:"Снайпер-Оверд, который преломляет свет и меняет позицию после выстрела.",items:[weapon("Фотонная винтовка",{skillKey:"ranged",skill:"Дальний бой",accuracy:1,attack:10,range:"В поле зрения"}),power("Световая маскировка",{syndrome:"Ангел Хало",timing:"Малое",encroach:2,notes:"До следующего действия считается скрытым, если ГМ допускает это по ситуации."}),combo("Лазерный выстрел",{skillKey:"ranged",skill:"Дальний бой",diceUnder:2,critUnder:9,attackUnder:5,diceOver:4,critOver:8,attackOver:9,encroach:4})]}),
  enemy({id:"enemy-gravity-knot",name:"Гравитационный сгусток",syndromes:"Балор",stats:[3,2,7,1],skills:{rc:5,will:4},hpBonus:25,enc:105,notes:"Нестабильная сфера Ренегата, искривляющая пространство вокруг себя.",items:[power("Чёрный импульс",{syndrome:"Балор",skill:"РК",skillKey:"rc",range:"В поле зрения",encroach:2,dice:2,critical:9,attack:9}),power("Локальная гравитация",{syndrome:"Балор",timing:"Авто",target:"Область",range:"Близко",encroach:3,notes:"Зона становится трудной для перемещения до следующего хода сгустка."})]}),
  enemy({id:"enemy-flesh-mimic",name:"Плотяной мимик",syndromes:"Экзайл",stats:[6,3,4,1],skills:{melee:4,dodge:2,perception:3},hpBonus:30,enc:100,notes:"Бесформенная масса, принимающая очертания людей и предметов.",items:[weapon("Костяной серп",{attack:9,guard:2}),power("Удлинённая конечность",{syndrome:"Экзайл",skill:"Ближний бой",skillKey:"melee",range:"10 м",encroach:2,dice:1,attack:3}),power("Плотяная завеса",{syndrome:"Экзайл",timing:"Авто",notes:"Раз за раунд уменьшает полученный урон на 5."})]}),
  enemy({id:"enemy-sonic-predator",name:"Звуковой хищник",syndromes:"Хануман",stats:[4,6,3,1],skills:{melee:3,dodge:5,rc:3,perception:3},hpBonus:10,enc:92,notes:"Очень быстрый охотник, атакующий ударной волной и голосом.",items:[weapon("Виброкоготь",{accuracy:1,attack:7}),power("Режущий звук",{syndrome:"Хануман",skill:"РК",skillKey:"rc",range:"В поле зрения",encroach:2,dice:1,attack:6}),combo("Сверхзвуковой наскок",{diceUnder:3,critUnder:9,attackUnder:4,diceOver:5,critOver:8,attackOver:7,encroach:4})]}),
  enemy({id:"enemy-sand-construct",name:"Песчаный конструкт",syndromes:"Морфеус",stats:[7,2,4,1],skills:{melee:4,dodge:1},hpBonus:34,enc:98,notes:"Тяжёлый искусственный страж, собирающий тело из минеральной пыли.",items:[weapon("Кварцевый молот",{accuracy:-1,attack:12,guard:5}),power("Песчаный щит",{syndrome:"Морфеус",timing:"Авто",notes:"Раз за раунд уменьшает урон по выбранной цели рядом на 6."}),power("Перестройка корпуса",{syndrome:"Морфеус",timing:"Малое",notes:"Восстанавливает 6 ОЗ, один раз за сцену."})]}),
  enemy({id:"enemy-tactical-drone",name:"Тактический дрон-Оверд",syndromes:"Нойман / Блэк Дог",stats:[3,5,7,2],skills:{ranged:5,perception:4,will:3},hpBonus:16,enc:110,notes:"Автономная платформа с боевым ИИ, анализирующая действия персонажей.",items:[weapon("Импульсная турель",{skillKey:"ranged",skill:"Дальний бой",accuracy:2,attack:9,range:"В поле зрения"}),power("Тактический анализ",{syndrome:"Нойман",timing:"Подготовка",target:"Союзники",range:"В поле зрения",notes:"До конца раунда союзники получают +1 куб к первой атаке."}),combo("Просчитанный залп",{skillKey:"ranged",skill:"Дальний бой",diceUnder:3,critUnder:9,attackUnder:5,diceOver:5,critOver:8,attackOver:8,encroach:4})]}),
  enemy({id:"enemy-domain-warden",name:"Хранитель домена",syndromes:"Оркус",stats:[4,3,6,3],skills:{rc:5,will:4,negotiation:2},hpBonus:24,enc:108,notes:"Ренегат, привязанный к конкретному месту и меняющий законы пространства вокруг.",items:[power("Каменные клыки",{syndrome:"Оркус",skill:"РК",skillKey:"rc",range:"В поле зрения",encroach:2,dice:1,attack:8}),power("Связующий домен",{syndrome:"Оркус",timing:"Авто",target:"Область",range:"В поле зрения",encroach:3,notes:"До следующего хода перемещение в выбранной области затруднено."})]}),
  enemy({id:"enemy-ice-chimera",name:"Ледяная химера",syndromes:"Саламандра / Химера",stats:[8,3,3,1],skills:{melee:5,dodge:2,will:3},hpBonus:38,enc:120,notes:"Крупная ренегатная тварь, покрытая ледяной бронёй.",items:[weapon("Ледяные рога",{accuracy:0,attack:13,guard:4}),power("Морозная шкура",{syndrome:"Саламандра",timing:"Постоянно",notes:"Имеет 5 дополнительной брони; внесите её вручную предметом брони при необходимости."}),combo("Ледяной таран",{diceUnder:2,critUnder:9,attackUnder:7,diceOver:5,critOver:8,attackOver:11,encroach:5})]}),
  enemy({id:"enemy-toxic-flower",name:"Токсичный цветок",syndromes:"Солярис",stats:[2,4,5,6],skills:{rc:4,negotiation:5,will:4},hpBonus:20,enc:102,notes:"Неподвижная колония Ренегата, выделяющая психоактивную пыльцу.",items:[power("Ядовитая пыльца",{syndrome:"Солярис",skill:"Переговоры",skillKey:"negotiation",target:"Область",range:"В поле зрения",encroach:3,dice:2,attack:5,notes:"Социальная атака; ГМ может наложить подходящий негативный статус при попадании."}),power("Сладкий аромат",{syndrome:"Солярис",timing:"Авто",target:"Один",range:"В поле зрения",encroach:2,notes:"Цель получает -2 куба к следующей проверке до конца раунда."})]})
];


const CREATURES = [
  "волк", "ворон", "паук", "богомол", "жук", "оса", "скорпион", "змей", "кабан", "медведь",
  "олень", "кошка", "угорь", "акула", "спрут", "слизень", "грибник", "терновник", "орхидея", "корень",
  "голем", "дрон", "автоматон", "броненосец", "мимик", "призрак", "фантом", "паразит"
];

const ADJECTIVES = [
  "Багровый", "Костяной", "Стеклянный", "Грозовой", "Теневой", "Ледяной", "Пепельный", "Ртутный",
  "Зеркальный", "Гравитационный", "Режущий", "Безглазый", "Споровый", "Ядовитый"
];

const SYNDROMES = [
  "Ангел Хало", "Балор", "Блэк Дог", "Брэм Стокер", "Химера", "Экзайл",
  "Хануман", "Морфеус", "Нойман", "Оркус", "Саламандра", "Солярис"
];

const POWER_NAMES = {
  "Ангел Хало": ["Призматический луч", "Ослепляющий отблеск"],
  "Балор": ["Гравитационный толчок", "Складка пространства"],
  "Блэк Дог": ["Импульсный разряд", "Магнитный скачок"],
  "Брэм Стокер": ["Кровавый шип", "Багровая регенерация"],
  "Химера": ["Звериный рывок", "Хищный рефлекс"],
  "Экзайл": ["Удлинённая конечность", "Плотяная броня"],
  "Хануман": ["Режущая волна", "Сверхзвуковой шаг"],
  "Морфеус": ["Кристаллический клинок", "Минеральный щит"],
  "Нойман": ["Просчитанный удар", "Тактический анализ"],
  "Оркус": ["Клыки домена", "Связующее поле"],
  "Саламандра": ["Морозный выброс", "Огненная шкура"],
  "Солярис": ["Токсичный туман", "Психоактивный аромат"]
};

function generatedEnemy(index) {
  const syndrome = SYNDROMES[index % SYNDROMES.length];
  const creature = CREATURES[index % CREATURES.length];
  const adjective = ADJECTIVES[Math.floor(index / CREATURES.length) % ADJECTIVES.length];
  const tier = 1 + (index % 5);
  const role = index % 4;
  const serial = String(index + 13).padStart(3, "0");
  const name = `${adjective} ${creature} ${serial}`;

  const primary = 3 + tier + (index % 3);
  const secondary = 2 + Math.floor(tier / 2) + ((index + 1) % 2);
  const stats = role === 0 ? [primary, secondary, 2+tier, 1+tier] :
    role === 1 ? [2+tier, primary, secondary, 1+tier] :
    role === 2 ? [secondary, 2+tier, primary, 1+tier] :
                 [2+tier, secondary, 2+tier, primary];

  const skillKey = role === 0 ? "melee" : role === 1 ? "ranged" : role === 2 ? "rc" : "negotiation";
  const skillLabel = {melee:"Ближний бой", ranged:"Дальний бой", rc:"РК", negotiation:"Переговоры"}[skillKey];
  const range = skillKey === "melee" ? "Вплотную" : "В поле зрения";
  const weaponName = skillKey === "melee" ? "Ренегатные когти" : skillKey === "ranged" ? "Органический метатель" : "Фокусирующий орган";
  const attackBase = 4 + tier * 2 + (index % 4);
  const attackFormulaValue = index % 9 === 0 ? `1d4+${attackBase}` : String(attackBase);
  const encroachFormulaValue = index % 17 === 0 ? "1d4" : String(1 + tier % 3);
  const powerNames = POWER_NAMES[syndrome];
  const hpBonus = 8 + tier * 8 + (index % 10);
  const enc = 72 + tier * 8 + (index % 11);

  const skills = { melee:0,dodge:1+tier,ranged:0,perception:1+tier,rc:0,will:1+tier,negotiation:0 };
  skills[skillKey] = 2 + tier;

  const items = [
    weapon(weaponName, {
      skillKey,
      skill: skillLabel,
      accuracy: Math.floor(tier / 2),
      attack: attackFormulaValue,
      guard: skillKey === "melee" ? 1+tier : 0,
      range
    }),
    power(powerNames[0], {
      syndrome,
      level: Math.min(5, 1+tier),
      skill: skillLabel,
      skillKey,
      target: index % 6 === 0 ? "Область" : "Один",
      range,
      encroach: encroachFormulaValue,
      dice: tier,
      critical: Math.max(7, 10-Math.floor(tier/2)),
      attack: index % 7 === 0 ? `1d4+${2+tier}` : String(2+tier*2),
      notes: `Основная атака существа. Уровень угрозы ${tier}.`
    }),
    power(powerNames[1], {
      syndrome,
      level: Math.min(5, tier),
      timing: index % 2 ? "Авто" : "Малое",
      target: "На себя",
      range: "Вплотную",
      encroach: index % 13 === 0 ? "1d4" : "1",
      notes: role === 0 ? "Усиляет натиск или защиту до следующего хода." : role === 1 ? "Позволяет сменить позицию или получить преимущество дальнего боя." : role === 2 ? "Искажает поле вокруг существа до следующего хода." : "Ослабляет внимание и волю ближайшей цели."
    }),
    combo(`Фирменная атака: ${creature}`, {
      skillKey,
      skill: skillLabel,
      diceUnder: tier,
      critUnder: Math.max(8, 10-Math.floor(tier/2)),
      attackUnder: String(2+tier*2),
      diceOver: tier+2,
      critOver: Math.max(7, 9-Math.floor(tier/2)),
      attackOver: index % 11 === 0 ? `1d4+${4+tier*2}` : String(4+tier*3),
      encroach: index % 19 === 0 ? "1d4" : String(2+tier),
      notes: `Комбо угрозы ${tier}; параметры можно подстроить под силу группы.`
    })
  ];

  return enemy({
    id:`enemy-generated-${String(index+1).padStart(3,"0")}`,
    name,
    syndromes:syndrome,
    stats,
    skills,
    hpBonus,
    enc,
    notes:`Оригинальное существо бестиария модуля. Архетип: ${creature}; синдром: ${syndrome}; уровень угрозы: ${tier}. Не является официальным монстром из книги.`,
    items
  });
}

const GENERATED_ENEMIES = Array.from({length: 388}, (_, i) => generatedEnemy(i));

export const ENEMY_CATALOG = [...BASE_ENEMIES, ...GENERATED_ENEMIES];
