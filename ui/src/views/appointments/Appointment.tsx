import React from "react";
import { useParams } from "react-router-dom";
import { Main } from "@daml.js/healthcare-claims-processing";
import { Clock } from "phosphor-react";
import { Message } from "components/Common";
import { formatDate } from "utils";
import { ChoiceModal, FollowUp, creations } from "components/ChoiceModal";
import { SingleItemView } from "components/TabularScreen";
import { Party, Time } from "@daml/types";
import { useAppointments } from "hooks/appointments";

type Props = {
  role: Party;
};

const formatDateHelper = (timeStr: Time) =>
  timeStr ? formatDate(new Date(timeStr)) : "";

const useAppointmentData = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const overviews = useAppointments({ appointmentId });
  return [{ appointmentId, overview: overviews[0] }];
};

const Appointment: React.FC<Props> = ({ role }) => {
  return (
    <SingleItemView
      title="Appointment"
      useData={useAppointmentData}
      fields={[
        [
          {
            label: "Patient Name",
            getter: (o) => o?.overview?.policy?.payload?.patientName,
          },
          {
            label: "Appointment Date",
            getter: (o) =>
              formatDateHelper(
                o?.overview?.appointment?.payload?.appointmentTime
              ),
          },
          {
            label: "Appointment Priority",
            getter: (o) =>
              o?.overview?.appointment?.payload?.encounterDetails
                .encounterDetails.appointmentPriority,
          },
        ],

        [
          {
            label: "Procedure Code",
            getter: (o) =>
              o?.overview?.appointment?.payload?.encounterDetails
                .encounterDetails.procedureCode,
          },
          {
            label: "Diagnosis Code",
            getter: (o) =>
              o?.overview?.appointment?.payload?.encounterDetails
                .encounterDetails.diagnosisCode,
          },
          {
            label: "Site Service Code",
            getter: (o) =>
              o?.overview?.appointment?.payload?.encounterDetails
                .encounterDetails.siteServiceCode,
          },
        ],

        [
          {
            label: "Allowed Amount",
            getter: (o) =>
              o?.overview?.appointment?.payload?.encounterDetails
                .encounterDetails?.allowedAmount || "",
          },
          {
            label: "CoPay",
            getter: (o) =>
              o?.overview?.appointment?.payload?.encounterDetails
                .encounterDetails?.coPay || "",
          },
          {
            label: "Patient Responsibility",
            getter: (o) =>
              o?.overview?.appointment?.payload?.encounterDetails
                .encounterDetails?.patientResponsibility || "",
          },
        ],
      ]}
      tableKey={(o) => o.overview?.appointment.contractId}
      itemUrl={(o) => ""}
      choices={(d) =>
        d?.overview?.appointment?.payload?.provider === role && (
          <ChoiceModal
            className="flex flex-col space-y-6 w-170 mt-3"
            choice={Main.Appointment.Appointment.CheckInPatient}
            contract={d.overview?.appointment?.contractId}
            submitTitle="Check In Patient Now"
            buttonTitle="Check In Patient"
            icon={<Clock />}
            initialValues={{}}
            successWidget={({ rv: [v, evts] }, close) => (
              <>
                <Message
                  title="Patient has been Checked In!"
                  content={
                    d.overview?.policy?.payload?.patientName +
                    " has been checked in and is ready for treatment."
                  }
                />
                <FollowUp
                  to={"/provider/treatments/" + creations(evts)[1]?.contractId}
                  label="View Treatment"
                />
              </>
            )}
          >
            <Message
              title="Check In Patient"
              content={
                d.overview?.policy?.payload?.patientName +
                " is present and ready for their appointment?"
              }
            />
          </ChoiceModal>
        )
      }
    />
  );
};

export default Appointment;
