import { createBrowserRouter } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { RequireAuth } from "../layouts/RequireAuth";
import { CalendarPage } from "../pages/CalendarPage";
import { CourseFormPage } from "../pages/CourseFormPage";
import { CoursesPage } from "../pages/CoursesPage";
import { DeadlineFormPage } from "../pages/DeadlineFormPage";
import { DeadlinesPage } from "../pages/DeadlinesPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RegisterPage } from "../pages/RegisterPage";
import { TimetablePage } from "../pages/TimetablePage";
import { TodayPage } from "../pages/TodayPage";

export const router = createBrowserRouter([
  // Open to everyone.
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  // Everything else sits behind the login gate.
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <TodayPage /> },
          { path: "calendar", element: <CalendarPage /> },
          { path: "deadlines", element: <DeadlinesPage /> },
          { path: "deadlines/new", element: <DeadlineFormPage /> },
          { path: "deadlines/:id/edit", element: <DeadlineFormPage /> },
          { path: "courses", element: <CoursesPage /> },
          { path: "courses/new", element: <CourseFormPage /> },
          { path: "courses/:id/edit", element: <CourseFormPage /> },
          { path: "timetable", element: <TimetablePage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
