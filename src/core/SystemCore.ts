import { BootLoader } from "../modules/Bootloader";
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
    this.registry = Registry.getInstance();
    this.lockScreen = new LockScreen();
    this.desktop = new Desktop();
  }

  public async boot(): Promise<void> {
    if (this.state !== "OFFLINE") return;

    this.state = "BOOTING";
    const startTime = Date.now();

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
      console.log(msg); 
    } catch (e) {
      const msg = task.errorMessage || `Task Failed: ${task.name}`;
      console.error(msg);
      throw e;
    }

    if (task.minDuration) {
      const elapsed = Date.now() - start;
      const remaining = task.minDuration - elapsed;
      if (remaining > 0) await AsyncUtils.wait(remaining);
    }
  }

  private completeBoot(): void {
    console.log("Boot Sequence Complete.");

    this.bootLoader.remove(() => {
      this.enterLockScreen();
    });
  }

  private enterLockScreen(): void {
    this.state = "LOCKED";
    console.log("Entering Lock Screen...");

    this.lockScreen.show(() => {
      this.onSystemReady();
    });
  }

  private onSystemReady(): void {
    this.state = "RUNNING";
    document.body.classList.add("system-active");

    this.desktop.init();

    console.log(">> SYSTEM ONLINE <<");
  }

  private handleBootError(error: any): void {
    console.error(`CRITICAL FAILURE: ${error.message}`);
    this.state = "ERROR";
  }
}