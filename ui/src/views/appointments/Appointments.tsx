import React from "react";
import TabularView from "components/TabularScreen";
import { useAppointments } from "hooks/appointments";
import { formatDate } from "utils/index";
import { Time } from "@daml/types";

const formatDateHelper = (timeStr: Time) =>
  timeStr ? formatDate(new Date(timeStr)) : "";

const useAppointmentsData = () => useAppointments({});

// Component to render multiple appointments within the scope of the authorized party
const Appointments: React.FC = () => {
  return (
    <TabularView
      title="Appointments"
      useData={useAppointmentsData}
      fields={[
        {
          label: "Appointment Date",
          getter: (o) =>
            formatDateHelper(o?.appointment?.payload?.appointmentTime),
        },
        {
          label: "Patient Name",
          getter: (o) => o?.policy?.payload?.patientName,
        },
        {
          label: "Insurance ID",
          getter: (o) => o?.policy?.payload?.insuranceID,
        },
        {
          label: "Procedure Code",
          getter: (o) =>
            o?.appointment?.payload?.encounterDetails.encounterDetails
              .procedureCode,
        },
        {
          label: "Appointment Priority",
          getter: (o) =>
            o?.appointment?.payload?.encounterDetails?.encounterDetails
              ?.appointmentPriority,
        },
      ]}
      tableKey={(o) => o.appointment.contractId}
      itemUrl={(o) => o.appointment.contractId}
    />
  );
};
export default Appointments;
