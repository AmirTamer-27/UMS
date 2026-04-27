import React, { useEffect, useState } from 'react';
import { Grid, TextField, Button, Stack, Typography } from '@mui/material';
import SeatLimitField from './SeatLimitField';
import PrerequisiteSelector from './PrerequisiteSelector';
import supabase, { isSupabaseConfigured } from '../../../../services/supabase/client';
import offeringQueue from './offeringQueue';
import { Autocomplete, TextField as MuiTextField } from '@mui/material';

export default function OfferingForm() {
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [courseInput, setCourseInput] = useState('');
  const [semesterInput, setSemesterInput] = useState('');
  const [form, setForm] = useState({ course_id: '', semester_id: '', seats: 0, prerequisites: [] });

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
          if (mounted) setSemesters(data || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSemesters();
    return () => (mounted = false);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) return console.error('Supabase is not configured');

    try {
      // determine course id: if form.course_id already set use it, else try to create a course from courseInput
      let courseId = form.course_id;
      if (!courseId) {
        const name = (courseInput || '').trim();
        if (!name) {
          console.error('No course selected or provided');
          return;
        }
        // Check for existing course by name to avoid duplicates
        const { data: existing, error: existingErr } = await supabase
          .from('courses')
          .select('id')
          .eq('name', name)
          .maybeSingle();
        if (existingErr) return console.error(existingErr);
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
                payload: { course_id: null, semester_id: form.semester_id, seat_limit: form.seats, published: false },
                prerequisites: form.prerequisites,
              });
              console.warn('Course creation blocked by RLS/auth — offering queued locally (#' + queued + ')');
              // Reset form for user to continue using UI; queued items will be retried when policies/keys are fixed
              setForm({ course_id: '', semester_id: '', seats: 0, prerequisites: [] });
              setCourseInput('');
              return;
            }
            return console.error(courseErr);
          }
          courseId = courseData?.[0]?.id;
        }
      }
      // determine semester id: if form.semester_id already set use it, else try to find/create by semesterInput
      let semesterId = form.semester_id;
      if (!semesterId) {
        const semName = (semesterInput || '').trim();
        if (!semName) {
          console.error('No semester selected or provided');
          return;
        }
        const { data: existingSem, error: existingSemErr } = await supabase
          .from('semesters')
          .select('id')
          .eq('name', semName)
          .maybeSingle();
        if (existingSemErr) {
          console.error(existingSemErr);
          // If RLS blocks reads, queue the offering
          const queued = offeringQueue.enqueueOffering({
            course: courseId ? null : { name: courseInput || '', code: '', credit_hours: 3, course_type: 'core' },
            payload: { course_id: courseId || null, semester_input: semName, seat_limit: form.seats, published: false },
            prerequisites: form.prerequisites,
          });
          console.warn('Semester lookup blocked — offering queued locally (#' + queued + ')');
          setForm({ course_id: '', semester_id: '', seats: 0, prerequisites: [] });
          setCourseInput('');
          setSemesterInput('');
          return;
        }
        if (existingSem && existingSem.id) {
          semesterId = existingSem.id;
        } else {
          // create a semester with sensible default dates (required by schema)
          const today = new Date();
          const start = today.toISOString().slice(0, 10);
          const endDate = new Date(today.getTime() + 1000 * 60 * 60 * 24 * 120);
          const end = endDate.toISOString().slice(0, 10);
          const { data: newSem, error: newSemErr } = await supabase
            .from('semesters')
            .insert({ name: semName, start_date: start, end_date: end, is_active: false })
            .select();
          if (newSemErr) {
            console.error(newSemErr);
            if (newSemErr?.code === '42501' || newSemErr?.status === 401) {
              const queued = offeringQueue.enqueueOffering({
                course: courseId ? null : { name: courseInput || '', code: '', credit_hours: 3, course_type: 'core' },
                payload: { course_id: courseId || null, semester_input: semName, seat_limit: form.seats, published: false },
                prerequisites: form.prerequisites,
              });
              console.warn('Semester creation blocked by RLS/auth — offering queued locally (#' + queued + ')');
              setForm({ course_id: '', semester_id: '', seats: 0, prerequisites: [] });
              setCourseInput('');
              setSemesterInput('');
              return;
            }
            return;
          }
          semesterId = newSem?.[0]?.id;
        }
      }

      // Validate required UUID fields before sending to Supabase
      if (!courseId) {
        console.error('Cannot create offering: no course selected or created');
        return;
      }
      if (!semesterId) {
        console.error('Cannot create offering: no semester selected/created');
        return;
      }

      const payload = {
        course_id: courseId,
        semester_id: semesterId,
        seat_limit: form.seats,
        published: false,
      };

      const { data, error } = await supabase.from('course_offerings').insert(payload).select();
      if (error) {
        console.error(error);
        if (error?.code === '42501' || error?.status === 401) {
          // Queue full offering for later retry
          const queued = offeringQueue.enqueueOffering({
            courseId, payload, prerequisites: form.prerequisites,
          });
          console.warn('Offering creation blocked by RLS/auth — queued locally (#' + queued + ')');
          setForm({ course_id: '', semester_id: '', seats: 0, prerequisites: [] });
          setCourseInput('');
          return;
        }
        return;
      }

      if (form.prerequisites?.length) {
        const inserts = form.prerequisites.map((pid) => ({ course_id: courseId, prerequisite_course_id: pid }));
        const { error: preErr } = await supabase.from('course_prerequisites').insert(inserts);
        if (preErr) console.error(preErr);
      }

      setForm({ course_id: '', semester_id: '', seats: 0, prerequisites: [] });
      setCourseInput('');
      setSemesterInput('');
    } catch (err) {
      console.error(err);
    }
  }

  function handleCancel() {
    setForm({ course_id: '', semester_id: '', seats: 0, prerequisites: [] });
  }

  return (
    <form onSubmit={handleSubmit}>
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
            fullWidth
            label="Semester"
            name="semesterInput"
            value={semesterInput}
            onChange={(e) => {
              setSemesterInput(e.target.value);
              setForm((s) => ({ ...s, semester_id: '' }));
            }}
            helperText={
              semesters.length === 0
                ? "No semesters found. You can type a new semester (e.g. '2026 Spring')."
                : "Type a semester name or leave empty to pick an existing one."
            }
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <SeatLimitField value={form.seats} onChange={(v) => setForm((s) => ({ ...s, seats: v }))} />
        </Grid>

        <Grid item xs={12} md={6}>
          <PrerequisiteSelector value={form.prerequisites} onChange={(v) => setForm((s) => ({ ...s, prerequisites: v }))} />
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Create Offering</Button>
          </Stack>
        </Grid>
      </Grid>
    </form>
  );
}
