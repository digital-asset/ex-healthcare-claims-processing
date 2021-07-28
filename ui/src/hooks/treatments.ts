import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";
import { useStreamQueries, useLedger } from "@daml/react";
import { mapIter, innerJoin, useAsync } from "../utils";

export const useTreatments = (query: any) => {
  const ledger = useLedger();
  const treatment = useAsync(
    async () =>
      query.treatmentId
        ? await ledger.fetch(Main.Treatment.Treatment, query.treatmentId)
        : null,
    query
  );
  const treatmentsStream = useStreamQueries(Main.Treatment.Treatment, () => [
    query,
  ]).contracts;
  const treatments: readonly CreateEvent<Main.Treatment.Treatment>[] =
    query.treatmentId && treatment ? [treatment] : treatmentsStream;

  const disclosed = useStreamQueries(Main.Policy.DisclosedPolicy).contracts;

  const keyedTreatments = new Map(treatments.map((p) => [p.payload.policy, p]));
  const keyedDisclosed = new Map(disclosed.map((p) => [p.contractId, p]));
  const overviews = Array.from(
    mapIter(
      ([treatment, policy]) => ({ treatment, policy }),
      innerJoin(keyedTreatments, keyedDisclosed).values()
    )
  );
  return overviews;
};
