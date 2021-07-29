import React from "react";
import { CreateEvent } from "@daml/ledger";
import { RenderError } from "../fields/Common";
import { Main } from "@daml.js/healthcare-claims-processing";
import { useField } from "formik";
import Select from "react-select";
import { validateNonEmpty } from "utils";
import { ChoiceErrorsType } from "./Common";

const PolicySelectField: React.FC<{
  name: string;
  label: string;
  disclosedRaw: readonly CreateEvent<Main.Policy.DisclosedPolicy>[];
  errors?: ChoiceErrorsType;
}> = ({ name, label, disclosedRaw, errors }) => {
  const [, , helpers] = useField({
    name,
    validate: validateNonEmpty(label),
  });
  const { setValue } = helpers;
  const formatOptionLabel = (a: CreateEvent<Main.Policy.DisclosedPolicy>) => (
    <div className="">
      Policy Provider: <b>{a.payload.payer}</b>
      <br />
      Disclosed Parties: <b>{a.payload.receivers}</b>
      <br />
      <div className="overflow-ellipsis-20">
        Contract ID: <b>{a.contractId}</b>
      </div>
    </div>
  );
  const error = errors?.[name];
  return (
    <div className="flow flow-col mb-2 mt-0.5">
      <label htmlFor={name} className="block label-sm">
        {label}
      </label>
      <Select
        classNamePrefix="react-select-modal-enum"
        options={disclosedRaw}
        onChange={(option) => setValue(option?.contractId)}
        formatOptionLabel={formatOptionLabel}
        getOptionValue={(a) => a.contractId}
        styles={{ singleValue: (base) => ({ textOverflow: "ellipsis" }) }}
      />
      <RenderError error={error} />
    </div>
  );
};
export default PolicySelectField;
