import { defineCollection, z } from "astro:content";

/**
 * CELESTIAL Frontmatter Schema v1 (compatible upgrade)
 *
 * 目的:
 * - 既存の dialogues を壊さずに、将来の activities / 外部連携 / 自動生成に耐える「世界データ」へ進化させる
 *
 * 互換ルール:
 * - 既存: tags(string[]) は残す（過去資産を壊さない）
 * - 新規: tagsV1(カテゴリ分割) を追加（将来はこれを主軸にする）
 */

const relationSchema = z.object({
  type: z.enum([
    "references",
    "follows",
    "responds_to",
    "summarizes",
    "depends_on",
    "same_topic",
  ]),
  target: z.object({
    kind: z.enum(["slug", "url", "id"]),
    value: z.string().min(1),
  }),
  note: z.string().optional(),
});

const tagsV1Schema = z
  .object({
    world: z.array(z.string()).default([]),
    system: z.array(z.string()).default([]),
    activity: z.array(z.string()).default([]),
    theme: z.array(z.string()).default([]),
  })
  .default({
    world: [],
    system: [],
    activity: [],
    theme: [],
  });

const externalSchema = z
  .object({
    platform: z.string().optional(),
    url: z.string().url().optional(),
  })
  .optional();

const socialSchema = z
  .object({
    x: z
      .object({
        text: z.string().optional(),
        hashtags: z.array(z.string()).default([]),
        auto: z.boolean().default(false),
      })
      .optional(),
  })
  .optional();

const dialogues = defineCollection({
  type: "content",
  schema: z.object({
    // ===== Required (existing) =====
    title: z.string(),
    description: z.string().optional(),

    // 公開スケジュール（予約投稿の核）
    publishAt: z.coerce.date(),

    // 生成日（自動生成・外部連携用）
    createdAt: z.coerce.date().optional(),

    /**
     * v1: type / source
     * - 既存mdを壊さないため、まず optional
     * - new-dialogue.mjs を改修したら、以後は基本入るようになる
     */
    type: z
      .enum(["dialogue", "activity", "obs", "music", "system"])
      .optional()
      .default("dialogue"),

    source: z
      .enum(["internal", "youtube", "twitch", "vrchat", "kakuyomu", "note", "x"])
      .optional()
      .default("internal"),

    // 公開状態（既存互換）
    visibility: z.enum(["public", "unlisted", "draft"]).default("public"),

    /**
     * 互換: 旧tags（過去資産を壊さない）
     * - 既存の md が tags: ["a","b"] でも通る
     */
    tags: z.array(z.string()).optional(),

    /**
     * v1: 新tags（カテゴリ分割）
     * - これからは tagsV1 を主軸にする
     * - 段階移行できるよう optional + default
     */
    tagsV1: tagsV1Schema,

    // 関連（将来の年表/索引/グラフ生成の核）
    relations: z.array(relationSchema).default([]),

    // 外部URLの正規化
    external: externalSchema,

    // SNS投稿メタ（将来自動投稿に使う）
    social: socialSchema,
  }),
});

export const collections = {
  dialogues,
};
