export type RandomNameGroupId = "person" | "place" | "school";

export type RandomNameCategoryId =
  | "person.chinese.modern"
  | "person.chinese.ancient"
  | "person.english"
  | "place.ancient"
  | "place.modern.city"
  | "place.modern.street"
  | "place.modern.community"
  | "place.modern.landmark"
  | "school.general"
  | "school.primary"
  | "school.middle"
  | "school.university"
  | "school.academy";

export type RandomNameGeneratorKind = "chinesePerson" | "englishPerson" | "compoundPlace" | "school";

export interface RandomNameGroup {
  id: RandomNameGroupId;
  label: string;
}

export interface RandomNameCategory {
  id: RandomNameCategoryId;
  group: RandomNameGroupId;
  label: string;
  hint: string;
  generator: RandomNameGeneratorKind;
}

export interface CompoundNamePool {
  prefixes: readonly string[];
  suffixes: readonly string[];
}

export type ChinesePersonCategoryId = Extract<RandomNameCategoryId, "person.chinese.modern" | "person.chinese.ancient">;

export interface ChinesePersonNamePool {
  singleSurnames: readonly string[];
  compoundSurnames?: readonly string[];
  oneCharGivenNames: readonly string[];
  twoCharGivenNames: readonly string[];
}

export const RANDOM_NAME_GROUPS: readonly RandomNameGroup[] = [
  { id: "person", label: "人名" },
  { id: "place", label: "地名" },
  { id: "school", label: "学校" },
] as const;

export const RANDOM_NAME_CATEGORIES: readonly RandomNameCategory[] = [
  { id: "person.chinese.modern", group: "person", label: "现代中文人名", hint: "偏日常、现实题材的人物名，默认使用常见姓氏和更现代的名字。", generator: "chinesePerson" },
  { id: "person.chinese.ancient", group: "person", label: "古风中文人名", hint: "适合古代、仙侠或幻想题材，包含复姓和更文学感的名字。", generator: "chinesePerson" },
  { id: "person.english", group: "person", label: "英文人名", hint: "适合西幻、海外背景或英文角色名。", generator: "englishPerson" },
  { id: "place.ancient", group: "place", label: "古代地名", hint: "州郡、城关、山川、宫观等古风地名。", generator: "compoundPlace" },
  { id: "place.modern.city", group: "place", label: "城市 / 区域", hint: "城市、区县、港湾、新区等现代地名。", generator: "compoundPlace" },
  { id: "place.modern.street", group: "place", label: "街道 / 站点", hint: "路、街、巷、桥、站点、广场等日常场景。", generator: "compoundPlace" },
  { id: "place.modern.community", group: "place", label: "小区 / 社区", hint: "花园、公寓、小区、社区、苑等居住地。", generator: "compoundPlace" },
  { id: "place.modern.landmark", group: "place", label: "地标 / 设施", hint: "医院、书店、公园、码头、大厦等公共地点。", generator: "compoundPlace" },
  { id: "school.general", group: "school", label: "学校通用", hint: "直接生成学校、实验学校、国际学校等名称。", generator: "school" },
  { id: "school.primary", group: "school", label: "小学", hint: "小学、实验小学、中心小学等名称。", generator: "school" },
  { id: "school.middle", group: "school", label: "中学 / 高中", hint: "中学、高级中学、外国语学校等名称。", generator: "school" },
  { id: "school.university", group: "school", label: "大学 / 学院", hint: "大学、学院、职业技术学院、师范学院等名称。", generator: "school" },
  { id: "school.academy", group: "school", label: "学院 / 学府", hint: "书院、学府、研究院、艺术学院等名称。", generator: "school" },
] as const;

