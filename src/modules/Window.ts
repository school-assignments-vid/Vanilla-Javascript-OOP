import type { AppConfig } from "../core/AppLoader";
import { Registry } from "../core/Registry";
import { DomUtils } from "../utils/DomUtils";
import { BaseComponent } from "../utils/BaseComponent";
import "../styles/_window.scss";

export class Window extends BaseComponent {
  public readonly id: string;
  private appConfig: AppConfig;
  private styleLink: HTMLLinkElement | null = null;
  private _isMinimized: boolean = false;
  private _isMaximized: boolean = false;
  private savedDimensions: {
    width: string;
    height: string;
    top: string;
    left: string;
  } | null = null;
  private registry: Registry;

  private isResizing: boolean = false;
  private currentResizeDir: string | null = null;
  private resizeStartDims: {
    x: number;
    y: number;
    w: number;
    h: number;
    top: number;
    left: number;
  } | null = null;

  constructor(appConfig: AppConfig) {
    super();
    this.id = appConfig.id + "-" + Date.now();
    this.appConfig = appConfig;
    this.registry = Registry.getInstance();
  }

  public getIcon(): string {
    const currentTheme = this.registry.get<string>("theme.mode") || "dark";
    if (typeof this.appConfig.icon === "object") {
      return currentTheme === "light"
        ? this.appConfig.icon.light
        : this.appConfig.icon.dark;
    }
    return this.appConfig.icon;
  }

  public async render(): Promise<void> {
    if (this.element) return;

    let contentHtml = '<div class="loading-state">Loading...</div>';

    try {
      contentHtml = await DomUtils.fetchText(this.appConfig.contentUrl);
    } catch (e) {
      console.error(`Error fetching content for ${this.appConfig.name}:`, e);
      contentHtml = `<div class="error-state">Failed to load content.</div>`;
    }

    const width = this.appConfig.width || 800;
    const height = this.appConfig.height || 500;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const offset = document.querySelectorAll(".zen-window").length * 24;

    const initialLeft = Math.max(20, (viewportW - width) / 2 + offset);
    const initialTop = Math.max(20, (viewportH - height) / 2 + offset);

    const handles = `
            <div class="resize-handle n" data-dir="n"></div>
            <div class="resize-handle e" data-dir="e"></div>
            <div class="resize-handle s" data-dir="s"></div>
            <div class="resize-handle w" data-dir="w"></div>
            <div class="resize-handle ne" data-dir="ne"></div>
            <div class="resize-handle nw" data-dir="nw"></div>
            <div class="resize-handle se" data-dir="se"></div>
            <div class="resize-handle sw" data-dir="sw"></div>
        `;

    this.element = DomUtils.create("div", {
      className: "zen-window",
      id: this.id,
      html: `
                ${handles}
                <div class="window-header">
                    <div class="window-icon">
                        <img src="${this.getIcon()}" alt="Icon" class="titlebar-icon-img"/>
                    </div>
                    <span class="window-title">${this.appConfig.name}</span>
                    <div class="window-controls">
                        <button class="minimize-btn" title="Minimize">
                            <svg width="10" height="1" viewBox="0 0 10 1"><path d="M0 0h10v1H0z" fill="currentColor"/></svg>
                        </button>
                        <button class="maximize-btn" title="Maximize">
                            <svg class="max-icon" width="10" height="10" viewBox="0 0 10 10"><path d="M1,1v8h8V1H1z M9,8H2V2h7V8z" fill="currentColor"/></svg>
                            <svg class="restore-icon" style="display:none;" width="10" height="10" viewBox="0 0 10 10"><path d="M3,3v7h7V3H3z M9,9H4V4h5V9z M1,1v6h1V2h5V1H1z" fill="currentColor"/></svg>
                        </button>
                        <button class="close-btn" title="Close">
                            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M10,1.1L8.9,0L5,3.9L1.1,0L0,1.1L3.9,5L0,8.9L1.1,10L5,6.1L8.9,10L10,8.9L6.1,5L10,1.1z" fill="currentColor"/></svg>
                        </button>
                    </div>
                </div>
                <div class="window-content">
                    ${contentHtml}
                </div>
            `,
      parent:
        (document.querySelector(".desktop-environment") as HTMLElement) ||
        document.body,
    });

    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
    this.element.style.top = `${initialTop}px`;
    this.element.style.left = `${initialLeft}px`;

    const onThemeChange = () => this.updateIcon();
    this.registry.subscribe("theme.mode", onThemeChange);
    this.disposables.push(() =>
      this.registry.unsubscribe("theme.mode", onThemeChange)
    );

    this.loadStyles();
    await this.loadScripts();
    this.attachListeners();
    this.attachResizeListeners();
    this.focus();
  }

