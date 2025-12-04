import { Service } from "../utils/Service";

export class Registry extends Service {
  private settings: Map<string, any>;
  private subscribers: Map<string, Array<(value: any) => void>>;
  private readonly STORAGE_KEY = "zen_os_registry";

  public constructor() {
    super();
    this.settings = new Map();
    this.subscribers = new Map();
  }

  protected override onCreation(): void {
    Object.defineProperty(window, "ZenRegistry", {
      value: this,
      writable: false,
      configurable: false,
    });
  }

  public async init(): Promise<void> {
    this.setDefaults();
    this.loadFromStorage();
  }

  private setDefaults(): void {
    this.settings.set("system.os.name", "ZenOS");
    this.settings.set("system.os.version", "0.3.0-alpha");
    this.settings.set("system.os.build", "24H2");
    this.settings.set("system.os.codename", "Nebula");
    this.settings.set("system.language", "en-US");
    this.settings.set("system.timezone", "UTC");

    this.settings.set("hardware.cpu", "ZenCore Virtual Processor (4 Cores)");
    this.settings.set("hardware.ram", "16 GB");
    this.settings.set("hardware.gpu", "ZenGraphic X1");
    this.settings.set("hardware.display.resolution", "1920x1080");

    this.settings.set("user.name", "User");
    this.settings.set("user.accountType", "Administrator");
    this.settings.set("user.avatar", "assets/icons/default_avatar.png");

    this.settings.set("theme.mode", "dark");
    this.settings.set("theme.accentColor", "#60cdff");
    this.settings.set("theme.font.sans", "Segoe UI");
    this.settings.set("theme.font.mono", "Cascadia Code");

    this.settings.set("desktop.wallpaper", "default_void.jpg");
    this.settings.set("desktop.icons.size", "medium");
    this.settings.set("desktop.icons.grid", true);

    this.settings.set("taskbar.position", "bottom");
    this.settings.set("taskbar.locked", true);
    this.settings.set("taskbar.autohide", false);

    this.settings.set("ui.transparency", true);
    this.settings.set("ui.animations", true);
    this.settings.set("ui.sound.enabled", true);
    this.settings.set("ui.scale", 1.0);

    this.settings.set("network.hostname", "zen-workstation");
    this.settings.set("network.ip", "192.168.1.105");
    this.settings.set("network.status", "Connected");
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        Object.entries(data).forEach(([key, value]) => {
          this.settings.set(key, value);
        });
      } else {
        this.saveToStorage();
      }
    } catch (e) {
      console.warn("Registry: Failed to load saved settings.", e);
    }
  }

  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.settings);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Registry: Failed to save settings.", e);
    }
  }

  public get<T>(key: string): T {
    return this.settings.get(key) as T;
  }

  public set(key: string, value: any): void {
    const oldValue = this.settings.get(key);
    this.settings.set(key, value);

    if (oldValue !== value) {
      this.notify(key, value);
      this.saveToStorage();
    }
  }

  public has(key: string): boolean {
    return this.settings.has(key);
  }

  public subscribe(key: string, callback: (value: any) => void): void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    this.subscribers.get(key)?.push(callback);
  }

  public unsubscribe(key: string, callback: (value: any) => void): void {
    if (!this.subscribers.has(key)) return;

    const callbacks = this.subscribers.get(key) || [];
    this.subscribers.set(
      key,
      callbacks.filter((cb) => cb !== callback)
    );
  }

  private notify(key: string, value: any): void {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach((cb) => cb(value));
    }
  }

  public dump(): Record<string, any> {
    return Object.fromEntries(this.settings);
  }
}
