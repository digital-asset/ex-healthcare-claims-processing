import { useStreamQueries, useLedger } from "@daml/react";
import { mapIter, useAsync, leftJoin } from "../utils";
import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";

export const useClaims = (query: any) => {
  const ledger = useLedger();
  const claim = useAsync(
    async () =>
      query.claimId
        ? await ledger.fetch(Main.Claim.Claim, query.claimId)
        : null,
    query
  );
  const claimsStream = useStreamQueries(Main.Claim.Claim, () => [
    query,
  ]).contracts;
  const claims: readonly CreateEvent<Main.Claim.Claim>[] =
    query.claimId && claim ? [claim] : claimsStream;
  const claimIds = claims.map((claim) => ({
    paymentId: claim.payload.claimId,
  }));
  const receipts = useStreamQueries(
    Main.Claim.PaymentReceipt,
    () => claimIds
  ).contracts;

  const keyedClaims = new Map(
    claims.map((claim) => [claim.payload.claimId, claim])
  );
  const keyedReceipts = new Map(
    receipts.map((receipt) => [receipt.payload.paymentId, receipt])
  );

  const disclosed = useStreamQueries(Main.Policy.DisclosedPolicy).contracts;

  const keyedDisclosed = new Map(disclosed.map((p) => [p.payload.patient, p]));

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
