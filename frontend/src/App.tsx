import React from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Header from "./components/Header";
import MedicationLogForm from "./components/MedicationLogForm";
import MedicationList from "./components/MedicationList";
import AddMedicationDialog from "./components/AddMedicationDialog";
import DueMedicationsPanel from "./components/DueMedicationsPanel";
import "./index.css";

/**
 * Layout structure:
 * - Header: Title and branding
 * - Left column (md-5):
 *   - MedicationLogForm: Form to log new medications
 *   - AddMedicationDialog: Placeholder for future medication management
 *   - DueMedicationsPanel: Placeholder for medication schedule tracking
 * - Right column (md-7):
 *   - MedicationList: Display of medication history
 */
const App: React.FC = () => {
  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <MedicationLogForm />
            <AddMedicationDialog />
            <DueMedicationsPanel />
          </Grid>
          <Grid item xs={12} md={7}>
            <MedicationList />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default App;
