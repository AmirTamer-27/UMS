# DATABASE_SCHEMA.md

# University Management System — Database Schema

This document describes the database tables and the relationships between them.

---

## 1. Core Identity Tables

## `profiles`

Stores the main application user profile for every system user.

Each row represents one user in the application and is linked to a Supabase Auth user by using the same UUID.

### Key fields

* `id` — primary key; same UUID as the Supabase Auth user
* `full_name` — user full name
* `email` — user email address
* `role` — user role, such as `admin`, `student`, `teacher`, or `parent`
* `department_id` — optional department reference
* `created_at` — profile creation timestamp

### Relationships

* `profiles.department_id` → `departments.id`
* Referenced by `student_profiles.user_id`
* Referenced by `staff_profiles.user_id`
* Referenced by `course_offerings.instructor_user_id`
* Referenced by `registrations.student_user_id`
* Referenced by `course_materials.uploaded_by`
* Referenced by `assignments.created_by`
* Referenced by `assignment_submissions.student_user_id`
* Referenced by `room_bookings.booked_by_user_id`
* Referenced by `parent_student_links.parent_user_id`
* Referenced by `parent_student_links.student_user_id`
* Referenced by `conversations.student_user_id`
* Referenced by `conversations.teacher_user_id`
* Referenced by `conversations.parent_user_id`
* Referenced by `messages.sender_user_id`

---

## `student_profiles`

Stores additional student-specific information.

This table extends `profiles` for users whose role is `student`.

### Key fields

* `user_id` — primary key; references `profiles.id`
* `student_number` — unique student identifier
* `level` — student academic level
* `status` — student status, such as active or inactive

### Relationships

* `student_profiles.user_id` → `profiles.id`

---

## `staff_profiles`

Stores additional staff or teacher-specific information.

This table extends `profiles` for users who are staff members or teachers.

### Key fields

* `user_id` — primary key; references `profiles.id`
* `staff_number` — unique staff identifier
* `title` — staff title or position
* `office_hours` — office hours information
* `bio` — staff biography

### Relationships

* `staff_profiles.user_id` → `profiles.id`

---

## 2. Reference Tables

## `departments`

Stores academic departments.

### Key fields

* `id` — primary key
* `name` — department name
* `code` — unique department code

### Relationships

* Referenced by `profiles.department_id`
* Referenced by `courses.department_id`

---

## `semesters`

Stores academic semester records.

### Key fields

* `id` — primary key
* `name` — semester name
* `start_date` — semester start date
* `end_date` — semester end date
* `is_active` — indicates whether this is the active semester

### Relationships

* Referenced by `course_offerings.semester_id`

---

# 3. Course Registration Tables

## `courses`

Stores the master course catalog.

A row in this table represents a course definition, not a semester-specific offering.

### Key fields

* `id` — primary key
* `code` — unique course code
* `name` — course name
* `description` — course description
* `credit_hours` — number of credit hours
* `course_type` — course type, such as `core` or `elective`
* `recommended_level` — recommended student academic level for taking the course
* `department_id` — department that owns the course

### Relationships

* `courses.department_id` → `departments.id`
* Referenced by `course_offerings.course_id`
* Referenced by `course_prerequisites.course_id`
* Referenced by `course_prerequisites.prerequisite_course_id`

---

## `course_offerings`

Stores courses that are offered in a specific semester.

Students register into `course_offerings`, not directly into `courses`.

### Key fields

* `id` — primary key
* `course_id` — referenced catalog course
* `semester_id` — referenced semester
* `instructor_user_id` — optional instructor reference
* `seat_limit` — maximum number of students allowed
* `published` — whether the offering is visible to students
* `created_at` — offering creation timestamp

### Relationships

* `course_offerings.course_id` → `courses.id`
* `course_offerings.semester_id` → `semesters.id`
* `course_offerings.instructor_user_id` → `profiles.id`
* Referenced by `registrations.course_offering_id`
* Referenced by `course_materials.course_offering_id`
* Referenced by `assignments.course_offering_id`

---

## `course_prerequisites`

Stores prerequisite relationships between courses.

This is a many-to-many self-referencing table on `courses`.

### Key fields

* `id` — primary key
* `course_id` — course that has a prerequisite
* `prerequisite_course_id` — course required before taking `course_id`

### Relationships

* `course_prerequisites.course_id` → `courses.id`
* `course_prerequisites.prerequisite_course_id` → `courses.id`

### Meaning

Each row means:

```text
course_id requires prerequisite_course_id
```

---

## `registrations`

Stores student course selections and registrations.

### Key fields

* `id` — primary key
* `student_user_id` — student reference
* `course_offering_id` — course offering reference
* `status` — registration status, such as `selected`, `registered`, or `dropped`
* `created_at` — registration creation timestamp

### Relationships

* `registrations.student_user_id` → `profiles.id`
* `registrations.course_offering_id` → `course_offerings.id`

---

# 4. LMS Tables

## `course_materials`

Stores metadata for uploaded course materials.

The actual files are stored in Supabase Storage. This table stores the file path and related metadata.

### Key fields

