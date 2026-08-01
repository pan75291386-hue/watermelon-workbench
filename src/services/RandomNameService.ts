import {
  CHINESE_PERSON_NAME_POOLS,
  COMPOUND_PLACE_POOLS,
  ENGLISH_FIRST_NAMES,
  ENGLISH_LAST_NAMES,
  RANDOM_NAME_CATEGORIES,
  RANDOM_NAME_GROUPS,
  SCHOOL_MODIFIERS,
  SCHOOL_PREFIXES,
  SCHOOL_SUFFIXES,
  type ChinesePersonCategoryId,
  type RandomNameCategory,
  type RandomNameCategoryId,
  type RandomNameGeneratorKind,
  type RandomNameGroup,
  type RandomNameGroupId,
} from "../data/randomNameData";

export type ChineseNameLength = 2 | 3;

export interface RandomNameOptions {
  group: RandomNameGroupId;
  categoryId: RandomNameCategoryId;
  chineseNameLength: ChineseNameLength;
}

const DEFAULT_CATEGORY_ID: ChinesePersonCategoryId = "person.chinese.modern";

export function createDefaultRandomNameOptions(): RandomNameOptions {
  return {
    group: "person",
    categoryId: DEFAULT_CATEGORY_ID,
    chineseNameLength: 2,
  };
}

export function listRandomNameGroups(): readonly RandomNameGroup[] {
  return RANDOM_NAME_GROUPS;
}

export function listRandomNameCategories(group: RandomNameGroupId): readonly RandomNameCategory[] {
  return RANDOM_NAME_CATEGORIES.filter((category) => category.group === group);
}

export function getRandomNameCategory(categoryId: RandomNameCategoryId): RandomNameCategory {
  return findCategory(categoryId) ?? findCategory(DEFAULT_CATEGORY_ID)!;
}

export function normalizeRandomNameOptions(options: RandomNameOptions): RandomNameOptions {
  const category = findCategory(options.categoryId);
  if (!category || category.group !== options.group) {
    const fallbackCategory = listRandomNameCategories(options.group)[0] ?? getRandomNameCategory(DEFAULT_CATEGORY_ID);
    return {
      group: fallbackCategory.group,
      categoryId: fallbackCategory.id,
      chineseNameLength: normalizeChineseNameLength(options.chineseNameLength),
    };
  }

  return {
    group: options.group,
    categoryId: category.id,
    chineseNameLength: normalizeChineseNameLength(options.chineseNameLength),
  };
}

export function generateRandomNames(options: RandomNameOptions, count = 12): string[] {
  const normalizedOptions = normalizeRandomNameOptions(options);
  const names = new Set<string>();
  const limit = Math.max(1, count);
  let attempts = 0;

  while (names.size < limit && attempts < limit * 50) {
    attempts += 1;
    names.add(generateOne(normalizedOptions));
  }

  return Array.from(names);
}

function generateOne(options: RandomNameOptions): string {
  const category = getRandomNameCategory(options.categoryId);

  if (category.generator === "chinesePerson") {
    return generateChinesePersonName(category.id, options.chineseNameLength);
  }

  if (category.generator === "englishPerson") {
    return `${pick(ENGLISH_FIRST_NAMES)} ${pick(ENGLISH_LAST_NAMES)}`;
  }

  if (category.generator === "school") {
    return generateSchoolName(category.id);
  }

  return generateCompoundPlaceName(category.id, category.generator);
}

function generateChinesePersonName(categoryId: RandomNameCategoryId, length: ChineseNameLength): string {
  const pool = CHINESE_PERSON_NAME_POOLS[isChinesePersonCategory(categoryId) ? categoryId : DEFAULT_CATEGORY_ID];

  if (length === 2) {
    return `${pick(pool.singleSurnames)}${pick(pool.oneCharGivenNames)}`;
  }

  if (pool.compoundSurnames && Math.random() < 0.45) {
    return `${pick(pool.compoundSurnames)}${pick(pool.oneCharGivenNames)}`;
  }

  return `${pick(pool.singleSurnames)}${pick(pool.twoCharGivenNames)}`;
}

function generateCompoundPlaceName(categoryId: RandomNameCategoryId, generator: RandomNameGeneratorKind): string {
  if (generator !== "compoundPlace") {
    throw new Error(`Unsupported compound place generator: ${generator}`);
  }

  if (!isCompoundPlaceCategory(categoryId)) {
    return generateCompoundPlaceName("place.ancient", "compoundPlace");
  }

  const pool = COMPOUND_PLACE_POOLS[categoryId];
  return `${pick(pool.prefixes)}${pick(pool.suffixes)}`;
}

function generateSchoolName(categoryId: RandomNameCategoryId): string {
  const suffixes = isSchoolCategory(categoryId) ? SCHOOL_SUFFIXES[categoryId] : SCHOOL_SUFFIXES["school.general"];
  const prefix = pick(SCHOOL_PREFIXES);
  const suffix = pick(suffixes);
  const modifier = pick(SCHOOL_MODIFIERS);

  if (suffix.startsWith(prefix)) {
    return suffix;
  }

  if (!modifier || prefix.includes(modifier) || suffix.includes(modifier)) {
    return `${prefix}${suffix}`;
  }

  return `${prefix}${modifier}${suffix}`;
}

function findCategory(categoryId: RandomNameCategoryId): RandomNameCategory | undefined {
  return RANDOM_NAME_CATEGORIES.find((category) => category.id === categoryId);
}

function normalizeChineseNameLength(length: ChineseNameLength): ChineseNameLength {
  return length === 3 ? 3 : 2;
}

export function isChinesePersonCategory(categoryId: RandomNameCategoryId): categoryId is ChinesePersonCategoryId {
  return categoryId in CHINESE_PERSON_NAME_POOLS;
}

function isCompoundPlaceCategory(categoryId: RandomNameCategoryId): categoryId is keyof typeof COMPOUND_PLACE_POOLS {
  return categoryId in COMPOUND_PLACE_POOLS;
}

function isSchoolCategory(categoryId: RandomNameCategoryId): categoryId is keyof typeof SCHOOL_SUFFIXES {
  return categoryId in SCHOOL_SUFFIXES;
}

function pick<T>(items: readonly T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) {
    throw new Error("Cannot pick from an empty list.");
  }

  return item;
}
