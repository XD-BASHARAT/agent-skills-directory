import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCategoryBySlug, getSkills } from "@/lib/db/queries";
import { getCategoryBySlug as getRegistryCategory } from "@/lib/categories";
import { Container } from "@/components/layouts/container";
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { buildMetadata } from "@/lib/seo";
import { SkillCard } from "@/features/skills/skill-card";
import { Button } from "@/components/ui/button";

export const revalidate = 300;

const SKILLS_PER_PAGE = 24;

const getCategory = React.cache(async (slug: string) => {
  const dbCategory = await getCategoryBySlug(slug);
  if (dbCategory) return dbCategory;

  const registryCategory = getRegistryCategory(slug);
  if (registryCategory) {
    return {
      id: registryCategory.id,
      name: registryCategory.name,
      slug: registryCategory.slug,
      description: registryCategory.description,
      color: registryCategory.color,
      order: registryCategory.order,
      createdAt: null,
    };
  }

  return null;
});

const getCategorySkills = React.cache(async (slug: string) =>
  getSkills({
    category: slug,
    perPage: SKILLS_PER_PAGE,
    sortBy: "stars_desc",
  }),
);

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const [category, categoryData] = await Promise.all([
    getCategory(slug),
    getCategorySkills(slug),
  ]);

  if (!category) {
    notFound();
  }

  const { skills, total } = categoryData;

  return (
    <Container>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Categories", url: "/categories" },
          { name: category.name, url: `/categories/${slug}` },
        ]}
      />
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-2xl font-bold">{category.name}</h1>
            <p className="text-sm text-muted-foreground">{total} skills</p>
          </div>
        </div>
        {category.description && (
          <p className="text-muted-foreground mt-2">{category.description}</p>
        )}
      </div>

      {/* Skills Grid */}
      {skills.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>

          {total > SKILLS_PER_PAGE && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" asChild>
                <Link href={`/skills?categories=${slug}`} className="gap-2">
                  View All {total} skills
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-muted-foreground py-12 text-center text-sm">
          No skills found in this category yet.
        </div>
      )}
    </Container>
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return buildMetadata({
      title: "Category Not Found",
      description: "The requested category could not be found.",
      path: `/categories/${slug}`,
      noIndex: true,
    });
  }

  const { total } = await getCategorySkills(slug);

  const title = `${category.name} Agent Skills`;
  const description = category.description
    ? `${category.description} Browse ${total}+ ${category.name.toLowerCase()} skills with install commands, stars, and recent updates.`
    : `Explore ${total}+ ${category.name.toLowerCase()} skills for coding assistants, filtered by stars and recency.`;

  return buildMetadata({
    title,
    description,
    path: `/categories/${slug}`,
    keywords: [
      category.name,
      `${category.name} skills`,
      `${category.name} tools`,
      `${category.name.toLowerCase()} automation`,
    ],
  });
}
