const SYS = "double-cross-3e-ru";

const weapon = (id,name,{weaponType="Ближнее",skill="Ближний бой",skillKey="melee",accuracy=0,attackPower="0",guard=0,range="Вплотную",stock=0,notes="",img="icons/svg/sword.svg"}={}) => ({id,name,type:"weapon",category:"Оружие",img,source:"Базовое снаряжение",system:{weaponType,skill,skillKey,accuracy,attackPower:String(attackPower),guard,range,stock,notes,equipped:false}});
const armor = (id,name,{dodge=0,initiative=0,armor=0,stock=0,notes="",img="icons/svg/shield.svg"}={}) => ({id,name,type:"armor",category:"Броня",img,source:"Базовое снаряжение",system:{armorType:"Броня",dodge,initiative,armor,stock,notes,equipped:false}});
const misc = (id,name,{itemType="Прочее",skill="",stock=0,diceBonus=0,scoreBonus=0,notes="",img="icons/svg/item-bag.svg"}={}) => ({id,name,type:"misc",category:itemType,img,source:"Базовое снаряжение",system:{itemType,skill,stock,diceBonus,scoreBonus,notes,equipped:false}});

export const EQUIPMENT_CATALOG = [
  weapon("gear-w001","Кулаки",{attackPower:"-5",guard:0,stock:0,notes:"Базовое оружие каждого персонажа. Не требует приобретения.",img:"icons/svg/fist.svg"}),
  weapon("gear-w002","Нож",{accuracy:-1,attackPower:2,guard:0,stock:2}),
  weapon("gear-w003","Кастет",{accuracy:0,attackPower:1,guard:0,stock:1,img:"icons/svg/fist.svg"}),
  weapon("gear-w004","Дубинка",{accuracy:-1,attackPower:2,guard:1,stock:2}),
  weapon("gear-w005","Деревянный меч",{accuracy:-1,attackPower:3,guard:2,stock:3}),
  weapon("gear-w006","Боевой нож",{accuracy:-1,attackPower:3,guard:1,stock:4}),
  weapon("gear-w007","Меч",{accuracy:-1,attackPower:5,guard:3,stock:7}),
  weapon("gear-w008","Двуручный меч",{accuracy:-3,attackPower:10,guard:3,stock:12}),
  weapon("gear-w009","Большой молот",{accuracy:-3,attackPower:12,guard:2,stock:10}),
  weapon("gear-w010","Копьё",{accuracy:-2,attackPower:5,guard:2,stock:6}),
  weapon("gear-w011","Электрошоковая дубинка",{accuracy:-1,attackPower:3,guard:2,stock:7,notes:"При необходимости ГМ может применять тематический эффект оглушения."}),
  weapon("gear-w012","Катана",{accuracy:-1,attackPower:5,guard:3,stock:8}),
  weapon("gear-w013","Пистолет",{weaponType:"Дальнее",skill:"Дальний бой",skillKey:"ranged",accuracy:-1,attackPower:3,guard:0,range:"20 м",stock:6,img:"icons/svg/bullet.svg"}),
  weapon("gear-w014","Револьвер",{weaponType:"Дальнее",skill:"Дальний бой",skillKey:"ranged",accuracy:-1,attackPower:4,range:"20 м",stock:7,img:"icons/svg/bullet.svg"}),
  weapon("gear-w015","Пистолет-пулемёт",{weaponType:"Дальнее",skill:"Дальний бой",skillKey:"ranged",accuracy:-1,attackPower:4,range:"20 м",stock:9,img:"icons/svg/bullet.svg"}),
  weapon("gear-w016","Дробовик",{weaponType:"Дальнее",skill:"Дальний бой",skillKey:"ranged",accuracy:-1,attackPower:5,range:"10 м",stock:7,img:"icons/svg/bullet.svg"}),
  weapon("gear-w017","Штурмовая винтовка",{weaponType:"Дальнее",skill:"Дальний бой",skillKey:"ranged",accuracy:-1,attackPower:7,range:"50 м",stock:12,img:"icons/svg/bullet.svg"}),
  weapon("gear-w018","Снайперская винтовка",{weaponType:"Дальнее",skill:"Дальний бой",skillKey:"ranged",accuracy:-2,attackPower:8,range:"200 м",stock:14,img:"icons/svg/bullseye.svg"}),
  weapon("gear-w019","Крупнокалиберная винтовка",{weaponType:"Дальнее",skill:"Дальний бой",skillKey:"ranged",accuracy:-3,attackPower:10,range:"300 м",stock:20,img:"icons/svg/bullseye.svg"}),
  weapon("gear-w020","Лёгкий пулемёт",{weaponType:"Дальнее",skill:"Дальний бой",skillKey:"ranged",accuracy:-2,attackPower:9,range:"100 м",stock:18,img:"icons/svg/bullet.svg"}),
  weapon("gear-w021","Лук",{weaponType:"Дальнее",skill:"Дальний бой",skillKey:"ranged",accuracy:-1,attackPower:4,range:"50 м",stock:5,img:"icons/svg/target.svg"}),
  weapon("gear-w022","Арбалет",{weaponType:"Дальнее",skill:"Дальний бой",skillKey:"ranged",accuracy:-2,attackPower:6,range:"50 м",stock:8,img:"icons/svg/target.svg"}),
  weapon("gear-w023","Метательный нож",{weaponType:"Дальнее",skill:"Дальний бой",skillKey:"ranged",accuracy:-1,attackPower:2,range:"10 м",stock:2}),
  weapon("gear-w024","Гранатомёт",{weaponType:"Дальнее",skill:"Дальний бой",skillKey:"ranged",accuracy:-3,attackPower:9,range:"100 м",stock:20,img:"icons/svg/explosion.svg"}),
  weapon("gear-w025","Тяжёлый пулемёт",{weaponType:"Дальнее",skill:"Дальний бой",skillKey:"ranged",accuracy:-3,attackPower:12,range:"200 м",stock:25,img:"icons/svg/bullet.svg"}),

  armor("gear-a001","Усиленная одежда",{armor:1,stock:1}),
  armor("gear-a002","Кожаная куртка",{armor:2,stock:4}),
  armor("gear-a003","Противоосколочный жилет",{armor:3,stock:6}),
  armor("gear-a004","Броня перехватчика",{initiative:1,armor:5,stock:10}),
  armor("gear-a005","Бронежилет III класса",{dodge:-2,initiative:1,armor:7,stock:14}),
  armor("gear-a006","Кольчуга",{dodge:-1,initiative:1,armor:8,stock:16}),
  armor("gear-a007","Латная броня",{dodge:-3,initiative:3,armor:10,stock:20}),
  armor("gear-a008","Боевой костюм UGN",{dodge:-1,initiative:1,armor:7,stock:30}),
  armor("gear-a009","Атмосферный костюм",{armor:4,stock:9}),
  armor("gear-a010","Биозащитный костюм",{dodge:-4,initiative:4,armor:7,stock:12}),
  armor("gear-a011","Счастливая одежда",{armor:1,stock:14,notes:"Особая одежда с дополнительным игровым свойством; карточку можно отредактировать под правила вашей кампании."}),
  armor("gear-a012","Превосходная одежда",{armor:1,stock:16,notes:"Особая одежда с дополнительным игровым свойством; карточку можно отредактировать под правила вашей кампании."}),
  armor("gear-a013","Костюм скрытности",{armor:2,stock:16}),
  armor("gear-a014","Боевая броня UGN",{dodge:-1,initiative:1,armor:8,stock:22}),
  armor("gear-a015","Куртка стрелка",{dodge:-1,initiative:2,armor:3,stock:12}),
  armor("gear-a016","Боевой маскот-костюм",{dodge:-1,initiative:1,armor:12,stock:24}),
  armor("gear-a017","Вооружённый костюм",{dodge:-3,initiative:2,armor:10,stock:25}),
  armor("gear-a018","Антиренегатный костюм",{dodge:-1,initiative:1,armor:7,stock:18}),

  misc("gear-m001","Повседневная одежда",{stock:0}),
  misc("gear-m002","Мобильный телефон",{stock:0}),
  misc("gear-m003","Аксессуар",{stock:0}),
  misc("gear-m004","Памятная вещь",{stock:2,skill:"Воля",scoreBonus:1,notes:"Даёт +1 к итоговому результату подходящей проверки Воли, когда это оправдано предметом."}),
  misc("gear-m005","Чехол для оружия",{itemType:"Расходник",stock:1,notes:"Позволяет удобно хранить выбранное оружие; применение зависит от ситуации."}),
  misc("gear-m006","Аптечка",{itemType:"Расходник",stock:3,notes:"Средство первой помощи для восстановления после ранений; величину восстановления при необходимости можно задать в карточке."}),
  misc("gear-m007","Портативный терминал",{stock:2,skill:"Информация"}),
  misc("gear-m008","Набор инструментов",{stock:2,skill:"Знания / Снабжение"}),
  misc("gear-m009","Рация",{stock:1}),
  misc("gear-m010","Фонарик",{stock:0}),
  misc("gear-m011","Наручники",{stock:1}),
  misc("gear-m012","Бинокль",{stock:1,skill:"Восприятие"}),
  misc("gear-m013","Фотоаппарат",{stock:1,skill:"Искусство / Информация"}),
  misc("gear-m014","Поддельные документы",{stock:3,skill:"Переговоры / Информация"}),
  misc("gear-m015","Наличные средства",{stock:3,skill:"Снабжение"}),
  misc("gear-m016","Велосипед",{itemType:"Транспорт",stock:1,skill:"Вождение"}),
  misc("gear-m017","Мотоцикл",{itemType:"Транспорт",stock:5,skill:"Вождение"}),
  misc("gear-m018","Легковой автомобиль",{itemType:"Транспорт",stock:8,skill:"Вождение"}),
  misc("gear-m019","Спортивный автомобиль",{itemType:"Транспорт",stock:12,skill:"Вождение"}),
  misc("gear-m020","Фургон",{itemType:"Транспорт",stock:8,skill:"Вождение"}),
  misc("gear-m021","Связь: руководитель UGN",{itemType:"Связь",stock:1,skill:"Информация: UGN",diceBonus:2}),
  misc("gear-m022","Связь: информатор",{itemType:"Связь",stock:1,skill:"Информация: Преступный мир",diceBonus:2}),
  misc("gear-m023","Связь: частный детектив",{itemType:"Связь",stock:1,skill:"Информация: Слухи",diceBonus:2}),
  misc("gear-m024","Связь: журналист",{itemType:"Связь",stock:1,skill:"Информация: СМИ",diceBonus:2}),
  misc("gear-m025","Связь: полицейский",{itemType:"Связь",stock:1,skill:"Информация: Полиция",diceBonus:2}),
  misc("gear-m026","Связь: военный",{itemType:"Связь",stock:1,skill:"Информация: Военное дело",diceBonus:2}),
  misc("gear-m027","Связь: учёный",{itemType:"Связь",stock:1,skill:"Информация: Академия",diceBonus:2}),
  misc("gear-m028","Связь: сетевой хакер",{itemType:"Связь",stock:1,skill:"Информация: Интернет",diceBonus:2}),
  misc("gear-m029","Связь: оккультист",{itemType:"Связь",stock:1,skill:"Информация: Мистика",diceBonus:2}),
  misc("gear-m030","Связь: снабженец",{itemType:"Связь",stock:1,skill:"Снабжение",diceBonus:3,notes:"Контакт со снабженцем помогает с проверками Снабжения; число применений при необходимости можно задать в карточке."}),
  misc("gear-m031","Голосовой модулятор",{stock:2,skill:"Переговоры",scoreBonus:1}),
  misc("gear-m032","Поддерживающий персонал",{itemType:"Связь",stock:5,scoreBonus:2,notes:"При приобретении выберите, какую характеристику поддерживает персонал; ограничение применений можно настроить в карточке."}),
  misc("gear-m033","Усиленный материал",{stock:5,notes:"Модификация выбранного оружия или защиты; конкретный параметр задайте в примечании."}),
  misc("gear-m034","Скрытая кобура",{stock:2,notes:"Для скрытого ношения компактного оружия."}),
  misc("gear-m035","Набор маскировки",{stock:2,skill:"Искусство / Переговоры",diceBonus:1}),
  misc("gear-m036","Медицинский набор",{stock:3,skill:"Знания: Медицина",diceBonus:1}),
  misc("gear-m037","Ноутбук",{stock:2,skill:"Информация: Интернет",diceBonus:1}),
  misc("gear-m038","Полевой датчик Ренегата",{stock:4,skill:"Знания: Ренегат",diceBonus:1}),
  misc("gear-m039","Удостоверение UGN",{stock:0,skill:"Информация: UGN"}),
  misc("gear-m040","Набор выживания",{stock:2,notes:"Верёвка, вода, инструменты и расходники для полевой работы."})
];

export function equipmentToItemData(entry) {
  return {
    name: entry.name,
    type: entry.type,
    img: entry.img || "icons/svg/item-bag.svg",
    flags: { [SYS]: { libraryId: entry.id } },
    system: {
      ...entry.system,
      description: `<p><strong>${entry.category}</strong> · ${entry.source}</p><p>${entry.system.notes || "Базовая каталожная запись."}</p>`
    }
  };
}

export const EQUIPMENT_COUNTS = Object.freeze({
  total: EQUIPMENT_CATALOG.length,
  weapons: EQUIPMENT_CATALOG.filter(x=>x.type==="weapon").length,
  armor: EQUIPMENT_CATALOG.filter(x=>x.type==="armor").length,
  misc: EQUIPMENT_CATALOG.filter(x=>x.type==="misc").length
});
