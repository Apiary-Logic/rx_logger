import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import Brightness2Icon from "@mui/icons-material/Brightness2";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TodayIcon from "@mui/icons-material/Today";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

/**
 * Interface representing a medication log entry from the API
 */
interface MedicationLog {
  id: number;
  medication: string;
  timestamp: string;
  source: string;
  notes: string;
}

/**
 * Formats a timestamp into a human-readable label and detailed time
 *
 * @param isoString - ISO timestamp string to format
 * @returns Object containing formatted label and time
 */
function formatMedTimestamp(isoString: string): {
  label: string;
  fine: string;
} {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  // Get hour/minute for fine print
  const hour = date.getHours();
  const fine = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Determine part of day
  let partOfDay = "";
  if (hour < 5) partOfDay = "overnight";
  else if (hour < 12) partOfDay = "morning";
  else if (hour < 17) partOfDay = "afternoon";
  else if (hour < 21) partOfDay = "evening";
  else partOfDay = "night";

  if (isToday) {
    return { label: `This ${partOfDay}`, fine };
  } else if (isYesterday) {
    return { label: `Yesterday`, fine };
  } else {
    // Check if within last 7 days
    const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7 && daysAgo > 0) {
      return {
        label: date.toLocaleDateString(undefined, { weekday: "long" }),
        fine,
      };
    } else {
      return {
        label: date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        fine,
      };
    }
  }
}

/**
 * Returns the appropriate icon and color for a time label
 *
 * @param label - Formatted time label
 * @returns Object containing icon and color information
 */
function getPartOfDayIconAndColor(label: string) {
  if (label.includes("morning"))
    return { icon: <WbSunnyIcon fontSize="small" />, color: "default" };
  if (label.includes("afternoon"))
    return { icon: <WbSunnyIcon fontSize="small" />, color: "default" };
  if (label.includes("evening"))
    return { icon: <Brightness2Icon fontSize="small" />, color: "default" };
  if (label.includes("night") || label.includes("overnight"))
    return { icon: <NightsStayIcon fontSize="small" />, color: "default" };
  if (label === "Yesterday") return { icon: <TodayIcon fontSize="small" />, color: "default" };
  if (label.match(/^[A-Za-z]+day$/))
    return { icon: <CalendarTodayIcon fontSize="small" />, color: "default" };
  return { icon: <AccessTimeIcon fontSize="small" />, color: "default" };
}

/**
 * MedicationList component displays the medication history from the API
 *
 * Features:
 * - Fetches and displays medication logs
 * - Provides a refresh button to get latest data
 * - Shows loading state while fetching data
 * - Displays formatted timestamps with appropriate icons
 */
const MedicationList: React.FC = () => {
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Fetches medication logs from the API
   */
  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/medications");
      const contentType = res.headers.get("content-type");
      if (!res.ok) throw new Error("Failed to fetch medication logs");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Expected JSON, got: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      // Transform API response into MedicationLog objects
      setLogs(
        data.map((row: any[]) => ({
          id: row[0],
          medication: row[1],
          timestamp: row[2],
          source: row[3],
          notes: row[4],
        }))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs on component mount
  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <Box sx={{ px: { xs: 1, sm: 3 }, pb: 3, maxWidth: 700, mx: "auto" }}>
      <Card
        sx={{
          borderRadius: 5,
          boxShadow: 4,
          bgcolor: "#f8fafc",
          px: { xs: 1, sm: 3 },
          py: 3,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontFamily: "Inter, Roboto, Arial, sans-serif",
              letterSpacing: 0.5,
            }}
          >
            Medication History
          </Typography>
          <Button
            onClick={fetchLogs}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2, fontWeight: 500 }}
          >
            Refresh
          </Button>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : logs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No medication logs yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {logs.map((log) => {
              const ts = formatMedTimestamp(log.timestamp);
              const { icon, color } = getPartOfDayIconAndColor(ts.label);
              return (
                <Card
                  key={log.id}
                  sx={{
                    borderRadius: 4,
                    boxShadow: 3,
                    bgcolor: "background.paper",
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        color: "primary.main",
                        fontSize: { xs: "1.2rem", sm: "1.4rem" },
                        letterSpacing: 0.2,
                      }}
                    >
                      {log.medication}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Chip
                        icon={icon}
                        label={
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: "1.1rem", sm: "1.2rem" },
                              letterSpacing: 0.1,
                            }}
                          >
                            {ts.label}
                          </Typography>
                        }
                        color={color as any}
                        size="medium"
                        sx={{
                          borderRadius: 2,
                          px: 2,
                          py: 1,
                          background:
                            color === "warning"
                              ? "linear-gradient(90deg,#ffe082,#fffde7)"
                              : color === "primary"
                                ? "linear-gradient(90deg,#90caf9,#e3f2fd)"
                                : color === "info"
                                  ? "linear-gradient(90deg,#b3e5fc,#e1f5fe)"
                                  : color === "secondary"
                                    ? "linear-gradient(90deg,#ce93d8,#f3e5f5)"
                                    : "#f5f5f5",
                          color: color === "default" ? "text.primary" : undefined,
                          boxShadow: "none",
                          mr: 1,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.95em", display: "block", mb: 0.5 }}
                    >
                      {formatMedTimestamp(log.timestamp).fine}
                    </Typography>
                    {log.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        <strong>Notes:</strong> {log.notes}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Card>
    </Box>
  );
};

export default MedicationList;
