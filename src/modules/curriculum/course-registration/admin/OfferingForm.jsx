import React, { useEffect, useState } from 'react';
import { Alert, Autocomplete, Button, Grid, MenuItem, Stack, TextField } from '@mui/material';

import supabase, { isSupabaseConfigured } from '../../../../services/supabase/client';
import PrerequisiteSelector from './PrerequisiteSelector';
import SeatLimitField from './SeatLimitField';
import offeringQueue from './offeringQueue';

export default function OfferingForm({ onOfferingCreated }) {
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [courseInput, setCourseInput] = useState('');
  const [form, setForm] = useState({
    course_id: '',
    semester_id: '',
    instructor_user_id: '',
    seats: '',
    prerequisites: [],
  });
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadCourses() {
      try {
        if (!isSupabaseConfigured || !supabase) {
          console.error('Supabase is not configured — OfferingForm requires Supabase');
          return;
        }

        const { data, error } = await supabase.from('courses').select('*');
        if (error) {
          console.error(error);
          return;
        }

        if (mounted) setCourses(data || []);
      } catch (err) {
        console.error(err);
      }
    }

    loadCourses();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSemesters() {
      try {
        if (!isSupabaseConfigured || !supabase) return;

        const { data, error } = await supabase
          .from('semesters')
          .select('*')
          .order('start_date', { ascending: false });

        if (error) {
          console.error('Failed to load semesters', error);
          return;
        }

        if (mounted) {
          const nextSemesters = data || [];
          const activeSemester = nextSemesters.find((semester) => semester.is_active);

          setSemesters(nextSemesters);
          setForm((currentForm) => ({
            ...currentForm,
            semester_id: currentForm.semester_id || activeSemester?.id || nextSemesters[0]?.id || '',
          }));
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadSemesters();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadStaffMembers() {
      try {
        if (!isSupabaseConfigured || !supabase) return;

        const { data, error } = await supabase
          .from('staff_profiles')
          .select(`
            user_id,
            staff_number,
            title,
            profile:profiles!staff_profiles_user_id_fkey (
              id,
              full_name,
              email,
              role
            )
          `)
          .order('staff_number');

        if (error) {
          console.error('Failed to load staff members', error);
          return;
        }

        if (mounted) {
          setStaffMembers(
            (data || [])
              .filter((staff) => staff.profile?.role === 'teacher' || staff.profile?.role === 'staff')
              .map((staff) => ({
                id: staff.user_id,
                name: staff.profile?.full_name || staff.profile?.email || staff.user_id,
                title: staff.title || '',
              })),
          );
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadStaffMembers();
    return () => {
      mounted = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function resetForm() {
    setForm((currentForm) => ({
      course_id: '',
      semester_id: currentForm.semester_id,
      instructor_user_id: '',
      seats: '',
      prerequisites: [],
    }));
    setCourseInput('');
  }

  async function resolveCourseId() {
    if (form.course_id) return form.course_id;

    const name = courseInput.trim();
    if (!name) {
      throw new Error('Select a course before creating an offering.');
    }

    const { data: existing, error: existingError } = await supabase
      .from('courses')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing?.id) return existing.id;

    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 12);
    const code = `${base}-${Math.floor(100 + Math.random() * 899)}`;

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({ name, code, credit_hours: 3, course_type: 'core' })
      .select('id')
      .single();

    if (courseError) {
      if (
        courseError?.code === '42501' ||
        courseError?.status === 401 ||
        courseError?.message?.toLowerCase?.().includes('row-level security')
      ) {
        const queued = offeringQueue.enqueueOffering({
          course: { name, code, credit_hours: 3, course_type: 'core' },
          payload: {
            course_id: null,
            semester_id: form.semester_id,
            instructor_user_id: form.instructor_user_id,
            seat_limit: Number(form.seats),
            published: false,
          },
          prerequisites: form.prerequisites,
        });
        console.warn('Course creation blocked by RLS/auth — offering queued locally (#' + queued + ')');
        resetForm();
      }

      throw courseError;
    }

    return courseData?.id;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Supabase is not configured.');
      return;
    }

    try {
      const semesterId = form.semester_id;
      const seatLimit = Number(form.seats);

      if (!semesterId) {
        setErrorMessage('Select a semester before creating an offering.');
        return;
      }
      if (!form.instructor_user_id) {
        setErrorMessage('Select a staff member to teach this offering.');
        return;
      }
      if (!Number.isInteger(seatLimit) || seatLimit <= 0) {
        setErrorMessage('Enter a valid seat limit greater than 0.');
        return;
      }

      const courseId = await resolveCourseId();
      if (!courseId) {
        setErrorMessage('Cannot create offering: no course selected or created.');
        return;
      }

      const { data: duplicateOffering, error: duplicateError } = await supabase
        .from('course_offerings')
        .select('id')
        .eq('course_id', courseId)
        .eq('semester_id', semesterId)
        .maybeSingle();

      if (duplicateError) {
        setErrorMessage(duplicateError.message);
        return;
      }

      if (duplicateOffering) {
        setErrorMessage('This course already has an offering in the selected semester.');
        return;
      }

      const payload = {
        course_id: courseId,
        semester_id: semesterId,
        instructor_user_id: form.instructor_user_id,
        seat_limit: seatLimit,
        published: false,
      };

      const { error } = await supabase.from('course_offerings').insert(payload).select();
      if (error) {
        if (error?.code === '42501' || error?.status === 401) {
          const queued = offeringQueue.enqueueOffering({
            courseId,
            payload,
            prerequisites: form.prerequisites,
          });
          console.warn('Offering creation blocked by RLS/auth — queued locally (#' + queued + ')');
          resetForm();
          return;
        }

        setErrorMessage(error.message);
        return;
      }

      if (form.prerequisites?.length) {
        const inserts = form.prerequisites.map((prerequisiteCourseId) => ({
          course_id: courseId,
          prerequisite_course_id: prerequisiteCourseId,
        }));
        const { error: prerequisiteError } = await supabase
          .from('course_prerequisites')
          .insert(inserts);

        if (prerequisiteError) console.error(prerequisiteError);
      }

      resetForm();
      setMessage('Course offering created successfully.');
      onOfferingCreated?.();
    } catch (err) {
      setErrorMessage(err.message || 'Unable to create course offering.');
    }
  }

  function handleCancel() {
    resetForm();
    setMessage('');
    setErrorMessage('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={courses}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option?.name || option?.title || String(option?.id || '');
              }}
              value={courses.find((course) => course.id === form.course_id) || null}
              inputValue={courseInput}
              onInputChange={(_, value) => setCourseInput(value)}
              onChange={(_, value) => {
                if (!value) {
                  setForm((currentForm) => ({ ...currentForm, course_id: '' }));
                  return;
                }
                if (typeof value === 'string') {
                  setCourseInput(value);
                  setForm((currentForm) => ({ ...currentForm, course_id: '' }));
                } else {
                  setCourseInput(value.name);
                  setForm((currentForm) => ({ ...currentForm, course_id: value.id }));
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Course (select or type to add)" />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Semester"
              name="semester_id"
              value={form.semester_id}
              onChange={handleChange}
              helperText={
                semesters.length === 0
                  ? 'No semesters found.'
                  : 'Active semester is selected automatically. Choose another if needed.'
              }
            >
              {semesters.map((semester) => (
                <MenuItem key={semester.id} value={semester.id}>
                  {semester.name}{semester.is_active ? ' (Active)' : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <SeatLimitField
              value={form.seats}
              onChange={(value) => setForm((currentForm) => ({ ...currentForm, seats: value }))}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Instructor"
              name="instructor_user_id"
              value={form.instructor_user_id}
              onChange={handleChange}
              helperText={
                staffMembers.length === 0
                  ? 'No teacher or staff profiles found.'
                  : 'Select the staff member who will teach this offering.'
              }
            >
              {staffMembers.map((staff) => (
                <MenuItem key={staff.id} value={staff.id}>
                  {staff.name}{staff.title ? ` - ${staff.title}` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <PrerequisiteSelector
              value={form.prerequisites}
              onChange={(value) => (
                setForm((currentForm) => ({ ...currentForm, prerequisites: value }))
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={handleCancel} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Create Offering
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </form>
  );
}
