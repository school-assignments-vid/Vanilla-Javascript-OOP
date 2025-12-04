import gsap from "gsap";
import { Registry } from "../core/Registry";
import { DomUtils } from "../utils/DomUtils";
import { BaseComponent } from "../utils/BaseComponent";
import "../styles/_lockscreen.scss";

export class LockScreen extends BaseComponent {
  private onUnlock: (() => void) | null = null;
  private isUnlocking: boolean = false;
  private registry: Registry;

  constructor() {
    super();
    this.registry = Registry.getInstance();
  }

  public show(onUnlockCallback: () => void): void {
    this.onUnlock = onUnlockCallback;
    this.create();
    this.startClock();
    this.attachListeners();
  }

  private create(): void {
    if (document.querySelector(".lock-screen")) return;

    const wallpaper = this.registry.get<string>("desktop.wallpaper") || "default_void.jpg";
    const bgUrl = wallpaper.startsWith('http') 
        ? `url(${wallpaper})` 
        : `url(assets/wallpapers/${wallpaper})`;

    this.element = DomUtils.create("div", {
        className: "lock-screen",
        parent: document.body,
        html: `
            <div class="lock-bg" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: ${bgUrl};
                background-size: cover;
                background-position: center;
                filter: blur(5px); 
                transform: scale(1.05);
                z-index: -1;
                will-change: transform, filter;
            "></div>
            
            <div class="time-container">
                <div class="clock-time">00:00</div>
                <div class="clock-date">Monday, January 1</div>
            </div>
        `
    });

    gsap.set(this.element, { opacity: 0 });
    this.updateTime();

    gsap.to(this.element, {
      opacity: 1,
      duration: 1.5,
      ease: "power2.out",
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
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString(navigator.language, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    }
  }

  private attachListeners(): void {
    this.addListener(window, "keydown", (e) => this.handleInput(e));
    this.addListener(window, "mousedown", (e) => this.handleInput(e));
    this.addListener(window, "touchstart", (e) => this.handleInput(e));
  }

  private handleInput(e: Event): void {
    if (this.isUnlocking) return;

    if (e.type === "keydown") {
      const k = (e as KeyboardEvent).key;
      if (/^F\d+$/.test(k)) return;
    }

    this.dismiss();
  };

  private dismiss(): void {
    if (!this.element) return;
    this.isUnlocking = true;

    gsap.to(this.element, {
      opacity: 0,
      scale: 1.1,
      filter: "blur(15px)",
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        this.destroy();
        if (this.onUnlock) this.onUnlock();
      },
    });
  }
}