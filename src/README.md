# University Management System Frontend

This `src` structure follows a feature-based architecture for a ReactJS MVP backed by Supabase.

## Top-level folders

- `app/`: application shell concerns such as routing, layouts, and route guards.
- `facilities/`: facilities-focused features such as classrooms, offices, and resource planning.
- `curriculum/`: curriculum-focused features such as subjects, assessments, and technology enablement.
- `staff/`: staff-focused features such as professor and TA management, performance, and HR integration.
- `community/`: communication features for parents, students, instructors, and staff.
- `shared/`: reusable UI, hooks, utilities, constants, and shared types used across modules.
- `services/`: cross-module service integrations, including Supabase clients and helpers.
- `context/`: React context providers for session, role, and app-wide state.
- `store/`: centralized state setup for scalable client-side state management.
- `assets/`: static assets such as images, icons, and brand resources.
- `styles/`: global styles, tokens, and design-system level styling entry points.
- `config/`: environment and runtime configuration helpers.
- `lib/`: low-level framework helpers and integration utilities.
- `tests/`: test utilities and app-level test scaffolding.
