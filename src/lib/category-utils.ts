import type { Category } from "@/lib/portal-types";

export type CategoryOption = {
  id: string;
  name: string;
  depth: number;
  ownerTeamId: string;
};

export function flattenCategories(categories: Category[], depth = 0): CategoryOption[] {
  return categories.flatMap((category) => [
    {
      id: category.id,
      name: category.name,
      depth,
      ownerTeamId: category.ownerTeamId,
    },
    ...flattenCategories(category.children ?? [], depth + 1),
  ]);
}
