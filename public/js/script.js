document.addEventListener("DOMContentLoaded", () => {
  console.log("project2 JS imported successfully!");

  const form = document.querySelector("#ingredients-form");
  const input = document.querySelector("#ingredient-input");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const ingredients = input.value.split(",").map(i => i.trim());
    console.log("Sending ingredients:", ingredients);

    try {
      const response = await fetch("/choose-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ingredients }),
      });

      const data = await response.json();
      console.log("Recipe response:", data);
      // You can redirect or update the DOM here
    } catch (err) {
      console.error("Fetch error:", err);
    }
  });
});


