"use client";

import * as React from "react";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFavoritesContext } from "@/lib/contexts/favorites-context";

type FavoriteButtonProps = Readonly<
  React.ComponentProps<"button"> & {
    skillId: string;
  }
>;

function FavoriteButton({ skillId, className, ...props }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isLoaded, isAuthenticated } =
    useFavoritesContext();

  if (!isLoaded || !isAuthenticated) return null;

  const favorited = isFavorite(skillId);

  const handleToggleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(skillId);
  };

  return (
    <button
      type="button"
      onClick={handleToggleFavorite}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
      className={cn(
        "absolute top-2.5 right-2.5 z-10 inline-flex size-11 items-center justify-center rounded-full",
        "transition-[opacity,transform,background-color,color] motion-reduce:transition-none",
        "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
        "hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        favorited && "opacity-100",
        favorited ? "text-red-500" : "text-muted-foreground/60 hover:text-red-400",
        className,
      )}
      {...props}
    >
      <Heart className={cn("size-3.5", favorited && "fill-current")} aria-hidden="true" />
    </button>
  );
}

export { FavoriteButton };
