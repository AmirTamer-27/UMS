import React from 'react';
import { TextField } from '@mui/material';

export default function SeatLimitField({ value = 0, onChange }) {
  return (
    <TextField
      fullWidth
      label="Seat limit"
      inputMode="numeric"
      value={value}
      onChange={(e) => {
        const nextValue = e.target.value.replace(/\D/g, '');
        onChange(nextValue);
      }}
    />
  );
}