  private updateIcon(): void {
    if (!this.element) return;
    const img = this.element.querySelector(
      ".titlebar-icon-img"
    ) as HTMLImageElement;
    if (img) {
      img.src = this.getIcon();
    }
  }

  public override destroy(): void {
    this.unloadStyles();
    super.destroy();
  }

  public getTitle(): string {
    return this.appConfig.name;
  }
  public getAppId(): string {
    return this.appConfig.id;
  }
  public isMinimized(): boolean {
    return this._isMinimized;
  }

  public focus(): void {
    if (this._isMinimized) return;

    document.querySelectorAll(".zen-window").forEach((w) => {
      w.classList.remove("active");
      (w as HTMLElement).style.zIndex = "100";
    });

    if (this.element) {
      this.element.classList.add("active");
      this.element.style.zIndex = "200";
      this.element.style.display = "flex";
      this.element.classList.remove("minimized");
      document.dispatchEvent(
        new CustomEvent("window:requestfocus", {
          detail: { windowId: this.id },
        })
      );
    }
  }

  public minimize(): void {
    if (!this.element) return;
    this._isMinimized = true;
    this.element.classList.add("minimized");
    this.element.classList.remove("active");
  }

  public restore(): void {
    if (!this.element) return;
    this._isMinimized = false;
    this.element.classList.remove("minimized");
    this.focus();
  }

  public maximize(): void {
    if (!this.element) return;

    if (this._isMaximized) {
      if (this.savedDimensions) {
        this.element.style.width = this.savedDimensions.width;
        this.element.style.height = this.savedDimensions.height;
        this.element.style.top = this.savedDimensions.top;
        this.element.style.left = this.savedDimensions.left;
        this.element.classList.remove("maximized");
        this._isMaximized = false;
      }
    } else {
      this.savedDimensions = {
        width: this.element.style.width,
        height: this.element.style.height,
        top: this.element.style.top,
        left: this.element.style.left,
      };

      this.element.classList.add("maximized");
      this.element.style.top = "0";
      this.element.style.left = "0";
      this.element.style.width = "100vw";
      this.element.style.height = "calc(100vh - 48px)";
      this._isMaximized = true;
    }

    this.updateMaximizeIcon();
  }

  private updateMaximizeIcon(): void {
    const btn = this.element?.querySelector(".maximize-btn");
    if (btn) {
      const maxIcon = btn.querySelector(".max-icon") as HTMLElement;
      const restoreIcon = btn.querySelector(".restore-icon") as HTMLElement;
      if (this._isMaximized) {
        maxIcon.style.display = "none";
        restoreIcon.style.display = "block";
      } else {
        maxIcon.style.display = "block";
        restoreIcon.style.display = "none";
      }
    }
  }

  private loadStyles(): void {
    if (this.appConfig.styleUrl) {
      this.styleLink = document.createElement("link");
      this.styleLink.rel = "stylesheet";
      this.styleLink.href = this.appConfig.styleUrl;
      document.head.appendChild(this.styleLink);
    }
  }

  private unloadStyles(): void {
    if (this.styleLink && this.styleLink.parentNode) {
      this.styleLink.parentNode.removeChild(this.styleLink);
      this.styleLink = null;
    }
  }

  private async loadScripts(): Promise<void> {
    if (this.appConfig.scriptUrl && this.element) {
      try {
        const code = await DomUtils.fetchText(this.appConfig.scriptUrl);
        const scopedRun = new Function("container", "registry", code);
        scopedRun(
          this.element.querySelector(".window-content"),
          Registry.getInstance()
        );
      } catch (e) {
        console.error(
          `Window: Error running script for ${this.appConfig.name}`,
          e
        );
      }
    }
  }

