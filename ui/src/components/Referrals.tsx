import React from "react";
import { useParams } from "react-router-dom";
import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";
import { useStreamQueries, useLedger } from "@daml/react";
import { Share } from "phosphor-react";
import { mapIter, innerJoin, Message, useAsync } from "./Common";
import { ChoiceModal, DayTimePickerField } from "./ChoiceModal";
import {
  TabularScreenRoutes,
  TabularView,
  SingleItemView,
} from "./TabularScreen";
import { Party } from "@daml/types";

type Props = {
  role: Party;
};

const ReferralRoutes: React.FC<Props> = ({ role }) => (
  <TabularScreenRoutes
    metavar=":referralId"
    table={Referrals}
    detail={Referral({ role })}
  />
);

const useReferrals = (query: any) => {
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

const useReferralsData = () => useReferrals({});

const Referrals: React.FC = () => {
  return (
    <TabularView
      title="Referrals"
      useData={useReferralsData}
      fields={[
        { label: "Name", getter: (o) => o?.policy?.payload?.patientName },
        {
          label: "Referring Party",
          getter: (o) => o?.referral?.payload?.referringProvider,
        },
        {
          label: "Appointment Priority",
          getter: (o) =>
            o?.referral?.payload?.referralDetails?.encounterDetails
              ?.appointmentPriority,
        },
      ]}
      tableKey={(o) => o.referral.contractId}
      itemUrl={(o) => o.referral.contractId}
    />
  );
};

const useReferralData = () => {
  const { referralId } = useParams<{ referralId: string }>();
  const overviews = useReferrals({ referralId: referralId });
  return [{ referralId, overview: overviews[0] }];
};

const Referral: React.FC<Props> = ({ role }) => {
  return (
    <SingleItemView
      title="Referral"
      useData={useReferralData}
      fields={[
        [
          {
            label: "Name",
            getter: (o) => o?.overview?.policy?.payload?.patientName,
          },
          {
            label: "Referring Party",
            getter: (o) => o?.overview?.referral?.payload?.referringProvider,
          },
          {
            label: "Appointment Priority",
            getter: (o) =>
              o?.overview?.referral?.payload?.referralDetails?.encounterDetails
                ?.appointmentPriority,
          },
        ],
      ]}
      tableKey={(o) => o.overview.referral.contractId}
      itemUrl={(o) => ""}
      choices={(d) =>
        d?.overview?.referral?.payload?.renderingProvider === role ? (
          <ChoiceModal
            className="flex flex-col"
            choice={Main.Provider.ReferralDetails.ScheduleAppointment}
            contract={d.overview?.referral?.contractId}
            submitTitle="Schedule Appointment"
            buttonTitle="Schedule Appointment"
            icon={<Share />}
            initialValues={{ appointmentTime: new Date().toISOString() }}
            successWidget={({ rv: [v, evts] }, close) => (
              <>
                <Message
                  title="Appointment Created!"
                  content={
                    "An appointment has been scheduled for " +
                    d.overview?.policy?.payload?.patientName +
                    "."
                  }
                />
              </>
            )}
          >
            <h1 className="text-center">Schedule Appointment</h1>
            <p>Select a date for this appointment</p>
            <DayTimePickerField name="appointmentTime" />
          </ChoiceModal>
        ) : (
          <></>
        )
      }
    />
  );
};

export default ReferralRoutes;
