import React, { useEffect, useState } from 'react';
import { Alert, Grid, TextField, Button, MenuItem, Stack } from '@mui/material';
import SeatLimitField from './SeatLimitField';
import PrerequisiteSelector from './PrerequisiteSelector';
import supabase, { isSupabaseConfigured } from '../../../../services/supabase/client';
import offeringQueue from './offeringQueue';
import { Autocomplete, TextField as MuiTextField } from '@mui/material';

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
    async function load() {
        try {
          if (isSupabaseConfigured && supabase) {
            const { data, error } = await supabase.from('courses').select('*');
            if (error) {
              console.error(error);
              // helpful hint for the developer
              console.error(
                "Schema error while selecting from 'courses'. Run this SQL in Supabase SQL editor:\nselect column_name, data_type from information_schema.columns where table_name='courses';",
              );
              return;
            }
            if (mounted) setCourses(data || []);
          } else {
            console.error('Supabase is not configured — OfferingForm requires Supabase');
          }
      } catch (err) {
        console.error(err);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadSemesters() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase.from('semesters').select('*').order('start_date', { ascending: false });
          if (error) {
            console.error('Failed to load semesters', error);
            return;
          }
          if (mounted) {
            const nextSemesters = data || [];
            setSemesters(nextSemesters);
            const activeSemester = nextSemesters.find((semester) => semester.is_active);
            setForm((currentForm) => ({
              ...currentForm,
              semester_id: currentForm.semester_id || activeSemester?.id || nextSemesters[0]?.id || '',
            }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSemesters();
    return () => (mounted = false);
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
    return () => (mounted = false);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
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

  async function handleSubmit(e) {
    e.preventDefault();
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

      // determine course id: if form.course_id already set use it, else try to create a course from courseInput
      let courseId = form.course_id;
      if (!courseId) {
        const name = (courseInput || '').trim();
        if (!name) {
          setErrorMessage('Select a course before creating an offering.');
          return;
        }
        // Check for existing course by name to avoid duplicates
        const { data: existing, error: existingErr } = await supabase
          .from('courses')
          .select('id')
          .eq('name', name)
          .maybeSingle();
        if (existingErr) {
          setErrorMessage(existingErr.message);
          return;
        }
        if (existing && existing.id) {
          courseId = existing.id;
        } else {
          // Generate a course code since DB requires non-null `code`.
          function generateCode(s) {
            const base = s
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .slice(0, 12);
            const suffix = Math.floor(100 + Math.random() * 899);
            return `${base}-${suffix}`;
          }
          const code = generateCode(name);
          const { data: courseData, error: courseErr } = await supabase
            .from('courses')
            .insert({ name, code, credit_hours: 3, course_type: 'core' })
            .select();
          if (courseErr) {
            console.error(courseErr);
            // If row-level security or auth blocks the insert, enqueue the entire offering for later retry
            if (courseErr?.code === '42501' || courseErr?.status === 401 || courseErr?.message?.toLowerCase?.().includes('row-level security')) {
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
              // Reset form for user to continue using UI; queued items will be retried when policies/keys are fixed
              resetForm();
              return;
            }
            setErrorMessage(courseErr.message);
            return;
          }
          courseId = courseData?.[0]?.id;
        }
      }
      // Validate required UUID fields before sending to Supabase
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

      const { data, error } = await supabase.from('course_offerings').insert(payload).select();
      if (error) {
        if (error?.code === '42501' || error?.status === 401) {
          // Queue full offering for later retry
          const queued = offeringQueue.enqueueOffering({
            courseId, payload, prerequisites: form.prerequisites,
          });
          console.warn('Offering creation blocked by RLS/auth — queued locally (#' + queued + ')');
          resetForm();
          return;
        }
        setErrorMessage(error.message);
        return;
      }

      if (form.prerequisites?.length) {
        const inserts = form.prerequisites.map((pid) => ({ course_id: courseId, prerequisite_course_id: pid }));
        const { error: preErr } = await supabase.from('course_prerequisites').insert(inserts);
        if (preErr) console.error(preErr);
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
            getOptionLabel={(o) => {
              if (typeof o === 'string') return o;
              return o?.name || o?.title || String(o?.id || '');
            }}
            value={courses.find((c) => c.id === form.course_id) || null}
            inputValue={courseInput}
            onInputChange={(_, v) => setCourseInput(v)}
            onChange={(_, v) => {
              if (!v) {
                setForm((s) => ({ ...s, course_id: '' }));
                return;
              }
              if (typeof v === 'string') {
                // free text: set input; course_id stays blank to create on submit
                setCourseInput(v);
                setForm((s) => ({ ...s, course_id: '' }));
              } else {
                setCourseInput(v.name);
                setForm((s) => ({ ...s, course_id: v.id }));
              }
            }}
            renderInput={(params) => <MuiTextField {...params} label="Course (select or type to add)" />}
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
          <SeatLimitField value={form.seats} onChange={(v) => setForm((s) => ({ ...s, seats: v }))} />
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
                {staff.name}{staff.title ? ` — ${staff.title}` : ''}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <PrerequisiteSelector value={form.prerequisites} onChange={(v) => setForm((s) => ({ ...s, prerequisites: v }))} />
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleCancel} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Create Offering</Button>
          </Stack>
        </Grid>
      </Grid>
      </Stack>
    </form>
  );
}
