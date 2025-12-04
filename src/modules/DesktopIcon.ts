import type { AppConfig } from "../core/AppLoader";
import { WindowManager } from "./WindowManager";
import { Registry } from "../core/Registry";
import { DomUtils } from "../utils/DomUtils";
import { BaseComponent } from "../utils/BaseComponent";

export class DesktopIcon extends BaseComponent {
  private imgElement: HTMLImageElement | null = null;
  private appConfig: AppConfig;
  private windowManager: WindowManager;
  private registry: Registry;

  constructor(appConfig: AppConfig, wm: WindowManager) {
    super();
    this.appConfig = appConfig;
    this.windowManager = wm;
    this.registry = Registry.getInstance();
  }

  public render(parentContainer: HTMLElement): void {
    if (this.element) return;

    this.element = DomUtils.create("div", {
      className: "desktop-icon",
      attributes: {
        title: `Double-click to launch ${this.appConfig.name}`,
        "data-app-id": this.appConfig.id,
      },
      parent: parentContainer,
      html: `
                <img 
                    src="${this.getIconSource()}" 
                    alt="${this.appConfig.name} icon"
                    onerror="this.src='https://placehold.co/48x48/000000/ffffff?text=App'"
                />
                <span class="icon-label">${this.appConfig.name}</span>
            `,
    });

    this.imgElement = this.element.querySelector("img");
    this.attachListeners();

    const onThemeChange = () => this.updateIcon();
    this.registry.subscribe("theme.mode", onThemeChange);
    this.disposables.push(() =>
      this.registry.unsubscribe("theme.mode", onThemeChange)
    );
  }

  private getIconSource(): string {
    const currentTheme = this.registry.get<string>("theme.mode") || "dark";

    if (typeof this.appConfig.icon === "object") {
      return currentTheme === "light"
        ? this.appConfig.icon.light
        : this.appConfig.icon.dark;
    }
    return this.appConfig.icon;
  }

  private updateIcon(): void {
    if (this.imgElement) {
      this.imgElement.src = this.getIconSource();
    }
  }

  private attachListeners(): void {
    if (!this.element) return;

    this.addListener(this.element, "dblclick", () => {
      this.windowManager.openApp(this.appConfig.id);
    });

    this.addListener(this.element, "click", (e) => {
      document
        .querySelectorAll(".desktop-icon")
        .forEach((icon) => icon.classList.remove("selected"));
      this.element?.classList.add("selected");
      e.stopPropagation();
    });
  }
}
