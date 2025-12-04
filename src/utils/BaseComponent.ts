export abstract class BaseComponent {
    protected element: HTMLElement | null = null;
    protected disposables: (() => void)[] = [];

    /**
     * Clean up all listeners and remove the element from DOM.
     */
    public destroy(): void {
        // 1. Run all cleanup functions (remove event listeners, stop intervals)
        this.disposables.forEach(dispose => dispose());
        this.disposables = [];

        // 2. Remove element from DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    /**
     * Helper to add an event listener that automatically gets cleaned up on destroy.
     */
    protected addListener(
        target: EventTarget, 
        type: string, 
        listener: EventListenerOrEventListenerObject
    ): void {
        target.addEventListener(type, listener);
        this.disposables.push(() => target.removeEventListener(type, listener));
    }

    /**
     * Helper to add a timer/interval that automatically clears on destroy.
     */
    protected setInterval(callback: () => void, ms: number): void {
        const id = window.setInterval(callback, ms);
        this.disposables.push(() => window.clearInterval(id));
    }

    protected setTimeout(callback: () => void, ms: number): void {
        const id = window.setTimeout(callback, ms);
        this.disposables.push(() => window.clearTimeout(id));
    }
}