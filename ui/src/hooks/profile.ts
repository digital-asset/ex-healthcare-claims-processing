import { useStreamQueries } from "@daml/react";
import { Main } from "@daml.js/healthcare-claims-processing";

export const useProfile = () => {
  // Stream all provider, patient and policy data which is within the authorized scope of the party
  const pcpResult = useStreamQueries(Main.Provider.Provider).contracts;
  const patientResult = useStreamQueries(Main.Patient.Patient).contracts;
  const policyResult = useStreamQueries(Main.Policy.InsurancePolicy).contracts;
  return { pcpResult, patientResult, policyResult };
};
