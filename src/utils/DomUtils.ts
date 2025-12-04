export class DomUtils {
    /**
     * Creates an HTML element with the specified options.
     */
    static create<K extends keyof HTMLElementTagNameMap>(
        tag: K,
        options: {
            className?: string;
            id?: string;
            text?: string;
            html?: string;
            attributes?: Record<string, string>;
            parent?: HTMLElement;
            events?: Record<string, EventListenerOrEventListenerObject>;
        } = {}
    ): HTMLElementTagNameMap[K] {
        const el = document.createElement(tag);
        
        if (options.className) el.className = options.className;
        if (options.id) el.id = options.id;
        if (options.text) el.textContent = options.text;
        if (options.html) el.innerHTML = options.html;
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, val]) => {
                el.setAttribute(key, val);
            });
        }

        if (options.events) {
            Object.entries(options.events).forEach(([event, listener]) => {
                el.addEventListener(event, listener);
            });
        }

        if (options.parent) {
            options.parent.appendChild(el);
        }

        return el;
    }

    /**
     * Safely fetches text content from a URL.
     */
    static async fetchText(url: string): Promise<string> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        return await response.text();
    }
}