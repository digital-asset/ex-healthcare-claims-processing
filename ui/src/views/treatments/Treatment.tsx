import React from "react";
import { useParams } from "react-router-dom";
import { Main } from "@daml.js/healthcare-claims-processing";
import { Share } from "phosphor-react";
import { Message } from "components/Common";
import { FormModal } from "components/modals/FormModal";
import SingleItemView from "components/SingleItemView";
import { useTreatments } from "hooks/treatments";
import { useParty } from "@daml/react";

const useTreatmentData = () => {
  const { treatmentId } = useParams<{ treatmentId: string }>();
  const overviews = useTreatments({ treatmentId });
  return [{ treatmentId, overview: overviews[0] }];
};

const SingleTreatment: React.FC = () => {
  const role = useParty();

  return (
    <SingleItemView
      title="Treatment"
      useData={useTreatmentData}
      fields={[
        [
          {
            label: "Patient Name",
            getter: (o) => o?.overview?.policy?.payload?.patientName,
          },
          {
            label: "Appointment Priority",
            getter: (o) =>
              o?.overview?.treatment?.payload?.encounterDetails
                .appointmentPriority,
          },
        ],

        [
          {
            label: "Procedure Code",
            getter: (o) =>
              o?.overview?.treatment?.payload?.encounterDetails.procedureCode,
          },
          {
            label: "Diagnosis Code",
            getter: (o) =>
              o?.overview?.treatment?.payload?.encounterDetails.diagnosisCode,
          },
          {
            label: "Site Service Code",
            getter: (o) =>
              o?.overview?.treatment?.payload?.encounterDetails.siteServiceCode,
          },
        ],

        [
          {
            label: "Allowed Amount",
            getter: (o) =>
              o?.overview?.treatment?.payload?.encounterDetails
                ?.allowedAmount || "",
          },
          {
            label: "CoPay",
            getter: (o) =>
              o?.overview?.treatment?.payload?.encounterDetails?.coPay || "",
          },
          {
            label: "Patient Responsibility",
            getter: (o) =>
              o?.overview?.treatment?.payload?.encounterDetails
                ?.patientResponsibility || "",
          },
        ],
      ]}
      tableKey={(o) => o.overview?.treatment.contractId}
      itemUrl={(o) => ""}
      choices={(d) =>
        d?.overview?.treatment?.payload?.provider === role && (
          <FormModal
            className="flex flex-col space-y-6 w-170 mt-3"
            choice={Main.Treatment.Treatment.CompleteTreatment}
            contract={d.overview?.treatment?.contractId}
            submitTitle="Complete Treatment"
            buttonTitle="Complete Treatment"
            icon={<Share />}
            initialValues={{}}
            successWidget={({ rv: [v, evts] }, close) => (
              <>
                <Message
                  title="Treatment Complete!"
                  content={
                    d.overview?.policy?.payload?.patientName +
                    " has received treatment and a claim has been made to his insurance provider."
                  }
                />
              </>
            )}
          >
            <Message
              title="Complete Treatment"
              content={
                d.overview?.policy?.payload?.patientName +
                " is present and ready for treatment?"
              }
            />
          </FormModal>
        )
      }
    />
  );
};

export default SingleTreatment;
