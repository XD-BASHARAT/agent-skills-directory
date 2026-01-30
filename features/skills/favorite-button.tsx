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
      className={cn(
        "absolute top-2.5 right-2.5 z-10 rounded-full p-1 transition-[opacity,transform,background-color,color]",
        "opacity-0 group-hover:opacity-100",
        "hover:bg-muted/80",
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
