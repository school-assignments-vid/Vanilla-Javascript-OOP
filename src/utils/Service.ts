/**
 * Base class for Singleton Services.
 * Handles the unique instance creation and management.
 */
export abstract class Service {
  // Stores the single instance of the class
  protected static _instance: any = null;

  /**
   * Get the singleton instance. Creates it if it doesn't exist.
   */
  public static getInstance<T extends Service>(this: new () => T): T {
    // 'this' refers to the specific class Constructor (e.g. Registry)
    const self = this as any;

    if (!self._instance) {
      self._instance = new this();

      // If the service has a hook for when it's created, run it
      if (typeof (self._instance as any).onCreation === "function") {
        (self._instance as any).onCreation();
      }
    }

    return self._instance;
  }

  /**
   * Optional method: Override this in your service to run code
   * immediately after the singleton is created (e.g. exposing to window).
   */
  protected onCreation(): void {}
}