  private attachListeners(): void {
    if (!this.element) return;

    this.addListener(
      this.element.querySelector(".close-btn")!,
      "click",
      (e) => {
        e.stopPropagation();
        const closeEvent = new CustomEvent("window:close", {
          detail: { windowId: this.id },
        });
        document.dispatchEvent(closeEvent);
      }
    );

    this.addListener(
      this.element.querySelector(".minimize-btn")!,
      "click",
      (e) => {
        e.stopPropagation();
        this.minimize();
        document.dispatchEvent(
          new CustomEvent("window:minimize", { detail: { windowId: this.id } })
        );
      }
    );

    this.addListener(
      this.element.querySelector(".maximize-btn")!,
      "click",
      (e) => {
        e.stopPropagation();
        this.maximize();
      }
    );

    const header = this.element.querySelector(".window-header") as HTMLElement;
    if (header) {
      this.addListener(header, "mousedown", (e) =>
        this.handleDragStart(e as MouseEvent)
      );
      this.addListener(header, "dblclick", () => this.maximize());
    }

    this.addListener(this.element, "mousedown", () => this.focus());
  }

  private handleDragStart(e: MouseEvent): void {
    if (!this.element || this._isMaximized) return;
    if ((e.target as HTMLElement).closest(".window-controls")) return;

    this.element.classList.add("dragging");

    const startX = e.clientX;
    const startY = e.clientY;
    const initialLeft = this.element.offsetLeft;
    const initialTop = this.element.offsetTop;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.element) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      this.element.style.left = `${initialLeft + dx}px`;
      this.element.style.top = `${initialTop + dy}px`;
    };

    const onMouseUp = () => {
      if (this.element) this.element.classList.remove("dragging");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    this.focus();
  }

  private attachResizeListeners(): void {
    if (!this.element) return;
    const handles = this.element.querySelectorAll(".resize-handle");

    handles.forEach((handle) => {
      this.addListener(handle, "mousedown", (e) => {
        const me = e as MouseEvent;
        me.preventDefault();
        me.stopPropagation();
        if (this._isMaximized) return;

        const target = me.target as HTMLElement;
        const dir = target.getAttribute("data-dir");
        if (!dir) return;

        this.startResize(me, dir);
      });
    });
  }

  private startResize(e: MouseEvent, dir: string): void {
    if (!this.element) return;

    this.isResizing = true;
    this.currentResizeDir = dir;
    this.element.classList.add("resizing");

    const rect = this.element.getBoundingClientRect();
    this.resizeStartDims = {
      x: e.clientX,
      y: e.clientY,
      w: rect.width,
      h: rect.height,
      top: this.element.offsetTop,
      left: this.element.offsetLeft,
    };

    const onMouseMove = (moveEvent: MouseEvent) =>
      this.handleResizeMove(moveEvent);
    const onMouseUp = () => this.stopResize(onMouseMove, onMouseUp);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    this.focus();
  }

  private handleResizeMove(e: MouseEvent): void {
    if (!this.isResizing || !this.resizeStartDims || !this.element) return;

    const deltaX = e.clientX - this.resizeStartDims.x;
    const deltaY = e.clientY - this.resizeStartDims.y;

    const minW = 320;
    const minH = 200;

    let newW = this.resizeStartDims.w;
    let newH = this.resizeStartDims.h;
    let newTop = this.resizeStartDims.top;
    let newLeft = this.resizeStartDims.left;

    const dir = this.currentResizeDir || "";

    if (dir.includes("e")) {
      newW = Math.max(minW, this.resizeStartDims.w + deltaX);
    } else if (dir.includes("w")) {
      newW = Math.max(minW, this.resizeStartDims.w - deltaX);
      if (newW !== minW) newLeft = this.resizeStartDims.left + deltaX;
    }

    if (dir.includes("s")) {
      newH = Math.max(minH, this.resizeStartDims.h + deltaY);
    } else if (dir.includes("n")) {
      newH = Math.max(minH, this.resizeStartDims.h - deltaY);
      if (newH !== minH) newTop = this.resizeStartDims.top + deltaY;
    }

    this.element.style.width = `${newW}px`;
    this.element.style.height = `${newH}px`;

    if (dir.includes("n") || dir.includes("w")) {
      if (dir.includes("n")) this.element.style.top = `${newTop}px`;
      if (dir.includes("w")) this.element.style.left = `${newLeft}px`;
    }
  }

  private stopResize(moveFn: any, upFn: any): void {
    this.isResizing = false;
    this.currentResizeDir = null;
    this.resizeStartDims = null;
    if (this.element) this.element.classList.remove("resizing");

    document.removeEventListener("mousemove", moveFn);
    document.removeEventListener("mouseup", upFn);
  }
}
