import "../styles/_taskbar.scss";
import { WindowManager } from "./WindowManager";
import { Window } from "./Window";
import { Registry } from "../core/Registry";
import { DomUtils } from "../utils/DomUtils";
import { BaseComponent } from "../utils/BaseComponent";

export class Taskbar extends BaseComponent {
  private appsContainer: HTMLElement | null = null;
  private previewContainer: HTMLElement | null = null;

  private windowManager: WindowManager;
  private registry: Registry;
  private activePreviewAppId: string | null = null;

  private startIconPath: string =
    "M11.106 2.553a1 1 0 0 1 1.788 0l2.851 5.701l5.702 2.852a1 1 0 0 1 .11 1.725l-.11 .063l-5.702 2.851l-2.85 5.702a1 1 0 0 1 -1.726 .11l-.063 -.11l-2.852 -5.702l-5.701 -2.85a1 1 0 0 1 -.11 -1.726l.11 -.063l5.701 -2.852z";

  constructor() {
    super();
    this.windowManager = WindowManager.getInstance();
    this.registry = Registry.getInstance();
  }

  public init(): void {
    this.create();
    this.startClock();
    this.attachListeners();
    this.updateAppIcons();

    const onThemeChange = () => this.updateAppIcons();
    this.registry.subscribe("theme.mode", onThemeChange);
    this.disposables.push(() =>
      this.registry.unsubscribe("theme.mode", onThemeChange)
    );
  }

  public override destroy(): void {
    super.destroy();

    if (this.previewContainer && this.previewContainer.parentNode) {
      this.previewContainer.parentNode.removeChild(this.previewContainer);
      this.previewContainer = null;
    }
  }

  private create(): void {
    this.element = DomUtils.create("div", {
      className: "zen-taskbar",
      html: `
                <div class="taskbar-left">
                    <div class="start-btn" title="Start">
                        <svg viewBox="0 0 24 24">
                            <path d="${this.startIconPath}" />
                        </svg>
                    </div>
                </div>

                <div class="taskbar-center">
                    <div class="taskbar-apps"></div>
                </div>

                <div class="taskbar-tray">
                    <div class="tray-clock">
                        <span class="clock-time">00:00</span>
                        <span class="clock-date">1/1/2024</span>
                    </div>
                </div>
            `,
      parent: document.body,
    });

    this.previewContainer = DomUtils.create("div", {
      className: "taskbar-previews",
      parent: document.body,
    });

    this.appsContainer = this.element.querySelector(".taskbar-apps");
    this.updateTime();
  }

  private attachListeners(): void {
    this.addListener(document, "window:open", () => this.handleWindowChange());
    this.addListener(document, "window:closed", () =>
      this.handleWindowChange()
    );
    this.addListener(document, "window:focus", () => this.handleWindowChange());
    this.addListener(document, "window:minimize", () =>
      this.handleWindowChange()
    );

    this.addListener(document, "mousedown", (e) => this.handleGlobalClick(e));

    if (this.appsContainer) {
      this.addListener(this.appsContainer, "click", (e) =>
        this.handleAppIconClick(e)
      );
    }
  }

  private handleWindowChange(): void {
    this.updateAppIcons();
    if (this.activePreviewAppId) {
      const icon = this.appsContainer?.querySelector(
        `[data-app-id="${this.activePreviewAppId}"]`
      ) as HTMLElement;
      if (icon) {
        const windows = this.windowManager
          .getOpenWindows()
          .filter((w) => w.getAppId() === this.activePreviewAppId);
        if (windows.length > 0) {
          this.showPreviews(this.activePreviewAppId, icon, windows);
        } else {
          this.closePreviews();
        }
      } else {
        this.closePreviews();
      }
    }
  }

  private handleGlobalClick(e: Event): void {
    const target = e.target as HTMLElement;
    const isTaskbarIcon = target.closest(".taskbar-app-icon");
    const isPreview = target.closest(".taskbar-previews");

    if (!isTaskbarIcon && !isPreview) {
      this.closePreviews();
    }
  }

