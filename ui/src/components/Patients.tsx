import React from "react";
import {
  Redirect,
  Route,
  Switch,
  useRouteMatch,
  useParams,
} from "react-router-dom";
import { Main } from "@daml.js/healthcare-claims-processing";
import { CreateEvent } from "@daml/ledger";
import { useParty, useStreamQueries } from "@daml/react";
import { Share } from "phosphor-react";
import {
  mapIter,
  innerJoin,
  FieldsRow,
  Message,
  PageTitleDiv,
  PageTitleSpan,
  PageSubTitleSpan,
  TabLink,
} from "./Common";
import { useField } from "formik";
import Select from "react-select";
import {
  LField,
  EField,
  ChoiceModal,
  ChoiceErrorsType,
  Nothing,
  validateNonEmpty,
  RenderError,
} from "./ChoiceModal";
import { TabularView } from "./TabularScreen";

type PatientOverview = {
  acceptance: Main.Patient.NotifyPatientOfPCPAcceptance;
  policy: Main.Policy.DisclosedPolicy;
};

const PatientRoutes: React.FC = () => {
  const match = useRouteMatch();
  return (
    <Switch>
      <Route path={`${match.path}/:patientId`}>
        <Patient />
      </Route>
      <Route path={match.path}>
        <Patients />
      </Route>
    </Switch>
  );
};

const usePatients = (query: any, predicate: any = () => true) => {
  const acceptances = useStreamQueries(
    Main.Patient.NotifyPatientOfPCPAcceptance,
    () => [query]
  ).contracts.map((resp) => resp.payload);
  const disclosedRaw = useStreamQueries(Main.Policy.DisclosedPolicy, () => [
    query,
  ]).contracts.filter((resp) => predicate(resp.payload));
  const disclosed = disclosedRaw.map((resp) => resp.payload);

  const keyedAcceptance = new Map(acceptances.map((p) => [p.patient, p]));
  const keyedDisclosed = new Map(disclosed.map((p) => [p.patient, p]));
  const overviews = Array.from(
    mapIter(
      ([acceptance, policy]) => ({ acceptance, policy }),
      innerJoin(keyedAcceptance, keyedDisclosed).values()
    )
  );
  return { acceptances, disclosed, overviews, disclosedRaw };
};

const useAllPatients: () => PatientOverview[] = () => usePatients({}).overviews;
const Patients: React.FC = () => {
  return (
    <TabularView
      title="Patients"
      useData={useAllPatients}
      fields={[
        { label: "Name", getter: (o) => o.policy.patientName },
        { label: "Insurance ID", getter: (o) => o.policy.insuranceID },
      ]}
      tableKey={(o) => o.policy.patient}
      itemUrl={(o) => o.policy.patient}
    />
  );
};

const Patient: React.FC = () => {
  const username = useParty();
  const controlled = (d: Main.Policy.DisclosedPolicy) =>
    d.receivers.length > 0 && d.receivers.includes(username);

  const { patientId } = useParams<{ patientId: string }>();
  const { overviews, disclosed, disclosedRaw } = usePatients(
    { patient: patientId },
    controlled
  );
  const match = useRouteMatch();

  const policyRows = disclosed.map((d, i) => (
    <div key={d.receivers.join() + d.insuranceID}>
      <FieldsRow
        fields={[
          { label: "Receivers", value: d.receivers.join() },
          { label: "Insurance ID", value: d.insuranceID },
        ]}
      />
      {i === disclosed.length - 1 ? <></> : <hr />}
    </div>
  ));

  const pcpResult = useStreamQueries(Main.Provider.Provider).contracts;
  const pcpContract = pcpResult[0];

  const content = (po: PatientOverview) => (
    <div className="flex flex-col p-5 space-y-4 bg-white rounded shadow-lg">
      <Switch>
        <Route exact path={match.path + "/policies"}>
          <div className="flex flex-col space-y-4">{policyRows}</div>
        </Route>
        <Route exact path={match.path}>
          <div>
            <ChoiceModal
              className="flex flex-col w-170"
              choice={Main.Provider.Provider.CreateReferral}
              contract={pcpContract?.contractId}
              submitTitle="Create Referral"
              buttonTitle="Refer Patient"
              icon={<Share />}
              successWidget={({ rv: [v, evts] }, close) => (
                <>
                  <Message
                    title="Referral Created!"
                    content="Change to the Radiologist role to see the referral and schedule an appointment with the patient."
                  />
                </>
              )}
              initialValues={{
                policy: Nothing,
                receiver: Nothing,
                encounterId: Nothing,
                procedureCode: Nothing,
                diagnosisCode: Nothing,
                siteServiceCode: Nothing,
                appointmentPriority: Nothing,
              }}
            >
              {({ errors, touched }) => (
                <>
                  <h1 className="heading-2xl mb-7">Create Referral</h1>
                  <PolicySelect
                    label="Policy"
                    name="policy"
                    disclosedRaw={disclosedRaw}
                    errors={errors}
                  />
                  <div className="grid grid-cols-2 gap-4 gap-x-8 mb-7.5 mt-4">
                    <LField name="receiver" label="Receiver" errors={errors} />
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
            </ChoiceModal>
          </div>
          <hr />
          <FieldsRow
            fields={[
              { label: "Name", value: po.policy.patientName },
              { label: "Insurance ID", value: po.policy.insuranceID },
              { label: "Primary Care Provider", value: "" },
            ]}
          />
        </Route>
        <Route>
          <Redirect to={match.url} />
        </Route>
      </Switch>
    </div>
  );

  return (
    <>
      <PageTitleDiv>
        <PageTitleSpan title="Patient" />
        <PageSubTitleSpan title={patientId} />
      </PageTitleDiv>

      <div className="flex flex-col space-y-2">
        <div className="flex">
          <TabLink to={match.url + ""}> Summary </TabLink>
          <TabLink to={match.url + "/policies"}> Disclosed Policies </TabLink>
        </div>

        {overviews.length > 0 && content(overviews[0])}
      </div>
    </>
  );
};

const PolicySelect: React.FC<{
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

export default PatientRoutes;
