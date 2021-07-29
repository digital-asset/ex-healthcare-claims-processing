import { useStreamQueries } from "@daml/react";
import { Main } from "@daml.js/healthcare-claims-processing";

export const useProfile = () => {
  const pcpResult = useStreamQueries(Main.Provider.Provider).contracts;
  const patientResult = useStreamQueries(Main.Patient.Patient).contracts;
  const policyResult = useStreamQueries(Main.Policy.InsurancePolicy).contracts;
  return { pcpResult, patientResult, policyResult };
};