  private handleAppIconClick(e: Event): void {
    const target = e.target as HTMLElement;
    const icon = target.closest(".taskbar-app-icon") as HTMLElement;

    if (icon) {
      const appId = icon.dataset.appId;
      if (!appId) return;

      const windows = this.windowManager
        .getOpenWindows()
        .filter((w) => w.getAppId() === appId);

      if (windows.length === 1) {
        const win = windows[0];
        if (
          win.id === this.windowManager.getActiveWindowId() &&
          !win.isMinimized()
        ) {
          win.minimize();
        } else {
          win.restore();
          win.focus();
        }
        this.closePreviews();
      } else if (windows.length > 1) {
        if (this.activePreviewAppId === appId) {
          this.closePreviews();
        } else {
          this.showPreviews(appId, icon, windows);
        }
      }
    }
  }

  private showPreviews(
    appId: string,
    iconElement: HTMLElement,
    windows: Window[]
  ): void {
    if (!this.previewContainer) return;

    this.activePreviewAppId = appId;
    this.previewContainer.innerHTML = "";

    windows.forEach((win) => {
      const isActive =
        win.id === this.windowManager.getActiveWindowId() && !win.isMinimized();

      DomUtils.create("div", {
        className: `preview-item ${isActive ? "active" : ""}`,
        html: `
                    <div class="preview-header">
                        <img src="${win.getIcon()}" alt="" />
                        <span>${win.getTitle()}</span>
                        <div class="preview-close" title="Close Window">×</div>
                    </div>
                    <div class="preview-thumbnail"></div>
                `,
        parent: this.previewContainer!,
        events: {
          click: (e: Event) => {
            if ((e.target as HTMLElement).closest(".preview-close")) {
              e.stopPropagation();
              this.windowManager.closeWindow(win.id);
              return;
            }
            win.restore();
            win.focus();
            this.closePreviews();
          },
        },
      });
    });

    const iconRect = iconElement.getBoundingClientRect();

    this.previewContainer.classList.add("visible");

    const leftPos =
      iconRect.left +
      iconRect.width / 2 -
      this.previewContainer.offsetWidth / 2;
    this.previewContainer.style.left = `${leftPos}px`;
    this.previewContainer.style.bottom = "60px";
  }

  private closePreviews(): void {
    if (!this.previewContainer) return;
    this.previewContainer.classList.remove("visible");
    this.activePreviewAppId = null;
  }

  private updateAppIcons(): void {
    if (!this.appsContainer) return;

    const openWindows = this.windowManager.getOpenWindows();
    const groups = new Map<string, Window[]>();

    openWindows.forEach((win) => {
      const appId = win.getAppId();
      if (!groups.has(appId)) {
        groups.set(appId, []);
      }
      groups.get(appId)!.push(win);
    });

    this.appsContainer.innerHTML = "";
    const activeWindowId = this.windowManager.getActiveWindowId();

    groups.forEach((windows, appId) => {
      const isActive = windows.some(
        (w) => w.id === activeWindowId && !w.isMinimized()
      );
      const count = windows.length;

      const iconClass = `taskbar-app-icon ${isActive ? "active" : "running"} ${
        count > 1 ? "multiple" : ""
      }`;

      const icon = DomUtils.create("div", {
        className: iconClass,
        attributes: { "data-app-id": appId },
        parent: this.appsContainer!,
      });

      icon.title = count === 1 ? windows[0].getTitle() : `${count} windows`;

      const imgWrapper = DomUtils.create("div", {
        className: "icon-wrapper",
        parent: icon,
      });
      DomUtils.create("img", {
        attributes: { src: windows[0].getIcon(), alt: "App" },
        parent: imgWrapper,
      });

      DomUtils.create("div", { className: "app-indicator", parent: icon });
    });
  }

  private startClock(): void {
    this.setInterval(() => this.updateTime(), 1000);
  }

  private updateTime(): void {
    if (!this.element) return;

    const now = new Date();
    const timeEl = this.element.querySelector(".clock-time");
    const dateEl = this.element.querySelector(".clock-date");

    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString(navigator.language, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString(navigator.language, {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
    }
  }
}
