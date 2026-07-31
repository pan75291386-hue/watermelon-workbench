export type RandomNameTarget = "person" | "place";
export type PersonLanguage = "chinese" | "english";
export type ChineseNameLength = 2 | 3;
export type PlaceStyle = "ancient" | "modern";

export interface RandomNameOptions {
  target: RandomNameTarget;
  personLanguage: PersonLanguage;
  chineseNameLength: ChineseNameLength;
  placeStyle: PlaceStyle;
}

const CHINESE_SURNAMES = [
  "林",
  "苏",
  "沈",
  "顾",
  "陆",
  "谢",
  "许",
  "江",
  "温",
  "叶",
  "周",
  "赵",
  "秦",
  "宋",
  "韩",
  "孟",
  "程",
  "纪",
  "姜",
  "白",
  "傅",
  "乔",
  "夏",
  "唐",
  "萧",
  "楚",
  "洛",
  "云",
  "黎",
  "钟",
  "徐",
  "魏",
  "薛",
  "贺",
  "梁",
  "顾",
  "宁",
  "盛",
  "闻",
  "辛",
];

const CHINESE_GIVEN_CHARS = [
  "安",
  "然",
  "清",
  "宁",
  "岚",
  "晚",
  "舟",
  "遥",
  "星",
  "河",
  "月",
  "霁",
  "初",
  "微",
  "棠",
  "栀",
  "禾",
  "序",
  "珩",
  "璟",
  "辞",
  "砚",
  "知",
  "衍",
  "殊",
  "墨",
  "景",
  "澜",
  "予",
  "眠",
  "晏",
  "昭",
  "照",
  "一",
  "临",
  "野",
  "川",
  "回",
  "声",
  "洛",
  "绾",
  "梨",
  "若",
  "弦",
  "栖",
  "望",
  "庭",
  "竹",
  "衡",
  "尘",
  "隽",
  "瑶",
  "翎",
  "槿",
  "烬",
  "苍",
  "迟",
  "越",
  "霜",
  "旻",
];

const ENGLISH_FIRST_NAMES = [
  "Aiden",
  "Alice",
  "Amelia",
  "Arthur",
  "Audrey",
  "Blair",
  "Caleb",
  "Clara",
  "Daphne",
  "Elias",
  "Evelyn",
  "Felix",
  "Flora",
  "Gavin",
  "Hazel",
  "Iris",
  "Julian",
  "Lena",
  "Leo",
  "Mira",
  "Nora",
  "Oscar",
  "Rhea",
  "Rowan",
  "Selene",
  "Theo",
  "Vera",
  "Victor",
];

const ENGLISH_LAST_NAMES = [
  "Ashford",
  "Blackwood",
  "Bright",
  "Calloway",
  "Carter",
  "Everett",
  "Fairchild",
  "Gray",
  "Hale",
  "Hart",
  "Hawthorne",
  "Kingsley",
  "Lancaster",
  "Locke",
  "Marlow",
  "Montgomery",
  "Pierce",
  "Quinn",
  "Reed",
  "Sinclair",
  "Sterling",
  "Vaughn",
  "Whitaker",
  "Wilder",
];

const ANCIENT_PLACE_PREFIXES = [
  "青",
  "云",
  "长",
  "寒",
  "落",
  "望",
  "归",
  "扶",
  "白",
  "玄",
  "朱",
  "碎",
  "听",
  "藏",
  "九",
  "千",
  "照",
  "澜",
  "鹤",
  "栖",
];

const ANCIENT_PLACE_SUFFIXES = [
  "州",
  "郡",
  "城",
  "关",
  "渡",
  "谷",
  "山",
  "川",
  "陵",
  "台",
  "宫",
  "观",
  "阁",
  "坞",
  "泽",
  "原",
  "坡",
  "巷",
  "镇",
  "桥",
];

const MODERN_PLACE_PREFIXES = [
  "星海",
  "南岸",
  "北城",
  "新川",
  "云港",
  "澜湾",
  "鹿鸣",
  "青禾",
  "望江",
  "临安",
  "海棠",
  "锦程",
  "东序",
  "西洲",
  "长宁",
  "明湖",
  "秋浦",
  "晴川",
];

const MODERN_PLACE_SUFFIXES = [
  "市",
  "区",
  "路",
  "街",
  "巷",
  "湾",
  "港",
  "站",
  "广场",
  "花园",
  "公寓",
  "医院",
  "大学",
  "书店",
  "影城",
  "大厦",
  "公园",
  "码头",
];

export function createDefaultRandomNameOptions(): RandomNameOptions {
  return {
    target: "person",
    personLanguage: "chinese",
    chineseNameLength: 2,
    placeStyle: "ancient",
  };
}

export function generateRandomNames(options: RandomNameOptions, count = 12): string[] {
  const names = new Set<string>();
  const limit = Math.max(1, count);
  let attempts = 0;

  while (names.size < limit && attempts < limit * 20) {
    attempts += 1;
    names.add(generateOne(options));
  }

  return Array.from(names);
}

function generateOne(options: RandomNameOptions): string {
  if (options.target === "place") {
    return options.placeStyle === "ancient"
      ? `${pick(ANCIENT_PLACE_PREFIXES)}${pick(ANCIENT_PLACE_SUFFIXES)}`
      : `${pick(MODERN_PLACE_PREFIXES)}${pick(MODERN_PLACE_SUFFIXES)}`;
  }

  if (options.personLanguage === "english") {
    return `${pick(ENGLISH_FIRST_NAMES)} ${pick(ENGLISH_LAST_NAMES)}`;
  }

  const surname = pick(CHINESE_SURNAMES);
  if (options.chineseNameLength === 2) {
    return `${surname}${pick(CHINESE_GIVEN_CHARS)}`;
  }

  return `${surname}${pick(CHINESE_GIVEN_CHARS)}${pick(CHINESE_GIVEN_CHARS)}`;
}

function pick<T>(items: readonly T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) {
    throw new Error("Cannot pick from an empty list.");
  }

  return item;
}
