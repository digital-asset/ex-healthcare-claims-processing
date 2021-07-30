import { useStreamQueries, useLedger } from "@daml/react";
import { mapIter, useAsync, leftJoin } from "../utils";
import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";

//Hook to fetch and stream claim data from Daml ledger
export const useClaims = (query: any) => {
  const ledger = useLedger();

  // Fetch single claim information if the query contains a "claimId"
  const claim = useAsync(
    async () =>
      query.claimId
        ? await ledger.fetch(Main.Claim.Claim, query.claimId)
        : null,
    query
  );

  // Stream all claim data which is within the authorized scope of the party
  const claimsStream = useStreamQueries(Main.Claim.Claim, () => [
    query,
  ]).contracts;

  const claims: readonly CreateEvent<Main.Claim.Claim>[] =
    query.claimId && claim ? [claim] : claimsStream;

  //Create array of payment ids to fetch receipts
  const claimIds = claims.map((claim) => ({
    paymentId: claim.payload.claimId,
  }));

  // Stream all receipt data within the authorized scope of the party
  const receipts = useStreamQueries(
    Main.Claim.PaymentReceipt,
    () => claimIds
  ).contracts;

  // Stream all policy data within the authorized scope of the party
  const disclosed = useStreamQueries(Main.Policy.DisclosedPolicy).contracts;

  //Create new map for bills, receicept and policies used to combine data
  const keyedClaims = new Map(
    claims.map((claim) => [claim.payload.claimId, claim])
  );
  const keyedReceipts = new Map(
    receipts.map((receipt) => [receipt.payload.paymentId, receipt])
  );
  const keyedDisclosed = new Map(disclosed.map((p) => [p.payload.patient, p]));

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
