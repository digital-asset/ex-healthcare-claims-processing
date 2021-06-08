import React from "react";
import { useParams } from "react-router-dom";
import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";
import { useStreamQueries, useLedger } from "@daml/react";
import { Clock } from "phosphor-react";
import { mapIter, innerJoin, Message, useAsync, formatDate } from "./Common";
import { ChoiceModal, FollowUp, creations } from "./ChoiceModal";
import {
  TabularScreenRoutes,
  TabularView,
  SingleItemView,
} from "./TabularScreen";
import { Party, Time } from "@daml/types";

type Props = {
  role: Party;
};

const formatDateHelper = (timeStr: Time) =>
  timeStr ? formatDate(new Date(timeStr)) : "";

const AppointmentRoutes: React.FC<Props> = ({ role }) => (
  <TabularScreenRoutes
    metavar=":appointmentId"
    table={Appointments}
    detail={Appointment({ role })}
  />
);

const useAppointments = (query: any) => {
  const ledger = useLedger();
  const appointment = useAsync(
    async () =>
      query.appointmentId
        ? await ledger.fetch(Main.Appointment.Appointment, query.appointmentId)
        : null,
    query
  );
  const appointmentsStream = useStreamQueries(
    Main.Appointment.Appointment,
    () => [query]
  ).contracts;
  const appointments: readonly CreateEvent<Main.Appointment.Appointment>[] =
    query.appointmentId && appointment ? [appointment] : appointmentsStream;

  const disclosed = useStreamQueries(Main.Policy.DisclosedPolicy).contracts;

  const keyedAppointments = new Map(
    appointments.map((p) => [p.payload.policy, p])
  );
  const keyedDisclosed = new Map(disclosed.map((p) => [p.contractId, p]));
  return Array.from(
    mapIter(
      ([appointment, policy]) => ({ appointment, policy }),
      innerJoin(keyedAppointments, keyedDisclosed).values()
    )
  );
};

const useAppointmentsData = () => useAppointments({});

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
            o?.appointment?.payload?.encounterDetails.encounterDetails
              .appointmentPriority,
        },
      ]}
      tableKey={(o) => o.appointment.contractId}
      itemUrl={(o) => o.appointment.contractId}
    />
  );
};

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
        d?.overview?.appointment?.payload?.provider === role ? (
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
        ) : (
          <></>
        )
      }
    />
  );
};

export default AppointmentRoutes;
