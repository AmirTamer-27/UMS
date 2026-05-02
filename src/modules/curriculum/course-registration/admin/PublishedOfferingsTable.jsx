import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useNavigate } from 'react-router-dom';

import supabase, { isSupabaseConfigured } from '../../../../services/supabase/client';

export default function PublishedOfferingsTable({ refreshKey = 0 }) {
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (!isSupabaseConfigured || !supabase) {
          console.error('Supabase is not configured — PublishedOfferingsTable requires Supabase');
          return;
        }

        const { data, error } = await supabase
          .from('course_offerings')
          .select(`
            id,
            semester_id,
            seat_limit,
            published,
            created_at,
            course:course_id(name),
            semester:semester_id(name),
            instructor:profiles!course_offerings_instructor_user_id_fkey(full_name, email)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error(error);
          return;
        }

        if (mounted) setRows(data || []);
      } catch (err) {
        console.error(err);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  async function togglePublish(id, value) {
    if (!isSupabaseConfigured || !supabase) {
      console.error('Supabase not configured');
      return;
    }

    try {
      const { error } = await supabase
        .from('course_offerings')
        .update({ published: value })
        .eq('id', id);

      if (error) {
        console.error(error);
        return;
      }

      setRows((currentRows) => (
        currentRows.map((row) => (row.id === id ? { ...row, published: value } : row))
      ));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Course</TableCell>
            <TableCell>Semester</TableCell>
            <TableCell>Instructor</TableCell>
            <TableCell>Seats</TableCell>
            <TableCell>Published</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography>No offerings</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.course?.name || '—'}</TableCell>
                <TableCell>{row.semester?.name || row.semester_id || '—'}</TableCell>
                <TableCell>{row.instructor?.full_name || row.instructor?.email || 'Staff TBA'}</TableCell>
                <TableCell>{row.seat_limit}</TableCell>
                <TableCell>
                  <Switch
                    checked={row.published}
                    onChange={(event) => togglePublish(row.id, event.target.checked)}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View in LMS">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/lms/courses/${row.id}`)}
                    >
                      <MenuBookIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Course Offering">
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
