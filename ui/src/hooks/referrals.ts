import { mapIter, innerJoin } from "../utils";
import { Main } from "@daml.js/healthcare-claims-processing";
import { useStreamQueries, useLedger } from "@daml/react";
import { useAsync } from "../utils";
import { CreateEvent } from "@daml/ledger";

export const useReferrals = (query: any) => {
  const ledger = useLedger();
  const referral = useAsync(
    async () =>
      query.referralId
        ? await ledger.fetch(Main.Provider.ReferralDetails, query.referralId)
        : null,
    query
  );
  const referralsStream = useStreamQueries(
    Main.Provider.ReferralDetails,
    () => [query]
  ).contracts;

  const referrals: readonly CreateEvent<Main.Provider.ReferralDetails>[] =
    query.referralId && referral ? [referral] : referralsStream;

  const disclosed = useStreamQueries(Main.Policy.DisclosedPolicy).contracts;

  const keyedReferrals = new Map(
    referrals.map((p) => [p.payload.referralDetails.policy, p])
  );
  const keyedDisclosed = new Map(disclosed.map((p) => [p.contractId, p]));
  return Array.from(
    mapIter(
      ([referral, policy]) => ({ referral, policy }),
      innerJoin(keyedReferrals, keyedDisclosed).values()
    )
  );
};
