import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";
import { useStreamQueries, useLedger } from "@daml/react";
import { mapIter, innerJoin, useAsync } from "../utils";
import { useKeyedPolicies } from "./policies";

// Hook to stream appointment data
export const useAppointments = (query: any) => {
  // Stream all appointment data
  const appointments: readonly CreateEvent<Main.Appointment.Appointment>[] =
    useStreamQueries(Main.Appointment.Appointment, () => [query]).contracts;

  const keyedAppointments = new Map(
    appointments.map((p) => [p?.payload?.policy, p])
  );

  const keyedPolicies = useKeyedPolicies();

  return Array.from(
    mapIter(
      ([appointment, policy]) => ({ appointment, policy }),
      innerJoin(keyedAppointments, keyedPolicies).values()
    )
  );
};

// Hook to fetch and stream appointment data from Daml ledger
export const useAppointment = (query: any) => {
  const ledger = useLedger();

  // Fetch single appointment data
  const appointmentFetch = useAsync(
    async () =>
      await ledger.fetch(Main.Appointment.Appointment, query.appointmentId),
    query
  );

  const appointments: readonly CreateEvent<Main.Appointment.Appointment>[] =
    appointmentFetch ? [appointmentFetch] : [];

  const keyedAppointments = new Map(
    appointments.map((p) => [p?.payload?.policy, p])
  );

  const keyedPolicies = useKeyedPolicies();

  //return a combined array of appointment and policy
  return Array.from(
    mapIter(
      ([appointment, policy]) => ({ appointment, policy }),
      innerJoin(keyedAppointments, keyedPolicies).values()
    )
  );
};
