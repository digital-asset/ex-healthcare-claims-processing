import { useStreamQueries } from "@daml/react";
import { mapIter, innerJoin } from "../utils";
import { Main } from "@daml.js/healthcare-claims-processing";

export const usePatients = (query: any, predicate: any = () => true) => {
  // Stream all acceptance patients data which is within the authorized scope of the party
  const acceptances = useStreamQueries(
    Main.Patient.NotifyPatientOfPCPAcceptance,
    () => [query]
  ).contracts.map((resp) => resp.payload);

  // Stream all policy data which is within the authorized scope of the party
  const disclosedRaw = useStreamQueries(Main.Policy.DisclosedPolicy, () => [
    query,
  ]).contracts.filter((resp) => predicate(resp.payload));
  const disclosed = disclosedRaw.map((resp) => resp.payload);

  //Create new map for acceptance and policies, used to combine data
  const keyedAcceptance = new Map(acceptances.map((p) => [p.patient, p]));

  const keyedDisclosed = new Map(disclosed.map((p) => [p.patient, p]));

  // combine fetched data
  const overviews = Array.from(
    mapIter(
      ([acceptance, policy]) => ({ acceptance, policy }),
      innerJoin(keyedAcceptance, keyedDisclosed).values()
    )
  );

  //return all patients (acceptances), policies (disclosed), overviews (combined), disclosedRaw (raw policies)
  return { acceptances, disclosed, overviews, disclosedRaw };
};
