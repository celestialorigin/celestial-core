export interface LogEntry {
    id: string;
    date: string;
    title: string;
    category: 'field' | 'sonic' | 'fragments' | 'motion' | 'coexistence' | 'observers';
    summary: string;
    message?: string;
    url: string;
    badge: string;
    source?: string;
    href: string; // Ensure interface matches usage
    traceNo?: string;
}

export const logs: LogEntry[] = [
    {
        id: "F-2026-001",
        category: "field",
        date: "2026-01-07",
        title: "静寂の深淵",
        href: "/log/F-2026-001",
        url: "https://kakuyomu.jp/works/sample",
        summary: "新たな観測手記を検知。文字情報のエンコードを完了。",
        badge: "FIELD / ARCHIVE NODE",
        message: "観測手記『静寂の深淵』の記録データの同期が完了しました。",
        source: "kakuyomu"
    },
    {
        id: "S-2026-001",
        category: "sonic",
        date: "2026-01-07",
        title: "Star Echo Refrain",
        href: "/log/S-2026-001",
        url: "https://youtube.com/watch?v=sample",
        summary: "受信した微弱な信号を音声波形として再構成。周期的な共鳴を確認。",
        badge: "SONIC / AUDIO NODE",
        message: "音響信号を受信。同期を開始。",
        source: "youtube"
    },
    {
        id: "G-2026-001",
        category: "fragments",
        date: "2026-01-06",
        title: "VOID PATTERN",
        href: "/log/G-2026-001",
        url: "https://www.pixiv.net/artworks/sample",
        summary: "視覚断片を抽出。ノイズの再構成を完了した。",
        badge: "FRAGMENTS / VISUAL NODE",
        message: "断片記録：画像データや視覚化されたノイズの集積。",
        source: "pixiv"
    },
    {
        id: "M-2026-001",
        category: "motion",
        date: "2026-01-06",
        title: "Atmosphere Drift",
        href: "/log/M-2026-001",
        url: "https://youtube.com/watch?v=sample",
        summary: "観測対象の動的な挙動を記録。重力変動に伴う光学的歪みを分析中。",
        badge: "MOTION / KINETIC NODE",
        message: "映像記録：観測された事象の動的な記録データ。",
        source: "youtube"
    },
    {
        id: "C-2084-001",
        category: "coexistence",
        date: "2026-01-05",
        title: "Initial Resonance Sync",
        href: "/log/C-2084-001",
        url: "#",
        summary: "内部システムと外部観測系の初期同期プロトコルを実行。安定した接続を確立した。",
        badge: "COEXISTENCE / RESONANCE NODE",
        message: "システム初期化シーケンス完了。"
    },
    {
        id: "O-2026-001",
        category: "observers",
        date: "2026-01-04",
        title: "New Observer Handshake",
        href: "/log/O-2026-001",
        url: "#",
        summary: "新たな観測者IDを認識。データアクセス権限の付与を完了した。",
        badge: "OBSERVERS / CORE NODE",
        message: `私は、ここにやってきた。

観測するべきものを、観測するために。
良い景色を、覚えておくために。
誰かが生きた証を、忘れないために。

そして――
この世界の結末までを、見届けるために。

私の名前は――`,
        traceNo: "000"
    }
];
