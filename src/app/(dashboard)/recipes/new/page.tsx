import { RecipeForm } from "@/components/recipes/recipe-form"

export default function NewRecipePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">New recipe</h1>
        <p className="text-sm text-stone-500 mt-0.5">Build your recipe and ingredients</p>
      </div>
      <RecipeForm />
    </div>
  )
}
