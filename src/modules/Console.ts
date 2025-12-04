import "../styles/_console.scss";
import { DomUtils } from "../utils/DomUtils";
import { BaseComponent } from "../utils/BaseComponent";

export type LogLevel =
  | "INFO"
  | "WARN"
  | "ERROR"
  | "SUCCESS"
  | "SYSTEM"
  | "INPUT";

export class Console extends BaseComponent {
  private static instance: Console;
  private output!: HTMLElement;
  private inputWrapper!: HTMLElement;
  private input!: HTMLInputElement;
  private isVisible: boolean = false;
  private isLocked: boolean = true;

  public onCommand: ((command: string) => Promise<void> | void) | null = null;

  private constructor() {
    super();
    this.create();
    this.attachListeners();
  }

  public static getInstance(): Console {
    if (!Console.instance) {
      Console.instance = new Console();
    }
    return Console.instance;
  }

  private create(): void {
    this.element = DomUtils.create("div", {
      className: "sys-console hidden",
      parent: document.body,
    });

    DomUtils.create("div", {
      className: "console-header",
      parent: this.element,
    });

    this.output = DomUtils.create("div", {
      className: "console-output",
      parent: this.element,
    });

    this.inputWrapper = DomUtils.create("div", {
      className: "console-input-wrapper locked",
      parent: this.element,
      html: `<span class="prompt-symbol">root@zen:~$</span>`,
    });

    this.input = DomUtils.create("input", {
      className: "console-input",
      attributes: {
        type: "text",
        placeholder: "System booting...",
        spellcheck: "false",
        autocomplete: "off",
      },
      parent: this.inputWrapper,
    }) as HTMLInputElement;
    this.input.disabled = true;
  }

  private attachListeners(): void {
    this.addListener(window, "keydown", (e: Event) => {
      const kEvent = e as KeyboardEvent;
      if (kEvent.key === "F2") {
        this.toggle();
        kEvent.preventDefault();
        return;
      }

      if (kEvent.key === "Escape") {
        if (this.isVisible) {
          this.toggle();
          kEvent.preventDefault();
        }
        return;
      }

      if (this.isVisible) {
        const isCtrlOrMeta = kEvent.ctrlKey || kEvent.metaKey;
        const isModifier = ["Control", "Shift", "Alt", "Meta"].includes(
          kEvent.key
        );

        if (!isCtrlOrMeta && !isModifier) {
          if (document.activeElement !== this.input) {
            this.input.focus();
          }
        }
      }
    });

    this.addListener(this.input, "keydown", async (e: Event) => {
      const kEvent = e as KeyboardEvent;
      if (kEvent.key === "Enter" && !this.isLocked) {
        const command = this.input.value.trim();
        if (command) {
          await this.processCommand(command);
        }
        this.input.value = "";
      }
    });
  }

  private async processCommand(command: string): Promise<void> {
    this.log(`root@zen:~$ ${command}`, "INPUT");
    this.setLock(true, "");

    if (this.onCommand) {
      try {
        await this.onCommand(command);
      } catch (err: any) {
        this.log(`Error: ${err.message || err}`, "ERROR");
      }
    } else {
      this.log(`Command not found: ${command}`, "WARN");
    }

    this.setLock(false);
    if (this.isVisible) this.input.focus();
  }

  public setLock(locked: boolean, placeholderText?: string): void {
    this.isLocked = locked;
    this.input.disabled = locked;

    if (locked) {
      this.inputWrapper.classList.add("locked");
      this.input.placeholder = placeholderText || "Processing...";
    } else {
      this.inputWrapper.classList.remove("locked");
      this.input.placeholder = "";
      if (this.isVisible) setTimeout(() => this.input.focus(), 50);
    }
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    if (this.element) {
      if (this.isVisible) {
        this.element.classList.remove("hidden");
        if (!this.isLocked) setTimeout(() => this.input.focus(), 50);
      } else {
        this.element.classList.add("hidden");
        this.input.blur();
      }
    }
  }

  public show(): void {
    this.isVisible = true;
    this.element?.classList.remove("hidden");
  }

  public log(message: string, level: LogLevel = "INFO"): void {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour12: false });

    let contentHtml = "";
    if (level === "INPUT") {
      contentHtml = `<span class="message" style="opacity: 0.6;">${message}</span>`;
    } else {
      contentHtml = `
          <span class="timestamp">${timeStr}</span>
          <span class="level">[${level}]</span>
          <span class="message">${message}</span>
        `;
    }

    DomUtils.create("div", {
      className: `log-line log-${level.toLowerCase()}`,
      html: contentHtml,
      parent: this.output,
    });

    this.output.scrollTop = this.output.scrollHeight;
  }

  public clear(): void {
    this.output.innerHTML = "";
  }
}
