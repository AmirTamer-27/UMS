import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField, Typography } from '@mui/material';
import supabase, { isSupabaseConfigured } from '../../../../services/supabase/client';

export default function PrerequisiteSelector({ value = [], onChange }) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
        try {
          if (isSupabaseConfigured && supabase) {
              const { data, error } = await supabase.from('courses').select('*');
              if (error) {
                console.error(error);
                if (error?.status === 401 || error?.code === '42501') {
                  // unauthorized / RLS — leave options empty but show a hint
                  if (mounted) setOptions([]);
                  return;
                }
                console.error(
                  "Schema error while selecting from 'courses'. Run this SQL in Supabase SQL editor:\nselect column_name, data_type from information_schema.columns where table_name='courses';",
                );
                return;
              }
              if (mounted) setOptions(data || []);
          } else {
            console.error('Supabase is not configured — PrerequisiteSelector requires Supabase');
          }
      } catch (err) {
        console.error(err);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  if (!isSupabaseConfigured || !supabase) {
    return <Typography color="error">Supabase not configured — prerequisites disabled</Typography>;
  }

  return (
    <Autocomplete
      multiple
      options={options}
      getOptionLabel={(o) => o?.name || o?.title || String(o?.id || '')}
      value={options.filter((o) => value.includes(o.id))}
      onChange={(_, items) => onChange(items.map((i) => i.id))}
      renderInput={(params) => <TextField {...params} label="Prerequisites" />}
    />
  );
}
