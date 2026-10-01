import { useState } from "react";
import { ChefHat } from "lucide-react";

import { resolveRecipeImageUrl } from "../../services/recipeServices";

function RecipeImage({ imageUrl, alt, className = "" }) {
  const src = resolveRecipeImageUrl(imageUrl);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const showImage = src && failedImageUrl !== src;

  return (
    <div
      className={`relative overflow-hidden bg-chaybook-container ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || "Recipe"}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailedImageUrl(src)}
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white to-chaybook-container text-chaybook-primary"
        >
          <ChefHat size={44} strokeWidth={1.4} />
        </div>
      )}
    </div>
  );
}

export default RecipeImage;
