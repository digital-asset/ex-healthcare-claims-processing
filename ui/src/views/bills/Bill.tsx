import React from "react";
import { useParams } from "react-router-dom";
import { Main } from "@daml.js/healthcare-claims-processing";
import { Share } from "phosphor-react";
import { Message } from "components/Common";
import { ChoiceModal } from "components/ChoiceModal";
import { SingleItemView } from "components/TabularScreen";
import { useBills } from "hooks/bills";

const useBillData = () => {
  const { billId } = useParams<{ billId: string }>();
  const overview = useBills({ billId })[0];
  return [{ billId, overview: overview }];
};

const SingleBill: React.FC = () => {
  return (
    <SingleItemView
      title="Bill"
      useData={useBillData}
      fields={[
        [
          {
            label: "CoPay",
            getter: (o) =>
              o?.overview?.bill?.payload?.encounterDetails?.coPay || "",
          },
          {
            label: "Patient Responsibility",
            getter: (o) =>
              o?.overview?.bill?.payload?.encounterDetails
                ?.patientResponsibility || "",
          },
        ],

        [
          {
            label: "Provider",
            getter: (o) => o?.overview?.bill?.payload?.provider,
          },
          {
            label: "Appointment Priority",
            getter: (o) =>
              o?.overview?.bill?.payload?.encounterDetails.appointmentPriority,
          },
        ],

        [
          {
            label: "Procedure Code",
            getter: (o) =>
              o?.overview?.bill?.payload?.encounterDetails.procedureCode,
          },
          {
            label: "Diagnosis Code",
            getter: (o) =>
              o?.overview?.bill?.payload?.encounterDetails.diagnosisCode,
          },
          {
            label: "Site Service Code",
            getter: (o) =>
              o?.overview?.bill?.payload?.encounterDetails.siteServiceCode,
          },
        ],
      ]}
      tableKey={(o) => o.overview?.bill?.contractId}
      itemUrl={(o) => ""}
      choices={(d) => (
        <ChoiceModal
          className="flex flex-col space-y-6 w-170 mt-3"
          choice={Main.Claim.PatientObligation.PayPatientObligation}
          contract={d.overview?.bill?.contractId}
          submitTitle="Pay Bill Now"
          buttonTitle="Pay Bill"
          icon={<Share />}
          successWidget={({ rv: [v, evts] }, close) => (
            <>
              <Message
                title="Bill has been paid!"
                content={"The bill for this procedure has been paid."}
              />
            </>
          )}
          initialValues={{}}
        >
          <Message
            title="Pay Bill"
            content={"This bill is accurate and ready to be paid?"}
          />
        </ChoiceModal>
      )}
    />
  );
};

export default SingleBill;
