export class MathUtils {
    /**
     * Restricts a number to be within a range (inclusive).
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }
}