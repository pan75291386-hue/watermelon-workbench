import { App, Modal, normalizePath, Platform, Setting, TFolder } from "obsidian";

export type ExportDestination =
  | { kind: "vault"; path: string; folder: string }
  | { kind: "system"; path: string; createDefaultFolder: boolean };

type ExportFormat = "docx" | "txt";

interface NativeSaveDialog {
  showSaveDialog(options: {
    title: string;
    defaultPath: string;
    buttonLabel: string;
    filters: Array<{ name: string; extensions: string[] }>;
  }): Promise<{ canceled: boolean; filePath?: string }>;
}

/** Lets the writer choose a vault folder or, on desktop, an absolute file path. */
export class ExportDestinationModal extends Modal {
  private resolveChoice: ((destination: ExportDestination | null) => void) | null = null;
  private settled = false;
  private submitting = false;
  private browsing = false;
  private selectedFolder: string;
  private systemPathInput: HTMLInputElement | null = null;
  private fileNameInput: HTMLInputElement | null = null;
  private errorEl!: HTMLParagraphElement;
  private defaultAbsoluteFolder: string | null = null;
  private nativeSaveDialog: NativeSaveDialog | null = null;

  constructor(
    app: App,
    private readonly defaultFolder: string,
    private readonly defaultFileName: string,
    private readonly format: ExportFormat,
  ) {
    super(app);
    this.selectedFolder = defaultFolder;
  }

  choose(): Promise<ExportDestination | null> {
    return new Promise((resolve) => {
      this.resolveChoice = resolve;
      this.open();
    });
  }

  override onOpen(): void {
    this.titleEl.setText("选择导出位置");
    this.contentEl.empty();

    const adapter = this.app.vault.adapter as typeof this.app.vault.adapter & {
      getFullPath?: (path: string) => string;
    };
    const canSaveOutsideVault = Platform.isDesktopApp && typeof adapter.getFullPath === "function";
    if (canSaveOutsideVault) {
      this.defaultAbsoluteFolder = adapter.getFullPath?.(this.defaultFolder) ?? null;
      this.nativeSaveDialog = getNativeSaveDialog();
    }

    const folders = [this.defaultFolder, "", ...this.app.vault.getAllLoadedFiles()
      .filter((file): file is TFolder => file instanceof TFolder)
      .map((folder) => folder.path)]
      .filter((folder, index, all) => all.indexOf(folder) === index);

    new Setting(this.contentEl)
      .setName("仓库内文件夹")
      .setDesc("可从现有文件夹中选择；默认使用当前章节旁的“导出”文件夹。")
      .addDropdown((dropdown) => {
        folders.forEach((folder) => {
          const label = folder === this.defaultFolder ? `${folder}（默认）` : folder || "/（仓库根目录）";
          dropdown.addOption(folder, label);
        });
        dropdown.setValue(this.defaultFolder);
        dropdown.onChange((folder) => {
          this.selectedFolder = folder;
          if (this.systemPathInput && adapter.getFullPath) {
            const nodePath = require("path") as typeof import("node:path");
            const currentName = nodePath.basename(this.systemPathInput.value) || this.defaultFileName;
            this.systemPathInput.value = adapter.getFullPath(joinVaultPath(folder, currentName));
          }
          this.showError("");
        });
      });

    if (canSaveOutsideVault) {
      const pathSetting = new Setting(this.contentEl)
        .setName("完整保存地址")
        .setDesc("点击“浏览并保存”可打开电脑的保存窗口，也可直接修改地址。");
      pathSetting.addText((text) => {
        text.setValue(adapter.getFullPath?.(joinVaultPath(this.defaultFolder, this.defaultFileName)) ?? "");
        this.systemPathInput = text.inputEl;
        text.inputEl.style.minWidth = "240px";
      });
      if (this.nativeSaveDialog) {
        pathSetting.addButton((button) => button.setButtonText("浏览并保存…")
          .onClick(() => void this.browseAndSave()));
      }
    } else {
      new Setting(this.contentEl)
        .setName("文件名")
        .addText((text) => {
          text.setValue(this.defaultFileName);
          this.fileNameInput = text.inputEl;
        });
    }

    this.errorEl = this.contentEl.createEl("p");
    this.errorEl.style.color = "var(--text-error)";

    new Setting(this.contentEl)
      .addButton((button) => button.setButtonText("取消").onClick(() => this.close()))
      .addButton((button) => button.setButtonText("保存").setCta().onClick(() => void this.submit()));
  }

  override onClose(): void {
    if (!this.settled) {
      this.settled = true;
      this.resolveChoice?.(null);
    }
    this.resolveChoice = null;
    this.contentEl.empty();
  }

  private async submit(): Promise<void> {
    if (this.settled || this.submitting) {
      return;
    }

    this.submitting = true;
    try {
      await this.validateAndFinish();
    } catch (error) {
      console.error("Failed to choose export destination", error);
      this.showError("无法使用此位置，请检查地址后重试。");
    } finally {
      this.submitting = false;
    }
  }

