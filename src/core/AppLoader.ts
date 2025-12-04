import { Service } from "../utils/Service";

export interface AppConfig {
  id: string;
  name: string;
  icon: string | { light: string; dark: string };
  contentUrl: string;
  styleUrl?: string;
  scriptUrl?: string;
  width?: number;
  height?: number;
}

export class AppLoader extends Service {
  private apps: AppConfig[] | null = null;
  private readonly appsJsonPath = "data/apps.json";

  public constructor() {
    super();
  }

  public async loadApps(): Promise<AppConfig[]> {
    if (this.apps) {
      return this.apps;
    }

    try {
      const response = await fetch(this.appsJsonPath);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${this.appsJsonPath}: ${response.statusText}`
        );
      }
      const rawApps = (await response.json()) as Omit<AppConfig, "content">[];

      this.apps = rawApps as AppConfig[];

      console.log(`Loaded ${this.apps.length} applications.`);
      return this.apps;
    } catch (error) {
      console.error("Error loading applications:", error);
      return [];
    }
  }

  public getAllApps(): AppConfig[] {
    return this.apps || [];
  }

  public getApp(id: string): AppConfig | undefined {
    return this.apps?.find((app) => app.id === id);
  }
}
