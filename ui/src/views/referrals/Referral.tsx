import React from "react";
import { useParams } from "react-router-dom";
import { Main } from "@daml.js/healthcare-claims-processing";
import { Share } from "phosphor-react";
import { Message } from "components/Common";
import { FormModal } from "components/modals/FormModal";
import { DayTimePickerField } from "components/fields/Common";
import SingleItemView from "components/SingleItemView";
import { useReferrals } from "hooks/referrals";
import { useParty } from "@daml/react";

const useReferralData = () => {
  const { referralId } = useParams<{ referralId: string }>();
  const overviews = useReferrals({ referralId: referralId });
  return [{ referralId, overview: overviews[0] }];
};

const SingleReferral: React.FC = () => {
  const role = useParty();

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
        Boolean(
          d?.overview?.referral?.payload?.renderingProvider === role &&
            !d?.overview?.referral?.payload?.appointment
        ) ? (
          <FormModal
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
          </FormModal>
        ) : (
          <></>
        )
      }
    />
  );
};

export default SingleReferral;
