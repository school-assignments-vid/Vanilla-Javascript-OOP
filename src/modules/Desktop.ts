import { Registry } from "../core/Registry";
import { Taskbar } from "./Taskbar";
import { WindowManager } from "./WindowManager";
import { AppLoader } from "../core/AppLoader";
import { DesktopIcon } from "./DesktopIcon";
import { DomUtils } from "../utils/DomUtils";
import { BaseComponent } from "../utils/BaseComponent";
import "../styles/_desktop.scss";

export class Desktop extends BaseComponent {
  private registry: Registry;
  private taskbar: Taskbar;
  private windowManager: WindowManager;
  private appLoader: AppLoader;
  private desktopIcons: DesktopIcon[] = [];

  constructor() {
    super();
    this.registry = Registry.getInstance();
    this.windowManager = WindowManager.getInstance();
    this.appLoader = AppLoader.getInstance();
    this.taskbar = new Taskbar(); 
  }

  public async init(): Promise<void> {
    this.render();
    
    const onWallpaperChange = (newWallpaper: string) => this.updateWallpaper(newWallpaper);
    this.registry.subscribe("desktop.wallpaper", onWallpaperChange);
    this.disposables.push(() => this.registry.unsubscribe("desktop.wallpaper", onWallpaperChange));

    await this.appLoader.loadApps(); 

    this.taskbar.init();
    this.renderDesktopIcons();
    this.attachListeners();
  }

  public override destroy(): void {
    this.desktopIcons.forEach(icon => icon.destroy());
    this.desktopIcons = [];
    
    this.windowManager.closeAll();
    this.taskbar.destroy();

    super.destroy();
    
    console.log("Desktop environment destroyed.");
  }

  private render(): void {
    if (document.querySelector(".desktop-environment")) return;

    this.element = DomUtils.create("div", {
        className: "desktop-environment",
        parent: document.body
    });
    
    const wallpaper = this.registry.get<string>("desktop.wallpaper") || "default_void.jpg";
    this.updateWallpaper(wallpaper);
  }

  private updateWallpaper(path: string): void {
      if (!this.element) return;
      const url = path.startsWith('http') ? path : `assets/wallpapers/${path}`;
      this.element.style.backgroundImage = `url('${url}')`;
  }
  
  private renderDesktopIcons(): void {
      if (!this.element) return;
      
      const apps = this.appLoader.getAllApps();
      
      apps.forEach(appConfig => {
          const icon = new DesktopIcon(appConfig, this.windowManager);
          icon.render(this.element!);
          this.desktopIcons.push(icon);
      });
  }

  private attachListeners(): void {
    if (this.element) {
        this.addListener(this.element, "contextmenu", (e) => e.preventDefault());
        this.addListener(this.element, "click", () => {
            document.querySelectorAll('.desktop-icon').forEach(icon => icon.classList.remove('selected'));
        });
    }
  }
}