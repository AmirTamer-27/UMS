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
import AdminCourseOfferingPage from "../../modules/curriculum/course-registration/admin/AdminCourseOfferingPage";
import {
  AdminCreateStaffPage,
  StaffProfilePage,
} from "../../staff/professor-ta-management/pages";
import TeacherMessagesPage from "../../community/parent-to-teacher-communication/pages/TeacherMessagesPage";
import MessagesPage from "../../community/parent-to-teacher-communication/pages/MessagesPage";
import ParentMessagesPage from "../../community/parent-to-teacher-communication/pages/ParentMessagesPage";
import ClassroomsPage from "../../facilities/classroom-laboratory-management/pages/ClassroomsPage";
import StudentRecordsPage from "../../facilities/administrative-office-automation/pages/StudentRecordsPage";

const AppRouter = () => (
  <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
    <Routes>
      <Route element={<LoginPage />} path="/login" />

      <Route
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
        path="/dashboard"
      />

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
            <ClassroomsPage />
          </ProtectedRoute>
        }
        path="/facilities/classrooms"
      />

      <Route
        element={
          <ProtectedRoute>
            <AdminCourseOfferingPage />
          </ProtectedRoute>
        }
        path="/admin/course-offerings"
      />

      <Route
        element={
          <ProtectedRoute>
            <StudentRecordsPage />
          </ProtectedRoute>
        }
        path="/admin/student-records"
      />
      <Route
        element={
          <ProtectedRoute>
            <StaffProfilePage />
          </ProtectedRoute>
        }
        path="/staff/profile"
      />
      <Route
        element={
          <ProtectedRoute>
            <AdminCreateStaffPage />
          </ProtectedRoute>
        }
        path="/admin/staff/create"
      />



      <Route
        element={
          <ProtectedRoute>
            <TeacherMessagesPage />
          </ProtectedRoute>
        }
        path="/teacher/messages"
      />

      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        }
      />
      <Route element={<AdminCourseOfferingPage />} path="/admin/course-offerings" />
      <Route
        element={<ProtectedRoute><ParentMessagesPage /></ProtectedRoute>}
        path="/parent/messages"
      />
      <Route
        element={<ProtectedRoute><TeacherMessagesPage /></ProtectedRoute>}
        path="/teacher/messages"
      />
      <Route
        element={<ProtectedRoute><MessagesPage /></ProtectedRoute>}
        path="/messages"
      />
      <Route element={<Navigate replace to="/login" />} path="/" />
      <Route element={<Navigate replace to="/login" />} path="*" />
    </Routes>
  </Router>
);

export default AppRouter;
