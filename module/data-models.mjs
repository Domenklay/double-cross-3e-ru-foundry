const f = foundry.data.fields;

const number = (initial = 0, options = {}) => new f.NumberField({
  required: true,
  nullable: false,
  initial,
  ...options
});

const string = (initial = "") => new f.StringField({
  required: true,
  nullable: false,
  blank: true,
  initial
});

const bool = (initial = false) => new f.BooleanField({
  required: true,
  nullable: false,
  initial
});

const resource = (value = 0, max = 0) => new f.SchemaField({
  value: number(value),
  max: number(max),
  bonus: number(0)
});

const customSkill = (name = "") => new f.SchemaField({
  name: string(name),
  value: number(0, { min: 0 })
});

const lois = () => new f.SchemaField({
  relationship: string(""),
  name: string(""),
  positive: string(""),
  negative: string(""),
  positiveActive: bool(true),
  titus: bool(false),
  discarded: bool(false),
  special: bool(false)
});

export class DX3ActorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      details: new f.SchemaField({
        playerName: string(""),
        codename: string(""),
        spentXp: number(0, { min: 0 }),
        availableXp: number(0, { min: 0 }),
        age: string(""),
        gender: string(""),
        zodiac: string(""),
        height: string(""),
        weight: string(""),
        bloodType: string(""),
        breed: string(""),
        syndromes: string(""),
        subSyndrome: string(""),
        work: string(""),
        cover: string(""),
        creationMethod: string(""),
        origin: string(""),
        experience: string(""),
        encounter: string(""),
        awakening: string(""),
        impulse: string(""),
        notes: new f.HTMLField({ required: true, nullable: false, blank: true, initial: "" })
      }),

      stats: new f.SchemaField({
        body: number(0, { min: 0 }),
        sense: number(0, { min: 0 }),
        mind: number(0, { min: 0 }),
        social: number(0, { min: 0 })
      }),

      skills: new f.SchemaField({
        melee: number(0, { min: 0 }),
        dodge: number(0, { min: 0 }),
        ranged: number(0, { min: 0 }),
        perception: number(0, { min: 0 }),
        rc: number(0, { min: 0 }),
        will: number(0, { min: 0 }),
        negotiation: number(0, { min: 0 }),
        procure: number(0, { min: 0 }),
        ride1: customSkill(""),
        ride2: customSkill(""),
        art1: customSkill(""),
        art2: customSkill(""),
        knowledge1: customSkill(""),
        knowledge2: customSkill(""),
        info1: customSkill(""),
        info2: customSkill(""),
        custom: new f.TypedObjectField(new f.SchemaField({
          category: string("ride"),
          name: string(""),
          value: number(0, { min: 0 })
        }), { required: true, nullable: false, initial: {} })
      }),

      hp: resource(20, 20),
      stock: resource(0, 0),
      savings: number(0, { min: 0 }),
      initiative: number(0),
      initiativeBonus: number(0),
      move: number(5),
      moveBonus: number(0),
      dash: number(10),
      armorTotal: number(0),
      dodgeItemMod: number(0),

      encroachment: new f.SchemaField({
        base: number(30, { min: 0 }),
        value: number(30, { min: 0 }),
        max: number(100, { min: 1 }),
        diceBonus: number(0),
        powerLevelBonus: number(0)
      }),

      loises: new f.SchemaField({
        l1: lois(),
        l2: lois(),
        l3: lois(),
        l4: lois(),
        l5: lois(),
        l6: lois(),
        l7: lois()
      })
    };
  }
}

export class DX3CharacterData extends DX3ActorData {}
export class DX3EnemyData extends DX3ActorData {}

class DX3BaseItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new f.HTMLField({ required: true, nullable: false, blank: true, initial: "" }),
      notes: string("")
    };
  }
}

export class DX3PowerData extends DX3BaseItemData {
  static defineSchema() {
    const schema = super.defineSchema();
    Object.assign(schema, {
      syndrome: string(""),
      source: string(""),
      maxLevel: number(3, { min: 1 }),
      level: number(1, { min: 0 }),
      timing: string("Основное"),
      skill: string(""),
      skillKey: string("none"),
      difficulty: string("-"),
      target: string("-"),
      range: string("-"),
      encroach: number(0, { min: 0 }),
      encroachFormula: string("0"),
      restrict: string("-"),
      configured: bool(false),
      automation: string("card"),
      diceBonus: number(0),
      dicePerLevel: number(0),
      critical: number(10, { min: 2, max: 10 }),
      criticalPerLevel: number(0),
      scoreBonus: number(0),
      scorePerLevel: number(0),
      attackPower: string("0"),
      attackPerLevel: number(0),
      guardBonus: number(0),
      guardPerLevel: number(0),
      uses: number(0, { min: 0 }),
      maxUses: number(0, { min: 0 })
    });
    return schema;
  }
}

export class DX3WeaponData extends DX3BaseItemData {
  static defineSchema() {
    const schema = super.defineSchema();
    Object.assign(schema, {
      weaponType: string("Ближнее"),
      skill: string("Ближний бой"),
      skillKey: string("melee"),
      accuracy: number(0),
      attackPower: string("0"),
      guard: number(0),
      range: string("Вплотную"),
      stock: number(0, { min: 0 }),
      equipped: bool(true)
    });
    return schema;
  }
}

export class DX3ArmorData extends DX3BaseItemData {
  static defineSchema() {
    const schema = super.defineSchema();
    Object.assign(schema, {
      armorType: string("Броня"),
      dodge: number(0),
      initiative: number(0),
      armor: number(0),
      stock: number(0, { min: 0 }),
      equipped: bool(true)
    });
    return schema;
  }
}

export class DX3MiscData extends DX3BaseItemData {
  static defineSchema() {
    const schema = super.defineSchema();
    Object.assign(schema, {
      itemType: string("Предмет"),
      skill: string(""),
      stock: number(0, { min: 0 }),
      diceBonus: number(0),
      scoreBonus: number(0),
      equipped: bool(false)
    });
    return schema;
  }
}

export class DX3ComboData extends DX3BaseItemData {
  static defineSchema() {
    const schema = super.defineSchema();
    Object.assign(schema, {
      condition: string(""),
      combination: string(""),
      powerIds: string("[]"),
      autoCalculate: bool(true),
      weaponId: string(""),
      timing: string("Основное"),
      skill: string(""),
      skillKey: string("none"),
      difficulty: string("-"),
      target: string("-"),
      range: string("-"),
      encroach: number(0, { min: 0 }),
      encroachFormula: string("0"),
      diceUnder: number(0),
      criticalUnder: number(10, { min: 2, max: 10 }),
      attackUnder: string("0"),
      notesUnder: string(""),
      diceOver: number(0),
      criticalOver: number(10, { min: 2, max: 10 }),
      attackOver: string("0"),
      notesOver: string("")
    });
    return schema;
  }
}

export const ACTOR_MODELS = {
  character: DX3CharacterData,
  enemy: DX3EnemyData
};

export const ITEM_MODELS = {
  power: DX3PowerData,
  weapon: DX3WeaponData,
  armor: DX3ArmorData,
  misc: DX3MiscData,
  combo: DX3ComboData
};
