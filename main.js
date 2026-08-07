"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => WatermelonWorkbenchPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  manuscriptRoot: "",
  defaultFontFamily: "",
  defaultFontSizePx: 22,
  defaultLineHeight: 1.8,
  autoParagraphIndent: true,
  showChapterPanel: true,
  showStatsPanel: true,
  chapterPanelWidth: 260,
  statsPanelWidth: 280,
  rememberLastFile: true,
  chapterSort: "name",
  lastOpenFilePath: null
};
var WatermelonSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(plugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Writing workbench").setDesc("\u4FDD\u6301 Markdown \u6587\u4EF6\u4E0D\u53D8\uFF0C\u53EA\u8C03\u6574\u5199\u4F5C\u5DE5\u4F5C\u53F0\u4E2D\u7684\u5C55\u793A\u4E0E\u8F85\u52A9\u529F\u80FD\u3002").setHeading();
    new import_obsidian.Setting(containerEl).setName("Manuscript root").setDesc("Only used as an optional ceiling for your novel files. Leave empty to derive scope from the currently opened note.").addText((text) => {
      text.setPlaceholder("Novels/My Project").setValue(this.plugin.settings.manuscriptRoot).onChange(async (value) => {
        this.plugin.settings.manuscriptRoot = normalizeRootInput(value);
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Workbench font").setDesc("\u7559\u7A7A\u5219\u8DDF\u968F Obsidian \u6B63\u6587\u5B57\u4F53\uFF1B\u4E5F\u53EF\u4EE5\u8F93\u5165\u672C\u673A\u5DF2\u5B89\u88C5\u5B57\u4F53\u540D\u79F0\uFF0C\u4F8B\u5982\uFF1A\u971E\u9E5C\u6587\u6977\u3001Microsoft YaHei\u3001SimSun\u3002").addText((text) => {
      text.setPlaceholder("\u8DDF\u968F Obsidian\uFF0C\u6216\u8F93\u5165\u672C\u5730\u5B57\u4F53\u540D\u79F0").setValue(this.plugin.settings.defaultFontFamily).onChange(async (value) => {
        this.plugin.settings.defaultFontFamily = normalizeFontFamilyInput(value);
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Default font size").setDesc("Editor font size in pixels.").addDropdown((dropdown) => {
      [16, 18, 20, 22, 24, 26, 28, 30].forEach((size) => {
        dropdown.addOption(String(size), `${size}px`);
      });
      dropdown.setValue(String(this.plugin.settings.defaultFontSizePx));
      dropdown.onChange(async (value) => {
        this.plugin.settings.defaultFontSizePx = Number(value) || DEFAULT_SETTINGS.defaultFontSizePx;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Default line height").setDesc("Comfortable spacing for long-form writing.").addDropdown((dropdown) => {
      [1.4, 1.5, 1.6, 1.8, 2].forEach((lineHeight) => {
        dropdown.addOption(String(lineHeight), `${lineHeight}x`);
      });
      dropdown.setValue(String(this.plugin.settings.defaultLineHeight));
      dropdown.onChange(async (value) => {
        this.plugin.settings.defaultLineHeight = Number(value) || DEFAULT_SETTINGS.defaultLineHeight;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Show chapter panel by default").setDesc("Display the left-hand chapter list when the workbench opens.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.showChapterPanel).onChange(async (value) => {
        this.plugin.settings.showChapterPanel = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Show stats panel by default").setDesc("Display the right-hand writing statistics panel when the workbench opens.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.showStatsPanel).onChange(async (value) => {
        this.plugin.settings.showStatsPanel = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Remember last opened chapter").setDesc("Restore the most recently opened file when the workbench opens again.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.rememberLastFile).onChange(async (value) => {
        this.plugin.settings.rememberLastFile = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Chapter sort").setDesc("Choose how chapter files are ordered in the left pane.").addDropdown((dropdown) => {
      dropdown.addOption("name", "By path / name").addOption("modified", "By last modified time");
      dropdown.setValue(this.plugin.settings.chapterSort);
      dropdown.onChange(async (value) => {
        this.plugin.settings.chapterSort = value === "modified" ? "modified" : "name";
        await this.plugin.saveSettings();
      });
    });
  }
};
function normalizeRootInput(value) {
  const trimmed = value.trim();
  return trimmed ? (0, import_obsidian.normalizePath)(trimmed) : "";
}
function normalizeFontFamilyInput(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.includes(",") || trimmed.startsWith('"') || trimmed.startsWith("'")) {
    return trimmed;
  }
  return `"${trimmed.replace(/"/g, '\\"')}"`;
}

// src/views/WorkbenchView.ts
var import_obsidian3 = require("obsidian");

// src/data/randomNameData.ts
var RANDOM_NAME_GROUPS = [
  { id: "person", label: "\u4EBA\u540D" },
  { id: "place", label: "\u5730\u540D" },
  { id: "school", label: "\u5B66\u6821" }
];
var RANDOM_NAME_CATEGORIES = [
  { id: "person.chinese.modern", group: "person", label: "\u73B0\u4EE3\u4E2D\u6587\u4EBA\u540D", hint: "\u504F\u65E5\u5E38\u3001\u73B0\u5B9E\u9898\u6750\u7684\u4EBA\u7269\u540D\uFF0C\u9ED8\u8BA4\u4F7F\u7528\u5E38\u89C1\u59D3\u6C0F\u548C\u66F4\u73B0\u4EE3\u7684\u540D\u5B57\u3002", generator: "chinesePerson" },
  { id: "person.chinese.ancient", group: "person", label: "\u53E4\u98CE\u4E2D\u6587\u4EBA\u540D", hint: "\u9002\u5408\u53E4\u4EE3\u3001\u4ED9\u4FA0\u6216\u5E7B\u60F3\u9898\u6750\uFF0C\u5305\u542B\u590D\u59D3\u548C\u66F4\u6587\u5B66\u611F\u7684\u540D\u5B57\u3002", generator: "chinesePerson" },
  { id: "person.english", group: "person", label: "\u82F1\u6587\u4EBA\u540D", hint: "\u9002\u5408\u897F\u5E7B\u3001\u6D77\u5916\u80CC\u666F\u6216\u82F1\u6587\u89D2\u8272\u540D\u3002", generator: "englishPerson" },
  { id: "place.ancient", group: "place", label: "\u53E4\u4EE3\u5730\u540D", hint: "\u5DDE\u90E1\u3001\u57CE\u5173\u3001\u5C71\u5DDD\u3001\u5BAB\u89C2\u7B49\u53E4\u98CE\u5730\u540D\u3002", generator: "compoundPlace" },
  { id: "place.modern.city", group: "place", label: "\u57CE\u5E02 / \u533A\u57DF", hint: "\u57CE\u5E02\u3001\u533A\u53BF\u3001\u6E2F\u6E7E\u3001\u65B0\u533A\u7B49\u73B0\u4EE3\u5730\u540D\u3002", generator: "compoundPlace" },
  { id: "place.modern.street", group: "place", label: "\u8857\u9053 / \u7AD9\u70B9", hint: "\u8DEF\u3001\u8857\u3001\u5DF7\u3001\u6865\u3001\u7AD9\u70B9\u3001\u5E7F\u573A\u7B49\u65E5\u5E38\u573A\u666F\u3002", generator: "compoundPlace" },
  { id: "place.modern.community", group: "place", label: "\u5C0F\u533A / \u793E\u533A", hint: "\u82B1\u56ED\u3001\u516C\u5BD3\u3001\u5C0F\u533A\u3001\u793E\u533A\u3001\u82D1\u7B49\u5C45\u4F4F\u5730\u3002", generator: "compoundPlace" },
  { id: "place.modern.landmark", group: "place", label: "\u5730\u6807 / \u8BBE\u65BD", hint: "\u533B\u9662\u3001\u4E66\u5E97\u3001\u516C\u56ED\u3001\u7801\u5934\u3001\u5927\u53A6\u7B49\u516C\u5171\u5730\u70B9\u3002", generator: "compoundPlace" },
  { id: "school.general", group: "school", label: "\u5B66\u6821\u901A\u7528", hint: "\u76F4\u63A5\u751F\u6210\u5B66\u6821\u3001\u5B9E\u9A8C\u5B66\u6821\u3001\u56FD\u9645\u5B66\u6821\u7B49\u540D\u79F0\u3002", generator: "school" },
  { id: "school.primary", group: "school", label: "\u5C0F\u5B66", hint: "\u5C0F\u5B66\u3001\u5B9E\u9A8C\u5C0F\u5B66\u3001\u4E2D\u5FC3\u5C0F\u5B66\u7B49\u540D\u79F0\u3002", generator: "school" },
  { id: "school.middle", group: "school", label: "\u4E2D\u5B66 / \u9AD8\u4E2D", hint: "\u4E2D\u5B66\u3001\u9AD8\u7EA7\u4E2D\u5B66\u3001\u5916\u56FD\u8BED\u5B66\u6821\u7B49\u540D\u79F0\u3002", generator: "school" },
  { id: "school.university", group: "school", label: "\u5927\u5B66 / \u5B66\u9662", hint: "\u5927\u5B66\u3001\u5B66\u9662\u3001\u804C\u4E1A\u6280\u672F\u5B66\u9662\u3001\u5E08\u8303\u5B66\u9662\u7B49\u540D\u79F0\u3002", generator: "school" },
  { id: "school.academy", group: "school", label: "\u5B66\u9662 / \u5B66\u5E9C", hint: "\u4E66\u9662\u3001\u5B66\u5E9C\u3001\u7814\u7A76\u9662\u3001\u827A\u672F\u5B66\u9662\u7B49\u540D\u79F0\u3002", generator: "school" }
];
var CHINESE_PERSON_NAME_POOLS = {
  "person.chinese.modern": {
    singleSurnames: [
      "\u738B",
      "\u674E",
      "\u5F20",
      "\u5218",
      "\u9648",
      "\u6768",
      "\u8D75",
      "\u9EC4",
      "\u5468",
      "\u5434",
      "\u5F90",
      "\u5B59",
      "\u80E1",
      "\u6731",
      "\u9AD8",
      "\u6797",
      "\u4F55",
      "\u90ED",
      "\u9A6C",
      "\u7F57",
      "\u6881",
      "\u5B8B",
      "\u90D1",
      "\u8C22",
      "\u97E9",
      "\u5510",
      "\u8BB8",
      "\u9093",
      "\u51AF",
      "\u66F9",
      "\u66FE",
      "\u5F6D",
      "\u8427",
      "\u8521",
      "\u6F58",
      "\u7530",
      "\u8463",
      "\u8881",
      "\u4E8E",
      "\u4F59",
      "\u53F6",
      "\u848B",
      "\u675C",
      "\u82CF",
      "\u9B4F",
      "\u7A0B",
      "\u5415",
      "\u4E01",
      "\u6C88",
      "\u4EFB",
      "\u59DA",
      "\u5362",
      "\u59DC",
      "\u5D14",
      "\u949F",
      "\u8C2D",
      "\u9646",
      "\u6C6A",
      "\u8303",
      "\u91D1",
      "\u77F3",
      "\u5ED6",
      "\u8D3E",
      "\u590F",
      "\u97E6",
      "\u4ED8",
      "\u65B9",
      "\u767D",
      "\u90B9",
      "\u5B5F",
      "\u718A",
      "\u79E6",
      "\u90B1",
      "\u6C5F",
      "\u5C39",
      "\u859B",
      "\u95EB",
      "\u6BB5",
      "\u96F7",
      "\u4FAF"
    ],
    oneCharGivenNames: [
      "\u660E",
      "\u534E",
      "\u4F1F",
      "\u5F3A",
      "\u78CA",
      "\u6D0B",
      "\u6770",
      "\u6D9B",
      "\u5B87",
      "\u6D69",
      "\u6668",
      "\u7136",
      "\u5B81",
      "\u6B23",
      "\u60A6",
      "\u5A77",
      "\u654F",
      "\u9759",
      "\u6D01",
      "\u4F73",
      "\u6021",
      "\u6DB5",
      "\u742A",
      "\u777F",
      "\u822A",
      "\u8F69",
      "\u8FB0",
      "\u6CFD",
      "\u9633",
      "\u535A",
      "\u6587",
      "\u660A",
      "\u5F64",
      "\u598D",
      "\u7433",
      "\u5A1C",
      "\u9896",
      "\u7476",
      "\u6674",
      "\u96EA",
      "\u83F2",
      "\u840C",
      "\u4E50",
      "\u5B89",
      "\u5609",
      "\u4E00",
      "\u53EF",
      "\u8BFA",
      "\u601D",
      "\u82E5",
      "\u827A",
      "\u6615",
      "\u96E8",
      "\u5B50",
      "\u8FDC",
      "\u8BDA",
      "\u51EF",
      "\u6960",
      "\u5DDD",
      "\u5B81",
      "\u4E54",
      "\u6E05",
      "\u683C",
      "\u590F"
    ],
    twoCharGivenNames: [
      "\u5B50\u6DB5",
      "\u96E8\u6850",
      "\u6893\u8431",
      "\u4E00\u8BFA",
      "\u601D\u6E90",
      "\u5609\u6021",
      "\u6D69\u7136",
      "\u5B87\u822A",
      "\u6668\u66E6",
      "\u6B23\u6021",
      "\u4F73\u5B81",
      "\u660E\u8F69",
      "\u5B50\u58A8",
      "\u82E5\u66E6",
      "\u8BED\u6668",
      "\u8BD7\u6DB5",
      "\u6893\u6674",
      "\u5B50\u8F69",
      "\u96E8\u6CFD",
      "\u5609\u61FF",
      "\u601D\u742A",
      "\u68A6\u7476",
      "\u8BED\u5AE3",
      "\u4E00\u9E23",
      "\u4FCA\u6770",
      "\u535A\u6587",
      "\u6D69\u5B87",
      "\u6893\u777F",
      "\u6668\u9633",
      "\u660A\u7136",
      "\u6CFD\u5B87",
      "\u4E66\u7476",
      "\u53EF\u6B23",
      "\u4F73\u6021",
      "\u96E8\u6B23",
      "\u82E5\u6DB5",
      "\u601D\u96E8",
      "\u5B50\u6602",
      "\u4EA6\u8FB0",
      "\u5609\u5B81",
      "\u5B89\u742A",
      "\u745E\u6CFD",
      "\u666F\u884C",
      "\u77E5\u590F",
      "\u6E05\u626C",
      "\u5357\u4E54",
      "\u661F\u7136",
      "\u4E91\u8212"
    ]
  },
  "person.chinese.ancient": {
    singleSurnames: [
      "\u59EC",
      "\u8C22",
      "\u8427",
      "\u6C88",
      "\u88F4",
      "\u9646",
      "\u6E29",
      "\u67F3",
      "\u987E",
      "\u5D14",
      "\u664F",
      "\u5BB9",
      "\u71D5",
      "\u695A",
      "\u4E91",
      "\u82CF",
      "\u79E6",
      "\u5B8B",
      "\u536B",
      "\u970D",
      "\u51CC",
      "\u6D1B",
      "\u767D",
      "\u53F6",
      "\u82B1",
      "\u5510",
      "\u5B5F",
      "\u675C",
      "\u859B",
      "\u4E54",
      "\u962E",
      "\u84DD",
      "\u6155",
      "\u5546",
      "\u989C",
      "\u541B",
      "\u7EAA",
      "\u95FB",
      "\u949F",
      "\u51E4",
      "\u666F",
      "\u59DC",
      "\u6C5F",
      "\u5085",
      "\u97E9",
      "\u987E",
      "\u8BB8",
      "\u6797"
    ],
    compoundSurnames: [
      "\u53F8\u9A6C",
      "\u4E0A\u5B98",
      "\u6B27\u9633",
      "\u590F\u4FAF",
      "\u8BF8\u845B",
      "\u95FB\u4EBA",
      "\u4E1C\u65B9",
      "\u8D6B\u8FDE",
      "\u7687\u752B",
      "\u5C09\u8FDF",
      "\u6FB9\u53F0",
      "\u516C\u5B59",
      "\u8F69\u8F95",
      "\u4EE4\u72D0",
      "\u949F\u79BB",
      "\u5B87\u6587",
      "\u957F\u5B59",
      "\u6155\u5BB9",
      "\u53F8\u5F92",
      "\u53F8\u7A7A",
      "\u5357\u5BAB",
      "\u767E\u91CC",
      "\u7B2C\u4E94",
      "\u897F\u95E8"
    ],
    oneCharGivenNames: [
      "\u4E88",
      "\u73A6",
      "\u73E9",
      "\u749F",
      "\u664F",
      "\u662D",
      "\u8F9E",
      "\u781A",
      "\u8605",
      "\u6F88",
      "\u6D35",
      "\u73DE",
      "\u7FCA",
      "\u884D",
      "\u747E",
      "\u745C",
      "\u8861",
      "\u9701",
      "\u9065",
      "\u68E0",
      "\u6F9C",
      "\u821F",
      "\u7720",
      "\u5C18",
      "\u96BD",
      "\u69FF",
      "\u70EC",
      "\u65FB",
      "\u7948",
      "\u6654",
      "\u7422",
      "\u73A5",
      "\u6D04",
      "\u6C50",
      "\u7EFE",
      "\u5F26",
      "\u6816",
      "\u5EAD",
      "\u7AF9",
      "\u9E64",
      "\u96EA",
      "\u6E21",
      "\u6EAA",
      "\u6D32",
      "\u5C7F",
      "\u7B60",
      "\u82B7",
      "\u68F9"
    ],
    twoCharGivenNames: [
      "\u6E05\u664F",
      "\u6000\u747E",
      "\u77E5\u5FAE",
      "\u666F\u884C",
      "\u7167\u591C",
      "\u4E91\u8212",
      "\u96EA\u8605",
      "\u4E34\u5DDD",
      "\u671B\u8212",
      "\u957F\u5E9A",
      "\u9752\u8861",
      "\u95FB\u6EAA",
      "\u5F52\u8F9E",
      "\u5357\u679D",
      "\u5317\u8FB0",
      "\u6298\u6708",
      "\u542C\u6F9C",
      "\u6276\u5149",
      "\u660E\u73E9",
      "\u758F\u6850",
      "\u7167\u96EA",
      "\u95EE\u821F",
      "\u77E5\u8BB8",
      "\u6000\u8FDC",
      "\u4E91\u6816",
      "\u6708\u767D",
      "\u661F\u56DE",
      "\u9701\u5DDD",
      "\u9752\u68E0",
      "\u58A8\u8F9E",
      "\u5EAD\u7B60",
      "\u9065\u591C",
      "\u89C2\u6F9C",
      "\u60CA\u9E3F",
      "\u781A\u79CB",
      "\u662D\u660E"
    ]
  }
};
var ENGLISH_FIRST_NAMES = [
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
  "Adrian",
  "Beatrice",
  "Celine",
  "Cedric",
  "Dorian",
  "Elena",
  "Emery",
  "Freya",
  "Gideon",
  "Helena",
  "Isla",
  "Jasper",
  "Lucian",
  "Lyra",
  "Maeve",
  "Miles",
  "Nolan",
  "Ophelia",
  "Phoebe",
  "Quentin",
  "Rosalie",
  "Silas",
  "Tessa",
  "Vivian",
  "Wesley",
  "Yvette"
];
var ENGLISH_LAST_NAMES = [
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
  "Bennett",
  "Caldwell",
  "Darcy",
  "Ellington",
  "Frost",
  "Grayson",
  "Harrington",
  "Kensington",
  "Langley",
  "Monroe",
  "North",
  "Pembroke",
  "Rivers",
  "Sutton",
  "Thorne",
  "Vale",
  "Westbrook",
  "Winslow"
];
var COMPOUND_PLACE_POOLS = {
  "place.ancient": {
    prefixes: ["\u9752", "\u4E91", "\u957F", "\u5BD2", "\u843D", "\u671B", "\u5F52", "\u6276", "\u767D", "\u7384", "\u6731", "\u788E", "\u542C", "\u85CF", "\u4E5D", "\u5343", "\u7167", "\u6F9C", "\u9E64", "\u6816", "\u82CD", "\u96EA", "\u6708", "\u9E23", "\u9010", "\u6000", "\u6E21", "\u7075", "\u7389", "\u6276\u6851", "\u4E34\u5DDD", "\u5F52\u96C1", "\u9E7F\u9E23", "\u9752\u5D16", "\u767D\u77F3", "\u6CA7\u6D6A", "\u7167\u591C"],
    suffixes: ["\u5DDE", "\u90E1", "\u57CE", "\u5173", "\u6E21", "\u8C37", "\u5C71", "\u5DDD", "\u9675", "\u53F0", "\u5BAB", "\u89C2", "\u9601", "\u575E", "\u6CFD", "\u539F", "\u5761", "\u5DF7", "\u9547", "\u6865", "\u574A", "\u6D32", "\u6D66", "\u6D25", "\u9A7F", "\u5EAD", "\u82D1", "\u5CF0", "\u5CE1", "\u6CC9"]
  },
  "place.modern.city": {
    prefixes: ["\u661F\u6D77", "\u5357\u5CB8", "\u5317\u57CE", "\u65B0\u5DDD", "\u4E91\u6E2F", "\u6F9C\u6E7E", "\u9E7F\u9E23", "\u9752\u79BE", "\u671B\u6C5F", "\u4E34\u5B89", "\u6D77\u68E0", "\u9526\u7A0B", "\u4E1C\u5E8F", "\u897F\u6D32", "\u957F\u5B81", "\u660E\u6E56", "\u79CB\u6D66", "\u6674\u5DDD", "\u6708\u6E7E", "\u6C5F\u4E34", "\u677E\u5EAD", "\u4E91\u6816", "\u82B1\u5C7F", "\u94F6\u6C99", "\u767D\u9E6D", "\u5357\u6C40"],
    suffixes: ["\u5E02", "\u533A", "\u53BF", "\u9547", "\u65B0\u533A", "\u6E7E", "\u6E2F", "\u5C9B", "\u57CE", "\u65B0\u57CE", "\u5F00\u53D1\u533A", "\u9AD8\u65B0\u533A", "\u6EE8\u6D77\u533A", "\u4E2D\u5FC3\u533A", "\u5317\u533A", "\u5357\u533A"]
  },
  "place.modern.street": {
    prefixes: ["\u661F\u6D77", "\u5357\u5CB8", "\u5317\u57CE", "\u65B0\u5DDD", "\u9E7F\u9E23", "\u9752\u79BE", "\u671B\u6C5F", "\u6D77\u68E0", "\u9526\u7A0B", "\u4E1C\u5E8F", "\u897F\u6D32", "\u957F\u5B81", "\u660E\u6E56", "\u6674\u5DDD", "\u94F6\u674F", "\u6800\u5B50", "\u68A7\u6850", "\u6842\u82B1", "\u6625\u5C71", "\u5357\u98CE", "\u4E91\u6749", "\u6708\u89C1", "\u767D\u9732", "\u671D\u9633"],
    suffixes: ["\u8DEF", "\u8857", "\u5DF7", "\u5927\u9053", "\u5357\u8DEF", "\u5317\u8DEF", "\u4E1C\u8DEF", "\u897F\u8DEF", "\u7AD9", "\u6865", "\u5E7F\u573A", "\u6B65\u884C\u8857", "\u5929\u6865", "\u5730\u94C1\u7AD9", "\u516C\u4EA4\u7AD9", "\u5341\u5B57\u8DEF\u53E3"]
  },
  "place.modern.community": {
    prefixes: ["\u661F\u6D77", "\u5357\u5CB8", "\u5317\u57CE", "\u65B0\u5DDD", "\u6F9C\u6E7E", "\u9E7F\u9E23", "\u9752\u79BE", "\u671B\u6C5F", "\u6D77\u68E0", "\u9526\u7A0B", "\u957F\u5B81", "\u660E\u6E56", "\u6674\u5DDD", "\u4E91\u6816", "\u6708\u6E7E", "\u6625\u6C5F", "\u9752\u67E0", "\u677E\u95F4", "\u82B1\u95F4", "\u767D\u9E6D", "\u9526\u7EE3", "\u534A\u5C71"],
    suffixes: ["\u82B1\u56ED", "\u516C\u5BD3", "\u5C0F\u533A", "\u793E\u533A", "\u82D1", "\u91CC", "\u5E9C", "\u5EAD", "\u5C45", "\u6E7E", "\u5C71\u5E84", "\u65B0\u6751", "\u5BB6\u56ED", "\u96C5\u82D1", "\u540D\u90B8", "\u516C\u9986"]
  },
  "place.modern.landmark": {
    prefixes: ["\u661F\u6D77", "\u5357\u5CB8", "\u5317\u57CE", "\u65B0\u5DDD", "\u4E91\u6E2F", "\u6F9C\u6E7E", "\u9E7F\u9E23", "\u9752\u79BE", "\u671B\u6C5F", "\u4E34\u5B89", "\u6D77\u68E0", "\u9526\u7A0B", "\u957F\u5B81", "\u660E\u6E56", "\u6674\u5DDD", "\u767D\u9E6D", "\u677E\u5EAD", "\u4E91\u6816", "\u94F6\u6C99", "\u6625\u5C71", "\u79CB\u6D66", "\u5357\u6C40"],
    suffixes: ["\u533B\u9662", "\u4E66\u5E97", "\u5F71\u57CE", "\u5927\u53A6", "\u516C\u56ED", "\u7801\u5934", "\u56FE\u4E66\u9986", "\u7F8E\u672F\u9986", "\u535A\u7269\u9986", "\u4F53\u80B2\u9986", "\u97F3\u4E50\u5385", "\u5267\u9662", "\u5496\u5561\u9986", "\u5546\u573A", "\u4F1A\u5C55\u4E2D\u5FC3", "\u5199\u5B57\u697C"]
  }
};
var SCHOOL_PREFIXES = [
  "\u660E\u5FB7",
  "\u542F\u660E",
  "\u80B2\u624D",
  "\u6811\u4EBA",
  "\u5F18\u6587",
  "\u77E5\u884C",
  "\u535A\u96C5",
  "\u884C\u77E5",
  "\u683C\u81F4",
  "\u6C42\u771F",
  "\u81F4\u8FDC",
  "\u7ACB\u8BDA",
  "\u4FEE\u8FDC",
  "\u5D07\u6587",
  "\u5C1A\u5FB7",
  "\u6000\u8FDC",
  "\u9752\u79BE",
  "\u661F\u6D77",
  "\u9E7F\u9E23",
  "\u6674\u5DDD",
  "\u660E\u6E56",
  "\u5357\u5C71",
  "\u671B\u6C5F",
  "\u4E91\u5DDD",
  "\u6D77\u68E0",
  "\u9526\u7A0B",
  "\u957F\u5B81",
  "\u4E34\u5B89",
  "\u767D\u9E6D",
  "\u677E\u5EAD",
  "\u4E91\u6816",
  "\u6625\u5C71",
  "\u7B2C\u4E00",
  "\u7B2C\u4E8C",
  "\u7B2C\u4E09",
  "\u5B9E\u9A8C",
  "\u5916\u56FD\u8BED",
  "\u53CC\u8BED",
  "\u56FD\u9645",
  "\u9644\u5C5E",
  "\u8054\u5408",
  "\u672A\u6765",
  "\u65B0\u57CE",
  "\u5317\u57CE",
  "\u5357\u5CB8",
  "\u897F\u6D32",
  "\u4E1C\u5E8F",
  "\u660E\u73E0"
];
var SCHOOL_MODIFIERS = ["", "\u5B9E\u9A8C", "\u5916\u56FD\u8BED", "\u53CC\u8BED", "\u56FD\u9645", "\u9644\u5C5E", "\u827A\u672F", "\u79D1\u6280", "\u5E08\u8303", "\u804C\u4E1A", "\u4EBA\u6587", "\u672A\u6765"];
var SCHOOL_SUFFIXES = {
  "school.general": ["\u5B66\u6821", "\u5B9E\u9A8C\u5B66\u6821", "\u56FD\u9645\u5B66\u6821", "\u53CC\u8BED\u5B66\u6821", "\u5916\u56FD\u8BED\u5B66\u6821", "\u9644\u5C5E\u5B66\u6821", "\u672A\u6765\u5B66\u6821"],
  "school.primary": ["\u5C0F\u5B66", "\u5B9E\u9A8C\u5C0F\u5B66", "\u4E2D\u5FC3\u5C0F\u5B66", "\u7B2C\u4E00\u5C0F\u5B66", "\u7B2C\u4E8C\u5C0F\u5B66", "\u5916\u56FD\u8BED\u5C0F\u5B66", "\u9644\u5C5E\u5C0F\u5B66"],
  "school.middle": ["\u4E2D\u5B66", "\u9AD8\u7EA7\u4E2D\u5B66", "\u5B9E\u9A8C\u4E2D\u5B66", "\u7B2C\u4E00\u4E2D\u5B66", "\u7B2C\u4E8C\u4E2D\u5B66", "\u5916\u56FD\u8BED\u5B66\u6821", "\u9644\u5C5E\u4E2D\u5B66", "\u9AD8\u4E2D"],
  "school.university": ["\u5927\u5B66", "\u5B66\u9662", "\u5E08\u8303\u5B66\u9662", "\u804C\u4E1A\u6280\u672F\u5B66\u9662", "\u79D1\u6280\u5927\u5B66", "\u7406\u5DE5\u5B66\u9662", "\u827A\u672F\u5B66\u9662", "\u533B\u5B66\u9662"],
  "school.academy": ["\u4E66\u9662", "\u5B66\u5E9C", "\u5B66\u9662", "\u7814\u7A76\u9662", "\u827A\u672F\u5B66\u9662", "\u97F3\u4E50\u5B66\u9662", "\u6587\u5B66\u9986", "\u7814\u4FEE\u9662"]
};

// src/services/RandomNameService.ts
var DEFAULT_CATEGORY_ID = "person.chinese.modern";
function createDefaultRandomNameOptions() {
  return {
    group: "person",
    categoryId: DEFAULT_CATEGORY_ID,
    chineseNameLength: 2
  };
}
function listRandomNameGroups() {
  return RANDOM_NAME_GROUPS;
}
function listRandomNameCategories(group) {
  return RANDOM_NAME_CATEGORIES.filter((category) => category.group === group);
}
function getRandomNameCategory(categoryId) {
  return findCategory(categoryId) ?? findCategory(DEFAULT_CATEGORY_ID);
}
function normalizeRandomNameOptions(options) {
  const category = findCategory(options.categoryId);
  if (!category || category.group !== options.group) {
    const fallbackCategory = listRandomNameCategories(options.group)[0] ?? getRandomNameCategory(DEFAULT_CATEGORY_ID);
    return {
      group: fallbackCategory.group,
      categoryId: fallbackCategory.id,
      chineseNameLength: normalizeChineseNameLength(options.chineseNameLength)
    };
  }
  return {
    group: options.group,
    categoryId: category.id,
    chineseNameLength: normalizeChineseNameLength(options.chineseNameLength)
  };
}
function generateRandomNames(options, count = 12) {
  const normalizedOptions = normalizeRandomNameOptions(options);
  const names = /* @__PURE__ */ new Set();
  const limit = Math.max(1, count);
  let attempts = 0;
  while (names.size < limit && attempts < limit * 50) {
    attempts += 1;
    names.add(generateOne(normalizedOptions));
  }
  return Array.from(names);
}
function generateOne(options) {
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
function generateChinesePersonName(categoryId, length) {
  const pool = CHINESE_PERSON_NAME_POOLS[isChinesePersonCategory(categoryId) ? categoryId : DEFAULT_CATEGORY_ID];
  if (length === 2) {
    return `${pick(pool.singleSurnames)}${pick(pool.oneCharGivenNames)}`;
  }
  if (pool.compoundSurnames && Math.random() < 0.45) {
    return `${pick(pool.compoundSurnames)}${pick(pool.oneCharGivenNames)}`;
  }
  return `${pick(pool.singleSurnames)}${pick(pool.twoCharGivenNames)}`;
}
function generateCompoundPlaceName(categoryId, generator) {
  if (generator !== "compoundPlace") {
    throw new Error(`Unsupported compound place generator: ${generator}`);
  }
  if (!isCompoundPlaceCategory(categoryId)) {
    return generateCompoundPlaceName("place.ancient", "compoundPlace");
  }
  const pool = COMPOUND_PLACE_POOLS[categoryId];
  return `${pick(pool.prefixes)}${pick(pool.suffixes)}`;
}
function generateSchoolName(categoryId) {
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
function findCategory(categoryId) {
  return RANDOM_NAME_CATEGORIES.find((category) => category.id === categoryId);
}
function normalizeChineseNameLength(length) {
  return length === 3 ? 3 : 2;
}
function isChinesePersonCategory(categoryId) {
  return categoryId in CHINESE_PERSON_NAME_POOLS;
}
function isCompoundPlaceCategory(categoryId) {
  return categoryId in COMPOUND_PLACE_POOLS;
}
function isSchoolCategory(categoryId) {
  return categoryId in SCHOOL_SUFFIXES;
}
function pick(items) {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === void 0) {
    throw new Error("Cannot pick from an empty list.");
  }
  return item;
}

// src/services/TimeMachineService.ts
var import_obsidian2 = require("obsidian");
var BACKUP_FOLDER_NAME = "\u5907\u4EFD";
var AUTO_SNAPSHOT_INTERVAL_WORDS = 500;
var AUTO_SNAPSHOT_MIN_INTERVAL_MS = 2 * 60 * 1e3;
var MAX_AUTO_SNAPSHOTS_PER_FILE = 30;
async function maybeCreateTimeMachineSnapshot(plugin, file, currentText, lastSnapshotWords, lastSnapshotCreatedAt) {
  const currentState = {
    wordCount: lastSnapshotWords,
    createdAt: lastSnapshotCreatedAt,
    created: false
  };
  if (!file) {
    return currentState;
  }
  const currentWords = countWritingCharacters(currentText);
  if (currentWords <= 0) {
    return currentState;
  }
  const now = Date.now();
  const today = formatDateStamp(now);
  if (!await hasDailySnapshotForDate(plugin, file, today)) {
    const dailySnapshot = await createTimeMachineSnapshot(plugin, file, currentText, {
      kind: "daily",
      wordCount: currentWords,
      createdAt: now
    });
    return {
      wordCount: dailySnapshot.wordCount,
      createdAt: dailySnapshot.createdAt,
      created: true
    };
  }
  if (currentWords - lastSnapshotWords < AUTO_SNAPSHOT_INTERVAL_WORDS) {
    return currentState;
  }
  if (lastSnapshotCreatedAt > 0 && now - lastSnapshotCreatedAt < AUTO_SNAPSHOT_MIN_INTERVAL_MS) {
    return currentState;
  }
  const autoSnapshot = await createTimeMachineSnapshot(plugin, file, currentText, {
    kind: "auto",
    wordCount: currentWords,
    createdAt: now
  });
  await pruneOldAutoSnapshots(plugin, file);
  return {
    wordCount: autoSnapshot.wordCount,
    createdAt: autoSnapshot.createdAt,
    created: true
  };
}
async function createTimeMachineSnapshot(plugin, file, text, options = {}) {
  const folderPath = await ensureChapterBackupFolder(plugin, file);
  const createdAt = options.createdAt ?? Date.now();
  const wordCount = options.wordCount ?? countWritingCharacters(text);
  const kind = options.kind ?? "manual";
  const snapshotPath = await getUniqueSnapshotPath(plugin, folderPath, kind, createdAt, wordCount);
  await plugin.app.vault.create(snapshotPath, text);
  return {
    path: snapshotPath,
    createdAt,
    wordCount,
    originalPath: file.path,
    kind
  };
}
function getBackupFolderPath(file) {
  const parentPath = file.parent?.path;
  return (0, import_obsidian2.normalizePath)(parentPath && parentPath !== "/" ? `${parentPath}/${BACKUP_FOLDER_NAME}` : BACKUP_FOLDER_NAME);
}
function getChapterBackupFolderPath(file) {
  return (0, import_obsidian2.normalizePath)(`${getBackupFolderPath(file)}/${sanitizeFileName(file.basename)}`);
}
function countWritingCharacters(text) {
  return Array.from(text.replace(/\s+/g, "")).length;
}
async function listTimeMachineSnapshots(plugin, file) {
  if (!file) {
    return [];
  }
  return [...listLegacySnapshots(plugin, file), ...listChapterSnapshots(plugin, file)].sort(
    (left, right) => right.createdAt - left.createdAt
  );
}
async function buildSnapshotDiff(plugin, snapshot, currentText) {
  const snapshotText = await plugin.app.vault.cachedRead(snapshot);
  return diffLines(snapshotText, currentText);
}
function diffLines(previousText, currentText) {
  const previousLines = previousText.split("\n");
  const currentLines = currentText.split("\n");
  const rows = previousLines.length + 1;
  const columns = currentLines.length + 1;
  const table = Array.from({ length: rows }, () => Array.from({ length: columns }, () => 0));
  for (let row2 = previousLines.length - 1; row2 >= 0; row2 -= 1) {
    for (let column2 = currentLines.length - 1; column2 >= 0; column2 -= 1) {
      table[row2][column2] = previousLines[row2] === currentLines[column2] ? table[row2 + 1][column2 + 1] + 1 : Math.max(table[row2 + 1][column2], table[row2][column2 + 1]);
    }
  }
  const result = [];
  let row = 0;
  let column = 0;
  while (row < previousLines.length && column < currentLines.length) {
    if (previousLines[row] === currentLines[column]) {
      result.push({ kind: "same", text: previousLines[row] });
      row += 1;
      column += 1;
    } else if (table[row + 1][column] >= table[row][column + 1]) {
      result.push({ kind: "removed", text: previousLines[row] });
      row += 1;
    } else {
      result.push({ kind: "added", text: currentLines[column] });
      column += 1;
    }
  }
  while (row < previousLines.length) {
    result.push({ kind: "removed", text: previousLines[row] });
    row += 1;
  }
  while (column < currentLines.length) {
    result.push({ kind: "added", text: currentLines[column] });
    column += 1;
  }
  return result;
}
async function ensureChapterBackupFolder(plugin, file) {
  const rootFolderPath = getBackupFolderPath(file);
  await ensureFolder(plugin, rootFolderPath);
  const chapterFolderPath = getChapterBackupFolderPath(file);
  await ensureFolder(plugin, chapterFolderPath);
  return chapterFolderPath;
}
async function ensureFolder(plugin, folderPath) {
  const existing = plugin.app.vault.getAbstractFileByPath(folderPath);
  if (existing) {
    return;
  }
  await plugin.app.vault.createFolder(folderPath);
}
function listLegacySnapshots(plugin, file) {
  const folder = plugin.app.vault.getAbstractFileByPath(getBackupFolderPath(file));
  if (!(folder instanceof import_obsidian2.TFolder)) {
    return [];
  }
  const prefix = `${sanitizeFileName(file.basename)}__`;
  return folder.children.filter((child) => child instanceof import_obsidian2.TFile && child.name.startsWith(prefix) && child.name.endsWith(".md")).map((snapshot) => ({
    path: snapshot.path,
    createdAt: snapshot.stat.ctime,
    wordCount: readWordCountFromSnapshotName(snapshot.basename),
    originalPath: file.path,
    kind: "legacy"
  }));
}
function listChapterSnapshots(plugin, file) {
  const folder = plugin.app.vault.getAbstractFileByPath(getChapterBackupFolderPath(file));
  if (!(folder instanceof import_obsidian2.TFolder)) {
    return [];
  }
  return folder.children.filter((child) => child instanceof import_obsidian2.TFile && child.extension === "md").map((snapshot) => ({
    path: snapshot.path,
    createdAt: snapshot.stat.ctime,
    wordCount: readWordCountFromSnapshotName(snapshot.basename),
    originalPath: file.path,
    kind: readSnapshotKindFromName(snapshot.basename)
  }));
}
async function hasDailySnapshotForDate(plugin, file, dateStamp) {
  const folder = plugin.app.vault.getAbstractFileByPath(getChapterBackupFolderPath(file));
  if (!(folder instanceof import_obsidian2.TFolder)) {
    return false;
  }
  return folder.children.some(
    (child) => child instanceof import_obsidian2.TFile && child.basename.startsWith(`daily__${dateStamp}__`) && child.extension === "md"
  );
}
async function pruneOldAutoSnapshots(plugin, file) {
  const folder = plugin.app.vault.getAbstractFileByPath(getChapterBackupFolderPath(file));
  if (!(folder instanceof import_obsidian2.TFolder)) {
    return;
  }
  const autoSnapshots = folder.children.filter((child) => child instanceof import_obsidian2.TFile && child.basename.startsWith("auto__") && child.extension === "md").sort((left, right) => right.stat.ctime - left.stat.ctime);
  const expiredSnapshots = autoSnapshots.slice(MAX_AUTO_SNAPSHOTS_PER_FILE);
  for (const snapshot of expiredSnapshots) {
    await plugin.app.vault.delete(snapshot);
  }
}
async function getUniqueSnapshotPath(plugin, folderPath, kind, createdAt, wordCount) {
  const timestamp = kind === "daily" ? formatDateStamp(createdAt) : formatTimestamp(createdAt);
  const baseName = `${kind}__${timestamp}__${wordCount}\u5B57`;
  let snapshotPath = (0, import_obsidian2.normalizePath)(`${folderPath}/${baseName}.md`);
  let counter = 2;
  while (plugin.app.vault.getAbstractFileByPath(snapshotPath)) {
    snapshotPath = (0, import_obsidian2.normalizePath)(`${folderPath}/${baseName}-${counter}.md`);
    counter += 1;
  }
  return snapshotPath;
}
function readWordCountFromSnapshotName(name) {
  const match = name.match(/__(\d+)字(?:-\d+)?$/);
  return match ? Number(match[1]) : 0;
}
function readSnapshotKindFromName(name) {
  if (name.startsWith("auto__")) {
    return "auto";
  }
  if (name.startsWith("daily__")) {
    return "daily";
  }
  if (name.startsWith("manual__")) {
    return "manual";
  }
  return "legacy";
}
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
function formatDateStamp(timestamp) {
  const date = new Date(timestamp);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}
function sanitizeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}

// src/services/StatsService.ts
var CJK_CHAR_REGEX = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
var LATIN_WORD_REGEX = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;
var HEADING_REGEX = /^#{1,6}\s+/gm;
function computeWritingStats(text) {
  const characters = Array.from(text).length;
  const charactersNoSpaces = Array.from(text.replace(/\s+/g, "")).length;
  const cjkMatches = text.match(CJK_CHAR_REGEX) ?? [];
  const latinMatches = text.match(LATIN_WORD_REGEX) ?? [];
  const paragraphs = text.split(/\n\s*\n/g).map((paragraph) => paragraph.trim()).filter(Boolean).length;
  const headings = (text.match(HEADING_REGEX) ?? []).length;
  const words = cjkMatches.length + latinMatches.length;
  const readingMinutes = Math.max(1, Math.ceil(words / 300));
  return {
    words,
    characters,
    charactersNoSpaces,
    paragraphs,
    headings,
    readingMinutes
  };
}
function computeTypingSpeed(sessionWords, writingTimeMs) {
  if (sessionWords <= 0 || writingTimeMs <= 0) {
    return 0;
  }
  return Math.round(sessionWords / (writingTimeMs / 6e4));
}
function formatDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1e3));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

// src/utils/formatting.ts
function wrapSelection(value, selectionStart, selectionEnd, wrapper) {
  const selectedText = value.slice(selectionStart, selectionEnd);
  const replacement = `${wrapper}${selectedText}${wrapper}`;
  const nextValue = `${value.slice(0, selectionStart)}${replacement}${value.slice(selectionEnd)}`;
  const cursorStart = selectionStart + wrapper.length;
  const cursorEnd = cursorStart + selectedText.length;
  return {
    value: nextValue,
    selectionStart: cursorStart,
    selectionEnd: cursorEnd
  };
}
function prefixSelectedLines(value, selectionStart, selectionEnd, prefix) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const lineEndIndex = value.indexOf("\n", selectionEnd);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  const block = value.slice(lineStart, lineEnd);
  const transformedBlock = block.split("\n").map((line) => `${prefix}${line}`).join("\n");
  const nextValue = `${value.slice(0, lineStart)}${transformedBlock}${value.slice(lineEnd)}`;
  const delta = transformedBlock.length - block.length;
  return {
    value: nextValue,
    selectionStart: selectionStart + prefix.length,
    selectionEnd: selectionEnd + delta
  };
}

// src/views/WorkbenchView.ts
var PARAGRAPH_INDENT = "\u3000\u3000";
var WORKBENCH_VIEW_TYPE = "watermelon-workbench";
var FONT_PRESETS = [
  "",
  '"LXGW WenKai", "\u971E\u9E5C\u6587\u6977", cursive',
  '"Source Han Serif SC", "Noto Serif SC", SimSun, serif',
  '"Source Han Sans SC", "Noto Sans SC", sans-serif',
  '"Microsoft YaHei", "PingFang SC", sans-serif',
  '"SimSun", "\u5B8B\u4F53", serif',
  '"FangSong", "\u4EFF\u5B8B", serif',
  'Georgia, "Times New Roman", serif'
];
var FONT_SIZE_PRESETS = [16, 18, 20, 22, 24, 26, 28, 30];
var LINE_HEIGHT_PRESETS = [1.4, 1.5, 1.6, 1.8, 2];
var IDLE_THRESHOLD_MS = 5e3;
var MIN_PANEL_WIDTH = 180;
var MAX_PANEL_WIDTH = 480;
var WorkbenchView = class extends import_obsidian3.TextFileView {
  constructor(leaf, plugin) {
    super(leaf);
    this.chapters = [];
    this.selectedChapterPath = null;
    this.scopeMode = "single-file";
    this.scopeRootPath = null;
    this.sessionState = createEmptySessionState();
    this.randomNameOptions = createDefaultRandomNameOptions();
    this.randomNames = [];
    this.activePluginTool = null;
    this.otherChaptersWords = 0;
    this.novelTotalWords = 0;
    this.timeMachineSnapshots = [];
    this.lastSnapshotWords = 0;
    this.lastSnapshotCreatedAt = 0;
    this.snapshotSaveInFlight = false;
    this.caretMirrorEl = null;
    this.plugin = plugin;
    this.chapterPanelVisible = plugin.settings.showChapterPanel;
    this.statsPanelVisible = plugin.settings.showStatsPanel;
    this.chapterPanelWidth = plugin.settings.chapterPanelWidth;
    this.statsPanelWidth = plugin.settings.statsPanelWidth;
    this.activeFontFamily = plugin.settings.defaultFontFamily;
    this.activeFontSizePx = plugin.settings.defaultFontSizePx;
    this.activeLineHeight = plugin.settings.defaultLineHeight;
    this.autoIndentEnabled = plugin.settings.autoParagraphIndent;
  }
  getViewType() {
    return WORKBENCH_VIEW_TYPE;
  }
  getDisplayText() {
    return this.file ? `Watermelon \xB7 ${this.file.basename}` : "Watermelon Workbench";
  }
  getIcon() {
    return "notebook-pen";
  }
  getViewData() {
    return this.editorEl ? this.getCurrentEditorText() : this.data ?? "";
  }
  setViewData(data, clear) {
    if (clear) {
      this.clear();
    }
    this.data = data;
    if (this.editorEl) {
      this.editorEl.value = this.autoIndentEnabled ? formatEditorDisplayText(data) : data;
    }
    this.updateHeaderState();
    this.updateStats();
  }
  clear() {
    this.data = "";
    if (this.editorEl) {
      this.editorEl.value = "";
    }
    this.updateStats();
  }
  getState() {
    return {
      ...super.getState(),
      file: this.file?.path ?? this.selectedChapterPath ?? void 0
    };
  }
  async setState(state, result) {
    await super.setState(state, result);
    const filePath = typeof state?.file === "string" ? state.file : null;
    if (!filePath) {
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof import_obsidian3.TFile) {
      this.configureScopeFromFile(file, true);
      this.refreshChapterList();
      await this.openChapter(file);
    }
  }
  async onOpen() {
    this.buildLayout();
    this.registerVaultEvents();
    this.registerSessionTicker();
    this.applyTypography();
    this.applyPanelLayout();
    const fileToOpen = this.getInitialFileForOpen();
    if (fileToOpen) {
      this.configureScopeFromFile(fileToOpen, true);
      this.refreshChapterList();
      await this.openChapter(fileToOpen);
    } else {
      this.refreshChapterList();
      this.renderEmptyEditorState("\u6253\u5F00\u4E00\u4E2A Markdown \u7B14\u8BB0\u540E\u518D\u8FDB\u5165 Workbench\uFF0C\u6216\u4F7F\u7528\u201COpen current file in writing workbench\u201D\u3002");
    }
  }
  async onLoadFile(file) {
    await super.onLoadFile(file);
    this.selectedChapterPath = file.path;
    this.updateHeaderState();
    this.refreshChapterList();
    this.updateStats();
  }
  async onClose() {
    await this.save();
  }
  async refreshFromSettings() {
    this.chapterPanelVisible = this.plugin.settings.showChapterPanel;
    this.statsPanelVisible = this.plugin.settings.showStatsPanel;
    this.chapterPanelWidth = clampPanelWidth(this.plugin.settings.chapterPanelWidth);
    this.statsPanelWidth = clampPanelWidth(this.plugin.settings.statsPanelWidth);
    this.activeFontFamily = this.plugin.settings.defaultFontFamily;
    this.activeFontSizePx = this.plugin.settings.defaultFontSizePx;
    this.activeLineHeight = this.plugin.settings.defaultLineHeight;
    this.applyAutoIndentMode(this.plugin.settings.autoParagraphIndent);
    this.refreshChapterList();
    this.applyTypography();
    this.applyPanelLayout();
    this.updateStats();
  }
  async openChapter(file) {
    if (this.file?.path === file.path) {
      return;
    }
    if (this.file) {
      await this.save();
    }
    this.selectedChapterPath = file.path;
    this.file = file;
    const sourceText = await this.app.vault.cachedRead(file);
    const contents = this.autoIndentEnabled ? normalizeLegacyParagraphSpacing(sourceText) : sourceText;
    this.setViewData(contents, true);
    this.resetSessionStats(contents);
    this.lastSnapshotWords = countWritingCharacters(contents);
    this.lastSnapshotCreatedAt = Date.now();
    await this.refreshTimeMachineSnapshots();
    await this.onLoadFile(file);
    if (this.plugin.settings.rememberLastFile) {
      this.plugin.settings.lastOpenFilePath = file.path;
      await this.plugin.saveSettings();
    }
  }
  async exitWorkbench() {
    await this.save();
    const currentFile = this.file;
    if (currentFile) {
      await this.leaf.setViewState({
        type: "markdown",
        active: true,
        state: { file: currentFile.path, mode: "source" }
      });
      return;
    }
    this.leaf.detach();
  }
  getInitialFileForOpen() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile instanceof import_obsidian3.TFile && activeFile.extension === "md") {
      return activeFile;
    }
    if (this.plugin.settings.rememberLastFile && this.plugin.settings.lastOpenFilePath) {
      const remembered = this.app.vault.getAbstractFileByPath(this.plugin.settings.lastOpenFilePath);
      if (remembered instanceof import_obsidian3.TFile) {
        return remembered;
      }
    }
    return null;
  }
  configureScopeFromFile(file, force = false) {
    if (!force && this.scopeRootPath) {
      return;
    }
    const siblingFiles = getMarkdownSiblings(file, this.app.vault.getMarkdownFiles());
    if (siblingFiles.length > 1) {
      this.scopeMode = "folder";
      this.scopeRootPath = file.parent?.path ?? "";
    } else {
      this.scopeMode = "single-file";
      this.scopeRootPath = file.path;
    }
  }
  buildLayout() {
    this.contentEl.empty();
    this.contentEl.addClass("wm-workbench-view");
    this.rootEl = this.contentEl.createDiv({ cls: "wm-workbench" });
    this.toolbarEl = this.rootEl.createDiv({ cls: "wm-toolbar" });
    this.bodyEl = this.rootEl.createDiv({ cls: "wm-body" });
    this.chapterListEl = this.bodyEl.createDiv({ cls: "wm-sidebar wm-sidebar-left" });
    this.leftResizerEl = this.bodyEl.createDiv({ cls: "wm-resizer wm-resizer-left" });
    this.editorShellEl = this.bodyEl.createDiv({ cls: "wm-editor-shell" });
    this.editorEl = this.editorShellEl.createEl("textarea", {
      cls: "wm-editor",
      attr: {
        spellcheck: "false",
        placeholder: "\u5728\u8FD9\u91CC\u5F00\u59CB\u4F60\u7684\u7AE0\u8282\u521B\u4F5C\u2026\u2026"
      }
    });
    this.emptyStateEl = this.editorShellEl.createDiv({ cls: "wm-empty-state" });
    this.rightResizerEl = this.bodyEl.createDiv({ cls: "wm-resizer wm-resizer-right" });
    this.statsEl = this.bodyEl.createDiv({ cls: "wm-sidebar wm-sidebar-right" });
    this.renderToolbar();
    this.renderChapterSidebar();
    this.renderStatsPane();
    this.attachEditorEvents();
    this.attachResizerEvents();
    this.updateHeaderState();
    this.updateStats();
  }
  renderToolbar() {
    this.toolbarEl.empty();
    const leftGroup = this.toolbarEl.createDiv({ cls: "wm-toolbar-group" });
    const fontSelect = leftGroup.createEl("select", { cls: "wm-select" });
    FONT_PRESETS.forEach((font) => {
      fontSelect.createEl("option", {
        value: font,
        text: prettyFontName(font)
      });
    });
    fontSelect.value = this.activeFontFamily;
    if (fontSelect.value !== this.activeFontFamily) {
      fontSelect.createEl("option", {
        value: this.activeFontFamily,
        text: prettyFontName(this.activeFontFamily)
      });
      fontSelect.value = this.activeFontFamily;
    }
    this.registerDomEvent(fontSelect, "change", async () => {
      this.activeFontFamily = fontSelect.value;
      this.plugin.settings.defaultFontFamily = fontSelect.value;
      this.applyTypography();
      await this.plugin.saveSettings();
    });
    const sizeSelect = leftGroup.createEl("select", { cls: "wm-select wm-select-small" });
    FONT_SIZE_PRESETS.forEach((size) => {
      sizeSelect.createEl("option", { value: String(size), text: `${size}` });
    });
    sizeSelect.value = String(this.activeFontSizePx);
    this.registerDomEvent(sizeSelect, "change", async () => {
      this.activeFontSizePx = Number(sizeSelect.value);
      this.plugin.settings.defaultFontSizePx = this.activeFontSizePx;
      this.applyTypography();
      await this.plugin.saveSettings();
    });
    const lineHeightSelect = leftGroup.createEl("select", { cls: "wm-select" });
    LINE_HEIGHT_PRESETS.forEach((lineHeight) => {
      lineHeightSelect.createEl("option", {
        value: String(lineHeight),
        text: `${lineHeight}\u500D\u884C\u8DDD`
      });
    });
    lineHeightSelect.value = String(this.activeLineHeight);
    this.registerDomEvent(lineHeightSelect, "change", async () => {
      this.activeLineHeight = Number(lineHeightSelect.value);
      this.plugin.settings.defaultLineHeight = this.activeLineHeight;
      this.applyTypography();
      await this.plugin.saveSettings();
    });
    const formatGroup = this.toolbarEl.createDiv({ cls: "wm-toolbar-group wm-toolbar-actions" });
    this.createToolbarButton(formatGroup, "B", "\u52A0\u7C97", () => this.applyCommand("bold"));
    this.createToolbarButton(formatGroup, "I", "\u659C\u4F53", () => this.applyCommand("italic"));
    this.createToolbarButton(formatGroup, "H1", "\u6807\u9898", () => this.applyCommand("heading"));
    this.createToolbarButton(formatGroup, "\u275D", "\u5F15\u7528", () => this.applyCommand("quote"));
    this.createToolbarButton(formatGroup, "\u2022", "\u5217\u8868", () => this.applyCommand("bullet"));
    this.autoIndentToggleButton = formatGroup.createEl("button", {
      cls: "wm-toolbar-button wm-auto-indent-button",
      text: "\u9996\u884C\u7F29\u8FDB",
      attr: { type: "button", "aria-label": "\u81EA\u52A8\u9996\u884C\u7F29\u8FDB" }
    });
    this.updateAutoIndentButtonState();
    this.registerDomEvent(this.autoIndentToggleButton, "click", () => {
      const enabled = !this.autoIndentEnabled;
      this.applyAutoIndentMode(enabled);
      this.plugin.settings.autoParagraphIndent = enabled;
      void this.plugin.saveSettings();
    });
    const rightGroup = this.toolbarEl.createDiv({ cls: "wm-toolbar-group wm-toolbar-group-right" });
    this.chapterToggleButton = rightGroup.createEl("button", {
      cls: "clickable-icon wm-icon-button",
      attr: { type: "button", "aria-label": "\u5207\u6362\u7AE0\u8282\u76EE\u5F55" }
    });
    this.registerDomEvent(this.chapterToggleButton, "click", () => {
      this.chapterPanelVisible = !this.chapterPanelVisible;
      this.plugin.settings.showChapterPanel = this.chapterPanelVisible;
      this.applyPanelLayout();
      void this.plugin.saveSettings();
    });
    this.statsToggleButton = rightGroup.createEl("button", {
      cls: "clickable-icon wm-icon-button",
      attr: { type: "button", "aria-label": "\u5207\u6362\u5B9E\u65F6\u7EDF\u8BA1\u680F" }
    });
    this.registerDomEvent(this.statsToggleButton, "click", () => {
      this.statsPanelVisible = !this.statsPanelVisible;
      this.plugin.settings.showStatsPanel = this.statsPanelVisible;
      this.applyPanelLayout();
      void this.plugin.saveSettings();
    });
    const exitButton = rightGroup.createEl("button", {
      cls: "wm-toolbar-button wm-exit-button",
      text: "\u9000\u51FA",
      attr: { type: "button", "aria-label": "\u9000\u51FA Workbench" }
    });
    this.registerDomEvent(exitButton, "click", () => {
      void this.exitWorkbench();
    });
  }
  renderChapterSidebar() {
    this.chapterListEl.empty();
    const headerEl = this.chapterListEl.createDiv({ cls: "wm-sidebar-header" });
    headerEl.createEl("h3", { text: "\u7AE0\u8282\u76EE\u5F55" });
    const createButton = headerEl.createEl("button", {
      cls: "clickable-icon",
      attr: { type: "button", "aria-label": "\u65B0\u5EFA\u7AE0\u8282" }
    });
    (0, import_obsidian3.setIcon)(createButton, "file-plus");
    this.registerDomEvent(createButton, "click", () => {
      void this.createChapterInCurrentDirectory();
    });
    const refreshButton = headerEl.createEl("button", {
      cls: "clickable-icon",
      attr: { type: "button", "aria-label": "\u5237\u65B0\u7AE0\u8282\u5217\u8868" }
    });
    (0, import_obsidian3.setIcon)(refreshButton, "refresh-cw");
    this.registerDomEvent(refreshButton, "click", () => this.refreshChapterList());
    this.chapterListBodyEl = this.chapterListEl.createDiv({ cls: "wm-chapter-list" });
    this.renderChapterItems();
  }
  renderStatsPane() {
    this.statsEl.empty();
    this.pluginBoxBodyEl = this.statsEl.createDiv({ cls: "wm-sidebar-section wm-plugin-box" });
    this.renderPluginBox();
    const headerEl = this.statsEl.createDiv({ cls: "wm-sidebar-header wm-stats-header" });
    headerEl.createEl("h3", { text: "\u5B9E\u65F6\u7EDF\u8BA1" });
    const hideButton = headerEl.createEl("button", {
      cls: "wm-pill-button",
      text: "\u9690\u85CF",
      attr: { type: "button" }
    });
    this.registerDomEvent(hideButton, "click", () => {
      this.statsPanelVisible = false;
      this.plugin.settings.showStatsPanel = false;
      this.applyPanelLayout();
      void this.plugin.saveSettings();
    });
    this.statsBodyEl = this.statsEl.createDiv({ cls: "wm-stats-grid" });
    this.updateStats();
  }
  renderPluginBox() {
    this.pluginBoxBodyEl.empty();
    this.pluginBoxBodyEl.createEl("h3", { text: "\u63D2\u4EF6\u7BB1", cls: "wm-plugin-box-title" });
    if (this.activePluginTool === "random") {
      this.renderRandomNameTool();
      return;
    }
    if (this.activePluginTool === "time-machine") {
      this.renderTimeMachineTool();
      return;
    }
    const menu = this.pluginBoxBodyEl.createDiv({ cls: "wm-plugin-icon-menu" });
    this.createPluginIcon(menu, "dice", "\u968F\u673A\u53D6\u540D", () => {
      this.activePluginTool = "random";
      this.renderPluginBox();
    });
    this.createPluginIcon(menu, "history", "\u65F6\u5149\u673A", () => {
      this.activePluginTool = "time-machine";
      this.renderPluginBox();
    });
  }
  createPluginIcon(parent, icon, label, onClick) {
    const button = parent.createEl("button", {
      cls: "wm-plugin-icon-button",
      attr: { type: "button", "aria-label": label }
    });
    const iconEl = button.createSpan({ cls: "wm-plugin-icon" });
    (0, import_obsidian3.setIcon)(iconEl, icon);
    button.createSpan({ cls: "wm-plugin-icon-label", text: label });
    this.registerDomEvent(button, "click", onClick);
  }
  renderToolHeader(parent, title) {
    const header = parent.createDiv({ cls: "wm-tool-header" });
    const backButton = header.createEl("button", {
      cls: "wm-mini-button",
      text: "\u2190 \u8FD4\u56DE",
      attr: { type: "button" }
    });
    header.createEl("h4", { text: title });
    this.registerDomEvent(backButton, "click", () => {
      this.activePluginTool = null;
      this.renderPluginBox();
    });
  }
  renderRandomNameTool() {
    const panel = this.pluginBoxBodyEl.createDiv({ cls: "wm-tool-panel" });
    this.renderToolHeader(panel, "\u968F\u673A\u53D6\u540D");
    this.randomNameOptions = normalizeRandomNameOptions(this.randomNameOptions);
    const controls = panel.createDiv({ cls: "wm-random-controls" });
    const groupSelect = this.createLabeledSelect(
      controls,
      "\u7C7B\u578B",
      listRandomNameGroups().map((group) => [group.id, group.label])
    );
    groupSelect.value = this.randomNameOptions.group;
    const categorySelect = this.createLabeledSelect(controls, "\u7EC6\u7C7B", []);
    const lengthSelect = this.createLabeledSelect(controls, "\u5B57\u6570", [
      ["2", "\u4E8C\u5B57\u540D"],
      ["3", "\u4E09\u5B57\u540D"]
    ]);
    lengthSelect.value = String(this.randomNameOptions.chineseNameLength);
    const hintEl = panel.createDiv({ cls: "wm-random-hint" });
    const generateButton = panel.createEl("button", {
      cls: "wm-toolbar-button wm-primary-button",
      text: "\u751F\u6210\u968F\u673A\u540D\u79F0",
      attr: { type: "button" }
    });
    const resultList = panel.createDiv({ cls: "wm-random-result-list" });
    const renderNames = () => {
      resultList.empty();
      const names = this.randomNames.length > 0 ? this.randomNames : generateRandomNames(this.randomNameOptions, 12);
      this.randomNames = names;
      names.forEach((name) => {
        const item = resultList.createEl("button", {
          cls: "wm-random-name-chip",
          text: name,
          attr: { type: "button", title: "\u70B9\u51FB\u63D2\u5165\u5230\u6B63\u6587" }
        });
        this.registerDomEvent(item, "click", () => this.insertTextAtCursor(name));
      });
    };
    const refreshCategorySelect = (preferredCategoryId) => {
      categorySelect.empty();
      const categories = listRandomNameCategories(groupSelect.value);
      categories.forEach((category) => {
        categorySelect.createEl("option", { value: category.id, text: category.label });
      });
      const categoryId = categories.some((category) => category.id === preferredCategoryId) ? preferredCategoryId : categories[0]?.id ?? "person.chinese.modern";
      categorySelect.value = categoryId;
    };
    const updateOptions = (keepCategory = true) => {
      if (!keepCategory) {
        refreshCategorySelect("");
      }
      this.randomNameOptions = normalizeRandomNameOptions({
        group: groupSelect.value,
        categoryId: categorySelect.value,
        chineseNameLength: lengthSelect.value === "3" ? 3 : 2
      });
      groupSelect.value = this.randomNameOptions.group;
      refreshCategorySelect(this.randomNameOptions.categoryId);
      categorySelect.value = this.randomNameOptions.categoryId;
      lengthSelect.value = String(this.randomNameOptions.chineseNameLength);
      lengthSelect.disabled = !isChinesePersonCategory(this.randomNameOptions.categoryId);
      hintEl.setText(`${getRandomNameCategory(this.randomNameOptions.categoryId).hint} \u70B9\u51FB\u540D\u79F0\u53EF\u63D2\u5165\u6B63\u6587\u3002`);
      this.randomNames = generateRandomNames(this.randomNameOptions, 12);
      renderNames();
    };
    refreshCategorySelect(this.randomNameOptions.categoryId);
    this.registerDomEvent(groupSelect, "change", () => updateOptions(false));
    this.registerDomEvent(categorySelect, "change", () => updateOptions(true));
    this.registerDomEvent(lengthSelect, "change", () => updateOptions(true));
    this.registerDomEvent(generateButton, "click", () => updateOptions(true));
    updateOptions(true);
  }
  renderTimeMachineTool() {
    const panel = this.pluginBoxBodyEl.createDiv({ cls: "wm-tool-panel" });
    this.renderToolHeader(panel, "\u65F6\u5149\u673A");
    panel.createDiv({ cls: "wm-plugin-panel-hint", text: "\u81EA\u52A8\u5907\u4EFD\uFF1A\u6BCF\u65E5 1 \u4EFD + \u6BCF\u65B0\u589E\u7EA6 500 \u5B57\u4E14\u95F4\u9694 2 \u5206\u949F\uFF1B\u6BCF\u7AE0\u4FDD\u7559\u6700\u8FD1 30 \u4EFD\u81EA\u52A8\u5907\u4EFD\uFF0C\u624B\u52A8\u5907\u4EFD\u6C38\u4E45\u4FDD\u7559\u3002" });
    const snapshotNowButton = panel.createEl("button", {
      cls: "wm-toolbar-button wm-primary-button",
      text: "\u7ACB\u5373\u4FDD\u5B58\u7248\u672C",
      attr: { type: "button" }
    });
    this.registerDomEvent(snapshotNowButton, "click", () => {
      void this.saveManualTimeMachineSnapshot();
    });
    this.timeMachineListEl = panel.createDiv({ cls: "wm-time-machine-list" });
    this.timeMachineDiffEl = panel.createDiv({ cls: "wm-time-machine-diff" });
    this.renderTimeMachineSnapshots();
  }
  createLabeledSelect(parent, label, options) {
    const wrapper = parent.createDiv({ cls: "wm-random-control" });
    wrapper.createEl("span", { text: label });
    const select = wrapper.createEl("select", { cls: "wm-select wm-select-small" });
    options.forEach(([value, text]) => {
      select.createEl("option", { value, text });
    });
    return select;
  }
  attachEditorEvents() {
    this.registerDomEvent(this.editorEl, "input", () => {
      this.handleEditorMutation();
    });
    this.registerDomEvent(this.editorEl, "keydown", (event) => {
      if (event.isComposing) {
        return;
      }
      if (event.key === "Enter" && this.autoIndentEnabled) {
        event.preventDefault();
        this.insertIndentedLineBreak();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        void this.exitWorkbench();
      }
    });
  }
  attachResizerEvents() {
    this.registerDomEvent(this.leftResizerEl, "pointerdown", (event) => {
      this.startResize("left", event);
    });
    this.registerDomEvent(this.rightResizerEl, "pointerdown", (event) => {
      this.startResize("right", event);
    });
  }
  registerSessionTicker() {
    this.registerInterval(
      window.setInterval(() => {
        if (!this.file) {
          return;
        }
        this.updateSessionDurations(Date.now());
        this.updateStats();
      }, 1e3)
    );
  }
  handleEditorMutation() {
    const now = Date.now();
    this.updateSessionDurations(now);
    this.sessionState.lastActivityAt = now;
    this.normalizeEditorDisplay();
    this.data = this.getCurrentEditorText();
    this.updateStats();
    this.requestSave();
    this.keepCursorInComfortZone();
    void this.maybeSaveTimeMachineSnapshot();
  }
  keepCursorInComfortZone() {
    window.requestAnimationFrame(() => {
      const editor = this.editorEl;
      const cursor = editor.selectionStart ?? 0;
      if (editor.value.slice(cursor).trim()) {
        return;
      }
      const caretTop = this.getTextareaCaretTop(editor, cursor);
      const caretViewportY = caretTop - editor.scrollTop;
      const lowerTrigger = editor.clientHeight * 0.62;
      if (caretViewportY <= lowerTrigger) {
        return;
      }
      const targetY = editor.clientHeight * 0.48;
      const maxScrollTop = Math.max(0, editor.scrollHeight - editor.clientHeight);
      editor.scrollTop = clamp(caretTop - targetY, 0, maxScrollTop);
    });
  }
  getTextareaCaretTop(editor, cursor) {
    const style = window.getComputedStyle(editor);
    const mirror = this.getCaretMirrorEl();
    const marker = document.createElement("span");
    const beforeCursor = editor.value.slice(0, cursor);
    mirror.empty();
    copyTextareaLayoutStyles(editor, mirror, style);
    mirror.appendText(beforeCursor.length > 0 ? beforeCursor : " ");
    marker.appendText(" ");
    mirror.appendChild(marker);
    const mirrorRect = mirror.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    return markerRect.top - mirrorRect.top;
  }
  getCaretMirrorEl() {
    if (!this.caretMirrorEl) {
      this.caretMirrorEl = this.editorShellEl.createDiv();
    }
    return this.caretMirrorEl;
  }
  normalizeEditorDisplay() {
    if (!this.autoIndentEnabled) {
      return;
    }
    const cursor = this.editorEl.selectionStart ?? 0;
    const currentValue = this.editorEl.value;
    const formatted = formatEditorDisplayTextWithCursor(currentValue, cursor);
    if (formatted.value === currentValue) {
      return;
    }
    this.editorEl.value = formatted.value;
    this.editorEl.setSelectionRange(formatted.cursor, formatted.cursor);
  }
  getCurrentEditorText() {
    return this.autoIndentEnabled ? getPlainEditorText(this.editorEl.value) : this.editorEl.value;
  }
  applyAutoIndentMode(enabled) {
    if (this.autoIndentEnabled === enabled) {
      this.updateAutoIndentButtonState();
      return;
    }
    if (!this.editorEl) {
      this.autoIndentEnabled = enabled;
      return;
    }
    const value = this.editorEl.value;
    const selectionStart = this.editorEl.selectionStart ?? 0;
    const selectionEnd = this.editorEl.selectionEnd ?? 0;
    const plainValue = this.autoIndentEnabled ? getPlainEditorText(value) : value;
    const plainSelectionStart = this.autoIndentEnabled ? getPlainEditorText(value.slice(0, selectionStart)).length : selectionStart;
    const plainSelectionEnd = this.autoIndentEnabled ? getPlainEditorText(value.slice(0, selectionEnd)).length : selectionEnd;
    this.autoIndentEnabled = enabled;
    if (enabled) {
      this.editorEl.value = formatPlainEditorDisplayText(plainValue);
      this.editorEl.setSelectionRange(
        getFormattedEditorCursor(plainValue, plainSelectionStart),
        getFormattedEditorCursor(plainValue, plainSelectionEnd)
      );
    } else {
      this.editorEl.value = plainValue;
      this.editorEl.setSelectionRange(plainSelectionStart, plainSelectionEnd);
    }
    this.data = this.getCurrentEditorText();
    this.updateAutoIndentButtonState();
    this.updateStats();
  }
  updateAutoIndentButtonState() {
    if (!this.autoIndentToggleButton) {
      return;
    }
    this.autoIndentToggleButton.classList.toggle("is-active", this.autoIndentEnabled);
    this.autoIndentToggleButton.setAttribute("aria-pressed", String(this.autoIndentEnabled));
    this.autoIndentToggleButton.setAttribute(
      "title",
      this.autoIndentEnabled ? "\u81EA\u52A8\u9996\u884C\u7F29\u8FDB\uFF1A\u5DF2\u5F00\u542F" : "\u81EA\u52A8\u9996\u884C\u7F29\u8FDB\uFF1A\u5DF2\u5173\u95ED"
    );
  }
  insertIndentedLineBreak() {
    const selectionStart = this.editorEl.selectionStart ?? 0;
    const selectionEnd = this.editorEl.selectionEnd ?? 0;
    const value = this.editorEl.value;
    const insertion = `
${PARAGRAPH_INDENT}`;
    const nextValue = `${value.slice(0, selectionStart)}${insertion}${value.slice(selectionEnd)}`;
    const nextCursor = selectionStart + insertion.length;
    this.editorEl.value = nextValue;
    this.editorEl.focus();
    this.editorEl.setSelectionRange(nextCursor, nextCursor);
    this.handleEditorMutation();
  }
  async applyCommand(command) {
    const selectionStart = this.editorEl.selectionStart ?? 0;
    const selectionEnd = this.editorEl.selectionEnd ?? 0;
    const value = this.editorEl.value;
    const result = command === "bold" ? wrapSelection(value, selectionStart, selectionEnd, "**") : command === "italic" ? wrapSelection(value, selectionStart, selectionEnd, "*") : command === "heading" ? prefixSelectedLines(value, selectionStart, selectionEnd, "# ") : command === "quote" ? prefixSelectedLines(value, selectionStart, selectionEnd, "> ") : prefixSelectedLines(value, selectionStart, selectionEnd, "- ");
    this.editorEl.value = result.value;
    this.editorEl.focus();
    this.editorEl.setSelectionRange(result.selectionStart, result.selectionEnd);
    this.handleEditorMutation();
  }
  createToolbarButton(parent, label, ariaLabel, onClick) {
    const button = parent.createEl("button", {
      cls: "wm-toolbar-button",
      text: label,
      attr: { type: "button", "aria-label": ariaLabel }
    });
    this.registerDomEvent(button, "click", onClick);
  }
  insertTextAtCursor(text) {
    const selectionStart = this.editorEl.selectionStart ?? 0;
    const selectionEnd = this.editorEl.selectionEnd ?? 0;
    const value = this.editorEl.value;
    const nextValue = `${value.slice(0, selectionStart)}${text}${value.slice(selectionEnd)}`;
    const nextCursor = selectionStart + text.length;
    this.editorEl.value = nextValue;
    this.editorEl.focus();
    this.editorEl.setSelectionRange(nextCursor, nextCursor);
    this.handleEditorMutation();
  }
  async refreshTimeMachineSnapshots() {
    this.timeMachineSnapshots = await listTimeMachineSnapshots(this.plugin, this.file);
    this.renderTimeMachineSnapshots();
  }
  renderTimeMachineSnapshots() {
    if (!this.timeMachineListEl) {
      return;
    }
    this.timeMachineListEl.empty();
    if (this.timeMachineDiffEl) {
      this.timeMachineDiffEl.empty();
    }
    if (!this.file) {
      this.timeMachineListEl.createDiv({ cls: "wm-empty-sidebar-state", text: "\u9009\u62E9\u7AE0\u8282\u540E\u5F00\u59CB\u8BB0\u5F55\u5386\u53F2\u7248\u672C\u3002" });
      return;
    }
    if (this.timeMachineSnapshots.length === 0) {
      this.timeMachineListEl.createDiv({ cls: "wm-empty-sidebar-state", text: "\u6682\u65F6\u6CA1\u6709\u5386\u53F2\u7248\u672C\u3002\u6BCF\u5929\u4F1A\u4FDD\u7559 1 \u4EFD\u65E5\u5907\u4EFD\uFF0C\u5199\u4F5C\u65B0\u589E\u7EA6 500 \u5B57\u4E14\u95F4\u9694 2 \u5206\u949F\u540E\u4F1A\u81EA\u52A8\u4FDD\u5B58\u3002" });
      return;
    }
    this.timeMachineSnapshots.forEach((snapshot) => {
      const item = this.timeMachineListEl.createDiv({ cls: "wm-time-machine-item" });
      item.createDiv({ cls: "wm-time-machine-title", text: `${snapshotKindLabel(snapshot.kind)} \xB7 ${new Date(snapshot.createdAt).toLocaleString()}` });
      item.createDiv({ cls: "wm-time-machine-meta", text: `${snapshot.wordCount || "\u672A\u77E5"} \u5B57 \xB7 ${snapshot.path}` });
      const actions = item.createDiv({ cls: "wm-time-machine-actions" });
      const diffButton = actions.createEl("button", {
        cls: "wm-mini-button",
        text: "\u67E5\u770B\u5220\u6539",
        attr: { type: "button" }
      });
      const restoreButton = actions.createEl("button", {
        cls: "wm-mini-button wm-danger-button",
        text: "\u6062\u590D",
        attr: { type: "button" }
      });
      this.registerDomEvent(diffButton, "click", () => {
        void this.showSnapshotDiff(snapshot);
      });
      this.registerDomEvent(restoreButton, "click", () => {
        void this.restoreSnapshot(snapshot);
      });
    });
  }
  async showSnapshotDiff(snapshot) {
    if (!this.timeMachineDiffEl) {
      return;
    }
    const snapshotFile = this.app.vault.getAbstractFileByPath(snapshot.path);
    if (!(snapshotFile instanceof import_obsidian3.TFile)) {
      new import_obsidian3.Notice("\u8FD9\u4E2A\u5386\u53F2\u7248\u672C\u6587\u4EF6\u4E0D\u5B58\u5728\u3002\u53EF\u80FD\u5DF2\u88AB\u79FB\u52A8\u6216\u5220\u9664\u3002");
      await this.refreshTimeMachineSnapshots();
      return;
    }
    const diff = await buildSnapshotDiff(this.plugin, snapshotFile, this.getCurrentEditorText());
    this.renderSnapshotDiff(diff);
  }
  renderSnapshotDiff(diff) {
    this.timeMachineDiffEl.empty();
    this.timeMachineDiffEl.createDiv({ cls: "wm-time-machine-diff-title", text: "\u5F53\u524D\u7248\u672C\u76F8\u5BF9\u5386\u53F2\u7248\u672C\u7684\u5220\u6539" });
    const visibleDiff = diff.filter((line) => line.kind !== "same" || line.text.trim()).slice(0, 160);
    visibleDiff.forEach((line) => {
      this.timeMachineDiffEl.createDiv({ cls: `wm-diff-line wm-diff-${line.kind}`, text: `${diffPrefix(line.kind)} ${line.text}` });
    });
    if (visibleDiff.length === 0) {
      this.timeMachineDiffEl.createDiv({ cls: "wm-empty-sidebar-state", text: "\u6CA1\u6709\u53D1\u73B0\u6587\u672C\u5DEE\u5F02\u3002" });
    }
  }
  async restoreSnapshot(snapshot) {
    const snapshotFile = this.app.vault.getAbstractFileByPath(snapshot.path);
    if (!(snapshotFile instanceof import_obsidian3.TFile)) {
      new import_obsidian3.Notice("\u8FD9\u4E2A\u5386\u53F2\u7248\u672C\u6587\u4EF6\u4E0D\u5B58\u5728\u3002\u53EF\u80FD\u5DF2\u88AB\u79FB\u52A8\u6216\u5220\u9664\u3002");
      await this.refreshTimeMachineSnapshots();
      return;
    }
    const snapshotText = await this.app.vault.cachedRead(snapshotFile);
    await this.saveManualTimeMachineSnapshot(false);
    this.editorEl.value = this.autoIndentEnabled ? formatEditorDisplayText(snapshotText) : snapshotText;
    this.handleEditorMutation();
    this.lastSnapshotWords = countWritingCharacters(snapshotText);
    this.lastSnapshotCreatedAt = Date.now();
    new import_obsidian3.Notice("\u5DF2\u6062\u590D\u5230\u6240\u9009\u65F6\u5149\u673A\u7248\u672C\u3002\u6062\u590D\u524D\u7684\u5F53\u524D\u5185\u5BB9\u5DF2\u53E6\u5B58\u4E3A\u5907\u4EFD\u3002");
    await this.refreshTimeMachineSnapshots();
  }
  async saveManualTimeMachineSnapshot(showNotice = true) {
    if (!this.file) {
      new import_obsidian3.Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A Markdown \u7AE0\u8282\u3002");
      return;
    }
    const text = this.getCurrentEditorText();
    const snapshot = await createTimeMachineSnapshot(this.plugin, this.file, text, { kind: "manual" });
    this.lastSnapshotWords = snapshot.wordCount;
    this.lastSnapshotCreatedAt = snapshot.createdAt;
    if (showNotice) {
      new import_obsidian3.Notice("\u5DF2\u4FDD\u5B58\u4E00\u4E2A\u65F6\u5149\u673A\u7248\u672C\u3002");
    }
    await this.refreshTimeMachineSnapshots();
  }
  async maybeSaveTimeMachineSnapshot() {
    if (this.snapshotSaveInFlight) {
      return;
    }
    this.snapshotSaveInFlight = true;
    try {
      const snapshotState = await maybeCreateTimeMachineSnapshot(
        this.plugin,
        this.file,
        this.getCurrentEditorText(),
        this.lastSnapshotWords,
        this.lastSnapshotCreatedAt
      );
      if (snapshotState.created) {
        this.lastSnapshotWords = snapshotState.wordCount;
        this.lastSnapshotCreatedAt = snapshotState.createdAt;
        await this.refreshTimeMachineSnapshots();
      }
    } finally {
      this.snapshotSaveInFlight = false;
    }
  }
  refreshChapterList() {
    this.chapters = this.getScopedFiles().sort((left, right) => this.compareFiles(left, right, this.plugin.settings));
    this.renderChapterItems();
    void this.refreshNovelTotalWords();
  }
  async refreshNovelTotalWords() {
    const activeFilePath = this.file?.path;
    const totals = await Promise.all(
      this.chapters.filter((file) => file.path !== activeFilePath).map(async (file) => computeWritingStats(await this.app.vault.cachedRead(file)).words)
    );
    this.otherChaptersWords = totals.reduce((total, words) => total + words, 0);
    this.novelTotalWords = this.otherChaptersWords + computeWritingStats(this.editorEl ? this.getCurrentEditorText() : this.data ?? "").words;
    this.updateStats();
  }
  renderChapterItems() {
    if (!this.chapterListBodyEl) {
      return;
    }
    this.chapterListBodyEl.empty();
    if (this.chapters.length === 0) {
      this.chapterListBodyEl.createDiv({
        cls: "wm-empty-sidebar-state",
        text: this.scopeMode === "folder" ? "\u5F53\u524D\u6587\u4EF6\u5939\u4E0B\u6CA1\u6709 Markdown \u6587\u4EF6\u3002" : "\u5F53\u524D\u4EC5\u663E\u793A\u8FD9\u7BC7\u7B14\u8BB0\u3002"
      });
      return;
    }
    this.chapters.forEach((file) => {
      const row = this.chapterListBodyEl.createDiv({
        cls: `wm-chapter-row${file.path === this.selectedChapterPath ? " is-active" : ""}`
      });
      const item = row.createEl("button", {
        cls: "wm-chapter-item",
        attr: { type: "button", title: file.path }
      });
      const titleEl = item.createDiv({ cls: "wm-chapter-title", text: file.basename });
      this.registerDomEvent(item, "click", () => {
        void this.openChapter(file);
      });
      this.registerDomEvent(titleEl, "click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.promptRenameChapter(file);
      });
      this.registerDomEvent(item, "contextmenu", (event) => {
        event.preventDefault();
        import_obsidian3.Menu.forEvent(event).addItem((menuItem) => {
          menuItem.setTitle("\u6253\u5F00\u7AE0\u8282").setIcon("file-text").onClick(() => {
            void this.openChapter(file);
          });
        }).addItem((menuItem) => {
          menuItem.setTitle("\u91CD\u547D\u540D\u7AE0\u8282").setIcon("pencil").onClick(() => this.promptRenameChapter(file));
        }).addItem((menuItem) => {
          menuItem.setTitle("\u5220\u9664\u7AE0\u8282").setIcon("trash-2").setWarning(true).onClick(() => {
            void this.deleteChapter(file);
          });
        });
      });
    });
  }
  async createChapterInCurrentDirectory() {
    const folderPath = this.getCurrentChapterCreationFolderPath();
    if (folderPath === null) {
      new import_obsidian3.Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u7AE0\u8282\uFF0C\u518D\u65B0\u5EFA\u7AE0\u8282\u3002");
      return;
    }
    try {
      await this.save();
      const file = await this.app.vault.create(this.getUniqueChapterPath(folderPath), "");
      this.scopeMode = "folder";
      this.scopeRootPath = file.parent?.path ?? folderPath;
      this.refreshChapterList();
      await this.openChapter(file);
      this.editorEl.focus();
      new import_obsidian3.Notice(`\u5DF2\u65B0\u5EFA\u7AE0\u8282\uFF1A${file.basename}`);
    } catch (error) {
      console.error("Failed to create chapter", error);
      new import_obsidian3.Notice("\u65B0\u5EFA\u7AE0\u8282\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5F53\u524D\u76EE\u5F55\u662F\u5426\u53EF\u5199\u3002");
    }
  }
  getCurrentChapterCreationFolderPath() {
    if (this.scopeMode === "folder" && this.scopeRootPath !== null) {
      return this.scopeRootPath;
    }
    if (this.file) {
      return this.file.parent?.path ?? "";
    }
    if (this.selectedChapterPath) {
      const selectedFile = this.app.vault.getAbstractFileByPath(this.selectedChapterPath);
      if (selectedFile instanceof import_obsidian3.TFile) {
        return selectedFile.parent?.path ?? "";
      }
    }
    return null;
  }
  getUniqueChapterPath(folderPath) {
    const baseName = "\u65B0\u7AE0\u8282";
    let chapterPath = joinVaultPath(folderPath, `${baseName}.md`);
    let counter = 2;
    while (this.app.vault.getAbstractFileByPath(chapterPath)) {
      chapterPath = joinVaultPath(folderPath, `${baseName} ${counter}.md`);
      counter += 1;
    }
    return chapterPath;
  }
  promptRenameChapter(file) {
    new ChapterRenameModal(this.app, file, async (inputName) => {
      const baseName = normalizeChapterBaseName(inputName);
      const error = this.getChapterRenameError(file, baseName);
      if (error) {
        return error;
      }
      if (baseName === file.basename) {
        return null;
      }
      await this.renameChapter(file, baseName);
      return null;
    }).open();
  }
  async renameChapter(file, baseName) {
    const newPath = this.getChapterRenamePath(file, baseName);
    const renamingActiveFile = this.file?.path === file.path;
    try {
      if (renamingActiveFile) {
        await this.save();
      }
      await this.app.fileManager.renameFile(file, newPath);
      const renamedFile = this.app.vault.getAbstractFileByPath(newPath);
      if (renamedFile instanceof import_obsidian3.TFile) {
        if (renamingActiveFile) {
          this.file = renamedFile;
          this.selectedChapterPath = renamedFile.path;
          if (this.scopeMode === "single-file" && this.scopeRootPath === file.path) {
            this.scopeRootPath = renamedFile.path;
          }
          await this.refreshTimeMachineSnapshots();
          if (this.plugin.settings.rememberLastFile) {
            this.plugin.settings.lastOpenFilePath = renamedFile.path;
            await this.plugin.saveSettings();
          }
        } else if (this.selectedChapterPath === file.path) {
          this.selectedChapterPath = renamedFile.path;
        }
      }
      this.refreshChapterList();
      this.updateHeaderState();
      new import_obsidian3.Notice(`\u5DF2\u91CD\u547D\u540D\u4E3A\uFF1A${baseName}`);
    } catch (error) {
      console.error("Failed to rename chapter", error);
      new import_obsidian3.Notice("\u91CD\u547D\u540D\u7AE0\u8282\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u540D\u79F0\u662F\u5426\u6709\u6548\u6216\u76EE\u6807\u6587\u4EF6\u662F\u5426\u5DF2\u5B58\u5728\u3002");
      this.refreshChapterList();
    }
  }
  getChapterRenamePath(file, baseName) {
    return joinVaultPath(file.parent?.path ?? "", `${baseName}.md`);
  }
  getChapterRenameError(file, baseName) {
    const invalidNameReason = getInvalidChapterBaseNameReason(baseName);
    if (invalidNameReason) {
      return invalidNameReason;
    }
    const targetPath = this.getChapterRenamePath(file, baseName);
    const existingFile = this.app.vault.getAbstractFileByPath(targetPath);
    if (existingFile && existingFile.path !== file.path) {
      return "\u540C\u540D\u7AE0\u8282\u5DF2\u5B58\u5728\u3002";
    }
    return null;
  }
  async deleteChapter(file) {
    const deletingActiveFile = this.file?.path === file.path;
    try {
      if (deletingActiveFile) {
        await this.save();
      }
      const confirmed = await this.app.fileManager.promptForDeletion(file);
      if (!confirmed) {
        return;
      }
      const nextFile = deletingActiveFile ? this.getNextChapterAfter(file) : null;
      await this.app.fileManager.trashFile(file);
      if (deletingActiveFile) {
        this.file = null;
        this.selectedChapterPath = null;
        const nextExistingFile = nextFile ? this.app.vault.getAbstractFileByPath(nextFile.path) : null;
        if (nextExistingFile instanceof import_obsidian3.TFile) {
          await this.openChapter(nextExistingFile);
        } else {
          this.scopeMode = "folder";
          this.scopeRootPath = file.parent?.path ?? "";
          await this.clearDeletedActiveChapterState();
        }
      } else {
        this.refreshChapterList();
      }
      new import_obsidian3.Notice(`\u5DF2\u79FB\u81F3\u5E9F\u7EB8\u7BD3\uFF1A${file.basename}`);
    } catch (error) {
      console.error("Failed to delete chapter", error);
      new import_obsidian3.Notice("\u5220\u9664\u7AE0\u8282\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u6587\u4EF6\u662F\u5426\u4ECD\u5B58\u5728\u6216\u662F\u5426\u53EF\u5199\u3002");
      this.refreshChapterList();
    }
  }
  getNextChapterAfter(file) {
    const index = this.chapters.findIndex((chapter) => chapter.path === file.path);
    if (index === -1) {
      return null;
    }
    return this.chapters[index + 1] ?? this.chapters[index - 1] ?? null;
  }
  async clearDeletedActiveChapterState() {
    this.file = null;
    this.selectedChapterPath = null;
    this.timeMachineSnapshots = [];
    this.renderTimeMachineSnapshots();
    this.timeMachineDiffEl?.empty();
    this.clear();
    this.renderEmptyEditorState("\u5F53\u524D\u7AE0\u8282\u5DF2\u5220\u9664\u3002\u8BF7\u9009\u62E9\u6216\u65B0\u5EFA\u4E00\u4E2A\u7AE0\u8282\u7EE7\u7EED\u5199\u4F5C\u3002");
    this.refreshChapterList();
    if (this.plugin.settings.rememberLastFile) {
      this.plugin.settings.lastOpenFilePath = null;
      await this.plugin.saveSettings();
    }
  }
  updateStats() {
    if (!this.statsBodyEl) {
      return;
    }
    const staticStats = computeWritingStats(this.editorEl ? this.getCurrentEditorText() : this.data ?? "");
    const sessionStats = this.getSessionStats(staticStats.words);
    this.novelTotalWords = this.otherChaptersWords + staticStats.words;
    const rows = this.buildStatsRows(staticStats, sessionStats);
    this.statsBodyEl.empty();
    rows.forEach((entries) => {
      const row = this.statsBodyEl.createDiv({ cls: "wm-stat-row" });
      entries.forEach(([label, value]) => {
        const card = row.createDiv({ cls: "wm-stat-card" });
        card.createDiv({ cls: "wm-stat-label", text: label });
        card.createDiv({ cls: "wm-stat-value", text: value });
      });
    });
  }
  buildStatsRows(stats, sessionStats) {
    return [
      [
        ["\u672C\u6B21\u5B57\u6570", String(sessionStats.sessionWords)],
        ["\u8F93\u5165\u901F\u5EA6\uFF08\u5B57/\u5206\uFF09", String(sessionStats.typingSpeed)]
      ],
      [
        ["\u7801\u5B57\u65F6\u95F4", formatDuration(sessionStats.writingTimeMs)],
        ["\u7A7A\u95F2\u65F6\u95F4", formatDuration(sessionStats.idleTimeMs)]
      ],
      [
        ["\u603B\u5B57\u7B26\u6570", String(stats.characters)],
        ["\u53BB\u7A7A\u683C\u5B57\u7B26\u6570", String(stats.charactersNoSpaces)]
      ],
      [
        ["\u7AE0\u8282\u6570", String(this.chapters.length)],
        ["\u5C0F\u8BF4\u603B\u5B57\u6570", String(this.novelTotalWords || stats.words)]
      ]
    ];
  }
  applyTypography() {
    if (!this.rootEl) {
      return;
    }
    this.rootEl.setCssProps({
      "--wm-font-family": this.activeFontFamily || "var(--font-text, var(--font-interface))",
      "--wm-font-size": `${this.activeFontSizePx}px`,
      "--wm-line-height": String(this.activeLineHeight)
    });
  }
  applyPanelLayout() {
    if (!this.rootEl || !this.bodyEl) {
      return;
    }
    this.rootEl.setCssProps({
      "--wm-left-width": `${clampPanelWidth(this.chapterPanelWidth)}px`,
      "--wm-right-width": `${clampPanelWidth(this.statsPanelWidth)}px`
    });
    this.bodyEl.toggleClass("wm-left-hidden", !this.chapterPanelVisible);
    this.bodyEl.toggleClass("wm-right-hidden", !this.statsPanelVisible);
    if (this.chapterToggleButton) {
      this.chapterToggleButton.empty();
      (0, import_obsidian3.setIcon)(this.chapterToggleButton, this.chapterPanelVisible ? "panel-left-close" : "panel-left-open");
    }
    if (this.statsToggleButton) {
      this.statsToggleButton.empty();
      (0, import_obsidian3.setIcon)(this.statsToggleButton, this.statsPanelVisible ? "panel-right-close" : "panel-right-open");
    }
  }
  updateHeaderState() {
    this.emptyStateEl?.toggleClass("is-hidden", Boolean(this.file));
    this.leaf.setEphemeralState({ file: this.file?.path ?? this.selectedChapterPath ?? null });
  }
  renderEmptyEditorState(message) {
    this.emptyStateEl.empty();
    this.emptyStateEl.createDiv({ cls: "wm-empty-title", text: "Watermelon Workbench" });
    this.emptyStateEl.createDiv({ cls: "wm-empty-copy", text: message });
    this.updateHeaderState();
  }
  registerVaultEvents() {
    this.registerEvent(this.app.vault.on("create", (file) => this.handleVaultRefresh(file)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.handleVaultRefresh(file)));
    this.registerEvent(this.app.vault.on("rename", (file) => this.handleVaultRefresh(file)));
    this.registerEvent(this.app.vault.on("modify", (file) => this.handleVaultRefresh(file)));
  }
  handleVaultRefresh(file) {
    if (!(file instanceof import_obsidian3.TFile) || file.extension !== "md") {
      return;
    }
    if (!this.isFileInCurrentScope(file)) {
      return;
    }
    this.refreshChapterList();
  }
  isFileInCurrentScope(file) {
    if (this.scopeRootPath === null) {
      return false;
    }
    if (this.scopeMode === "single-file") {
      return file.path === this.scopeRootPath;
    }
    return file.parent?.path === this.scopeRootPath;
  }
  getScopedFiles() {
    if (this.scopeRootPath === null) {
      return [];
    }
    const markdownFiles = this.app.vault.getMarkdownFiles();
    if (this.scopeMode === "single-file") {
      const file = this.app.vault.getAbstractFileByPath(this.scopeRootPath);
      return file instanceof import_obsidian3.TFile ? [file] : [];
    }
    return markdownFiles.filter((file) => file.parent?.path === this.scopeRootPath);
  }
  startResize(side, event) {
    event.preventDefault();
    const bodyRect = this.bodyEl.getBoundingClientRect();
    const onMove = (moveEvent) => {
      if (side === "left") {
        this.chapterPanelWidth = clampPanelWidth(moveEvent.clientX - bodyRect.left);
        this.plugin.settings.chapterPanelWidth = this.chapterPanelWidth;
      } else {
        this.statsPanelWidth = clampPanelWidth(bodyRect.right - moveEvent.clientX);
        this.plugin.settings.statsPanelWidth = this.statsPanelWidth;
      }
      this.applyPanelLayout();
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      this.bodyEl.removeClass("is-resizing");
      void this.plugin.saveSettings();
    };
    this.bodyEl.addClass("is-resizing");
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  resetSessionStats(text) {
    const baselineWords = computeWritingStats(text).words;
    this.sessionState = {
      baselineWords,
      writingTimeMs: 0,
      idleTimeMs: 0,
      lastActivityAt: null,
      lastTickAt: Date.now()
    };
  }
  updateSessionDurations(now) {
    const previousTick = this.sessionState.lastTickAt;
    if (!previousTick) {
      this.sessionState.lastTickAt = now;
      return;
    }
    const delta = now - previousTick;
    if (delta <= 0) {
      return;
    }
    const lastActivityAt = this.sessionState.lastActivityAt;
    if (lastActivityAt === null) {
      this.sessionState.idleTimeMs += delta;
      this.sessionState.lastTickAt = now;
      return;
    }
    const idleBoundary = lastActivityAt + IDLE_THRESHOLD_MS;
    if (previousTick >= idleBoundary) {
      this.sessionState.idleTimeMs += delta;
    } else if (now <= idleBoundary) {
      this.sessionState.writingTimeMs += delta;
    } else {
      this.sessionState.writingTimeMs += idleBoundary - previousTick;
      this.sessionState.idleTimeMs += now - idleBoundary;
    }
    this.sessionState.lastTickAt = now;
  }
  getSessionStats(currentWords) {
    const sessionWords = Math.max(0, currentWords - this.sessionState.baselineWords);
    const writingTimeMs = this.sessionState.writingTimeMs;
    const idleTimeMs = this.sessionState.idleTimeMs;
    return {
      sessionWords,
      typingSpeed: computeTypingSpeed(sessionWords, writingTimeMs),
      writingTimeMs,
      idleTimeMs
    };
  }
  compareFiles(left, right, settings) {
    if (settings.chapterSort === "modified") {
      return right.stat.mtime - left.stat.mtime || left.path.localeCompare(right.path, void 0, { numeric: true });
    }
    return left.path.localeCompare(right.path, void 0, { numeric: true });
  }
};
var ChapterRenameModal = class extends import_obsidian3.Modal {
  constructor(app, file, onSubmit) {
    super(app);
    this.file = file;
    this.onSubmit = onSubmit;
    this.submitting = false;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "\u91CD\u547D\u540D\u7AE0\u8282" });
    contentEl.createEl("p", { cls: "wm-settings-description", text: "\u4EC5\u4FEE\u6539\u6587\u4EF6\u540D\uFF0C\u4FDD\u7559 .md \u6269\u5C55\u540D\u3002" });
    let inputValue = this.file.basename;
    const errorEl = contentEl.createDiv({ cls: "wm-modal-error" });
    errorEl.hide();
    new import_obsidian3.Setting(contentEl).setName("\u7AE0\u8282\u540D\u79F0").setDesc("\u53EF\u4EE5\u76F4\u63A5\u8F93\u5165\u540D\u79F0\uFF0C\u4E5F\u53EF\u4EE5\u5E26 .md \u540E\u7F00\u3002").addText((text) => {
      text.setValue(inputValue);
      text.inputEl.select();
      text.onChange((value) => {
        inputValue = value;
        errorEl.hide();
        errorEl.setText("");
      });
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          void submit();
        }
      });
    });
    const submit = async () => {
      if (this.submitting) {
        return;
      }
      this.submitting = true;
      try {
        const error = await this.onSubmit(inputValue);
        if (error) {
          errorEl.setText(error);
          errorEl.show();
          return;
        }
        this.close();
      } finally {
        this.submitting = false;
      }
    };
    new import_obsidian3.Setting(contentEl).addButton((button) => {
      button.setButtonText("\u53D6\u6D88").onClick(() => this.close());
    }).addButton((button) => {
      button.setButtonText("\u91CD\u547D\u540D").setCta().onClick(() => {
        void submit();
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
function prettyFontName(fontFamily) {
  if (!fontFamily) {
    return "\u8DDF\u968F Obsidian";
  }
  const firstPart = fontFamily.split(",")[0]?.trim() ?? fontFamily;
  return firstPart.replace(/^"|"$/g, "");
}
function normalizeLegacyParagraphSpacing(text) {
  return text.split("\n").map((line) => line.startsWith(PARAGRAPH_INDENT) ? line.slice(PARAGRAPH_INDENT.length) : line).join("\n").replace(/\n{3,}/g, "\n\n");
}
function formatEditorDisplayText(text) {
  const originalLines = text.split("\n");
  return formatPlainEditorDisplayText(getPlainEditorText(text), originalLines);
}
function formatPlainEditorDisplayText(text, originalLines = text.split("\n")) {
  return text.split("\n").map((line, index) => {
    if (line.trim()) {
      return `${PARAGRAPH_INDENT}${line}`;
    }
    const originalLine = originalLines[index] ?? "";
    return originalLine.startsWith(PARAGRAPH_INDENT) ? PARAGRAPH_INDENT : line;
  }).join("\n");
}
function getFormattedEditorCursor(text, cursor) {
  const boundedCursor = Math.min(Math.max(cursor, 0), text.length);
  let formattedCursor = boundedCursor;
  let lineStart = 0;
  for (const line of text.split("\n")) {
    if (lineStart > boundedCursor) {
      break;
    }
    if (line.trim()) {
      formattedCursor += PARAGRAPH_INDENT.length;
    }
    lineStart += line.length + 1;
  }
  return formattedCursor;
}
function formatEditorDisplayTextWithCursor(text, cursor) {
  const before = text.slice(0, cursor);
  const formattedBefore = formatEditorDisplayText(before);
  const formattedAll = formatEditorDisplayText(text);
  return {
    value: formattedAll,
    cursor: Math.min(formattedAll.length, formattedBefore.length)
  };
}
function getPlainEditorText(text) {
  return text.split("\n").map((line) => line.startsWith(PARAGRAPH_INDENT) ? line.slice(PARAGRAPH_INDENT.length) : line).join("\n");
}
function getMarkdownSiblings(currentFile, allMarkdownFiles) {
  const parentPath = currentFile.parent?.path ?? "";
  return allMarkdownFiles.filter((file) => (file.parent?.path ?? "") === parentPath);
}
function joinVaultPath(folderPath, fileName) {
  return (0, import_obsidian3.normalizePath)(folderPath && folderPath !== "/" ? `${folderPath}/${fileName}` : fileName);
}
function normalizeChapterBaseName(input) {
  const trimmed = input.trim();
  return trimmed.toLowerCase().endsWith(".md") ? trimmed.slice(0, -3).trim() : trimmed;
}
function getInvalidChapterBaseNameReason(baseName) {
  if (!baseName) {
    return "\u7AE0\u8282\u540D\u4E0D\u80FD\u4E3A\u7A7A\u3002";
  }
  if (/[\\/:*?"<>|]/.test(baseName)) {
    return '\u7AE0\u8282\u540D\u4E0D\u80FD\u5305\u542B / \\ : * ? " < > |\u3002';
  }
  if (baseName.endsWith(".")) {
    return "\u7AE0\u8282\u540D\u4E0D\u80FD\u4EE5\u53E5\u70B9\u7ED3\u5C3E\u3002";
  }
  return null;
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function clampPanelWidth(width) {
  return Math.round(clamp(width, MIN_PANEL_WIDTH, MAX_PANEL_WIDTH));
}
function copyTextareaLayoutStyles(editor, mirror, style) {
  mirror.setCssStyles({
    position: "absolute",
    top: "0",
    left: "0",
    width: style.width,
    height: "auto",
    minHeight: "0",
    maxHeight: "none",
    visibility: "hidden",
    pointerEvents: "none",
    overflow: "hidden",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    boxSizing: style.boxSizing,
    padding: style.padding,
    border: style.border,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    textTransform: style.textTransform,
    tabSize: style.tabSize
  });
}
function diffPrefix(kind) {
  if (kind === "added") {
    return "+";
  }
  if (kind === "removed") {
    return "-";
  }
  return " ";
}
function snapshotKindLabel(kind) {
  if (kind === "auto") {
    return "\u81EA\u52A8";
  }
  if (kind === "daily") {
    return "\u6BCF\u65E5";
  }
  if (kind === "manual") {
    return "\u624B\u52A8";
  }
  return "\u65E7\u7248";
}
function createEmptySessionState() {
  return {
    baselineWords: 0,
    writingTimeMs: 0,
    idleTimeMs: 0,
    lastActivityAt: null,
    lastTickAt: Date.now()
  };
}
async function openWorkbenchLeaf(plugin, file) {
  const { workspace } = plugin.app;
  const activeLeaf = workspace.activeLeaf;
  const existingLeaf = workspace.getLeavesOfType(WORKBENCH_VIEW_TYPE)[0];
  const leaf = existingLeaf ?? activeLeaf ?? workspace.getLeaf(false);
  await leaf.setViewState({
    type: WORKBENCH_VIEW_TYPE,
    active: true,
    state: file ? { file: file.path } : void 0
  });
  const view = leaf.view;
  if (!(view instanceof WorkbenchView)) {
    new import_obsidian3.Notice("Unable to open the Watermelon workbench view.");
    return;
  }
  await view.refreshFromSettings();
  const targetFile = file ?? view.getInitialFileForOpen();
  if (!targetFile) {
    view.renderEmptyEditorState("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A Markdown \u7B14\u8BB0\uFF0C\u518D\u8FDB\u5165 Workbench\u3002");
    return;
  }
  view.configureScopeFromFile(targetFile, true);
  view.refreshChapterList();
  await view.openChapter(targetFile);
}

// src/main.ts
var WatermelonWorkbenchPlugin = class extends import_obsidian4.Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(WORKBENCH_VIEW_TYPE, (leaf) => new WorkbenchView(leaf, this));
    this.addCommand({
      id: "open-writing-workbench",
      name: "Open writing workbench",
      callback: async () => {
        await openWorkbenchLeaf(this, this.app.workspace.getActiveFile());
      }
    });
    this.addCommand({
      id: "open-current-file-in-writing-workbench",
      name: "Open current file in writing workbench",
      checkCallback: (checking) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!(activeFile instanceof import_obsidian4.TFile) || activeFile.extension !== "md") {
          return false;
        }
        if (!checking) {
          void openWorkbenchLeaf(this, activeFile);
        }
        return true;
      }
    });
    this.addCommand({
      id: "exit-writing-workbench",
      name: "Exit writing workbench",
      checkCallback: (checking) => {
        const view = this.getAnyWorkbenchView();
        if (!view) {
          return false;
        }
        if (!checking) {
          void view.exitWorkbench();
        }
        return true;
      }
    });
    this.addRibbonIcon("notebook-pen", "Open Watermelon Workbench", async () => {
      await openWorkbenchLeaf(this, this.app.workspace.getActiveFile());
    });
    this.addSettingTab(new WatermelonSettingTab(this));
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
    for (const leaf of this.app.workspace.getLeavesOfType(WORKBENCH_VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof WorkbenchView) {
        await view.refreshFromSettings();
      }
    }
  }
  getAnyWorkbenchView() {
    for (const leaf of this.app.workspace.getLeavesOfType(WORKBENCH_VIEW_TYPE)) {
      if (leaf.view instanceof WorkbenchView) {
        return leaf.view;
      }
    }
    return null;
  }
};
