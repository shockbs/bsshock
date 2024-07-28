// API Stuffs
export declare const connected(): boolean;

export declare function connect(a: string): Promise<string | Error>;

export declare const renewAccount: string;

// Others
export interface GuessThePokemonGameOptions {
    base: object;
    baseType: 'interaction' | 'message';
    embed?: {
        title?: string;
        color?: string;
        winMessage?: string;
        loseMessage?: string;
        timeoutMessage?: string;
    };
    button?: {
        text?: string;
        style?: number;
        emoji?: string;
    };
    time?: string | number;
}

export declare class guessThePokemonGame {
    constructor(options: GuessThePokemonGameOptions);
    startGame(): void;
}

export interface AiChatOptions {
    model: string;
    replyMention?: boolean;
    maxInteractions: number;
    components?: any[];
    custom?: string;
    blacklistedUsers: string[];
    embed?: {
        color?: string;
    };
    dashboard: {
        enabled: boolean;
        buttonStyle?: number;
        buttonString?: string;
        clearConversationOnSwitchModel?: boolean;
    }
}

export declare class AiChat {
    constructor(options: AiChatOptions);
    clear(): void | ReferenceError | TypeError | Error;
    clearConversation(id: string): boolean | ReferenceError | TypeError | Error;
    getData(id: string): object | ReferenceError | TypeError | Error;
    getCount(id: string): number | ReferenceError | TypeError | Error;
    handleMessage(message: 'message'): void;
    handleInteraction(interaction: 'interaction'): void | 'message';
}