  private async browseAndSave(): Promise<void> {
    if (!this.nativeSaveDialog || !this.systemPathInput || this.browsing || this.submitting || this.settled) {
      return;
    }

    this.browsing = true;
    try {
      const nodePath = require("path") as typeof import("node:path");
      const fs = require("fs") as typeof import("node:fs");
      const proposedPath = this.systemPathInput.value.trim();
      let existingFolder = nodePath.dirname(proposedPath);
      while (!fs.existsSync(existingFolder)) {
        const parent = nodePath.dirname(existingFolder);
        if (parent === existingFolder) {
          break;
        }
        existingFolder = parent;
      }

      const result = await this.nativeSaveDialog.showSaveDialog({
        title: "选择导出位置",
        defaultPath: nodePath.join(existingFolder, nodePath.basename(proposedPath)),
        buttonLabel: "导出",
        filters: [{ name: this.format === "docx" ? "Word 文档" : "纯文本", extensions: [this.format] }],
      });
      if (result.canceled || !result.filePath) {
        return;
      }

      this.systemPathInput.value = result.filePath;
      this.showError("");
      await this.submit();
    } catch (error) {
      console.error("Failed to open native export dialog", error);
      this.showError("无法打开系统保存窗口，请使用完整地址保存。");
    } finally {
      this.browsing = false;
    }
  }

  private async validateAndFinish(): Promise<void> {
    if (this.systemPathInput) {
      const nodePath = require("path") as typeof import("node:path");
      const fs = require("fs") as typeof import("node:fs");
      let filePath = this.systemPathInput.value.trim();
      if (!nodePath.isAbsolute(filePath) || /[\\/]$/.test(filePath)) {
        this.showError("请输入包含文件名的完整绝对地址。");
        return;
      }
      if (!nodePath.extname(filePath)) {
        filePath += `.${this.format}`;
      }
      if (nodePath.extname(filePath).toLowerCase() !== `.${this.format}`) {
        this.showError(`文件扩展名必须是 .${this.format}。`);
        return;
      }
      if (fs.existsSync(filePath)) {
        this.showError("目标文件已存在，请更换文件名，避免覆盖。");
        return;
      }

      const adapter = this.app.vault.adapter as typeof this.app.vault.adapter & {
        getFullPath?: (path: string) => string;
      };
      const name = nodePath.basename(filePath);
      const selectedVaultPath = joinVaultPath(this.selectedFolder, name);
      const selectedAbsolutePath = adapter.getFullPath?.(selectedVaultPath);
      if (selectedAbsolutePath && nodePath.resolve(selectedAbsolutePath) === nodePath.resolve(filePath)) {
        this.finish({ kind: "vault", path: selectedVaultPath, folder: this.selectedFolder });
        return;
      }

      const parent = nodePath.dirname(filePath);
      const createDefaultFolder = this.defaultAbsoluteFolder !== null &&
        nodePath.resolve(parent) === nodePath.resolve(this.defaultAbsoluteFolder);
      if (!createDefaultFolder && (!fs.existsSync(parent) || !fs.statSync(parent).isDirectory())) {
        this.showError("目标文件夹不存在，请选择现有文件夹。");
        return;
      }
      this.finish({ kind: "system", path: filePath, createDefaultFolder });
      return;
    }

    const fileName = this.fileNameInput?.value.trim() ?? "";
    if (!fileName || /[\\/:*?"<>|]/.test(fileName) || fileName.endsWith(".")) {
      this.showError("请输入有效的文件名。");
      return;
    }
    if (!fileName.toLowerCase().endsWith(`.${this.format}`)) {
      this.showError(`文件扩展名必须是 .${this.format}。`);
      return;
    }
    const filePath = joinVaultPath(this.selectedFolder, fileName);
    if (await this.app.vault.adapter.exists(filePath)) {
      this.showError("目标文件已存在，请更换文件名，避免覆盖。");
      return;
    }
    this.finish({ kind: "vault", path: filePath, folder: this.selectedFolder });
  }

  private showError(message: string): void {
    this.errorEl.setText(message);
  }

  private finish(destination: ExportDestination): void {
    this.settled = true;
    this.resolveChoice?.(destination);
    this.close();
  }
}

function joinVaultPath(folder: string, name: string): string {
  return normalizePath(folder && folder !== "/" ? `${folder}/${name}` : name);
}

function getNativeSaveDialog(): NativeSaveDialog | null {
  try {
    const electron = require("electron") as { remote?: { dialog?: NativeSaveDialog } };
    if (electron.remote?.dialog?.showSaveDialog) {
      return electron.remote.dialog;
    }
  } catch {
    // Some desktop builds provide the standalone remote bridge instead.
  }

  try {
    const remote = require("@electron/remote") as { dialog?: NativeSaveDialog };
    if (remote.dialog?.showSaveDialog) {
      return remote.dialog;
    }
  } catch {
    // Keep the editable path field when no native dialog bridge is available.
  }

  return null;
}
