import { Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, type WatermelonSettings, WatermelonSettingTab } from "./settings";
import { openWorkbenchLeaf, WorkbenchView, WORKBENCH_VIEW_TYPE } from "./views/WorkbenchView";

export default class WatermelonWorkbenchPlugin extends Plugin {
  settings!: WatermelonSettings;

  override async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(WORKBENCH_VIEW_TYPE, (leaf) => new WorkbenchView(leaf, this));

    this.addCommand({
      id: "open-writing-workbench",
      name: "Open writing workbench",
      callback: async () => {
        await openWorkbenchLeaf(this, this.app.workspace.getActiveFile());
      },
    });

    this.addCommand({
      id: "open-current-file-in-writing-workbench",
      name: "Open current file in writing workbench",
      checkCallback: (checking) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!(activeFile instanceof TFile) || activeFile.extension !== "md") {
          return false;
        }

        if (!checking) {
          void openWorkbenchLeaf(this, activeFile);
        }

        return true;
      },
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
      },
    });

    this.addRibbonIcon("notebook-pen", "Open Watermelon Workbench", async () => {
      await openWorkbenchLeaf(this, this.app.workspace.getActiveFile());
    });

    this.addSettingTab(new WatermelonSettingTab(this));
  }

  override onunload(): void {
    this.app.workspace.detachLeavesOfType(WORKBENCH_VIEW_TYPE);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);

    for (const leaf of this.app.workspace.getLeavesOfType(WORKBENCH_VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof WorkbenchView) {
        await view.refreshFromSettings();
      }
    }
  }

  private getAnyWorkbenchView(): WorkbenchView | null {
    for (const leaf of this.app.workspace.getLeavesOfType(WORKBENCH_VIEW_TYPE)) {
      if (leaf.view instanceof WorkbenchView) {
        return leaf.view;
      }
    }

    return null;
  }
}