* `id` — primary key
* `course_offering_id` — related course offering
* `title` — material title
* `file_path` — path to the uploaded file in storage
* `file_type` — file type, such as `pdf`, `video`, `document`, or `other`
* `uploaded_by` — user who uploaded the material
* `created_at` — upload timestamp

### Relationships

* `course_materials.course_offering_id` → `course_offerings.id`
* `course_materials.uploaded_by` → `profiles.id`

---

## `assignments`

Stores assignments created for course offerings.

### Key fields

* `id` — primary key
* `course_offering_id` — related course offering
* `title` — assignment title
* `description` — assignment description
* `due_date` — assignment due date and time
* `created_by` — user who created the assignment
* `created_at` — assignment creation timestamp

### Relationships

* `assignments.course_offering_id` → `course_offerings.id`
* `assignments.created_by` → `profiles.id`
* Referenced by `assignment_submissions.assignment_id`

---

## `assignment_submissions`

Stores student submissions for assignments.

### Key fields

* `id` — primary key
* `assignment_id` — related assignment
* `student_user_id` — student who submitted
* `submission_text` — optional text submission
* `file_path` — optional uploaded file path
* `submitted_at` — submission timestamp
* `is_late` — whether the submission was late

### Relationships

* `assignment_submissions.assignment_id` → `assignments.id`
* `assignment_submissions.student_user_id` → `profiles.id`

---

# 5. Facilities Tables

## `rooms`

Stores classrooms and laboratories.

### Key fields

* `id` — primary key
* `name` — room name
* `room_type` — room type, such as `classroom` or `lab`
* `capacity` — room capacity
* `building` — building name or code
* `is_active` — whether the room is available for use
* `created_at` — room creation timestamp

### Relationships

* Referenced by `room_bookings.room_id`

---

## `room_bookings`

Stores room reservations.

### Key fields

* `id` — primary key
* `room_id` — related room
* `booked_by_user_id` — user who made the booking
* `booking_date` — booking date
* `start_time` — booking start time
* `end_time` — booking end time
* `purpose` — booking purpose
* `status` — booking status, such as `confirmed` or `cancelled`
* `created_at` — booking creation timestamp

### Relationships

* `room_bookings.room_id` → `rooms.id`
* `room_bookings.booked_by_user_id` → `profiles.id`

---

# 6. Community Tables

## `parent_student_links`

Links parents to students.

### Key fields

* `id` — primary key
* `parent_user_id` — parent profile reference
* `student_user_id` — student profile reference

### Relationships

* `parent_student_links.parent_user_id` → `profiles.id`
* `parent_student_links.student_user_id` → `profiles.id`

---

## `conversations`

Stores parent-teacher conversation threads related to a specific student.

### Key fields

* `id` — primary key
* `student_user_id` — student context for the conversation
* `teacher_user_id` — teacher participant
* `parent_user_id` — parent participant
* `created_at` — conversation creation timestamp

### Relationships

* `conversations.student_user_id` → `profiles.id`
* `conversations.teacher_user_id` → `profiles.id`
* `conversations.parent_user_id` → `profiles.id`
* Referenced by `messages.conversation_id`

---

## `messages`

Stores messages inside conversations.

### Key fields

* `id` — primary key
* `conversation_id` — related conversation
* `sender_user_id` — user who sent the message
* `message_body` — message content
* `created_at` — message timestamp

### Relationships

* `messages.conversation_id` → `conversations.id`
* `messages.sender_user_id` → `profiles.id`

---

# 7. High-Level Relationship Summary

## Identity relationships

```text
Supabase Auth User
        ↓ same UUID
profiles
        ↓
student_profiles / staff_profiles
```

---

## Course registration relationships

```text
departments
    ↓
courses
    ↓
course_offerings
    ↓
registrations
```

```text
semesters
    ↓
course_offerings
```

```text
courses
    ↓ self-referencing many-to-many
course_prerequisites
```

---

## LMS relationships

```text
course_offerings
    ↓
course_materials
```

```text
course_offerings
    ↓
assignments
    ↓
assignment_submissions
```

---

## Facilities relationships

```text
rooms
    ↓
room_bookings
```

---

## Community relationships

```text
profiles(parent) ─┐
                  ↓
        parent_student_links
                  ↑
profiles(student) ┘
```

```text
profiles(student)
profiles(teacher) ─→ conversations → messages
profiles(parent)
```

---

# 8. Main Tables Summary

| Table                    | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `profiles`               | Main application user table linked to Supabase Auth |
| `student_profiles`       | Student-specific extension table                    |
| `staff_profiles`         | Staff-specific extension table                      |
| `departments`            | Academic departments                                |
| `semesters`              | Academic semesters                                  |
| `courses`                | Master course catalog, including recommended level  |
| `course_offerings`       | Semester-specific course offerings                  |
| `course_prerequisites`   | Course prerequisite relationships                   |
| `registrations`          | Student course selections and registrations         |
| `course_materials`       | Uploaded course material metadata                   |
| `assignments`            | Course assignments                                  |
| `assignment_submissions` | Student assignment submissions                      |
| `rooms`                  | Classrooms and laboratories                         |
| `room_bookings`          | Room reservations                                   |
| `parent_student_links`   | Parent-student relationships                        |
| `conversations`          | Parent-teacher conversation threads                 |
| `messages`               | Messages inside conversations                       |