export const CHINESE_PERSON_NAME_POOLS: Record<ChinesePersonCategoryId, ChinesePersonNamePool> = {
  "person.chinese.modern": {
    singleSurnames: [
      "王", "李", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴", "徐", "孙", "胡", "朱", "高", "林",
      "何", "郭", "马", "罗", "梁", "宋", "郑", "谢", "韩", "唐", "许", "邓", "冯", "曹", "曾", "彭",
      "萧", "蔡", "潘", "田", "董", "袁", "于", "余", "叶", "蒋", "杜", "苏", "魏", "程", "吕", "丁",
      "沈", "任", "姚", "卢", "姜", "崔", "钟", "谭", "陆", "汪", "范", "金", "石", "廖", "贾", "夏",
      "韦", "付", "方", "白", "邹", "孟", "熊", "秦", "邱", "江", "尹", "薛", "闫", "段", "雷", "侯",
    ],
    oneCharGivenNames: [
      "明", "华", "伟", "强", "磊", "洋", "杰", "涛", "宇", "浩", "晨", "然", "宁", "欣", "悦", "婷",
      "敏", "静", "洁", "佳", "怡", "涵", "琪", "睿", "航", "轩", "辰", "泽", "阳", "博", "文", "昊",
      "彤", "妍", "琳", "娜", "颖", "瑶", "晴", "雪", "菲", "萌", "乐", "安", "嘉", "一", "可", "诺",
      "思", "若", "艺", "昕", "雨", "子", "远", "诚", "凯", "楠", "川", "宁", "乔", "清", "格", "夏",
    ],
    twoCharGivenNames: [
      "子涵", "雨桐", "梓萱", "一诺", "思源", "嘉怡", "浩然", "宇航", "晨曦", "欣怡", "佳宁", "明轩",
      "子墨", "若曦", "语晨", "诗涵", "梓晴", "子轩", "雨泽", "嘉懿", "思琪", "梦瑶", "语嫣", "一鸣",
      "俊杰", "博文", "浩宇", "梓睿", "晨阳", "昊然", "泽宇", "书瑶", "可欣", "佳怡", "雨欣", "若涵",
      "思雨", "子昂", "亦辰", "嘉宁", "安琪", "瑞泽", "景行", "知夏", "清扬", "南乔", "星然", "云舒",
    ],
  },
  "person.chinese.ancient": {
    singleSurnames: [
      "姬", "谢", "萧", "沈", "裴", "陆", "温", "柳", "顾", "崔", "晏", "容", "燕", "楚", "云", "苏",
      "秦", "宋", "卫", "霍", "凌", "洛", "白", "叶", "花", "唐", "孟", "杜", "薛", "乔", "阮", "蓝",
      "慕", "商", "颜", "君", "纪", "闻", "钟", "凤", "景", "姜", "江", "傅", "韩", "顾", "许", "林",
    ],
    compoundSurnames: [
      "司马", "上官", "欧阳", "夏侯", "诸葛", "闻人", "东方", "赫连", "皇甫", "尉迟", "澹台", "公孙",
      "轩辕", "令狐", "钟离", "宇文", "长孙", "慕容", "司徒", "司空", "南宫", "百里", "第五", "西门",
    ],
    oneCharGivenNames: [
      "予", "玦", "珩", "璟", "晏", "昭", "辞", "砚", "蘅", "澈", "洵", "珞", "翊", "衍", "瑾", "瑜",
      "衡", "霁", "遥", "棠", "澜", "舟", "眠", "尘", "隽", "槿", "烬", "旻", "祈", "晔", "琢", "玥",
      "洄", "汐", "绾", "弦", "栖", "庭", "竹", "鹤", "雪", "渡", "溪", "洲", "屿", "筠", "芷", "棹",
    ],
    twoCharGivenNames: [
      "清晏", "怀瑾", "知微", "景行", "照夜", "云舒", "雪蘅", "临川", "望舒", "长庚", "青衡", "闻溪",
      "归辞", "南枝", "北辰", "折月", "听澜", "扶光", "明珩", "疏桐", "照雪", "问舟", "知许", "怀远",
      "云栖", "月白", "星回", "霁川", "青棠", "墨辞", "庭筠", "遥夜", "观澜", "惊鸿", "砚秋", "昭明",
    ],
  },
};

export const ENGLISH_FIRST_NAMES = [
  "Aiden", "Alice", "Amelia", "Arthur", "Audrey", "Blair", "Caleb", "Clara", "Daphne", "Elias", "Evelyn", "Felix",
  "Flora", "Gavin", "Hazel", "Iris", "Julian", "Lena", "Leo", "Mira", "Nora", "Oscar", "Rhea", "Rowan",
  "Selene", "Theo", "Vera", "Victor", "Adrian", "Beatrice", "Celine", "Cedric", "Dorian", "Elena", "Emery", "Freya",
  "Gideon", "Helena", "Isla", "Jasper", "Lucian", "Lyra", "Maeve", "Miles", "Nolan", "Ophelia", "Phoebe", "Quentin",
  "Rosalie", "Silas", "Tessa", "Vivian", "Wesley", "Yvette",
] as const;

export const ENGLISH_LAST_NAMES = [
  "Ashford", "Blackwood", "Bright", "Calloway", "Carter", "Everett", "Fairchild", "Gray", "Hale", "Hart", "Hawthorne", "Kingsley",
  "Lancaster", "Locke", "Marlow", "Montgomery", "Pierce", "Quinn", "Reed", "Sinclair", "Sterling", "Vaughn", "Whitaker", "Wilder",
  "Bennett", "Caldwell", "Darcy", "Ellington", "Frost", "Grayson", "Harrington", "Kensington", "Langley", "Monroe", "North", "Pembroke",
  "Rivers", "Sutton", "Thorne", "Vale", "Westbrook", "Winslow",
] as const;

