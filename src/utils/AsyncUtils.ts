export class AsyncUtils {
    /**
     * Returns a promise that resolves after the specified milliseconds.
     */
    static wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}