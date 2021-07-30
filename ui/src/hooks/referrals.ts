import { mapIter, innerJoin } from "../utils";
import { Main } from "@daml.js/healthcare-claims-processing";
import { useStreamQueries, useLedger } from "@daml/react";
import { useAsync } from "../utils";
import { CreateEvent } from "@daml/ledger";

// Hook to fetch and referral data from Daml ledger
export const useReferrals = (query: any) => {
  const ledger = useLedger();

  // Fetch single referral information if the query contains a "referralId"
  const referral: any = useAsync(
    async () =>
      query.referralId
        ? await ledger.fetch(Main.Provider.ReferralDetails, query.referralId)
        : null,
    query
  );

  var referralId = referral?.payload?.referralDetails?.referral;
  const appointmentsStream = useStreamQueries(
    Main.Appointment.Appointment,
    () => [
      {
        encounterDetails: {
          referral: referralId,
        },
      },
    ]
  ).contracts;
  // TODO MAKE TYPE SAFE
  if (
    appointmentsStream &&
    appointmentsStream.length &&
    referral &&
    referral.payload
  ) {
    referral.payload.appointment = appointmentsStream[0];
  }

  // Stream all referral data which is within the authorized scope of the party
  const referralsStream = useStreamQueries(
    Main.Provider.ReferralDetails,
    () => [query.referralId ? null : query]
  ).contracts;

  const referrals: readonly CreateEvent<Main.Provider.ReferralDetails>[] =
    query.referralId && referral ? [referral] : referralsStream;

  // Stream all policy data which is within the authorized scope of the party
  const disclosed = useStreamQueries(Main.Policy.DisclosedPolicy).contracts;

  // Create new map for policies and referrals to combine the data
  const keyedReferrals = new Map(
    referrals.map((p) => [p.payload.referralDetails.policy, p])
  );
  const keyedDisclosed = new Map(disclosed.map((p) => [p.contractId, p]));

  // Return the combined fetched data
  return Array.from(
    mapIter(
      ([referral, policy]) => ({ referral, policy }),
      innerJoin(keyedReferrals, keyedDisclosed).values()
    )
  );
};
