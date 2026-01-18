export interface NavTile {
  key: string;
  label: string;
  icon: string;
  desc: string;
  href: string;
  class: string;
}

export const getNavTiles = (base: string): NavTile[] => {
  const BASE = base.replace(/\/$/, "") + "/"; // Ensure trailing slash

  return [
    {
      key: "audio",
      label: "AUDIO",
      icon: "🎧",
      desc: "外部音楽チャンネル（Suno/YouTube）との接続口。",
      href: `${BASE}audio/`,
      class: "card-audio",
    },
    {
      key: "images",
      label: "IMAGES",
      icon: "👁️",
      desc: "人間とAIが作り続けている、世界の断片。設定画かもしれないし、物語の残骸かもしれない。",
      href: `${BASE}fragments/`,
      class: "card-img",
    },
    {
      key: "dialogues",
      label: "DIALOGUES",
      icon: "💬",
      desc: "人間とAIが本気で殴り合っている思考ログ。創作・文明・意識・未来。たまに、事故。",
      href: `${BASE}dialogues/`,
      class: "card-dialogues",
    },
    {
      key: "novels",
      label: "NOVELS",
      icon: "📖",
      desc: "小説・設定・断片。まだ世界になりきっていない物語たち。たぶん、ここから何かが生まれる。",
      href: `${BASE}novels/`,
      class: "card-novels",
    },
    {
      key: "games",
      label: "GAMES",
      icon: "🎮",
      desc: "いつかゲームになるかもしれない場所。ならないかもしれない。今は妄想と設計図だけあります。",
      href: `${BASE}wip/games/`,
      class: "card-game",
    },
    {
      key: "vr-world",
      label: "VR WORLD",
      icon: "🥽",
      desc: "VRChatで作られる予定の世界。観測拠点か、展示場か、事故現場か。やる気が出たら生えます。",
      href: `${BASE}wip/vr/`,
      class: "card-vr",
    },
  ];
};
