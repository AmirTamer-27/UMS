# SCRUM-93: Parent Student Progress Feature

**User Story:** As a parent, I want to view my child’s academic progress so that I can monitor performance.

## Overview
This feature introduces a dedicated page for Parents to monitor their children's academic progress within the Learning Management System (LMS). It leverages existing database structures such as `parent_student_links`, `registrations`, `assignments`, and `assignment_submissions`.

## Components Modified or Added

1. **`src/modules/lms/pages/ParentStudentProgressPage.jsx` [NEW]**
   - **Purpose:** Renders the core UI for the progress page.
   - **Functionality:** 
     - Queries `parent_student_links` to find all students linked to the current logged-in parent.
     - Allows parents to select between multiple children via a dropdown selector.
     - For the selected student, fetches their active registered courses (`registrations`).
     - Fetches the assignments associated with those courses (`assignments`).
     - Fetches the student's submissions for those assignments (`assignment_submissions`) and computes their status (Submitted, Submitted Late, Missing).
     - Renders chips for courses and a Material UI Table for assignment statuses.

2. **`src/app/router/AppRouter.jsx` [MODIFIED]**
   - **Purpose:** Handles application routing.
   - **Changes:** Added a new protected route `/parent/progress` pointing to the newly created `ParentStudentProgressPage` component.

3. **`src/shared/components/layout/MainLayout.jsx` [MODIFIED]**
   - **Purpose:** Handles the persistent sidebar navigation based on user roles.
   - **Changes:** Updated the `navigationByRole` configuration for the `parent` role to include an "Academic Progress" menu item (using the `TrendingUpOutlinedIcon`) that routes to `/parent/progress`.

## Database Interactions

This feature relies primarily on read-only interactions with Supabase:
- **`parent_student_links`**: Look up children by `parent_user_id`.
- **`registrations`**: Look up courses where `student_user_id` matches the selected child and `status` is not 'dropped'.
- **`course_offerings` & `courses`**: Resolves course names and codes.
- **`assignments`**: Finds all assignments linked to the active `course_offerings`.
- **`assignment_submissions`**: Checks completion and tardiness using `student_user_id` and `assignment_id`.

## Future Improvements
- **Grading:** Currently, the system lacks an explicit numerical or letter "grade" field on submissions. Progress is shown based on submission completion (Status: Submitted / Missing). If grades are added to the DB schema in the future, the `ParentStudentProgressPage` UI and its queries should be updated to display those explicit scores. 
- **Attendance:** Could be integrated into this progress page if an attendance table is introduced later.
