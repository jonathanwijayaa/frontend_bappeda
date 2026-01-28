/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    green: '#10B981',
                    blue: '#3B82F6',
                },
                background: {
                    gray: '#F3F4F6',
                },
            },
        },
    },
    plugins: [],
}
