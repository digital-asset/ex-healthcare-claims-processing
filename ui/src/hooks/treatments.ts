import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";
import { useStreamQueries, useLedger } from "@daml/react";
import { mapIter, innerJoin, useAsync } from "../utils";

// Hook to fetch and stream treatment data from Daml ledger
export const useTreatments = (query: any) => {
  const ledger = useLedger();

  // Fetch single treatment information if the query contains a "treatmentId"
  const treatment = useAsync(
    async () =>
      query.treatmentId
        ? await ledger.fetch(Main.Treatment.Treatment, query.treatmentId)
        : null,
    query
  );

  // Stream all treatment data which is within the authorized scope of the party
  const treatmentsStream = useStreamQueries(Main.Treatment.Treatment, () => [
    query,
  ]).contracts;

  const treatments: readonly CreateEvent<Main.Treatment.Treatment>[] =
    query.treatmentId && treatment ? [treatment] : treatmentsStream;

  // Stream all policy data which is within the authorized scope of the party
  const disclosed = useStreamQueries(Main.Policy.DisclosedPolicy).contracts;

  // Create new maps for treatments and policies to combine data
  const keyedTreatments = new Map(treatments.map((p) => [p.payload.policy, p]));
  const keyedDisclosed = new Map(disclosed.map((p) => [p.contractId, p]));

  // Return the combined fetched data
  return Array.from(
    mapIter(
      ([treatment, policy]) => ({ treatment, policy }),
      innerJoin(keyedTreatments, keyedDisclosed).values()
    )
  );
};
