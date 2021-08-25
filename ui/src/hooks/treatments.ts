import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";
import { useStreamQueries, useLedger } from "@daml/react";
import { mapIter, innerJoin, useAsync } from "../utils";
import { useKeyedPolicies } from "./policies";

// Hook to stream treatment data
export const useTreatments = (query: any) => {
  // Stream all treatment data
  const treatments: readonly CreateEvent<Main.Treatment.Treatment>[] =
    useStreamQueries(Main.Treatment.Treatment, () => [query]).contracts;

  // Create keyed maps for treatments and policies to combine data
  const keyedTreatments = new Map(treatments.map((p) => [p.payload.policy, p]));
  const keyedDisclosed = useKeyedPolicies();

  // Return the combined fetched data
  return Array.from(
    mapIter(
      ([treatment, policy]) => ({ treatment, policy }),
      innerJoin(keyedTreatments, keyedDisclosed).values()
    )
  );
};

// Hook to fetch treatment data
export const useTreatment = (query: any) => {
  const ledger = useLedger();

  // Fetch single treatment data
  const treatmentFetch = useAsync(
    async () => await ledger.fetch(Main.Treatment.Treatment, query.treatmentId),
    query
  );

  const treatments: readonly CreateEvent<Main.Treatment.Treatment>[] =
    treatmentFetch ? [treatmentFetch] : [];

  // Create keyed maps for treatments and policies to combine data
  const keyedTreatments = new Map(treatments.map((p) => [p.payload.policy, p]));
  const keyedDisclosed = useKeyedPolicies();

  // Return the combined fetched data
  return Array.from(
    mapIter(
      ([treatment, policy]) => ({ treatment, policy }),
      innerJoin(keyedTreatments, keyedDisclosed).values()
    )
  );
};
