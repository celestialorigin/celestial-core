import { defineCollection, z } from "astro:content";

const dialogues = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    publishAt: z.coerce.date(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  dialogues,
};