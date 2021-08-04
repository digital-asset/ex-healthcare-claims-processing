import { Main } from "@daml.js/healthcare-claims-processing";
import TabularView from "components/TabularScreen";
import { usePatients } from "hooks/patients";

type PatientOverview = {
  acceptance: Main.Patient.NotifyPatientOfPCPAcceptance;
  policy: Main.Policy.DisclosedPolicy;
};

const useAllPatients: () => PatientOverview[] = () => usePatients({}).overviews;

// Component to render multiple patients within the scope of the authorized party
const Patients: React.FC = () => {
  return (
    <TabularView
      title="Patients"
      useData={useAllPatients}
      fields={[
        { label: "Name", getter: (o) => o?.policy?.patientName },
        { label: "Insurance ID", getter: (o) => o?.policy?.insuranceID },
      ]}
      tableKey={(o) => o?.policy?.patient}
      itemUrl={(o) => o?.policy?.patient}
    />
  );
};

export default Patients;
