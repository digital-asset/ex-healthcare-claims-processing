import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";
import { useStreamQueries, useLedger } from "@daml/react";
import { mapIter, innerJoin, useAsync } from "../utils";

// Hook to fetch and stream appointment data from Daml ledger
export const useAppointments = (query: any) => {
  const ledger = useLedger();

  // Fetch single appointment information if the query contains a "appointmentId"
  const appointment = useAsync(
    async () =>
      query.appointmentId
        ? await ledger.fetch(Main.Appointment.Appointment, query.appointmentId)
        : null,
    query
  );

  // Stream all appointment data which is within the authorized scope of the party
  const appointmentsStream = useStreamQueries(
    Main.Appointment.Appointment,
    () => [query]
  ).contracts;

  const appointments: readonly CreateEvent<Main.Appointment.Appointment>[] =
    query.appointmentId && appointment ? [appointment] : appointmentsStream;

  // Stream all policy data which is within the authorized scope of the party
  const disclosed = useStreamQueries(Main.Policy.DisclosedPolicy).contracts;

  // Create new maps for appointments and policies to combine data
  const keyedAppointments = new Map(
    appointments.map((p) => [p.payload.policy, p])
  );
  const keyedDisclosed = new Map(disclosed.map((p) => [p.contractId, p]));

  // Return the combined fetched data
  return Array.from(
    mapIter(
      ([appointment, policy]) => ({ appointment, policy }),
      innerJoin(keyedAppointments, keyedDisclosed).values()
    )
  );
};
