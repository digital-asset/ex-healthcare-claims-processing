import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";
import { useStreamQueries, useLedger } from "@daml/react";
import { mapIter, innerJoin, useAsync } from "../utils";

export const useAppointments = (query: any) => {
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
