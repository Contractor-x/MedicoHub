declare module 'markdown-it' {
    interface MarkdownItOptions {
        [key: string]: any;
    }

    interface MarkdownItToken {
        [key: string]: any;
    }

    class MarkdownIt {
        constructor(options?: MarkdownItOptions);
        render(src: string, env?: any): string;
        renderInline(src: string, env?: any): string;
        use(...args: any[]): this;
        set(options: Partial<MarkdownItOptions>): this;
    }

    export = MarkdownIt;
}
