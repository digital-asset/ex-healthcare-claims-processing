import React from "react";

import { Main } from "@daml.js/healthcare-claims-processing";
import { Share } from "phosphor-react";
import { Message } from "components/Common";
import { LField, EField } from "components/fields/Common";
import { Nothing } from "utils";
import { FormModal } from "./FormModal";
import PolicySelectField from "components/fields/PolicySelectField";
import { CreateEvent } from "@daml/ledger";
import { ContractId } from "@daml/types";

type PcpContactType<T> = {
  contractId: ContractId<T>;
};

//Component that renders a model with a form to create a referral
const ReferralModal: React.FC<{
  disclosedRaw: readonly CreateEvent<Main.Policy.DisclosedPolicy>[];
  pcpContract: PcpContactType<any>;
}> = ({ disclosedRaw, pcpContract }) => {
  return (
    <div>
      <FormModal
        className="flex flex-col w-170"
        choice={Main.Provider.Provider.CreateReferral}
        contract={pcpContract?.contractId}
        submitTitle="Create Referral"
        buttonTitle="Refer Patient"
        icon={<Share />}
        successWidget={({ rv: [v, evts] }, close) => (
          <Message
            title="Referral Created!"
            content="Change to the Radiologist role to see the referral and schedule an appointment with the patient."
          />
        )}
        initialValues={{
          policy: Nothing,
          receiver: "Radiologist",
          encounterId: "",
          procedureCode: Nothing,
          diagnosisCode: Nothing,
          siteServiceCode: "",
          appointmentPriority: "",
        }}
      >
        {({ errors, touched }) => (
          <>
            <h1 className="heading-2xl mb-7">Create Referral</h1>
            <PolicySelectField
              label="Policy"
              name="policy"
              disclosedRaw={disclosedRaw}
              errors={errors}
            />
            <div className="grid grid-cols-2 gap-4 gap-x-8 mb-7.5 mt-4">
              <LField
                name="receiver"
                label="Receiver"
                errors={errors}
                disabled={true}
              />
              <EField
                name="diagnosisCode"
                e={Main.Types.DiagnosisCode}
                label="Diagnosis Code"
                errors={errors}
              />
              <LField
                name="encounterId"
                placeholder='eg "1"'
                label="Encounter ID"
                errors={errors}
              />
              <LField
                name="siteServiceCode"
                placeholder='eg "11"'
                label="Site Service Code"
                errors={errors}
              />
              <EField
                name="procedureCode"
                e={Main.Types.ProcedureCode}
                label="Procedure Code"
                errors={errors}
              />
              <LField
                name="appointmentPriority"
                placeholder='eg "Elective"'
                label="Appointment Priority"
                errors={errors}
              />
            </div>
          </>
        )}
      </FormModal>
    </div>
  );
};

export default ReferralModal;
