import { mapIter, innerJoin } from "../utils";
import { Main } from "@daml.js/healthcare-claims-processing";
import { useStreamQueries, useLedger } from "@daml/react";
import { useAsync } from "../utils";
import { CreateEvent } from "@daml/ledger";
import { useKeyedPolicies } from "./policies";

// Hook to stream referral data
export const useReferrals = (query: any) => {
  // Stream all referral data
  const referrals: readonly CreateEvent<Main.Provider.ReferralDetails>[] =
    useStreamQueries(Main.Provider.ReferralDetails, () => [query]).contracts;

  const keyedReferrals = new Map(
    referrals.map((p) => [p.payload.referralDetails.policy, p])
  );

  const keyedDisclosed = useKeyedPolicies();

  // Return the combined fetched data
  return Array.from(
    mapIter(
      ([referral, policy]) => ({ referral, policy }),
      innerJoin(keyedReferrals, keyedDisclosed).values()
    )
  );
};

// Hook to fetch and referral data from Daml ledger
export const useReferral = (query: any) => {
  const ledger = useLedger();

  // Fetch single referral information if the query contains a "referralId"
  const referralFetch = useAsync(
    async () =>
      await ledger.fetch(Main.Provider.ReferralDetails, query.referralId),
    query
  );

  const referrals: readonly CreateEvent<Main.Provider.ReferralDetails>[] =
    referralFetch ? [referralFetch] : [];

  // UNCOMMENT IF PROPOSED SOLUTION
  // var referralId = referral?.payload?.referralDetails?.referral;
  // const appointmentsStream = useStreamQueries(
  //   Main.Appointment.Appointment,
  //   () => [
  //     {
  //       encounterDetails: {
  //         referral: referralId,
  //       },
  //     },
  //   ]
  // ).contracts;
  // // TODO MAKE TYPE SAFE
  // if (
  //   appointmentsStream &&
  //   appointmentsStream.length &&
  //   referral &&
  //   referral.payload
  // ) {
  //   referral.payload.appointment = appointmentsStream[0];
  // }

  const keyedReferrals = new Map(
    referrals.map((p) => [p.payload.referralDetails.policy, p])
  );
  const keyedDisclosed = useKeyedPolicies();

  // Return the combined fetched data
  return Array.from(
    mapIter(
      ([referral, policy]) => ({ referral, policy }),
      innerJoin(keyedReferrals, keyedDisclosed).values()
    )
  );
};
