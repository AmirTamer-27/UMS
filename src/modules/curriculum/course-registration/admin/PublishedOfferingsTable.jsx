import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Switch, Typography } from '@mui/material';
import supabase, { isSupabaseConfigured } from '../../../../services/supabase/client';
import EditIcon from '@mui/icons-material/Edit';

export default function PublishedOfferingsTable() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
        try {
          if (isSupabaseConfigured && supabase) {
            const { data, error } = await supabase
              .from('course_offerings')
              .select('id, semester_id, seat_limit, published, created_at, course:course_id(name)')
              .order('created_at', { ascending: false });
            if (error) return console.error(error);
            if (mounted) setRows(data || []);
          } else {
            console.error('Supabase is not configured — PublishedOfferingsTable requires Supabase');
          }
      } catch (err) {
        console.error(err);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  async function togglePublish(id, value) {
    if (!isSupabaseConfigured || !supabase) return console.error('Supabase not configured');
    try {
      const { error } = await supabase.from('course_offerings').update({ published: value }).eq('id', id);
      if (error) return console.error(error);
      setRows((r) => r.map((row) => (row.id === id ? { ...row, published: value } : row)));
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
            <TableCell>Seats</TableCell>
            <TableCell>Published</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography>No offerings</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.course?.name || r.course?.title || r.course?.course_name || '—'}</TableCell>
                  <TableCell>{r.semester_id || (r.created_at ? new Date(r.created_at).toLocaleString() : '—')}</TableCell>
                  <TableCell>{r.seat_limit}</TableCell>
                <TableCell>
                  <Switch checked={r.published} onChange={(e) => togglePublish(r.id, e.target.checked)} />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