export const COMPOUND_PLACE_POOLS: Record<Extract<RandomNameCategoryId, "place.ancient" | "place.modern.city" | "place.modern.street" | "place.modern.community" | "place.modern.landmark">, CompoundNamePool> = {
  "place.ancient": {
    prefixes: ["青", "云", "长", "寒", "落", "望", "归", "扶", "白", "玄", "朱", "碎", "听", "藏", "九", "千", "照", "澜", "鹤", "栖", "苍", "雪", "月", "鸣", "逐", "怀", "渡", "灵", "玉", "扶桑", "临川", "归雁", "鹿鸣", "青崖", "白石", "沧浪", "照夜"],
    suffixes: ["州", "郡", "城", "关", "渡", "谷", "山", "川", "陵", "台", "宫", "观", "阁", "坞", "泽", "原", "坡", "巷", "镇", "桥", "坊", "洲", "浦", "津", "驿", "庭", "苑", "峰", "峡", "泉"],
  },
  "place.modern.city": {
    prefixes: ["星海", "南岸", "北城", "新川", "云港", "澜湾", "鹿鸣", "青禾", "望江", "临安", "海棠", "锦程", "东序", "西洲", "长宁", "明湖", "秋浦", "晴川", "月湾", "江临", "松庭", "云栖", "花屿", "银沙", "白鹭", "南汀"],
    suffixes: ["市", "区", "县", "镇", "新区", "湾", "港", "岛", "城", "新城", "开发区", "高新区", "滨海区", "中心区", "北区", "南区"],
  },
  "place.modern.street": {
    prefixes: ["星海", "南岸", "北城", "新川", "鹿鸣", "青禾", "望江", "海棠", "锦程", "东序", "西洲", "长宁", "明湖", "晴川", "银杏", "栀子", "梧桐", "桂花", "春山", "南风", "云杉", "月见", "白露", "朝阳"],
    suffixes: ["路", "街", "巷", "大道", "南路", "北路", "东路", "西路", "站", "桥", "广场", "步行街", "天桥", "地铁站", "公交站", "十字路口"],
  },
  "place.modern.community": {
    prefixes: ["星海", "南岸", "北城", "新川", "澜湾", "鹿鸣", "青禾", "望江", "海棠", "锦程", "长宁", "明湖", "晴川", "云栖", "月湾", "春江", "青柠", "松间", "花间", "白鹭", "锦绣", "半山"],
    suffixes: ["花园", "公寓", "小区", "社区", "苑", "里", "府", "庭", "居", "湾", "山庄", "新村", "家园", "雅苑", "名邸", "公馆"],
  },
  "place.modern.landmark": {
    prefixes: ["星海", "南岸", "北城", "新川", "云港", "澜湾", "鹿鸣", "青禾", "望江", "临安", "海棠", "锦程", "长宁", "明湖", "晴川", "白鹭", "松庭", "云栖", "银沙", "春山", "秋浦", "南汀"],
    suffixes: ["医院", "书店", "影城", "大厦", "公园", "码头", "图书馆", "美术馆", "博物馆", "体育馆", "音乐厅", "剧院", "咖啡馆", "商场", "会展中心", "写字楼"],
  },
};

export const SCHOOL_PREFIXES = [
  "明德", "启明", "育才", "树人", "弘文", "知行", "博雅", "行知", "格致", "求真", "致远", "立诚", "修远", "崇文", "尚德", "怀远",
  "青禾", "星海", "鹿鸣", "晴川", "明湖", "南山", "望江", "云川", "海棠", "锦程", "长宁", "临安", "白鹭", "松庭", "云栖", "春山",
  "第一", "第二", "第三", "实验", "外国语", "双语", "国际", "附属", "联合", "未来", "新城", "北城", "南岸", "西洲", "东序", "明珠",
] as const;

export const SCHOOL_MODIFIERS = ["", "实验", "外国语", "双语", "国际", "附属", "艺术", "科技", "师范", "职业", "人文", "未来"] as const;

export const SCHOOL_SUFFIXES: Record<Extract<RandomNameCategoryId, "school.general" | "school.primary" | "school.middle" | "school.university" | "school.academy">, readonly string[]> = {
  "school.general": ["学校", "实验学校", "国际学校", "双语学校", "外国语学校", "附属学校", "未来学校"],
  "school.primary": ["小学", "实验小学", "中心小学", "第一小学", "第二小学", "外国语小学", "附属小学"],
  "school.middle": ["中学", "高级中学", "实验中学", "第一中学", "第二中学", "外国语学校", "附属中学", "高中"],
  "school.university": ["大学", "学院", "师范学院", "职业技术学院", "科技大学", "理工学院", "艺术学院", "医学院"],
  "school.academy": ["书院", "学府", "学院", "研究院", "艺术学院", "音乐学院", "文学馆", "研修院"],
};
