# AI Rules for `congresso-vista-amiga`

This document outlines the core technologies used in this project and provides guidelines for their appropriate usage.

## Tech Stack Overview

*   **Frontend Framework:** React
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui (built on Radix UI)
*   **Routing:** React Router DOM
*   **Data Fetching/State Management:** React Query (`@tanstack/react-query`)
*   **Icons:** Lucide React
*   **Forms & Validation:** React Hook Form with Zod
*   **Database & Authentication:** Supabase
*   **Notifications:** Sonner and Radix UI Toasts
*   **Charting:** Recharts

## Library Usage Guidelines

To maintain consistency and efficiency, please adhere to the following library usage rules:

*   **UI Components:** Always prioritize `shadcn/ui` components for building the user interface. If a specific component is not available in `shadcn/ui` or requires significant customization, create a new component in `src/components/` and style it using Tailwind CSS. **Do not modify files within `src/components/ui/` directly.**
*   **Styling:** Use Tailwind CSS exclusively for all styling. Avoid inline styles or creating separate `.css` files for individual components. Global styles are managed in `src/index.css`.
*   **Routing:** All client-side navigation and routing should be handled using `react-router-dom`.
*   **Data Management:** For server state management and data fetching, use `@tanstack/react-query`. For simple, local component state, use React's built-in `useState` and `useReducer` hooks.
*   **Icons:** Integrate icons using the `lucide-react` library.
*   **Forms:** Implement forms using `react-hook-form` for state management and validation. For schema-based validation, use `zod`.
*   **Date Handling:** Use `date-fns` for any date manipulation, formatting, or parsing tasks.
*   **Database & Authentication:** All interactions with the backend database and user authentication should be performed using the `@supabase/supabase-js` client.
*   **Notifications:** For general, non-intrusive notifications, use `sonner`. For more traditional, dismissible toast messages, use the `useToast` hook provided in `src/hooks/use-toast.ts` (which leverages `@radix-ui/react-toast`).
*   **Charting:** For any data visualization or charting requirements, use the `recharts` library.
*   **Utility Functions:** Place general utility functions (e.g., `cn` for class merging) in `src/lib/utils.ts`.