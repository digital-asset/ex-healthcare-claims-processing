import { useStreamQueries } from "@daml/react";
import { mapIter, innerJoin } from "../utils";
import { Main } from "@daml.js/healthcare-claims-processing";

export const usePatients = (query: any, predicate: any = () => true) => {
  const acceptances = useStreamQueries(
    Main.Patient.NotifyPatientOfPCPAcceptance,
    () => [query]
  ).contracts.map((resp) => resp.payload);
  const disclosedRaw = useStreamQueries(Main.Policy.DisclosedPolicy, () => [
    query,
  ]).contracts.filter((resp) => predicate(resp.payload));
  const disclosed = disclosedRaw.map((resp) => resp.payload);

  const keyedAcceptance = new Map(acceptances.map((p) => [p.patient, p]));

  const keyedDisclosed = new Map(disclosed.map((p) => [p.patient, p]));

  const overviews = Array.from(
    mapIter(
      ([acceptance, policy]) => ({ acceptance, policy }),
      innerJoin(keyedAcceptance, keyedDisclosed).values()
    )
  );

  return { acceptances, disclosed, overviews, disclosedRaw };
};
