import { Main } from "@daml.js/healthcare-claims-processing";
import TabularView from "components/TabularScreen";
import { usePatients } from "hooks/patients";

type PatientOverview = {
  acceptance: Main.Patient.NotifyPatientOfPCPAcceptance;
  policy: Main.Policy.DisclosedPolicy;
};

// View to display all patient data
const TablePatients: React.FC = () => {
  // Assign function to useAllPatients and passing to TabularView component
  const useAllPatients: () => PatientOverview[] = () =>
    usePatients({}).overviews;

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

export default TablePatients;
