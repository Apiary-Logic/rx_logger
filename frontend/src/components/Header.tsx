import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MedicationIcon from "@mui/icons-material/Medication";
import Box from "@mui/material/Box";

/**
 * Header component displays the application title and branding
 *
 */
const Header: React.FC = () => (
  <AppBar
    position="static"
    elevation={0}
    sx={{
      bgcolor: "#fff",
      color: "primary.main",
      boxShadow: 0,
      borderBottom: "1px solid #e0e7ef",
    }}
  >
    <Toolbar sx={{ minHeight: 64 }}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <MedicationIcon sx={{ mr: 2, color: "primary.main", fontSize: 32 }} />
        <Typography
          variant="h5"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            fontFamily: "Inter, Roboto, Arial, sans-serif",
            letterSpacing: 0.5,
          }}
        >
          Medication Tracker
        </Typography>
      </Box>
    </Toolbar>
  </AppBar>
);

export default Header;
