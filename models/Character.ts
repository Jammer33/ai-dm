export enum Class {
    Barbarian = "Barbarian",
    Bard = "Bard",
    Cleric = "Cleric",
    Druid = "Druid",
    Fighter = "Fighter",
    Monk = "Monk",
    Paladin = "Paladin",
    Ranger = "Ranger",
    Rogue = "Rogue",
}

export enum Race {
    Dwarf = "Dwarf",
    Elf = "Elf",
    Halfling = "Halfling",
    Human = "Human",
    Dragonborn = "Dragonborn",
    Gnome = "Gnome",
    HalfElf = "Half-Elf",
    HalfOrc = "Half-Orc",
    Tiefling = "Tiefling",
}

export interface Character {
    id: number;
    name: string;
    description: string;
    _class: Class;
    race: Race;
    level: number;
}