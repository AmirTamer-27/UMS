import React from 'react';
import { TextField } from '@mui/material';

export default function SeatLimitField({ value = 0, onChange }) {
  return (
    <TextField
      fullWidth
      label="Seat limit"
      type="number"
      inputProps={{ min: 0 }}
      value={value}
      onChange={(e) => onChange(Number(e.target.value || 0))}
    />
  );
}
