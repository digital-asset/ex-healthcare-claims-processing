import React, { useState } from 'react'
import { Link, NavLink, Redirect, Route, Switch, useRouteMatch, useParams } from 'react-router-dom';
import { Main } from '@daml.js/healthcare-claims-processing';
import { CreateEvent } from '@daml/ledger';
import { useStreamQuery } from '@daml/react';
import { CaretRight, Share } from "phosphor-react";
import { innerJoin, intercalate, Field, FieldsRow, PageTitle, TabLink } from "./Common";
import { Formik, Form, Field as FField, useField } from 'formik';
import Select from 'react-select';
import { LField, EField, ChoiceModal, Nothing } from "./ChoiceModal";


type PatientOverview =
  { acceptance: Main.Patient.NotifyPatientOfPCPAcceptance,
    policy: Main.Policy.DisclosedPolicy,
  };


const PatientRoutes: React.FC = () => {
  const match = useRouteMatch();
  return (
    <Switch>
      <Route path={`${match.path}/:patientId`}>
        <Patient/>
      </Route>
      <Route path={match.path}>
        <Patients/>
      </Route>
    </Switch>
  )
}

const usePatients = (query: any) => {
  const acceptances = useStreamQuery(Main.Patient.NotifyPatientOfPCPAcceptance, () => query)
    .contracts
    .map(resp => resp.payload)
  const disclosedRaw = useStreamQuery(Main.Policy.DisclosedPolicy, () => query)
    .contracts
  const disclosed = disclosedRaw.map(resp => resp.payload)

  const keyedAcceptance = Object.fromEntries(acceptances.map(p => [p.patient, p]));
  const keyedDisclosed = Object.fromEntries(disclosed.map(p => [p.patient, p]));
  const overviews = Object.values(innerJoin(keyedAcceptance, keyedDisclosed))
                         .map(p => ({ acceptance: p[0], policy : p[1]}));
  return { acceptances, disclosed, overviews, disclosedRaw };
}

const Patients: React.FC = () => {
  const match = useRouteMatch();
  const [search, setSearch] = useState("");
  const searchedFor = (s: string) => s.toLowerCase().indexOf(search.toLowerCase()) != -1;
  const visible = usePatients({}).overviews.filter(p => searchedFor(p.policy.patientName) || searchedFor(p.policy.insuranceID));

  return (
    <>
    <PageTitle title="Patients" />
      <div className="flex p-2 bg-white">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name of insurance ID..."
          className="w-full px-3 py-2 h-10 bg-trueGray-100"
        />
      </div>
      <table className="table-fixed">
        <thead>
          <tr className="text-left text-trueGray-500 text-sm">
            <th className="w-1/6"> Name </th>
            <th className="w-1/6"> PCP </th>
            <th className="w-1/6"> Insurance ID </th>
            <th> </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((po) =>
            <tr key={po.policy.patient} className="bg-white text-trueGray-500 hover:bg-trueGray-100 ">
              <td className="border-red-600"> { po.policy.patientName } </td>
              <td> </td>
              <td> { po.policy.insuranceID } </td>
              <td>
                <div className="">
                  <Link to={match.url + "/" + po.policy.patient} className="flex justify-end">
                    <CaretRight />
                  </Link>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}

const Patient: React.FC = () => {
  const { patientId } = useParams< { patientId: string } >();
  const { overviews, disclosed, disclosedRaw } = usePatients({ patient: patientId });
  const match = useRouteMatch();

  const policyRows = disclosed.map((d) =>
    <div>
      <FieldsRow fields={[
        { label: "Receivers", value: d.receivers.join() },
        { label: "Insurance ID", value: d.insuranceID },
      ]} />
    </div>
  )

  const pcpResult = useStreamQuery(Main.Provider.Provider).contracts;
  const pcpContract = pcpResult[0];

  const content = (po: PatientOverview) => (
    <div className="flex flex-col p-5 space-y-4 bg-white rounded shadow-lg">
      <Switch>
        <Route exact path={match.path + "/policies"}>
          <div className="flex flex-col space-y-4">
            { intercalate(policyRows, <hr />) }
          </div>
        </Route>
        <Route exact path={match.path}>
          <div>
            <ChoiceModal className="flex flex-col"
                         choice={Main.Provider.Provider.CreateReferral}
                         contract={pcpContract?.contractId}
                         submitTitle="Create Referral"
                         buttonTitle="Refer Patient"
                         icon={<Share />}
                         initialValues={ {
                           policy: Nothing,
                           receiver: Nothing,
                           encounterId: Nothing,
                           procedureCode: Nothing,
                           diagnosisCode: Nothing,
                           siteServiceCode: Nothing,
                           appointmentPriority: Nothing,
                         } } >
              <h1 className="text-center">Create Referral</h1>
              <PolicySelect label="Policy" name="policy" disclosedRaw={disclosedRaw} />
              <div className="grid grid-cols-2">
              <LField name="receiver" label="Receiver"/>
              <EField name="diagnosisCode" e={Main.Types.DiagnosisCode} label="Diagnosis Code"/>
              <LField name="encounterId" placeholder='eg "1"' label="Encounter ID"/>
              <LField name="siteServiceCode" placeholder='eg "11"' label="Site Service Code"/>
              <EField name="procedureCode" e={Main.Types.ProcedureCode} label="Procedure Code"/>
              <LField name="appointmentPriority" placeholder='eg "Elective"' label="Appointment Priority"/>
              </div>
            </ChoiceModal>
          </div>
          <hr />
          <FieldsRow fields={[
            { label: "Name", value: po.policy.patientName},
            { label: "Insurance ID", value: po.policy.insuranceID},
            { label: "Primary Care Provider", value: ""},
          ]} />
        </Route>
        <Route>
          <Redirect to={match.url} />
        </Route>
      </Switch>
    </div>
  );

  return (
    <>
      <div className="flex items-end space-x-4">
        <PageTitle title="Patient"/>
        <div className="text-trueGray-500 text-sm"> { patientId } </div>
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex">
          <TabLink to={match.url + ""}> Summary </TabLink>
          <TabLink to={match.url + "/policies"}>  Disclosed Policies </TabLink>
        </div>

        { overviews.length > 0 && content(overviews[0]) }

      </div>
    </>
  )
}

const PolicySelect : React.FC< { name: string, label: string, disclosedRaw: readonly CreateEvent<Main.Policy.DisclosedPolicy>[] } > = ({name, label, disclosedRaw}) => {
  const [ field, meta, helpers ] = useField(name);
  const { setValue } = helpers;
  const formatOptionLabel= (a : CreateEvent<Main.Policy.DisclosedPolicy>) =>
    <div>
      Policy Provider: <b>{a.payload.payer}</b><br/>
      Disclosed Parties: <b>{a.payload.receivers}</b><br/>
      <div style={ {textOverflow: "ellipsis", display: "inline-block", maxWidth: "20em", overflow: "hidden", whiteSpace: "nowrap" } }>
        Contract ID: <b>{a.contractId}</b></div>
    </div>
  return (
    <div className="flow flow-col"><label htmlFor={name} className="block">{label}</label>
    <Select
      options={disclosedRaw}
      onChange={(option) => setValue(option?.contractId) }
      formatOptionLabel={formatOptionLabel}
      getOptionValue={a=>a.contractId}
      styles={({singleValue: (base) => ({ textOverflow: "ellipsis" }) })}
 />
 </div>);

}

export default PatientRoutes;
