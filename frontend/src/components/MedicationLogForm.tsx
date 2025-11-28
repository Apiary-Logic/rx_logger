import React, { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";

/** Local datetime helper */
const getCurrentISODateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

/**
 * MedicationLogForm component allows users to log medication intake
 *
 * Features:
 * - Form for entering medication name, time taken, source, and optional notes
 * - Date/time picker with "Now" shortcut button
 * - Success and error notifications
 * - Form resets after successful submission
 */
const MedicationLogForm: React.FC = () => {
  // Form state
  const [medication, setMedication] = useState("");
  const [timestamp, setTimestamp] = useState(getCurrentISODateTime());
  const [notes, setNotes] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handles form submission and API call to log medication
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medication, timestamp, source: "manual", notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log medication");
      }
      // Reset form on success
      setSuccess(true);
      setMedication("");
      setNotes("");
      setTimestamp(getCurrentISODateTime());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        borderRadius: 4,
        boxShadow: 3,
        bgcolor: "background.paper",
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontWeight: 700,
          fontFamily: "Inter, Roboto, Arial, sans-serif",
          letterSpacing: 0.5,
        }}
      >
        Log Medication
      </Typography>
      <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={handleSubmit}>
        <TextField
          label="Medication"
          value={medication}
          onChange={(e) => setMedication(e.target.value)}
          required
          InputProps={{ sx: { borderRadius: 2, bgcolor: "#fafbfc" } }}
        />
        <TextField
          label="Time Taken"
          type="datetime-local"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
          InputProps={{
            sx: { borderRadius: 2, bgcolor: "#fafbfc" },
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setTimestamp(getCurrentISODateTime())}
                  sx={{ minWidth: 0, px: 1, fontSize: 12 }}
                >
                  Now
                </Button>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          minRows={2}
          InputProps={{ sx: { borderRadius: 2, bgcolor: "#fafbfc" } }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ borderRadius: 2, fontWeight: 600, py: 1 }}
        >
          {loading ? "Logging..." : "Log Medication"}
        </Button>
      </Box>
      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: "100%" }}>
          Medication logged successfully!
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError("")}>
        <Alert severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default MedicationLogForm;
