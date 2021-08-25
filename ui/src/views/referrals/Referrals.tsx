import React from "react";
import TabularView from "components/TabularScreen";
import { useReferrals } from "hooks/referrals";

const useReferralsData = () => useReferrals({});

// Component to render multiple referrals within the scope of the authorized party
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

export default Referrals;
