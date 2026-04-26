import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { ProtectedRoute } from "../guards";
import { StudentCourseRegistrationPage } from "../../curriculum/core-elective-subject-management/pages";
import LoginPage from "../../modules/auth/login/pages/LoginPage";
import Dashboard from "../Dashboard";

const AppRouter = () => (
  <Router>
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route
        element={
          <ProtectedRoute>
            <StudentCourseRegistrationPage />
          </ProtectedRoute>
        }
        path="/courses/registration"
      />
      <Route
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
        path="/dashboard"
      />
      <Route element={<Navigate replace to="/login" />} path="/" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  </Router>
);

export default AppRouter;
