import { useTreatments } from "hooks/treatments";
import { TabularView } from "components/TabularScreen";

const useTreatmentsData = () => useTreatments({});

const Treatments: React.FC = () => {
  return (
    <TabularView
      title="Treatments"
      useData={useTreatmentsData}
      fields={[
        {
          label: "Patient Name",
          getter: (o) => o?.policy?.payload?.patientName,
        },
        {
          label: "Procedure Code",
          getter: (o) => o?.treatment?.payload?.encounterDetails.procedureCode,
        },
        {
          label: "Diagnosis Code",
          getter: (o) => o?.treatment?.payload?.encounterDetails.diagnosisCode,
        },
      ]}
      tableKey={(o) => o.treatment.contractId}
      itemUrl={(o) => o.treatment.contractId}
    />
  );
};

export default Treatments;
