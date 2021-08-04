import { useStreamQueries, useLedger } from "@daml/react";
import { mapIter, useAsync, leftJoin } from "../utils";
import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";

type claimIdProps = {
  paymentId: string;
};

// Hook to stream receipt data and return a keyed map
const useKeyedReceipts = (claimIds: claimIdProps[]) => {
  const receipts = useStreamQueries(
    Main.Claim.PaymentReceipt,
    () => claimIds
  ).contracts;

  return new Map(
    receipts.map((receipt) => [receipt.payload.paymentId, receipt])
  );
};

const useKeyedPolicies = () => {
  // Stream all receipt data within the authorized scope of the party
  const disclosed = useStreamQueries(Main.Policy.DisclosedPolicy).contracts;

  const keyedDisclosed = new Map(disclosed.map((p) => [p.payload.patient, p]));

  return keyedDisclosed;
};

//Hook to stream claim data
export const useClaims = (query: any) => {
  // Stream all claim data which is within the authorized scope of the party
  const claims: readonly CreateEvent<Main.Claim.Claim>[] = useStreamQueries(
    Main.Claim.Claim,
    () => [query]
  ).contracts;

  const claimIds = claims.map((claim) => ({
    paymentId: claim.payload.claimId,
  }));

  const keyedClaims = new Map(
    claims.map((claim) => [claim.payload.claimId, claim])
  );
  //stream receipts to create combined array
  const keyedReceipts = useKeyedReceipts(claimIds);
  //stream policies to create combined array
  const keyedDisclosed = useKeyedPolicies();

  // Return the combined fetched data
  return Array.from(
    mapIter(
      ([claim, receipt]) => ({
        claim,
        receipt,
        disclosed: keyedDisclosed.get(claim.payload.encounterDetails.patient),
      }),
      leftJoin(keyedClaims, keyedReceipts).values()
    )
  );
};

//Hook to fetch and stream claim data from Daml ledger
export const useClaim = (query: any) => {
  const ledger = useLedger();

  // Fetch single claim information if the query contains a "claimId"
  const claim = useAsync(
    async () => await ledger.fetch(Main.Claim.Claim, query.claimId),
    query
  );

  const claims: readonly CreateEvent<Main.Claim.Claim>[] = claim ? [claim] : [];

  const claimIds: claimIdProps[] = claims.map((claim) => ({
    paymentId: claim.payload.claimId,
  }));

  const keyedClaims = new Map(
    claims.map((claim) => [claim.payload.claimId, claim])
  );
  //stream receipts to create combined array
  const keyedReceipts = useKeyedReceipts(claimIds);
  //stream policies to create combined array
  const keyedDisclosed = useKeyedPolicies();

  // Return the combined fetched data
  return Array.from(
    mapIter(
      ([claim, receipt]) => ({
        claim,
        receipt,
        disclosed: keyedDisclosed.get(claim.payload.encounterDetails.patient),
      }),
      leftJoin(keyedClaims, keyedReceipts).values()
    )
  );
};
