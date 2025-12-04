import { AppLoader } from "../core/AppLoader";
import { Window } from "./Window";
import { Service } from "../utils/Service";

export class WindowManager extends Service {
  private openWindows: Map<string, Window> = new Map();
  private activeWindowId: string | null = null;

  public constructor() {
    super();
    this.attachGlobalListeners();
  }

  public getOpenWindows(): Window[] {
    return Array.from(this.openWindows.values());
  }

  public getActiveWindowId(): string | null {
    return this.activeWindowId;
  }

  public openApp(appId: string): Window | undefined {
    const appConfig = AppLoader.getInstance().getApp(appId);
    if (!appConfig) {
      console.error(`Application with ID "${appId}" not found.`);
      return;
    }

    const newWindow = new Window(appConfig);
    this.openWindows.set(newWindow.id, newWindow);
    newWindow.render();
    this.setActiveWindow(newWindow.id);
    document.dispatchEvent(
      new CustomEvent("window:open", { detail: { window: newWindow } })
    );
    return newWindow;
  }

  public setActiveWindow(windowId: string): void {
    const win = this.openWindows.get(windowId);
    if (win) {
      this.activeWindowId = windowId;
      win.focus();
      document.dispatchEvent(
        new CustomEvent("window:focus", { detail: { windowId } })
      );
    }
  }

  public minimizeWindow(windowId: string): void {
    const win = this.openWindows.get(windowId);
    if (win) {
      win.minimize();
    }
  }

  public maximizeWindow(windowId: string): void {
    const win = this.openWindows.get(windowId);
    if (win) {
      win.maximize();
    }
  }

  public closeWindow(windowId: string): void {
    const windowToClose = this.openWindows.get(windowId);
    if (windowToClose) {
      windowToClose.destroy();
      this.openWindows.delete(windowId);
      if (this.activeWindowId === windowId) {
        const remaining = this.getOpenWindows();
        if (remaining.length > 0) {
          this.setActiveWindow(remaining[remaining.length - 1].id);
        } else {
          this.activeWindowId = null;
        }
      }
      document.dispatchEvent(
        new CustomEvent("window:closed", { detail: { windowId } })
      );
    }
  }

  public closeAll(): void {
    this.openWindows.forEach((window) => window.destroy());
    this.openWindows.clear();
    this.activeWindowId = null;
    console.log("All windows closed.");
  }

  private handleWindowCloseEvent(event: Event): void {
    const detail = (event as CustomEvent).detail;
    if (detail && detail.windowId) {
      this.closeWindow(detail.windowId);
    }
  }

  private handleWindowFocusEvent(event: Event): void {
    const detail = (event as CustomEvent).detail;
    if (detail && detail.windowId) {
      this.activeWindowId = detail.windowId;
      document.dispatchEvent(
        new CustomEvent("window:focus", {
          detail: { windowId: detail.windowId },
        })
      );
    }
  }

  private attachGlobalListeners(): void {
    document.addEventListener(
      "window:close",
      this.handleWindowCloseEvent.bind(this) as EventListener
    );
    document.addEventListener(
      "window:requestfocus",
      this.handleWindowFocusEvent.bind(this) as EventListener
    );
  }
}
