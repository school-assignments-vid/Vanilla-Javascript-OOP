import { BootLoader } from "../modules/Bootloader";
import { Console } from "../modules/Console";
import { Registry } from "./Registry";
import { LockScreen } from "../modules/LockScreen";
import { Desktop } from "../modules/Desktop";
import { AsyncUtils } from "../utils/AsyncUtils";
import { Service } from "../utils/Service";

type SystemState = "OFFLINE" | "BOOTING" | "LOCKED" | "RUNNING" | "ERROR";

interface BootTask {
  name: string;
  action: () => Promise<void>;
  minDuration?: number;
  successMessage?: string;
  errorMessage?: string;
}

export class SystemCore extends Service {
  private bootLoader: BootLoader;
  private sysConsole: Console;
  private registry: Registry;
  private lockScreen: LockScreen;
  private desktop: Desktop;
  private state: SystemState = "OFFLINE";

  private bootSequence: BootTask[] = [
    {
      name: "Load Registry Hive",
      action: async () => {
        await this.registry.init();

        const theme = this.registry.get<string>("theme.mode");
        if (theme === "light") {
          document.body.classList.add("light");
        } else {
          document.body.classList.remove("light");
        }
      },
      minDuration: 500,
      successMessage: "Registry hive loaded. User settings applied.",
      errorMessage: "CRITICAL: Failed to load registry hive.",
    },
  ];

  public constructor() {
    super();
    this.bootLoader = new BootLoader();
    this.sysConsole = Console.getInstance();
    this.registry = Registry.getInstance();
    this.lockScreen = new LockScreen();
    this.desktop = new Desktop();

    this.sysConsole.onCommand = this.handleCommand.bind(this);
  }

  public async boot(): Promise<void> {
    if (this.state !== "OFFLINE") return;

    this.state = "BOOTING";
    const startTime = Date.now();

    this.sysConsole.setLock(true, "System booting...");

    this.bootLoader.create();

    try {
      for (const task of this.bootSequence) {
        await this.executeTask(task);
      }

      const elapsed = Date.now() - startTime;
      const minDuration = 10000;
      if (elapsed < minDuration) {
        await AsyncUtils.wait(minDuration - elapsed);
      }

      await AsyncUtils.wait(500);
      this.completeBoot();
    } catch (error: any) {
      this.handleBootError(error);
    }
  }

  private async executeTask(task: BootTask): Promise<void> {
    const start = Date.now();

    try {
      await task.action();
      const msg = task.successMessage || `Task Complete: ${task.name}`;
      this.sysConsole.log(msg, "SUCCESS");
    } catch (e) {
      const msg = task.errorMessage || `Task Failed: ${task.name}`;
      this.sysConsole.log(msg, "ERROR");
      throw e;
    }

    if (task.minDuration) {
      const elapsed = Date.now() - start;
      const remaining = task.minDuration - elapsed;
      if (remaining > 0) await AsyncUtils.wait(remaining);
    }
  }

  private completeBoot(): void {
    this.sysConsole.log("Boot Sequence Complete.", "SUCCESS");

    this.bootLoader.remove(() => {
      this.enterLockScreen();
    });
  }

  private enterLockScreen(): void {
    this.state = "LOCKED";
    this.sysConsole.log("Entering Lock Screen...", "SYSTEM");

    this.lockScreen.show(() => {
      this.onSystemReady();
    });
  }

  private onSystemReady(): void {
    this.state = "RUNNING";
    document.body.classList.add("system-active");

    this.desktop.init();

    this.sysConsole.log(">> SYSTEM ONLINE <<", "SUCCESS");
    this.sysConsole.setLock(false);
  }

  private handleBootError(error: any): void {
    this.sysConsole.log(`CRITICAL FAILURE: ${error.message}`, "ERROR");
    this.state = "ERROR";
  }

  private async handleCommand(command: string): Promise<void> {
    await AsyncUtils.wait(300);

    const parts = command.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case "help":
        if (args.length > 0) {
          const topic = args[0].toLowerCase();
          this.showHelpTopic(topic);
        } else {
          this.showGeneralHelp();
        }
        break;

      case "status":
        this.sysConsole.log(`System State: ${this.state}`, "SYSTEM");
        this.sysConsole.log("All systems operational.", "SUCCESS");
        break;

      case "registry":
        if (args.length > 0) {
          const key = args[0];
          const val = this.registry.get(key);
          if (val !== undefined) {
            this.sysConsole.log(`${key} = ${JSON.stringify(val)}`, "INFO");
          } else {
            this.sysConsole.log(`Key '${key}' not found.`, "WARN");
          }
        } else {
          this.sysConsole.log("Usage: registry [key]", "WARN");
          this.sysConsole.log("Type 'help registry' for more details.", "INFO");
        }
        break;

      case "clear":
        this.sysConsole.clear();
        break;

      case "reboot":
        this.sysConsole.log("Reboot sequence initiated...", "WARN");
        await AsyncUtils.wait(1000);
        this.sysConsole.clear();
        document.body.classList.remove("system-active");
        this.state = "OFFLINE";
        await this.desktop.destroy();
        await this.boot();
        break;

      default:
        this.sysConsole.log(`Unknown command: ${command}`, "ERROR");
        this.sysConsole.log("Type 'help' for a list of commands.", "INFO");
        break;
    }
  }

  private showGeneralHelp(): void {
    this.sysConsole.log("Available commands:", "INFO");
    this.sysConsole.log("- help [command]: Show usage for a command", "INFO");
    this.sysConsole.log("- status: Check system status", "INFO");
    this.sysConsole.log("- registry [key]: Get registry value", "INFO");
    this.sysConsole.log("- clear: Clear terminal output", "INFO");
    this.sysConsole.log("- reboot: Restart the system", "WARN");
  }

  private showHelpTopic(topic: string): void {
    switch (topic) {
      case "registry":
        this.sysConsole.log("Command: registry", "INFO");
        this.sysConsole.log("Usage: registry [key]", "INFO");
        break;
      case "status":
        this.sysConsole.log("Command: status", "INFO");
        this.sysConsole.log("Usage: status", "INFO");
        break;
      case "reboot":
        this.sysConsole.log("Command: reboot", "INFO");
        this.sysConsole.log("Usage: reboot", "INFO");
        break;
      case "clear":
        this.sysConsole.log("Command: clear", "INFO");
        this.sysConsole.log("Usage: clear", "INFO");
        break;
      case "help":
        this.sysConsole.log("Command: help", "INFO");
        this.sysConsole.log("Usage: help [command]", "INFO");
        break;
      default:
        this.sysConsole.log(`No manual entry found for '${topic}'.`, "WARN");
        break;
    }
  }
}
