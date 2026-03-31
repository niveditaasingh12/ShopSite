/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.{ejs,html,js}", // EJS templates
    "./public/**/*.{html,js}", // public JS / HTML
    "./src/**/*.{html,js}", // if you use src folder
  ],
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "slide-in": "slideIn 0.3s ease-out",
        "fade-out": "fadeOut 0.5s ease-in forwards",
      },
    },
  },
  plugins: [],
};
